import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

ROOT=Path(__file__).resolve().parent.parent
deck=json.load(open(ROOT/'tmp/pdfs/deck.json'))
TILE=30.0; MARGIN=8.0; CUT=0.25
W,H = A4[0]/mm, A4[1]/mm
COLS = int((W-2*MARGIN)//TILE)
USABLE_H = H-2*MARGIN

def draw_tile(c,t,x0,y0,wmm,hmm):
    pw=wmm/t['w']; ph=hmm/t['h']
    for (px,py,run,col) in t['runs']:
        c.setFillColor(HexColor(col))
        c.rect((x0+px*pw)*mm,(y0+hmm-(py+1)*ph)*mm,run*pw*mm,ph*mm,stroke=0,fill=1)

# rows of equal-height pieces; cols is how many 30mm columns a piece spans
def rows_for(items, cols_each, hmm):
    per = COLS // cols_each
    return [{'h':hmm,'cols':cols_each,'items':items[i:i+per]}
            for i in range(0,len(items),per)]

rows  = rows_for(deck['square'],1,TILE)
rows += rows_for(deck['tall'],  1,TILE*1.5)
rows += rows_for(deck['big'],   2,TILE*2)

pages=[]; cur=[]; used=0.0
for r in rows:
    if used+r['h'] > USABLE_H+0.01:
        pages.append(cur); cur=[]; used=0.0
    cur.append(r); used+=r['h']
if cur: pages.append(cur)

c=canvas.Canvas(str(ROOT/'print/tiles-A4.pdf'),pagesize=A4)
c.setTitle("Dusk Town tiles")
for pi,page in enumerate(pages):
    gh=sum(r['h'] for r in page); gw=COLS*TILE
    ox=(W-gw)/2; top=H-MARGIN; y=top
    c.setStrokeColor(HexColor("#000000")); c.setLineWidth(CUT)
    hlines=[top]; vsegs=[]
    for r in page:
        span=r['cols']*TILE
        for i,t in enumerate(r['items']):
            draw_tile(c,t,ox+i*span,y-r['h'],span,r['h'])
        n=len(r['items'])
        # vertical cuts only where pieces actually divide
        for k in range(n+1):
            vsegs.append((ox+k*span, y-r['h'], y))
        y-=r['h']; hlines.append(y)
    for (x,y0,y1) in vsegs:
        c.line(x*mm,y0*mm,x*mm,y1*mm)
    for b in hlines:
        c.line(ox*mm,b*mm,(ox+gw)*mm,b*mm)
    c.setFillColor(HexColor("#000000")); c.setFont("Helvetica",7)
    c.drawString(MARGIN*mm,(MARGIN-3)*mm,
      f"Dusk Town tiles — sheet {pi+1} of {len(pages)} — 30mm grid; apartments 30x45mm, sports centres 60x60mm — PRINT AT 100%, NO SCALING")
    c.showPage()
c.save()
print("tiles ->",len(pages),"A4 sheets")
for pi,page in enumerate(pages):
    k={}
    for r in page:
        for t in r['items']: k[t['label']]=k.get(t['label'],0)+1
    print(f"  sheet {pi+1}: {k}")
