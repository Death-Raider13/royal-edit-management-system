import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-test`,
      name: role === "admin" ? "Royal Edit Admin" : "Royal Edit Member",
      email: role === "admin" ? "admin@example.com" : "member@example.com",
      password: "hashed",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("two-role permissions", () => {
  it("rejects general users from client creation", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.operations.clients.create({
      organizationName: "Restricted Client",
      contactPerson: "Test Contact",
      email: "contact@example.com",
      phone: "+233000000000",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects general users from task creation", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.operations.tasks.create({
      projectId: 1,
      assignedMemberId: 2,
      title: "Restricted task",
      description: "This task should be created by an administrator.",
      priority: "medium",
      deadline: new Date("2026-09-30"),
      status: "not_started",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects general users from team administration and reports", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.operations.teamMembers.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.reports.projectSummary({ projectId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
