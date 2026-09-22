import json
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "pdf" / "scoring-index-card.pdf"
ICONS = ROOT / "tmp" / "pdfs" / "icons.json"

PAGE = landscape((4 * inch, 6 * inch))
W, H = PAGE

PAPER = HexColor("#f4ead5")
INK = HexColor("#30261b")
SOFT = HexColor("#6b5840")
EDGE = HexColor("#4e3d2a")
GREEN = HexColor("#3f7652")
GREEN_DARK = HexColor("#284d38")
GOLD = HexColor("#b56b32")
PALE = HexColor("#ead9ba")
RED = HexColor("#a84f3f")
WHITE = HexColor("#fff9eb")


def wrap(text, font, size, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = word if not current else current + " " + word
        if stringWidth(trial, font, size) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_icon(c, icons, name, x, y, size):
    icon = icons[name]
    scale = min(size / icon["w"], size / icon["h"])
    iw, ih = icon["w"] * scale, icon["h"] * scale
    ox, oy = x + (size - iw) / 2, y + (size - ih) / 2
    for px, py, run, color in icon["runs"]:
        c.setFillColor(HexColor(color))
        c.rect(ox + px * scale, oy + ih - (py + 1) * scale,
               run * scale, scale, stroke=0, fill=1)
    c.setStrokeColor(EDGE)
    c.setLineWidth(0.7)
    c.rect(x, y, size, size, stroke=1, fill=0)


def section(c, icons, icon_name, title, subtitle, bullets, x, y, width):
    icon_size = 22
    draw_icon(c, icons, icon_name, x, y - icon_size, icon_size)
    tx = x + icon_size + 7
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8.2)
    c.drawString(tx, y - 7, title)
    if subtitle:
        c.setFillColor(SOFT)
        c.setFont("Helvetica-Oblique", 6.2)
        c.drawRightString(x + width, y - 7, subtitle)

    line_y = y - 16
    c.setFont("Helvetica", 6.7)
    c.setFillColor(INK)
    for bullet in bullets:
        parts = wrap(bullet, "Helvetica", 6.7, width - icon_size - 14)
        for idx, line in enumerate(parts):
            if idx == 0:
                c.setFillColor(GREEN if bullet.startswith("+") else RED if bullet.startswith("-") else INK)
                c.circle(tx + 1.5, line_y + 1.7, 1.25, stroke=0, fill=1)
            c.setFillColor(INK)
            c.drawString(tx + 7, line_y, line)
            line_y -= 8
    bottom = min(line_y + 2, y - icon_size - 4)
    c.setStrokeColor(PALE)
    c.setLineWidth(0.55)
    c.line(x, bottom, x + width, bottom)
    return bottom - 7


def score_box(c, label, x, y, width, accent):
    c.setFillColor(WHITE)
    c.setStrokeColor(accent)
    c.setLineWidth(1)
    c.roundRect(x, y, width, 23, 4, stroke=1, fill=1)
    c.setFillColor(SOFT)
    c.setFont("Helvetica-Bold", 6.3)
    c.drawString(x + 6, y + 13, label.upper())
    c.setStrokeColor(SOFT)
    c.setLineWidth(0.55)
    c.line(x + width - 26, y + 7, x + width - 6, y + 7)


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    icons = json.loads(ICONS.read_text())
    c = canvas.Canvas(str(OUT), pagesize=PAGE)
    c.setTitle("Dusk Town player scoring index card")
    c.setAuthor("Dusk Town")

    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setStrokeColor(EDGE)
    c.setLineWidth(2)
    c.roundRect(7, 7, W - 14, H - 14, 8, stroke=1, fill=0)

    # Header
    c.setFillColor(GREEN_DARK)
    c.roundRect(8, H - 43, W - 16, 35, 7, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(19, H - 29, "DUSK TOWN")
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#e7d6b5"))
    c.drawRightString(W - 19, H - 22, "PLAYER SCORING")
    c.setFont("Helvetica", 6.5)
    c.drawRightString(W - 19, H - 32, "Only your own tiles and citizens count")

    left_x, right_x = 19, W / 2 + 5
    col_w = W / 2 - 29
    top = H - 55

    y = section(c, icons, "house", "HOUSE", "2 citizens", [
        "1 point base; never scores below 0",
        "+1 if a park is within 1",
        "+3 if the sports centre is within 3",
        "+3 inside an active school catchment",
        "-1 if outside every active school catchment",
        "-3 if industry is within 2",
    ], left_x, top, col_w)

    y = section(c, icons, "apartment", "APARTMENT", "4 citizens", [
        "Scores double the House result on its tile",
        "Scores 0 unless a park AND shop are directly adjacent",
    ], left_x, y, col_w)

    section(c, icons, "upgrade", "HOUSE UPGRADE", "3 citizens", [
        "+2 residential points; one upgrade per house",
    ], left_x, y, col_w)

    y = section(c, icons, "shop", "SHOP DISTRICTS", "edge-connected", [
        "1 / 2 / 3 / 4 shops score 0 / 2 / 7 / 12",
        "+5 for every shop after the fourth",
    ], right_x, top, col_w)

    y = section(c, icons, "industrial", "EMPLOYMENT", "6 jobs per factory", [
        "Homes need jobs: house 2, upgraded house 3, apartment 4",
        "+1 point per 2 employed citizens",
    ], right_x, y, col_w)

    y = section(c, icons, "hospital", "HOSPITAL", "one per player", [
        "0 points below 10 citizens; 8 points at 10+",
    ], right_x, y, col_w)

    section(c, icons, "school", "CIVIC REMINDERS", "do not score directly", [
        "School range is within 2; disabled by industry within 2",
        "School catchments never stack; sports centre occupies 2x2",
        "Distance is a square: diagonals count",
    ], right_x, y, col_w)

    # Scoring strip
    strip_y = 16
    c.setFillColor(PALE)
    c.roundRect(14, strip_y - 3, W - 28, 34, 5, stroke=0, fill=1)
    labels = [
        ("Residential", GREEN), ("Shops", GOLD),
        ("Employment", GREEN), ("Hospital", RED), ("TOTAL", EDGE),
    ]
    gap = 5
    box_w = (W - 38 - gap * 4) / 5
    for i, (label, accent) in enumerate(labels):
        score_box(c, label, 19 + i * (box_w + gap), strip_y + 2, box_w, accent)

    c.setFillColor(SOFT)
    c.setFont("Helvetica", 5.7)
    c.drawCentredString(W / 2, 9, "Final score = Residential + Shop districts + Employment + Hospital")

    c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
