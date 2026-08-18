import * as db from "../db";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  // Session expires in 30 days
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  
  await db.createSession({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function validateSession(sessionId: string) {
  const session = await db.getSessionById(sessionId);
  if (!session) {
    return null;
  }
  
  if (session.expiresAt.getTime() < Date.now()) {
    await db.deleteSession(sessionId);
    return null;
  }
  
  // Extend session if it's close to expiring (e.g. less than 15 days left)
  const fifteenDays = 1000 * 60 * 60 * 24 * 15;
  if (session.expiresAt.getTime() - Date.now() < fifteenDays) {
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db.updateSessionExpiry(sessionId, newExpiresAt);
    session.expiresAt = newExpiresAt;
  }
  
  const user = await db.getUserById(session.userId);
  if (!user) {
    return null;
  }
  
  return { user, session };
}
