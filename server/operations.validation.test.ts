import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-owner",
      name: "Test Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("operations input validation", () => {
  it("rejects a project deadline that precedes its start date before a database write", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.operations.projects.create({
      clientId: 1,
      name: "Invalid delivery timeline",
      description: "This should not be accepted.",
      startDate: new Date("2026-09-12"),
      deadline: new Date("2026-09-10"),
      status: "planned",
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "The deadline must be on or after the start date." });
  });

  it("rejects an invalid task priority at the procedure boundary", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.operations.tasks.create({
      projectId: 1,
      assignedMemberId: null,
      title: "Invalid priority task",
      description: "The procedure should validate the supplied priority.",
      priority: "urgent" as never,
      deadline: new Date("2026-09-20"),
      status: "not_started",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
