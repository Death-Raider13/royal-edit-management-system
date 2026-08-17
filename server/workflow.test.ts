import { describe, expect, it } from "vitest";
import { buildProjectReportPayload, calculateProjectSummary, generateReportWithPython } from "./reporting";
import { buildAssignmentNotification } from "./workflow";

describe("assignment notification workflow", () => {
  it("includes the required task, project, priority, and deadline context", () => {
    const result = buildAssignmentNotification({ taskTitle: "Final colour grading", projectName: "Northstar Campaign", priority: "high", deadline: new Date("2026-09-15T00:00:00Z"), reassigned: true });
    expect(result.type).toBe("task_reassigned");
    expect(result.content).toContain("Final colour grading");
    expect(result.content).toContain("Northstar Campaign");
    expect(result.content).toContain("HIGH priority");
    expect(result.content).toMatch(/15 Sept 2026/);
  });
});

describe("project reporting workflow", () => {
  it("calculates completion, task status counts, members, and overdue items", () => {
    const summary = calculateProjectSummary({
      project: { id: 1, clientName: "Northstar Studios", name: "Campaign", description: "Campaign work", startDate: new Date("2026-01-01"), deadline: new Date("2026-12-01"), status: "in_progress" },
      tasks: [
        { id: 1, title: "Finished task", priority: "medium", status: "completed", deadline: new Date("2026-01-05"), assignedMemberName: "Ama" },
        { id: 2, title: "Late task", priority: "high", status: "in_progress", deadline: new Date("2020-01-05"), assignedMemberName: "Kemi" },
      ],
    });
    expect(summary.completionPercentage).toBe(50);
    expect(summary.overdueTasks).toHaveLength(1);
    expect(summary.assignedMembers).toEqual(["Ama", "Kemi"]);
    expect(summary.statusCounts.find((item) => item.status === "completed")?.count).toBe(1);
  });

  it("passes the structured project payload to Python and returns both download formats", async () => {
    const summary = calculateProjectSummary({
      project: { id: 2, clientName: "Northstar Studios", name: "Launch Film", description: "Hero film production", startDate: new Date("2026-08-01"), deadline: new Date("2026-09-01"), status: "in_progress" },
      tasks: [{ id: 1, title: "Final edit", priority: "high", status: "in_progress", deadline: new Date("2026-08-28"), assignedMemberName: "Ama" }],
    });
    const document = await generateReportWithPython(buildProjectReportPayload(summary));
    expect(document.filename).toBe("Launch_Film_Royal_Edit_Report.pdf");
    expect(document.contentType).toBe("application/pdf");
    expect(document.filename).toMatch(/\.pdf$/);
    expect(document.pdfBase64.length).toBeGreaterThan(100);
  });
});
