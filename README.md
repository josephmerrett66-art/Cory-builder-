# Dusk Town

A cozy tile-laying city builder, played against a bot opponent on a shared map.

Open `index.html` in a browser. No build step, no dependencies — one self-contained file.

## The game

Two towns grow on one 13×13 plot of land. You enter from the south edge, Ada from
the north. Your roads, parks and plants are yours alone: hers do nothing for you,
and yours nothing for her. What you are competing for is space.

**Only houses score, and only your own.** Everything else exists to make houses
worth more. Your total is simply the sum of your houses.

A house starts at 1 point and collects:

| | |
|---|---|
| +2 | park within 2 |
| +2 | shop within 2 |
| +2 | employed (a factory with spare jobs, any distance) |
| +3 | sports centre within 3 |
| +3 | school within 2 |
| +3 | hospital within 4 |
| −3 | industry within 2 |
| −3 | hospital within 1 |

Floors at 0, tops out at 16. Distances are Chebyshev — diagonals count the same
as straight neighbours, so "within 2" is a 5×5 block.

Each house holds 2 citizens; each factory has 4 jobs. One factory covers two houses.

## Turns

Take two tiles, or place two. Never both. At most one road per take turn.
Civic buildings — sports centre, school and hospital — are shuffled into the
building deck and surface in the market at random. They cost a normal half-turn,
and you may only ever own one of each.

Roads are Carcassonne-style: straights, corners, T-junctions and crossroads that
must match end to end where two of your roads meet. Buildings go anywhere along
your own road. The game ends when the deck runs dry and neither player can place.

## Tools

`tools/sim.js` runs headless games for balance testing:

```
node tools/sim.js
```

It stubs the DOM, drives both sides with the bot's own logic, and reports tiles
placed, houses built, scores, and tiles stranded in hand. It is how the bot's
network-strangling bug was found and fixed.
