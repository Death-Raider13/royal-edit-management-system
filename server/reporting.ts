import { spawn } from "node:child_process";

type ProjectSource = {
  id: number;
  clientName: string;
  name: string;
  description: string;
  startDate: Date;
  deadline: Date;
  status: string;
};

type TaskSource = {
  id: number;
  title: string;
  priority: string;
  status: string;
  deadline: Date;
  assignedMemberName: string | null;
};

export function calculateProjectSummary(data: { project: ProjectSource; tasks: TaskSource[] }) {
  const now = new Date();
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter((task) => task.status === "completed").length;
  const overdueTasks = data.tasks.filter((task) => new Date(task.deadline) < now && task.status !== "completed");
  const statusCounts = ["not_started", "in_progress", "blocked", "completed"].map((status) => ({
    status,
    count: data.tasks.filter((task) => task.status === status).length,
  }));
  const assignedMembers = Array.from(new Set(data.tasks.flatMap((task) => task.assignedMemberName ? [task.assignedMemberName] : [])));
  return {
    project: data.project,
    totalTasks,
    completedTasks,
    completionPercentage: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    statusCounts,
    assignedMembers,
    overdueTasks,
    tasks: data.tasks,
  };
}

export function buildProjectReportPayload(summary: ReturnType<typeof calculateProjectSummary>) {
  return {
    generatedAt: new Date().toISOString(),
    project: {
      id: summary.project.id,
      clientName: summary.project.clientName,
      name: summary.project.name,
      description: summary.project.description,
      startDate: new Date(summary.project.startDate).toISOString(),
      deadline: new Date(summary.project.deadline).toISOString(),
      status: summary.project.status,
    },
    metrics: {
      totalTasks: summary.totalTasks,
      completedTasks: summary.completedTasks,
      overdueTasks: summary.overdueTasks.length,
      completionPercentage: summary.completionPercentage,
    },
    statusCounts: summary.statusCounts,
    assignedMembers: summary.assignedMembers,
    tasks: summary.tasks.map((task) => ({
      title: task.title,
      priority: task.priority,
      status: task.status,
      deadline: new Date(task.deadline).toISOString(),
      assignedMemberName: task.assignedMemberName,
    })),
  };
}

export async function generateReportWithPython(payload: ReturnType<typeof buildProjectReportPayload>) {
  return new Promise<{ filename: string; contentType: "application/pdf"; pdfBase64: string }>((resolve, reject) => {
    const child = spawn("python3", ["scripts/project_report.py"], { cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", () => reject(new Error("The reporting service could not start.")));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || "The reporting service could not generate this report."));
      try {
        resolve(JSON.parse(stdout) as { filename: string; contentType: "application/pdf"; pdfBase64: string });
      } catch {
        reject(new Error("The reporting service returned an invalid document."));
      }
    });
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}
