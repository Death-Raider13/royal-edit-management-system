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

export function buildTaskProgressNotification(input: {
  taskTitle: string;
  projectName: string;
  memberName: string;
  status: "not_started" | "in_progress" | "almost_done" | "blocked" | "completed";
}) {
  const messages = {
    not_started: {
      title: "Task moved back to not started",
      content: `${input.memberName} has marked “${input.taskTitle}” as not started on ${input.projectName}.`,
    },
    in_progress: {
      title: "Task progress update: work has started",
      content: `${input.memberName} has started working on “${input.taskTitle}” on ${input.projectName}.`,
    },
    almost_done: {
      title: "Task progress update: almost complete",
      content: `${input.memberName} is almost done with “${input.taskTitle}” on ${input.projectName}.`,
    },
    blocked: {
      title: "Task progress update: blocked",
      content: `${input.memberName} has marked “${input.taskTitle}” as blocked on ${input.projectName}; manager attention may be required.`,
    },
    completed: {
      title: "Task progress update: completed",
      content: `${input.memberName} has completed “${input.taskTitle}” on ${input.projectName}.`,
    },
  } as const;
  return { ...messages[input.status], type: "system" as const };
}
