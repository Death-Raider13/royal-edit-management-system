import html
import json
import re
import sys
from datetime import datetime


def label(value: str) -> str:
    return value.replace("_", " ").title()


def date_label(value: str) -> str:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d %b %Y")


def clean_filename(value: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return safe or "Royal_Edit_Project"


def generate(payload: dict) -> dict:
    project = payload["project"]
    metrics = payload["metrics"]
    status_rows = "\n".join(f"| {label(item['status'])} | {item['count']} |" for item in payload["statusCounts"])
    task_rows = "\n".join(
        f"| {task['title']} | {label(task['status'])} | {label(task['priority'])} | {task['assignedMemberName'] or 'Unassigned'} | {date_label(task['deadline'])} |"
        for task in payload["tasks"]
    ) or "| No tasks recorded | — | — | — | — |"
    assignees = ", ".join(payload["assignedMembers"]) or "No team members are assigned."
    markdown = f"""# Royal Edit Media House — Project Report

## {project['name']}

**Client:** {project['clientName']}  
**Project status:** {label(project['status'])}  
**Delivery window:** {date_label(project['startDate'])} to {date_label(project['deadline'])}  
**Generated:** {date_label(payload['generatedAt'])}

{project['description']}

## Delivery Snapshot

| Metric | Value |
| --- | ---: |
| Total tasks | {metrics['totalTasks']} |
| Completed tasks | {metrics['completedTasks']} |
| Overdue tasks | {metrics['overdueTasks']} |
| Completion | {metrics['completionPercentage']}% |

## Task Status Distribution

| Status | Tasks |
| --- | ---: |
{status_rows}

## Assigned Contributors

{assignees}

## Task Register

| Task | Status | Priority | Assignee | Deadline |
| --- | --- | --- | --- | --- |
{task_rows}

---

Prepared automatically by the Royal Edit Operations Hub.
"""
    status_cards = "".join(f"<div class='metric'><span>{html.escape(label(item['status']))}</span><strong>{item['count']}</strong></div>" for item in payload["statusCounts"])
    task_html_rows = "".join(
        "<tr>"
        f"<td>{html.escape(task['title'])}</td><td>{html.escape(label(task['status']))}</td><td>{html.escape(label(task['priority']))}</td>"
        f"<td>{html.escape(task['assignedMemberName'] or 'Unassigned')}</td><td>{html.escape(date_label(task['deadline']))}</td>"
        "</tr>"
        for task in payload["tasks"]
    ) or "<tr><td colspan='5'>No tasks recorded.</td></tr>"
    html_document = f"""<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{html.escape(project['name'])} — Royal Edit Report</title><style>
body{{font-family:Arial,sans-serif;background:#080808;color:#E8E0D0;margin:0;padding:44px;line-height:1.55}}.report{{max-width:960px;margin:auto}}.eyebrow{{color:#C9A84C;letter-spacing:.14em;text-transform:uppercase;font-size:12px}}h1,h2{{font-family:Georgia,serif;color:#E8E0D0}}h1{{font-size:42px;margin:.1em 0}}h2{{border-top:1px solid #5b4a21;padding-top:24px;margin-top:34px}}.sub{{color:#BFB5A3}}.grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}}.metric{{border:1px solid #4f421f;background:#14120f;padding:16px;border-radius:8px}}.metric span{{display:block;color:#BFB5A3;font-size:12px;text-transform:uppercase;letter-spacing:.1em}}.metric strong{{color:#C9A84C;font-family:Georgia,serif;font-size:30px}}table{{width:100%;border-collapse:collapse;margin-top:14px}}th,td{{border-bottom:1px solid #3a3428;padding:11px;text-align:left}}th{{color:#C9A84C;font-size:12px;text-transform:uppercase;letter-spacing:.1em}}footer{{margin-top:42px;color:#8f836f;font-size:12px}}
</style></head><body><main class='report'><p class='eyebrow'>Royal Edit Media House · Project Report</p><h1>{html.escape(project['name'])}</h1><p class='sub'>{html.escape(project['clientName'])} · {html.escape(label(project['status']))} · {html.escape(date_label(project['startDate']))} — {html.escape(date_label(project['deadline']))}</p><p>{html.escape(project['description'])}</p><h2>Delivery Snapshot</h2><section class='grid'><div class='metric'><span>Total tasks</span><strong>{metrics['totalTasks']}</strong></div><div class='metric'><span>Completed</span><strong>{metrics['completedTasks']}</strong></div><div class='metric'><span>Overdue</span><strong>{metrics['overdueTasks']}</strong></div><div class='metric'><span>Completion</span><strong>{metrics['completionPercentage']}%</strong></div></section><h2>Task Status Distribution</h2><section class='grid'>{status_cards}</section><h2>Assigned Contributors</h2><p>{html.escape(assignees)}</p><h2>Task Register</h2><table><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Deadline</th></tr></thead><tbody>{task_html_rows}</tbody></table><footer>Prepared automatically by the Royal Edit Operations Hub on {html.escape(date_label(payload['generatedAt']))}.</footer></main></body></html>"""
    return {"filename": f"{clean_filename(project['name'])}_Royal_Edit_Report", "markdown": markdown, "html": html_document}


if __name__ == "__main__":
    try:
        print(json.dumps(generate(json.load(sys.stdin))))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
