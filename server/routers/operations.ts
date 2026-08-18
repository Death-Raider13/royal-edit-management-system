import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { buildProjectReportPayload, calculateProjectSummary, generateReportWithPython } from "../reporting";
import { buildAssignmentNotification, buildTaskProgressNotification } from "../workflow";
import { sendTaskAssignmentEmail, sendTeamInvitationEmail } from "../mailer";
import { hashPassword } from "../_core/auth";

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

async function sendTaskProgressNotification(taskId: number, status: "not_started" | "in_progress" | "almost_done" | "blocked" | "completed") {
  const task = await db.getTaskWithDetails(taskId);
  if (!task?.assignedMemberId) return;
  const admins = await db.listAdminUsers();
  const notification = buildTaskProgressNotification({
    taskTitle: String(task.title),
    projectName: String(task.projectName),
    memberName: String(task.assignedMemberName ?? "A team member"),
    status,
  });
  await Promise.all(admins.map((admin) => db.createAdminNotification({ recipientUserId: admin.id, taskId, ...notification })));
  await logActivity("task", taskId, "progress_updated", notification.content);
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
  if (task.assignedMemberEmail) {
    try {
      await sendTaskAssignmentEmail({
        recipientName: String(task.assignedMemberName ?? "team member"),
        recipientEmail: String(task.assignedMemberEmail),
        taskTitle: String(task.title),
        projectName: String(task.projectName),
        priority: String(task.priority),
        deadline: task.deadline as Date,
        reassigned,
      });
    } catch (error) {
      console.warn("[Mailer] Assignment email could not be sent; in-app notification was retained.", error);
    }
  }
  await logActivity("task", taskId, reassigned ? "reassigned" : "assigned", `${String(task.title)} was ${reassigned ? "reassigned" : "assigned"} to ${task.assignedMemberName ? String(task.assignedMemberName) : "a team member"}.`);
}

export const operationsRouter = router({
  dashboard: protectedProcedure.query(async () => ({
    stats: await db.getDashboardStats(),
    recentActivity: await db.listRecentActivity(),
  })),

  teamMembers: router({
    list: adminProcedure.query(() => db.listTeamMembers()),
    create: adminProcedure.input(teamMemberInput).mutation(async ({ input, ctx }) => {
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "A login account already exists for this email. Ask the member to use their existing account or a different email." });
      const userId = await db.createUser({ email: input.email, password: await hashPassword(crypto.randomUUID()), name: input.name, role: "user", lastSignedIn: new Date() });
      const sentAt = new Date();
      const id = await db.createTeamMember({ ...input, userId, invitationStatus: "pending", invitationSentAt: sentAt });
      const token = crypto.randomUUID();
      await db.createInvitationToken({ token, teamMemberId: id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48) });
      const origin = `${ctx.req.protocol}://${ctx.req.headers.host ?? "localhost:3000"}`;
      try {
        await sendTeamInvitationEmail({ recipientName: input.name, recipientEmail: input.email, inviteUrl: `${origin}/setup-password?token=${encodeURIComponent(token)}` });
      } catch (error) {
        console.warn("[Mailer] Team invitation could not be sent; use resend invitation.", error);
      }
      await logActivity("team_member", id, "invited", `${input.name} was added and invited to the Royal Edit workspace.`);
      return { id, invited: true };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: teamMemberInput })).mutation(async ({ input }) => {
      await db.updateTeamMember(input.id, input.values);
      await logActivity("team_member", input.id, "updated", `${input.values.name}'s team record was updated.`);
      return { success: true };
    }),
    resendInvitation: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const member = await db.getTeamMemberById(input.id);
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Team member not found." });
      if (member.invitationStatus === "accepted") throw new TRPCError({ code: "CONFLICT", message: "This team member has already accepted the invitation." });
      const token = crypto.randomUUID();
      await db.createInvitationToken({ token, teamMemberId: member.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48) });
      await db.updateTeamMember(member.id, { invitationStatus: "pending", invitationSentAt: new Date() });
      const origin = `${ctx.req.protocol}://${ctx.req.headers.host ?? "localhost:3000"}`;
      await sendTeamInvitationEmail({ recipientName: member.name, recipientEmail: member.email, inviteUrl: `${origin}/setup-password?token=${encodeURIComponent(token)}` });
      await logActivity("team_member", member.id, "invitation_resent", `A new workspace invitation was sent to ${member.name}.`);
      return { success: true };
    }),
  }),

  clients: router({
    list: adminProcedure.query(() => db.listClients()),
    create: adminProcedure.input(clientInput).mutation(async ({ input }) => {
      const id = await db.createClient(input);
      await logActivity("client", id, "created", `${input.organizationName} was added as a client.`);
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: clientInput })).mutation(async ({ input }) => {
      await db.updateClient(input.id, input.values);
      await logActivity("client", input.id, "updated", `${input.values.organizationName}'s record was updated.`);
      return { success: true };
    }),
  }),

  projects: router({
    list: protectedProcedure.query(() => db.listProjects()),
    create: adminProcedure.input(projectInput).mutation(async ({ input }) => {
      assertValidSchedule(input.startDate, input.deadline);
      const id = await db.createProject(input);
      await logActivity("project", id, "created", `${input.name} was created.`);
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: projectInput })).mutation(async ({ input }) => {
      assertValidSchedule(input.values.startDate, input.values.deadline);
      await db.updateProject(input.id, input.values);
      await logActivity("project", input.id, "updated", `${input.values.name} was updated.`);
      return { success: true };
    }),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: projectStatus })).mutation(async ({ input }) => {
      await db.updateProject(input.id, { status: input.status });
      await logActivity("project", input.id, "status_updated", `Project status changed to ${input.status.replace("_", " ")}.`);
      return { success: true };
    }),
  }),

  tasks: router({
    list: protectedProcedure.query(({ ctx }) => db.listTasks(ctx.user.role === "admin" ? null : ctx.user.id)),
    create: adminProcedure.input(taskInput).mutation(async ({ input }) => {
      const id = await db.createTask(input);
      await logActivity("task", id, "created", `${input.title} was created.`);
      if (input.assignedMemberId) await sendAssignmentNotification(id);
      return { id };
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), values: taskInput })).mutation(async ({ input }) => {
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
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: taskStatus })).mutation(async ({ input, ctx }) => {
      const task = await db.getTaskWithDetails(input.id, ctx.user.role === "admin" ? null : ctx.user.id);
      if (!task) throw new TRPCError({ code: "FORBIDDEN", message: "You can only update tasks assigned to you." });
      const statusChanged = task.status !== input.status;
      await db.updateTask(input.id, { status: input.status });
      await logActivity("task", input.id, "status_updated", `Task status changed to ${input.status.replace("_", " ")}.`);
      if (ctx.user.role !== "admin" && statusChanged) await sendTaskProgressNotification(input.id, input.status);
      return { success: true };
    }),
    markAlmostDone: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only assigned team members can send a near-complete update." });
      const task = await db.getTaskWithDetails(input.id, ctx.user.id);
      if (!task) throw new TRPCError({ code: "FORBIDDEN", message: "You can only update tasks assigned to you." });
      if (task.status !== "in_progress") throw new TRPCError({ code: "BAD_REQUEST", message: "Mark the task in progress before sending an almost-complete update." });
      await sendTaskProgressNotification(input.id, "almost_done");
      return { success: true };
    }),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listNotifications(ctx.user.role === "admin" ? null : ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive(), source: z.enum(["member", "admin"]) })).mutation(async ({ input, ctx }) => {
      await db.markNotificationRead(input.id, input.source, ctx.user.role === "admin" ? null : ctx.user.id);
      return { success: true };
    }),
  }),

  reports: router({
    projectSummary: adminProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ input }) => {
      const data = await db.getProjectReportData(input.projectId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      return calculateProjectSummary(data);
    }),
    generate: adminProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ input }) => {
      const data = await db.getProjectReportData(input.projectId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      return generateReportWithPython(buildProjectReportPayload(calculateProjectSummary(data)));
    }),
  }),
});
