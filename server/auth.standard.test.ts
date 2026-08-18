import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  createUser: vi.fn().mockResolvedValue(7),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  getSessionById: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  updateSessionExpiry: vi.fn().mockResolvedValue(undefined),
  updateUserLastSignedIn: vi.fn().mockResolvedValue(undefined),
  updateUserPassword: vi.fn().mockResolvedValue(undefined),
  createTeamMember: vi.fn().mockResolvedValue(22),
  createInvitationToken: vi.fn().mockResolvedValue(undefined),
  getTeamMemberById: vi.fn(),
  updateTeamMember: vi.fn().mockResolvedValue(undefined),
  getInvitationToken: vi.fn(),
  markInvitationTokenUsed: vi.fn().mockResolvedValue(undefined),
  logActivity: vi.fn().mockResolvedValue(undefined),
  createActivityLog: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({ totalStaff: 0, totalClients: 0, activeProjects: 0, overdueTasks: 0 }),
  listRecentActivity: vi.fn().mockResolvedValue([]),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./mailer", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendTaskAssignmentEmail: vi.fn().mockResolvedValue(undefined),
  sendTeamInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";
import { createSession, hashPassword, validateSession, verifyPassword } from "./_core/auth";
import { createContext } from "./_core/context";
import { SESSION_COOKIE } from "@shared/const";
import type { TrpcContext } from "./_core/context";

const user = {
  id: 7,
  openId: "standard-auth-user",
  email: "member@example.com",
  name: "Royal Edit Member",
  password: "hashed-password",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(userValue: typeof user | null = null): TrpcContext {
  return {
    user: userValue,
    req: { headers: {} } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("standard authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createSession.mockResolvedValue(undefined);
    dbMocks.createUser.mockResolvedValue(7);
    dbMocks.getUserByEmail.mockResolvedValue(undefined);
    dbMocks.getInvitationToken.mockResolvedValue(undefined);
    dbMocks.getTeamMemberById.mockResolvedValue(undefined);
  });

  it("hashes passwords and verifies the original value only", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect password", hash)).resolves.toBe(false);
  });

  it("registers a general user and creates a session cookie", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context());
    const result = await caller.auth.register({ name: "New Member", email: "new@example.com", password: "password123" });
    expect(result).toEqual({ success: true });
    expect(dbMocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", role: "user" }));
    expect(dbMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
  });

  it("logs in with valid credentials, updates sign-in time, and sets a session cookie", async () => {
    const passwordHash = await hashPassword("correct-password");
    dbMocks.getUserByEmail.mockResolvedValue({ ...user, password: passwordHash });
    const response = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"];
    const caller = appRouter.createCaller({ ...context(), res: response });
    await expect(caller.auth.login({ email: user.email, password: "correct-password" })).resolves.toEqual({ success: true });
    expect(dbMocks.updateUserLastSignedIn).toHaveBeenCalledWith(user.id);
    expect(dbMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }));
    expect(response.cookie).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ httpOnly: true, path: "/" }));
  });

  it("rejects an invalid password without creating a session", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(user);
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.login({ email: user.email, password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(dbMocks.createSession).not.toHaveBeenCalled();
  });

  it("resolves a session cookie and grants access to a protected procedure", async () => {
    dbMocks.getSessionById.mockResolvedValue({ id: "session-id", userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20) });
    dbMocks.getUserById.mockResolvedValue(user);
    const ctx = await createContext({
      req: { headers: { cookie: `${SESSION_COOKIE}=session-id` } } as any,
      res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
    });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.operations.dashboard()).resolves.toMatchObject({ stats: { totalStaff: 0 }, recentActivity: [] });
  });

  it("requires an authenticated context for logout", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.logout()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("expires old sessions and refreshes sessions close to expiry", async () => {
    dbMocks.getSessionById.mockResolvedValueOnce({ id: "expired", userId: 7, expiresAt: new Date(Date.now() - 1000) });
    await expect(validateSession("expired")).resolves.toBeNull();
    expect(dbMocks.deleteSession).toHaveBeenCalledWith("expired");

    dbMocks.getSessionById.mockResolvedValueOnce({ id: "active", userId: 7, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) });
    dbMocks.getUserById.mockResolvedValue(user);
    const result = await validateSession("active");
    expect(result?.user.id).toBe(7);
    expect(dbMocks.updateSessionExpiry).toHaveBeenCalledWith("active", expect.any(Date));
  });

  it("creates a linked member account and sends a one-time invitation", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(undefined);
    const administrator = { ...user, role: "admin" as const };
    const caller = appRouter.createCaller({ ...context(administrator), req: { protocol: "https", headers: { host: "hub.example.com" } } as any });
    await expect(caller.operations.teamMembers.create({ name: "New Teammate", role: "Editor", email: "new-teammate@example.com", status: "active" })).resolves.toMatchObject({ id: 22, invited: true });
    expect(dbMocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "new-teammate@example.com", role: "user" }));
    expect(dbMocks.createTeamMember).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, invitationStatus: "pending" }));
    expect(dbMocks.createInvitationToken).toHaveBeenCalledWith(expect.objectContaining({ teamMemberId: 22, expiresAt: expect.any(Date) }));
    const mailer = await import("./mailer");
    expect(mailer.sendTeamInvitationEmail).toHaveBeenCalledWith(expect.objectContaining({ recipientEmail: "new-teammate@example.com", inviteUrl: expect.stringContaining("setup-password?token=") }));
  });

  it("rejects creating a team member when the email already owns a login", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(user);
    const caller = appRouter.createCaller({ ...context({ ...user, role: "admin" as const }), req: { protocol: "https", headers: { host: "hub.example.com" } } as any });
    await expect(caller.operations.teamMembers.create({ name: "Duplicate", role: "Editor", email: user.email, status: "active" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMocks.createTeamMember).not.toHaveBeenCalled();
  });

  it("resends a pending invitation and activates a valid one-time setup token", async () => {
    dbMocks.getTeamMemberById.mockResolvedValue({ id: 22, name: "Pending Member", email: "pending@example.com", invitationStatus: "pending", userId: 7 });
    const administratorCaller = appRouter.createCaller({ ...context({ ...user, role: "admin" as const }), req: { protocol: "https", headers: { host: "hub.example.com" } } as any });
    await expect(administratorCaller.operations.teamMembers.resendInvitation({ id: 22 })).resolves.toEqual({ success: true });
    expect(dbMocks.createInvitationToken).toHaveBeenCalledWith(expect.objectContaining({ teamMemberId: 22 }));

    dbMocks.getInvitationToken.mockResolvedValue({ token: "valid-token-123456789012345", teamMemberId: 22, userId: 7, email: "pending@example.com", name: "Pending Member", expiresAt: new Date(Date.now() + 1000 * 60 * 60), usedAt: null });
    const setupResponse = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"];
    const setupCaller = appRouter.createCaller({ ...context(), res: setupResponse });
    await expect(setupCaller.auth.setupPassword({ token: "valid-token-123456789012345", password: "new-secure-password" })).resolves.toEqual({ success: true });
    expect(dbMocks.updateUserPassword).toHaveBeenCalledWith(7, expect.any(String));
    expect(dbMocks.updateTeamMember).toHaveBeenCalledWith(22, expect.objectContaining({ invitationStatus: "accepted", status: "active" }));
    expect(dbMocks.markInvitationTokenUsed).toHaveBeenCalledWith("valid-token-123456789012345");

    const configuredPasswordHash = dbMocks.updateUserPassword.mock.calls.at(-1)?.[1];
    dbMocks.getUserByEmail.mockResolvedValue({ ...user, email: "pending@example.com", password: configuredPasswordHash });
    const loginResponse = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"];
    const memberCaller = appRouter.createCaller({ ...context(), res: loginResponse });
    await expect(memberCaller.auth.login({ email: "pending@example.com", password: "new-secure-password" })).resolves.toEqual({ success: true });
    expect(dbMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
  });

  it("rejects an expired invitation without changing the account", async () => {
    dbMocks.getInvitationToken.mockResolvedValue({ token: "expired-token-123456789012345", teamMemberId: 22, userId: 7, email: "pending@example.com", name: "Pending Member", expiresAt: new Date(Date.now() - 1000), usedAt: null });
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.setupPassword({ token: "expired-token-123456789012345", password: "new-secure-password" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.updateUserPassword).not.toHaveBeenCalled();
  });

  it("creates a 30-day session record for a user", async () => {
    const before = Date.now();
    const sessionId = await createSession(7);
    expect(sessionId).toEqual(expect.any(String));
    const input = dbMocks.createSession.mock.calls[0]?.[0] as { userId: number; expiresAt: Date };
    expect(input.userId).toBe(7);
    expect(input.expiresAt.getTime()).toBeGreaterThan(before + 1000 * 60 * 60 * 24 * 29);
  });
});
