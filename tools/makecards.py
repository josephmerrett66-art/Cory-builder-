import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

ROOT=Path(__file__).resolve().parent.parent
icons=json.load(open(ROOT/'tmp/pdfs/icons.json'))
W,H = A4[0]/mm, A4[1]/mm       # 210 x 297
CW,CH = 194.0, 132.0           # two landscape cards stacked, cut across the middle
INK=HexColor("#111315"); SOFT=HexColor("#5a6068"); LINE=HexColor("#b9bdc2")

def icon(c,name,x,y,size):
    t=icons[name]; pw=size/t['w']; ph=size/t['h']
    for (px,py,run,col) in t['runs']:
        c.setFillColor(HexColor(col))
        c.rect((x+px*pw)*mm,(y+size-(py+1)*ph)*mm,run*pw*mm,ph*mm,stroke=0,fill=1)
    c.setStrokeColor(LINE); c.setLineWidth(0.3)
    c.rect(x*mm,y*mm,size*mm,size*mm,stroke=1,fill=0)

COL1=[
 ("house","HOUSE","2 citizens \u00b7 1 point",
  ["+1  park within 1","+3  sports centre within 3",
   "+3  in school catchment \u00b7 \u22121 outside","\u22123  industry within 2","never below 0"]),
 ("apartment","APARTMENT","4 citizens",
  ["double a house on that tile","0 unless a park AND a shop",
   "are directly next to it"]),
 ("industrial","INDUSTRIAL","6 jobs, any distance",
  ["house needs 2 \u00b7 apartment 4","+1 per 2 employed citizens",
   "\u22123 to your homes within 2"]),
 ("upgrade","HOUSE UPGRADE","place on your house",
  ["+2 residential points \u00b7 3 citizens","one upgrade per house"]),
]
COL2=[
 ("park","PARK","", ["+1 to your homes within 1"]),
 ("shop","SHOP","edge-connected districts",
  ["1 / 2 / 3 / 4 shops: 0 / 2 / 7 / 12","each extra shop: +5"]),
 ("sports","SPORTS CENTRE","2x2 \u00b7 one each", ["+3 to your homes within 3"]),
 ("school","SCHOOL","one each",
  ["homes within 2: +3 \u00b7 outside: \u22121","no stacking \u00b7 disabled by industry within 2"]),
 ("hospital","HOSPITAL","one each",
  ["below 10 citizens: 0 points","10+ citizens: 8 points"]),
 ("road","ROAD","no points",
  ["buildings must touch your road","where your roads meet, ends match"]),
]

def column(c,items,x,ytop):
    y=ytop
    for name,title,sub,lines in items:
        icon(c,name,x,y-9,9)
        tx=x+12
        c.setFillColor(INK); c.setFont("Helvetica-Bold",8)
        c.drawString(tx*mm,(y-3.2)*mm,title)
        if sub:
            c.setFont("Helvetica-Oblique",6.6); c.setFillColor(SOFT)
            c.drawString((tx+42)*mm,(y-3.2)*mm,sub)
        c.setFont("Helvetica",7); c.setFillColor(INK)
        ly=y-6.6
        for L in lines:
            c.drawString(tx*mm,ly*mm,L); ly-=3.3
        y=min(ly, y-11)-2.4
        c.setStrokeColor(LINE); c.setLineWidth(0.2)
        c.line(x*mm,(y+1.4)*mm,(x+86)*mm,(y+1.4)*mm)
    return y

def card(c,ox,oy):
    c.setStrokeColor(LINE); c.setLineWidth(0.4)
    c.rect(ox*mm,oy*mm,CW*mm,CH*mm,stroke=1,fill=0)
    x=ox+7; y=oy+CH-9
    c.setFillColor(INK); c.setFont("Helvetica-Bold",12)
    c.drawString(x*mm,y*mm,"DUSK TOWN")
    c.setFont("Helvetica",7.4); c.setFillColor(SOFT)
    c.drawString((x+34)*mm,y*mm,"Score residences, shop districts, employment, and your hospital.")
    y-=4.6
    c.drawString(x*mm,y*mm,'Distance is a square \u2014 "within 2" is the 5\u00d75 block around a tile, diagonals included.')
    y-=3.8
    c.drawString(x*mm,y*mm,"Your turn: take two tiles, or place two. At most one road per take turn.")
    y-=4
    c.setStrokeColor(LINE); c.setLineWidth(0.4)
    c.line(x*mm,y*mm,(ox+CW-7)*mm,y*mm)
    y-=3
    column(c,COL1,x,y)
    column(c,COL2,x+98,y)

c=canvas.Canvas(str(ROOT/'print/reference-cards-A4.pdf'),pagesize=A4)
c.setTitle("Dusk Town reference cards")
gap=(H-2*CH)/3
card(c,(W-CW)/2, gap*2+CH)
card(c,(W-CW)/2, gap)
c.setStrokeColor(HexColor("#888888")); c.setLineWidth(0.3); c.setDash(2,2)
c.line(6*mm,(H/2)*mm,(W-6)*mm,(H/2)*mm)
c.setDash()
c.setFillColor(INK); c.setFont("Helvetica",7)
c.drawString(8*mm,4*mm,"Dusk Town \u2014 two reference cards \u2014 cut along the dashed line \u2014 PRINT AT 100%, NO SCALING")
c.showPage(); c.save()
print("cards written")
