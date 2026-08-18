import { and, desc, eq, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient as createLibsqlClient } from "@libsql/client";
import {
  activityLogs,
  clients,
  InsertClient,
  InsertProject,
  InsertTask,
  InsertTeamMember,
  InsertInvitationToken,
  invitationTokens,
  InsertUser,
  InsertSession,
  notifications,
  projects,
  sessions,
  tasks,
  teamMembers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

const projectFields = {
  id: projects.id,
  clientId: projects.clientId,
  name: projects.name,
  description: projects.description,
  startDate: projects.startDate,
  deadline: projects.deadline,
  status: projects.status,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

const taskFields = {
  id: tasks.id,
  projectId: tasks.projectId,
  assignedMemberId: tasks.assignedMemberId,
  title: tasks.title,
  description: tasks.description,
  priority: tasks.priority,
  deadline: tasks.deadline,
  status: tasks.status,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
};

const notificationFields = {
  id: notifications.id,
  recipientMemberId: notifications.recipientMemberId,
  taskId: notifications.taskId,
  title: notifications.title,
  content: notifications.content,
  type: notifications.type,
  readAt: notifications.readAt,
  createdAt: notifications.createdAt,
};

export async function getDb() {
  if (!_db && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    try {
      const client = createLibsqlClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect to Turso:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Turso database is unavailable.");
  return db;
}

export async function createUser(input: InsertUser) {
  const db = await requireDb();
  const result = await db.insert(users).values(input);
  return Number(result.lastInsertRowid);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserPassword(id: number, password: string) {
  const db = await requireDb();
  await db.update(users).set({ password, updatedAt: new Date(), lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function createSession(input: InsertSession) {
  const db = await requireDb();
  await db.insert(sessions).values(input);
}

export async function getSessionById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(sessions).where(eq(sessions.id, id)).limit(1))[0];
}

export async function deleteSession(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function deleteAllUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function updateSessionExpiry(id: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
}

export async function listTeamMembers() {
  const db = await requireDb();
  return db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));
}

export async function createTeamMember(input: InsertTeamMember) {
  const db = await requireDb();
  const result = await db.insert(teamMembers).values(input);
  return Number(result.lastInsertRowid);
}

export async function updateTeamMember(id: number, input: Partial<InsertTeamMember>) {
  const db = await requireDb();
  await db.update(teamMembers).set({ ...input, updatedAt: new Date() }).where(eq(teamMembers.id, id));
}

export async function getTeamMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1))[0];
}

export async function createInvitationToken(input: InsertInvitationToken) {
  const db = await requireDb();
  await db.insert(invitationTokens).values(input);
}

export async function getInvitationToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select({ token: invitationTokens.token, teamMemberId: invitationTokens.teamMemberId, expiresAt: invitationTokens.expiresAt, usedAt: invitationTokens.usedAt, userId: teamMembers.userId, email: teamMembers.email, name: teamMembers.name }).from(invitationTokens).innerJoin(teamMembers, eq(invitationTokens.teamMemberId, teamMembers.id)).where(eq(invitationTokens.token, token)).limit(1))[0];
}

export async function markInvitationTokenUsed(token: string) {
  const db = await requireDb();
  await db.update(invitationTokens).set({ usedAt: new Date() }).where(eq(invitationTokens.token, token));
}

export async function listClients() {
  const db = await requireDb();
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function createClient(input: InsertClient) {
  const db = await requireDb();
  const result = await db.insert(clients).values(input);
  return Number(result.lastInsertRowid);
}

export async function updateClient(id: number, input: Partial<InsertClient>) {
  const db = await requireDb();
  await db.update(clients).set({ ...input, updatedAt: new Date() }).where(eq(clients.id, id));
}

export async function listProjects() {
  const db = await requireDb();
  return db.select({ ...projectFields, clientName: clients.organizationName }).from(projects).innerJoin(clients, eq(projects.clientId, clients.id)).orderBy(desc(projects.updatedAt));
}

export async function getProjectWithClient(id: number) {
  const db = await requireDb();
  return (await db.select({ ...projectFields, clientName: clients.organizationName }).from(projects).innerJoin(clients, eq(projects.clientId, clients.id)).where(eq(projects.id, id)).limit(1))[0];
}

export async function createProject(input: InsertProject) {
  const db = await requireDb();
  const result = await db.insert(projects).values(input);
  return Number(result.lastInsertRowid);
}

export async function updateProject(id: number, input: Partial<InsertProject>) {
  const db = await requireDb();
  await db.update(projects).set({ ...input, updatedAt: new Date() }).where(eq(projects.id, id));
}

export async function listTasks(memberUserId?: number | null) {
  const db = await requireDb();
  const query = db.select({ ...taskFields, projectName: projects.name, clientName: clients.organizationName, assignedMemberName: teamMembers.name, assignedMemberEmail: teamMembers.email }).from(tasks).innerJoin(projects, eq(tasks.projectId, projects.id)).innerJoin(clients, eq(projects.clientId, clients.id)).leftJoin(teamMembers, eq(tasks.assignedMemberId, teamMembers.id));
  return memberUserId ? query.where(eq(teamMembers.userId, memberUserId)).orderBy(desc(tasks.updatedAt)) : query.orderBy(desc(tasks.updatedAt));
}

export async function getTaskWithDetails(id: number, memberUserId?: number | null) {
  const db = await requireDb();
  const conditions = memberUserId ? and(eq(tasks.id, id), eq(teamMembers.userId, memberUserId)) : eq(tasks.id, id);
  return (await db.select({ ...taskFields, projectName: projects.name, clientName: clients.organizationName, assignedMemberName: teamMembers.name, assignedMemberEmail: teamMembers.email }).from(tasks).innerJoin(projects, eq(tasks.projectId, projects.id)).innerJoin(clients, eq(projects.clientId, clients.id)).leftJoin(teamMembers, eq(tasks.assignedMemberId, teamMembers.id)).where(conditions).limit(1))[0];
}

export async function createTask(input: InsertTask) {
  const db = await requireDb();
  const result = await db.insert(tasks).values(input);
  return Number(result.lastInsertRowid);
}

export async function updateTask(id: number, input: Partial<InsertTask>) {
  const db = await requireDb();
  await db.update(tasks).set({ ...input, updatedAt: new Date() }).where(eq(tasks.id, id));
}

export async function createNotification(input: { recipientMemberId: number; taskId: number; title: string; content: string; type: "task_assigned" | "task_reassigned" | "system" }) {
  const db = await requireDb();
  await db.insert(notifications).values(input);
}

export async function listNotifications(memberUserId?: number | null) {
  const db = await requireDb();
  const query = db.select({ ...notificationFields, recipientName: teamMembers.name, recipientEmail: teamMembers.email }).from(notifications).innerJoin(teamMembers, eq(notifications.recipientMemberId, teamMembers.id));
  return memberUserId ? query.where(eq(teamMembers.userId, memberUserId)).orderBy(desc(notifications.createdAt)) : query.orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number, memberUserId?: number | null) {
  const db = await requireDb();
  if (memberUserId) {
    const owned = await db.select({ id: notifications.id }).from(notifications).innerJoin(teamMembers, eq(notifications.recipientMemberId, teamMembers.id)).where(and(eq(notifications.id, id), eq(teamMembers.userId, memberUserId))).limit(1);
    if (!owned[0]) return;
  }
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
}

export async function createActivityLog(input: { entityType: string; entityId: number; action: string; description: string }) {
  const db = await requireDb();
  await db.insert(activityLogs).values(input);
}

export async function listRecentActivity() {
  const db = await requireDb();
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8);
}

export async function getDashboardStats() {
  const db = await requireDb();
  const now = new Date();
  const [[staff], [client], [activeProject], [overdueTask]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(teamMembers),
    db.select({ count: sql<number>`count(*)` }).from(clients),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "in_progress")),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(lte(tasks.deadline, now), ne(tasks.status, "completed"))),
  ]);
  return { totalStaff: Number(staff?.count ?? 0), totalClients: Number(client?.count ?? 0), activeProjects: Number(activeProject?.count ?? 0), overdueTasks: Number(overdueTask?.count ?? 0) };
}

export async function getProjectReportData(projectId: number) {
  const db = await requireDb();
  const project = await getProjectWithClient(projectId);
  if (!project) return undefined;
  const projectTasks = await db.select({ ...taskFields, assignedMemberName: teamMembers.name, assignedMemberEmail: teamMembers.email }).from(tasks).leftJoin(teamMembers, eq(tasks.assignedMemberId, teamMembers.id)).where(eq(tasks.projectId, projectId)).orderBy(tasks.deadline);
  return { project, tasks: projectTasks };
}

export async function listOverdueTasks() {
  const db = await requireDb();
  return db.select().from(tasks).where(and(lte(tasks.deadline, new Date()), ne(tasks.status, "completed")));
}
