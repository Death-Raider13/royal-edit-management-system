import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendTaskAssignmentEmail(input: {
  recipientName: string;
  recipientEmail: string;
  taskTitle: string;
  projectName: string;
  priority: string;
  deadline: Date | string;
  reassigned: boolean;
}) {
  const dueDate = new Date(input.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const action = input.reassigned ? "reassigned to you" : "assigned to you";
  const subject = `${input.reassigned ? "Task reassigned" : "New task assigned"}: ${input.taskTitle}`;
  const text = `Hello ${input.recipientName},\n\nThe task “${input.taskTitle}” has been ${action}.\n\nProject: ${input.projectName}\nPriority: ${input.priority.toUpperCase()}\nDeadline: ${dueDate}\n\nPlease open the Royal Edit Operations Hub to review the full brief.\n`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#25211b"><p style="color:#8b6f2e;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Royal Edit Media House</p><h1 style="font-family:Georgia,serif;font-weight:400">A task has been ${action}.</h1><p>Hello ${escapeHtml(input.recipientName)},</p><p><strong>${escapeHtml(input.taskTitle)}</strong> is now in your delivery queue.</p><dl><dt>Project</dt><dd>${escapeHtml(input.projectName)}</dd><dt>Priority</dt><dd>${escapeHtml(input.priority.toUpperCase())}</dd><dt>Deadline</dt><dd>${escapeHtml(dueDate)}</dd></dl><p>Please open the Royal Edit Operations Hub to review the full brief.</p></div>`;
  await transport.sendMail({ from: process.env.FROM_EMAIL, to: input.recipientEmail, subject, text, html });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
}

export async function verifyMailTransport() {
  await transport.verify();
  return true;
}
