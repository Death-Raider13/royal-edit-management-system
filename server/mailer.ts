import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#0b0c0e;border:1px solid #27272a;border-radius:12px;overflow:hidden;color:#e8e0d0;">
  <div style="background-color:#0b0c0e;padding:32px 32px 24px;text-align:center;border-bottom:1px solid #27272a;">
    <p style="color:#c9a84c;letter-spacing:0.15em;text-transform:uppercase;font-size:12px;font-weight:600;margin:0;">Royal Edit</p>
    <p style="color:#a99e8c;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;margin:4px 0 0;">Operations Hub</p>
  </div>
  <div style="padding:40px 32px;">
    <h1 style="font-size:24px;font-weight:600;margin-top:0;margin-bottom:24px;color:#fff;">A task has been ${action}.</h1>
    <p style="font-size:16px;line-height:1.6;margin-bottom:24px;">Hello <strong>${escapeHtml(input.recipientName)}</strong>,<br><br>The task "<strong>${escapeHtml(input.taskTitle)}</strong>" is now in your delivery queue.</p>
    
    <div style="background-color:#141517;border:1px solid #27272a;border-radius:8px;padding:24px;margin-bottom:32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding-bottom:12px;color:#a99e8c;width:30%;">Project:</td>
          <td style="padding-bottom:12px;color:#fff;font-weight:500;">${escapeHtml(input.projectName)}</td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;color:#a99e8c;">Priority:</td>
          <td style="padding-bottom:12px;color:#fff;font-weight:500;">${escapeHtml(input.priority.toUpperCase())}</td>
        </tr>
        <tr>
          <td style="color:#a99e8c;">Deadline:</td>
          <td style="color:#fff;font-weight:500;">${escapeHtml(dueDate)}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align:center;">
      <a href="https://royaledit.app" style="display:inline-block;background-color:#c9a84c;color:#080808;font-weight:600;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:6px;text-align:center;">Open Operations Hub</a>
    </div>
  </div>
  <div style="background-color:#060606;padding:24px;text-align:center;border-top:1px solid #27272a;font-size:12px;color:#847966;">
    <p style="margin:0;">This is an automated notification from Royal Edit Media House.</p>
  </div>
</div>
  `.trim();
  await transport.sendMail({ from: process.env.FROM_EMAIL, to: input.recipientEmail, subject, text, html });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
}

export async function sendWelcomeEmail(input: {
  recipientName: string;
  recipientEmail: string;
}) {
  const subject = "Welcome to Royal Edit Operations Hub";
  const text = `Hello ${input.recipientName},\n\nWelcome to the Royal Edit Operations Hub!\n\nYour account has been successfully created.\n`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#25211b"><p style="color:#8b6f2e;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Royal Edit Media House</p><h1 style="font-family:Georgia,serif;font-weight:400">Welcome!</h1><p>Hello ${escapeHtml(input.recipientName)},</p><p>Your account in the Royal Edit Operations Hub has been successfully created.</p><p>You can now log in to review your projects, tasks, and notifications.</p></div>`;
  await transport.sendMail({ from: process.env.SMTP_FROM || process.env.FROM_EMAIL, to: input.recipientEmail, subject, text, html });
}

export async function verifyMailTransport() {
  await transport.verify();
  return true;
}
