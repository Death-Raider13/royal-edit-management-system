export function buildAssignmentNotification(input: {
  taskTitle: string;
  projectName: string;
  priority: string;
  deadline: Date | string;
  reassigned: boolean;
}) {
  const deadline = new Date(input.deadline).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return {
    title: input.reassigned ? "A task has been reassigned to you" : "A new task has been assigned to you",
    content: `${input.taskTitle} · ${input.projectName} · ${input.priority.toUpperCase()} priority · Due ${deadline}`,
    type: input.reassigned ? "task_reassigned" as const : "task_assigned" as const,
  };
}
