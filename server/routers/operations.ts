import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { buildProjectReportPayload, calculateProjectSummary, generateReportWithPython } from "../reporting";
import { buildAssignmentNotification } from "../workflow";

const projectStatus = z.enum(["planned", "in_progress", "on_hold", "completed", "cancelled"]);
const taskStatus = z.enum(["not_started", "in_progress", "blocked", "completed"]);
const taskPriority = z.enum(["low", "medium", "high"]);
const dateInput = z.coerce.date();
const teamMemberInput = z.object({
  name: z.string().trim().min(2).max(160),
  role: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  status: z.enum(["active", "inactive"]),
});
const clientInput = z.object({
  organizationName: z.string().trim().min(2).max(180),
  contactPerson: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(48),
});
const projectInput = z.object({
  clientId: z.number().int().positive(),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(6),
  startDate: dateInput,
  deadline: dateInput,
  status: projectStatus,
});
const taskInput = z.object({
  projectId: z.number().int().positive(),
  assignedMemberId: z.number().int().positive().nullable(),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(4),
  priority: taskPriority,
  deadline: dateInput,
  status: taskStatus,
});

function assertValidSchedule(startDate: Date, deadline: Date) {
  if (deadline.getTime() < startDate.getTime()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The deadline must be on or after the start date." });
  }
}

async function logActivity(entityType: string, entityId: number, action: string, description: string) {
  await db.createActivityLog({ entityType, entityId, action, description });
}

async function sendAssignmentNotification(taskId: number, previousMemberId?: number | null) {
  const task = await db.getTaskWithDetails(taskId);
  if (!task?.assignedMemberId) return;
  const assignedMemberId = Number(task.assignedMemberId);
  const reassigned = Boolean(previousMemberId && previousMemberId !== assignedMemberId);
  const notification = buildAssignmentNotification({
    taskTitle: String(task.title),
    projectName: String(task.projectName),
    priority: String(task.priority),
    deadline: task.deadline as Date,
    reassigned,
  });
  await db.createNotification({
    recipientMemberId: assignedMemberId,
    taskId,
    ...notification,
  });
  await logActivity("task", taskId, reassigned ? "reassigned" : "assigned", `${String(task.title)} was ${reassigned ? "reassigned" : "assigned"} to ${task.assignedMemberName ? String(task.assignedMemberName) : "a team member"}.`);
}

export const operationsRouter = router({
  dashboard: protectedProcedure.query(async () => ({
    stats: await db.getDashboardStats(),
    recentActivity: await db.listRecentActivity(),
  })),

  teamMembers: router({
    list: protectedProcedure.query(() => db.listTeamMembers()),
    create: protectedProcedure.input(teamMemberInput).mutation(async ({ input }) => {
      const id = await db.createTeamMember(input);
      await logActivity("team_member", id, "created", `${input.name} joined the team as ${input.role}.`);
      return { id };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), values: teamMemberInput })).mutation(async ({ input }) => {
      await db.updateTeamMember(input.id, input.values);
      await logActivity("team_member", input.id, "updated", `${input.values.name}'s team record was updated.`);
      return { success: true };
    }),
  }),

  clients: router({
    list: protectedProcedure.query(() => db.listClients()),
    create: protectedProcedure.input(clientInput).mutation(async ({ input }) => {
      const id = await db.createClient(input);
      await logActivity("client", id, "created", `${input.organizationName} was added as a client.`);
      return { id };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), values: clientInput })).mutation(async ({ input }) => {
      await db.updateClient(input.id, input.values);
      await logActivity("client", input.id, "updated", `${input.values.organizationName}'s record was updated.`);
      return { success: true };
    }),
  }),

  projects: router({
    list: protectedProcedure.query(() => db.listProjects()),
    create: protectedProcedure.input(projectInput).mutation(async ({ input }) => {
      assertValidSchedule(input.startDate, input.deadline);
      const id = await db.createProject(input);
      await logActivity("project", id, "created", `${input.name} was created.`);
      return { id };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), values: projectInput })).mutation(async ({ input }) => {
      assertValidSchedule(input.values.startDate, input.values.deadline);
      await db.updateProject(input.id, input.values);
      await logActivity("project", input.id, "updated", `${input.values.name} was updated.`);
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: projectStatus })).mutation(async ({ input }) => {
      await db.updateProject(input.id, { status: input.status });
      await logActivity("project", input.id, "status_updated", `Project status changed to ${input.status.replace("_", " ")}.`);
      return { success: true };
    }),
  }),

  tasks: router({
    list: protectedProcedure.query(() => db.listTasks()),
    create: protectedProcedure.input(taskInput).mutation(async ({ input }) => {
      const id = await db.createTask(input);
      await logActivity("task", id, "created", `${input.title} was created.`);
      if (input.assignedMemberId) await sendAssignmentNotification(id);
      return { id };
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), values: taskInput })).mutation(async ({ input }) => {
      const before = await db.getTaskWithDetails(input.id);
      if (!before) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      await db.updateTask(input.id, input.values);
      await logActivity("task", input.id, "updated", `${input.values.title} was updated.`);
      const previousMemberId = before.assignedMemberId ? Number(before.assignedMemberId) : null;
      if (input.values.assignedMemberId && input.values.assignedMemberId !== previousMemberId) {
        await sendAssignmentNotification(input.id, previousMemberId);
      }
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: taskStatus })).mutation(async ({ input }) => {
      await db.updateTask(input.id, { status: input.status });
      await logActivity("task", input.id, "status_updated", `Task status changed to ${input.status.replace("_", " ")}.`);
      return { success: true };
    }),
  }),

  notifications: router({
    list: protectedProcedure.query(() => db.listNotifications()),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),
  }),

  reports: router({
    projectSummary: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ input }) => {
      const data = await db.getProjectReportData(input.projectId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      return calculateProjectSummary(data);
    }),
    generate: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ input }) => {
      const data = await db.getProjectReportData(input.projectId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      return generateReportWithPython(buildProjectReportPayload(calculateProjectSummary(data)));
    }),
  }),
});
