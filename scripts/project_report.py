import base64
import io
import json
import re
import sys
import textwrap
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def label(value: str) -> str:
    return value.replace("_", " ").title()


def date_label(value: str) -> str:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d %b %Y")


def clean_filename(value: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return safe or "Royal_Edit_Project"


def draw_wrapped(pdf: canvas.Canvas, value: str, x: float, y: float, width: int, font: str = "Helvetica", size: float = 10, leading: float = 14, colour=colors.HexColor("#BFB5A3")) -> float:
    pdf.setFillColor(colour)
    pdf.setFont(font, size)
    for line in textwrap.wrap(value, width=width) or [""]:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def section(pdf: canvas.Canvas, title: str, x: float, y: float, page_width: float) -> float:
    pdf.setStrokeColor(colors.HexColor("#5B4A21"))
    pdf.line(x, y + 7, page_width - x, y + 7)
    pdf.setFillColor(colors.HexColor("#C9A84C"))
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(x, y - 12, title.upper())
    return y - 34


def generate(payload: dict) -> dict:
    project = payload["project"]
    metrics = payload["metrics"]
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4
    margin = 22 * mm

    pdf.setFillColor(colors.HexColor("#080808"))
    pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#C9A84C"))
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(margin, page_height - margin, "ROYAL EDIT MEDIA HOUSE  /  PROJECT REPORT")
    pdf.setFillColor(colors.HexColor("#E8E0D0"))
    pdf.setFont("Times-Bold", 28)
    title_y = page_height - margin - 46
    for index, line in enumerate(textwrap.wrap(project["name"], width=28)[:2]):
        pdf.drawString(margin, title_y - (index * 32), line)
    y = title_y - (min(2, len(textwrap.wrap(project["name"], width=28))) * 32) - 12
    y = draw_wrapped(pdf, f"{project['clientName']}  ·  {label(project['status'])}  ·  {date_label(project['startDate'])} — {date_label(project['deadline'])}", margin, y, 90, size=9, colour=colors.HexColor("#C9A84C")) - 8
    y = draw_wrapped(pdf, project["description"], margin, y, 92, size=10, leading=15) - 10

    y = section(pdf, "Delivery snapshot", margin, y, page_width)
    cards = [("TOTAL TASKS", str(metrics["totalTasks"])), ("COMPLETED", str(metrics["completedTasks"])), ("OVERDUE", str(metrics["overdueTasks"])), ("COMPLETION", f"{metrics['completionPercentage']}%")]
    card_gap = 8
    card_width = (page_width - (2 * margin) - (3 * card_gap)) / 4
    for index, (caption, value) in enumerate(cards):
        x = margin + index * (card_width + card_gap)
        pdf.setFillColor(colors.HexColor("#15130F"))
        pdf.setStrokeColor(colors.HexColor("#5B4A21"))
        pdf.roundRect(x, y - 48, card_width, 48, 4, fill=1, stroke=1)
        pdf.setFillColor(colors.HexColor("#847966"))
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawString(x + 8, y - 14, caption)
        pdf.setFillColor(colors.HexColor("#C9A84C"))
        pdf.setFont("Times-Bold", 19)
        pdf.drawString(x + 8, y - 37, value)
    y -= 72

    y = section(pdf, "Status distribution", margin, y, page_width)
    for item in payload["statusCounts"]:
        pdf.setFillColor(colors.HexColor("#BFB5A3"))
        pdf.setFont("Helvetica", 9)
        pdf.drawString(margin, y, label(item["status"]))
        pdf.setFillColor(colors.HexColor("#E8E0D0"))
        pdf.drawRightString(page_width - margin, y, str(item["count"]))
        pdf.setStrokeColor(colors.HexColor("#302A20"))
        pdf.line(margin, y - 7, page_width - margin, y - 7)
        y -= 24

    y -= 8
    y = section(pdf, "Assigned contributors", margin, y, page_width)
    y = draw_wrapped(pdf, ", ".join(payload["assignedMembers"]) or "No team members are assigned.", margin, y, 92) - 8
    pdf.setFillColor(colors.HexColor("#847966"))
    pdf.setFont("Helvetica", 7)
    pdf.drawString(margin, 15 * mm, "Prepared automatically by the Royal Edit Operations Hub.")
    pdf.showPage()

    pdf.setFillColor(colors.HexColor("#080808"))
    pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)
    y = page_height - margin
    y = section(pdf, "Task register", margin, y, page_width)
    headers = [("TASK", margin), ("STATUS", margin + 83 * mm), ("PRIORITY", margin + 112 * mm), ("OWNER", margin + 140 * mm), ("DUE", page_width - margin - 34 * mm)]
    pdf.setFillColor(colors.HexColor("#C9A84C"))
    pdf.setFont("Helvetica-Bold", 7)
    for header, x in headers:
        pdf.drawString(x, y, header)
    y -= 14
    pdf.setStrokeColor(colors.HexColor("#5B4A21"))
    pdf.line(margin, y + 7, page_width - margin, y + 7)
    for task in payload["tasks"]:
        if y < 34 * mm:
            pdf.showPage()
            pdf.setFillColor(colors.HexColor("#080808"))
            pdf.rect(0, 0, page_width, page_height, fill=1, stroke=0)
            y = page_height - margin
        pdf.setFillColor(colors.HexColor("#E8E0D0"))
        pdf.setFont("Helvetica", 8)
        pdf.drawString(margin, y, textwrap.shorten(task["title"], width=38, placeholder="…"))
        pdf.setFillColor(colors.HexColor("#BFB5A3"))
        pdf.drawString(margin + 83 * mm, y, label(task["status"]))
        pdf.drawString(margin + 112 * mm, y, label(task["priority"]))
        pdf.drawString(margin + 140 * mm, y, textwrap.shorten(task["assignedMemberName"] or "Unassigned", width=16, placeholder="…"))
        pdf.drawRightString(page_width - margin, y, date_label(task["deadline"]))
        pdf.setStrokeColor(colors.HexColor("#302A20"))
        pdf.line(margin, y - 7, page_width - margin, y - 7)
        y -= 24

    pdf.save()
    return {"filename": f"{clean_filename(project['name'])}_Royal_Edit_Report.pdf", "contentType": "application/pdf", "pdfBase64": base64.b64encode(buffer.getvalue()).decode("ascii")}


if __name__ == "__main__":
    try:
        print(json.dumps(generate(json.load(sys.stdin))))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
