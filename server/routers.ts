import { SESSION_COOKIE } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { createSession, hashPassword, validateSession, verifyPassword } from "./_core/auth";
import { deleteSession } from "./db";
import { sendWelcomeEmail } from "./mailer";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { operationsRouter } from "./routers/operations";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
function serializeSessionCookie(value: string, maxAge: number) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

function setSessionCookie(res: any, sessionId: string) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    path: "/",
  };
  if (typeof res?.cookie === "function") {
    res.cookie(SESSION_COOKIE, sessionId, options);
    return;
  }
  if (typeof res?.append === "function") {
    res.append("set-cookie", serializeSessionCookie(sessionId, options.maxAge));
  }
}

function clearSessionCookie(res: any) {
  if (typeof res?.clearCookie === "function") {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return;
  }
  if (typeof res?.append === "function") {
    res.append("set-cookie", serializeSessionCookie("", 0));
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user ?? null),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        }
        const passwordHash = await hashPassword(input.password);
        const userId = await db.createUser({
          email: input.email,
          password: passwordHash,
          name: input.name,
          role: "user",
          lastSignedIn: new Date(),
        });
        const sessionId = await createSession(userId);
        setSessionCookie(ctx.res, sessionId);
        
        // Send a welcome email asynchronously
        sendWelcomeEmail({
          recipientName: input.name,
          recipientEmail: input.email,
        }).catch((err) => {
          console.error("Failed to send welcome email:", err);
        });

        return { success: true };
      }),

    setupPassword: publicProcedure
      .input(z.object({ token: z.string().min(20), password: z.string().min(8, "Password must be at least 8 characters") }))
      .mutation(async ({ input, ctx }) => {
        const invitation = await db.getInvitationToken(input.token);
        if (!invitation || invitation.usedAt || invitation.expiresAt.getTime() < Date.now() || !invitation.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation is invalid or has expired. Ask an administrator to resend it." });
        }
        const passwordHash = await hashPassword(input.password);
        await db.updateUserPassword(invitation.userId, passwordHash);
        await db.updateTeamMember(invitation.teamMemberId, { userId: invitation.userId, invitationStatus: "accepted", invitationAcceptedAt: new Date(), status: "active" });
        await db.markInvitationTokenUsed(input.token);
        const sessionId = await createSession(invitation.userId);
        setSessionCookie(ctx.res, sessionId);
        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
        const valid = await verifyPassword(input.password, user.password);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
        await db.updateUserLastSignedIn(user.id);
        const sessionId = await createSession(user.id);
        setSessionCookie(ctx.res, sessionId);
        return { success: true };
      }),

    logout: protectedProcedure
      .mutation(async ({ ctx }) => {
        const requestHeaders = (ctx.req as unknown as { headers?: { cookie?: string } }).headers;
        const cookies = requestHeaders?.cookie ?? "";
        const { parse } = await import("cookie");
        const sessionId = parse(cookies)[SESSION_COOKIE];
        if (sessionId) {
          await deleteSession(sessionId);
        }
        clearSessionCookie(ctx.res);
        return { success: true };
      }),
  }),
  operations: operationsRouter,
});

export type AppRouter = typeof appRouter;
