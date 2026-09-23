# Dusk Town

A competitive two-player tile-placement city builder on one shared 13×13 board.
Play with two people on the same device, or against Ada. Open `index.html` in a
browser, or serve the folder locally. There is no build step or runtime dependency.

The existing illustrated and pixel artwork, cached grid renderer, road rotation,
and art-style preference are preserved. Switch **Art** in the header at any time.
Illustrated assets remain in `assets/illustrated/`.

## Population rules

**Population = min(Accommodation, Attraction).** Both towns' three values stay
visible above the board. There are no victory points, employment allocation,
upgrades, money, tax or development purchases in the active game.

| Tile | Accommodation | Attraction |
|---|---|---|
| House | 4 | 0 |
| Apartment | 8 if an own Park AND Shop touch its edges; otherwise 0 | 0 |
| Park | 0 | 1 total if at least one own House touches an edge |
| Shop | 0 | Each orthogonal group: 1 / 2 / 3+ Shops gives 1 / 4 / 8 total |
| Industry | 0 | 4 if there is no own House within 2 spaces; otherwise 0 |
| School | 0 | 2 per own House within 3 spaces, uncapped |
| Hospital | 0 | floor(Population before placement / 2), capped at 12; permanently locked |
| Sports Ground | 0 | 2 per distinct own building type within 2 spaces, capped at 12 |
| Road | 0 | 0 |

Ranges use **Manhattan distance** (orthogonal grid steps). Adjacency and Shop
connections require shared edges, never diagonals. Apartments are a separate
building type: they do not count as Houses for Parks, Industry or Schools.
Sports Ground retains the existing **2×2 footprint**; distance is measured from
its nearest occupied square. It counts each building type once, including
inactive Apartments, but excludes roads, opponents and itself. Its four pieces
are one building and never multiply its Attraction.

Every effect is recalculated from the board. Hospital is the sole exception:
its contribution is captured as `lockedAttraction` on placement, using Population
before it adds any Attraction or changes the Sports Ground's diversity bonus.

## Setup and turn sequence

Each player starts with a T-intersection centred on opposite edges, an adjacent
House, and exactly one personal School, Hospital and Sports Ground. Starting
values are **4 Accommodation, 0 Attraction, 0 Population**.

The shared **five-tile market includes roads and normal buildings**. Civic Tiles
are never shuffled into it. The supply retains 68 normal building tiles and 60
roads, with quantities centralised in the configuration.

1. Select one market tile or one of the active player's unused Civic Tiles.
2. Rotate a road if needed, then click a legal plot to preview it.
3. Review Accommodation, Attraction and Population before/after, including
   affected existing buildings. Click **Confirm placement** to commit.
4. The market slot refills immediately (or the Civic Tile is consumed), the
   town recalculates, victory is checked, and the other player takes a turn.

Selecting or previewing does not consume anything. You can choose another tile,
choose another plot or cancel freely until confirmation. There is no stored hand
or separate drawing turn. A Civic placement uses the entire normal turn.

Road edges must match touching road edges, including the opponent's roads, but a
new road must connect to an **own** road. Opponent roads never provide network
access. Buildings need an own edge-adjacent road; only one square of the Sports
Ground's complete, empty 2×2 footprint needs to touch that road.

## Winning and blocked turns

The target is **40 Population**. If Player 1 reaches it, Player 2 gets one final
turn. If Player 2 reaches it on their regular turn, both already have equal
turn counts and the game ends immediately. Higher Population wins; ties draw.

A player may pass only if none of their available market or unused Civic Tiles
can fit. A required final turn can be a pass. If neither player can place an
available tile, the game ends with the higher Population winning. Tiles still
hidden in the deck cannot be drawn without a placement, so they do not prevent
this blocked-board ending. There is no invented market wipe or discard action.

## Balancing and debugging

Edit **`GAME_CONFIG` in `index.html`**. It contains the board/market size, the
single `winPopulation` target, all Accommodation/Attraction values, all ranges,
Shop thresholds, Hospital/Sports caps, the Sports footprint and supply counts.
`distanceMetric` supports `manhattan` (current) or `chebyshev` (the older square
ranges). Restart after changing the configuration.

- **New game / Play again:** reset all state. Setup pauses any pending Ada turn.
- **Game seed:** reuse text to reproduce terrain, tile variants and supply order.
  Clear the field for a fresh shuffle.
- **Undo last move:** restores the complete pre-move board, supply, Civic Tiles,
  Hospital lock, turn and victory state. Against Ada, it rewinds your move and
  Ada's reply together so you can revise your choice. It also works after a win.
- **Debug town breakdown:** separate contributions for both players.
- **Log town calculations:** emits the detailed current calculations to console.
- **Contextual amber overlays:** selected School, Industry or Sports ranges;
  Apartment/Park adjacency; existing School/Industry ranges while placing a House.

## Architecture

The original single-file architecture remains: sprite generation and art assets,
then rules/state, placement validation, and cached cell rendering. Grid cells
retain `type`, `owner`, `mask`, `v` and a shared `root` for multi-cell tiles.
The old house-score/jobs/upgrades and two-action hand system were replaced.

Population uses independent `calculateAccommodation`, `calculateParkAttraction`,
`calculateShopAttraction`, `calculateIndustryAttraction`,
`calculateSchoolAttraction`, `calculateHospitalAttraction` and
`calculateSportsAttraction` functions, aggregated by `calculateTown`.
Preview simulates placement temporarily and restores the board before returning.
Both human play and Ada use the same legal-placement and commit functions.

## Checks and simulations

```sh
node tools/test-game.js
node tools/sim.js 5 balance
```

The regression suite covers every building, ownership, distances, road rotation,
multi-cell placement, previews, market/civic consumption, local and Ada turns,
Hospital locking, Undo/restart, equal-turn wins/draws and complete seeded games.
The simulation's optional arguments are run count and seed prefix. It reports
both towns' capacity, Attraction, Population and ending reason. Its heuristic
opponents help detect bugs; their results are not proof of human-play balance.

Existing PDFs under `print/` describe an older scoring design. They have not been
regenerated for these Population rules; use the in-game Rules index for this version.
