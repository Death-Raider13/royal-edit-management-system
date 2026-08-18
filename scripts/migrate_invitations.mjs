import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");

const client = createClient({ url, authToken });
const columns = await client.execute("PRAGMA table_info(teamMembers)");
const existing = new Set(columns.rows.map((row) => String(row.name)));
const statements = [];

if (!existing.has("userId")) statements.push("ALTER TABLE teamMembers ADD COLUMN userId INTEGER REFERENCES users(id) ON DELETE SET NULL");
if (!existing.has("invitationStatus")) statements.push("ALTER TABLE teamMembers ADD COLUMN invitationStatus TEXT");
if (!existing.has("invitationSentAt")) statements.push("ALTER TABLE teamMembers ADD COLUMN invitationSentAt INTEGER");
if (!existing.has("invitationAcceptedAt")) statements.push("ALTER TABLE teamMembers ADD COLUMN invitationAcceptedAt INTEGER");
statements.push("UPDATE teamMembers SET invitationStatus = 'pending' WHERE invitationStatus IS NULL");
statements.push("CREATE TABLE IF NOT EXISTS invitationTokens (token TEXT PRIMARY KEY NOT NULL, teamMemberId INTEGER NOT NULL REFERENCES teamMembers(id) ON DELETE CASCADE, expiresAt INTEGER NOT NULL, usedAt INTEGER, createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))");
statements.push("CREATE INDEX IF NOT EXISTS invitationTokens_teamMemberId_idx ON invitationTokens(teamMemberId)");
statements.push("CREATE INDEX IF NOT EXISTS teamMembers_userId_idx ON teamMembers(userId)");
statements.push("CREATE TABLE IF NOT EXISTS adminNotifications (id INTEGER PRIMARY KEY AUTOINCREMENT, recipientUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, taskId INTEGER REFERENCES tasks(id), title TEXT NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'task_progress', readAt INTEGER, createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000))");
statements.push("CREATE INDEX IF NOT EXISTS adminNotifications_recipientUserId_idx ON adminNotifications(recipientUserId)");
await client.batch(statements.map((sql) => ({ sql })), "write");
const verify = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'invitationTokens'");
console.log(JSON.stringify({ applied: statements.length, invitationTokens: verify.rows.length === 1 }));
client.close();
