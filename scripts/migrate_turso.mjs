import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");

const client = createClient({ url, authToken });
const statements = [
  `PRAGMA foreign_keys = ON`,
  // Drop old users table (no real users — fresh start)
  `DROP TABLE IF EXISTS sessions`,
  `DROP TABLE IF EXISTS users`,
  // Recreate with new schema
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, name TEXT, role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')), createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000), lastSignedIn INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expiresAt INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS teamMembers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL, email TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, organizationName TEXT NOT NULL, contactPerson TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER NOT NULL REFERENCES clients(id), name TEXT NOT NULL, description TEXT NOT NULL, startDate INTEGER NOT NULL, deadline INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','on_hold','completed','cancelled')), createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER NOT NULL REFERENCES projects(id), assignedMemberId INTEGER REFERENCES teamMembers(id), title TEXT NOT NULL, description TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')), deadline INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','blocked','completed')), createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, recipientMemberId INTEGER NOT NULL REFERENCES teamMembers(id), taskId INTEGER REFERENCES tasks(id), title TEXT NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('task_assigned','task_reassigned','system')), readAt INTEGER, createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE TABLE IF NOT EXISTS activityLogs (id INTEGER PRIMARY KEY AUTOINCREMENT, entityType TEXT NOT NULL, entityId INTEGER NOT NULL, action TEXT NOT NULL, description TEXT NOT NULL, createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))`,
  `CREATE INDEX IF NOT EXISTS projects_clientId_idx ON projects(clientId)`,
  `CREATE INDEX IF NOT EXISTS tasks_projectId_idx ON tasks(projectId)`,
  `CREATE INDEX IF NOT EXISTS tasks_assignedMemberId_idx ON tasks(assignedMemberId)`,
  `CREATE INDEX IF NOT EXISTS notifications_recipientMemberId_idx ON notifications(recipientMemberId)`,
  `CREATE INDEX IF NOT EXISTS activityLogs_createdAt_idx ON activityLogs(createdAt)`,
  `CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions(userId)`,
];

await client.batch(statements.map((sql) => ({ sql })), "write");
const result = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users','sessions','teamMembers','clients','projects','tasks','notifications','activityLogs') ORDER BY name");
console.log(JSON.stringify({ tables: result.rows.map((row) => row.name) }));
client.close();
