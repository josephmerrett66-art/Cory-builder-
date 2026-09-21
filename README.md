# Dusk Town

A cozy tile-laying city builder, played against a bot opponent on a shared map.

Open `index.html` in a browser. No build step, no dependencies — one self-contained file.

## The game

Choose a 7×7, 9×9, 11×11, 13×13 (original), or 15×15 map before each game.
The tile supply and scoring ranges stay the same, so smaller maps make space
more contested. Two towns grow on the shared land. You enter from the south edge, Ada from
the north. Your roads, parks and plants are yours alone: hers do nothing for you,
and yours nothing for her. What you are competing for is space.

Each building now has a distinct scoring role. Only your own buildings and
citizens count.

A House is worth **1 point**, holds 2 citizens, and can collect:

| | |
|---|---|
| +1 | park within 1 |
| +3 | sports centre within 3 |
| +3 | school within 2 |
| −3 | industry within 2 |

House scores floor at 0. Distances are Chebyshev — diagonals count the same as
straight neighbours, so "within 1" is the 3×3 block around a tile.

A house holds 2 citizens and an apartment 4; each factory has 6 jobs, so one
factory covers three houses. Distance is irrelevant — people commute. Every
2 employed citizens score **1 point**, so a fully used factory can contribute
up to 3 employment points.

**Apartment blocks** hold four citizens and need four jobs. They score double
whatever a house would score on that tile — but nothing at all unless a park
*and* a shop sit directly next to them. They are drawn taller than their tile
and overhang the row above.

**Shops** score as orthogonally connected districts: groups of 1, 2, 3, and 4
score 0, 2, 7, and 12 points. Every shop beyond the fourth adds 5 more. Diagonal
shops do not connect.

A **Hospital** scores 0 below 10 citizens and 8 points once its town reaches
10 citizens. School and Sports Centre rules are unchanged.

## Turns

Take two tiles, or place two. Never both. At most one road per take turn.
Civic buildings — sports centre, school and hospital — are shuffled into the
building deck and surface in the market at random. They cost a normal half-turn,
and you may only ever own one of each. The sports centre covers a 2x2 block.

Roads are Carcassonne-style: straights, corners, T-junctions and crossroads that
must match end to end where two of your roads meet. Buildings go anywhere along
your own road. The game ends immediately when neither player can legally place
another tile from their hand or the remaining supply (including roads). The board
does not have to be completely full, and unused tiles may remain. If one player
cannot make progress, they pass while the other continues. Final scores appear
automatically after the last possible placement.

**New game** and **Play again** reopen the map-size chooser. Opening it pauses
Ada's turn; **Keep playing** resumes the existing game without resetting it.

## Tools

`node tools/test-game.js` checks map sizing, supply-aware endings, passing,
immediate final scoring, and complete seeded games on the smaller maps.

`tools/sim.js` runs headless games for balance testing:

```
node tools/sim.js
```

It stubs the DOM, drives both sides with the bot's own logic, and reports tiles
placed, houses built, scores, and tiles stranded in hand. It is how the bot's
network-strangling bug was found and fixed.
