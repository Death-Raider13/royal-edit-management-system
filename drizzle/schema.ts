import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () => integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);
const updatedAt = () => integer("updatedAt", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
});

export const teamMembers = sqliteTable("teamMembers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull().unique(),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationName: text("organizationName").notNull(),
  contactPerson: text("contactPerson").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("clientId").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  startDate: integer("startDate", { mode: "timestamp_ms" }).notNull(),
  deadline: integer("deadline", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["planned", "in_progress", "on_hold", "completed", "cancelled"] }).notNull().default("planned"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("projectId").notNull().references(() => projects.id),
  assignedMemberId: integer("assignedMemberId").references(() => teamMembers.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  deadline: integer("deadline", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["not_started", "in_progress", "blocked", "completed"] }).notNull().default("not_started"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipientMemberId: integer("recipientMemberId").notNull().references(() => teamMembers.id),
  taskId: integer("taskId").references(() => tasks.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["task_assigned", "task_reassigned", "system"] }).notNull().default("system"),
  readAt: integer("readAt", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export const activityLogs = sqliteTable("activityLogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entityType").notNull(),
  entityId: integer("entityId").notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertSession = typeof sessions.$inferInsert;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type InsertClient = typeof clients.$inferInsert;
export type InsertProject = typeof projects.$inferInsert;
export type InsertTask = typeof tasks.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;

