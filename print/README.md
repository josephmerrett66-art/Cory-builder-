# Printing the physical set

Two PDFs, four A4 sheets in total. **Print at 100% — turn off "fit to page"
and "shrink to fit".** Measure a tile with a ruler after the first sheet; a
square tile should be exactly 30mm.

300 gsm matte card.

The standalone 6 x 4 inch player scoring card is generated at
`output/pdf/scoring-index-card.pdf`. It summarises every final-scoring category
and includes writable subtotal and total boxes.

## tiles-A4.pdf — 3 sheets, 144 pieces

| | |
|---|---|
| House | 21 |
| Apartment | 6 (30 x 45mm, stands taller than its cell) |
| Park | 13 (pond, playground, skate park, gardens) |
| Shop | 13 |
| Industrial | 15 |
| Sports centre | 2 (60 x 60mm, covers 2x2) |
| School | 2 |
| Hospital | 2 |
| House upgrade | 8 |
| Road | 60 |
| Starting tile | 2 |

Tiles are butted together and the cut lines run the full width and height of
each block, so one pass of a guillotine serves two rows. Cut lines only appear
where pieces actually divide — the 60mm sports centres have no line through
the middle.

## reference-cards-A4.pdf — 1 sheet, two identical cards

Landscape, stacked, cut along the dashed line. Each card carries every
building, its icon and its exact scoring, plus the distance rule and the turn
structure.

## Regenerating

    node tools/deck.js      # fixed deck -> deck.json
    node tools/icons.js     # card icons -> icons.json
    python3 tools/makepdf.py
    python3 tools/makescorecard.py
    python3 tools/makecards.py

The generators read the sprites straight out of `index.html`, so the printed
tiles always match the digital game.
