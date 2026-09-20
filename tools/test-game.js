const assert = require('node:assert/strict');
const path = require('node:path');
const {load} = require('./stub');
const game = load(path.join(__dirname, '..', 'index.html'), 42);
let checked = 0;
function test(name, run) { run(); checked++; console.log('PASS', name); }
function sealed() {
  game.newGame(7);
  for (let r=0;r<7;r++) for(let c=0;c<7;c++) {
    if(game.S.grid[r][c]?.type !== 'entrance')
      game.S.grid[r][c]={type:'house',owner:'you'};
  }
  game.S.you.hand=[]; game.S.bot.hand=[];
  game.S.deck=[]; game.S.market=[]; game.S.roads=[];
}
test('first visit requires map selection', () => {
  assert.equal(game.S.started,false);
  assert.equal(game.document.getElementById('setup').open,true);
  assert.equal(game.canTake(),false);
});
for(const size of [7,9,11,13,15]) test(`${size}×${size} grid, centred entrances and live supply`,()=>{
  game.newGame(size);
  assert.equal(game.S.grid.length,size);
  assert.ok(game.S.grid.every(row=>row.length===size));
  assert.equal(game.S.grid[0][Math.floor(size/2)].owner,'bot');
  assert.equal(game.S.grid[size-1][Math.floor(size/2)].owner,'you');
  assert.equal(game.cellEls.length,size*size);
  assert.equal(game.gameShouldEnd(),false);
  assert.equal(game.canTake(),true);
});
test('invalid map size keeps the current valid size',()=>{
  game.newGame(8); assert.equal(game.SIZE,15);
});
test('new game chooser pauses and cancels without losing the game',()=>{
  game.newGame(9); const state=game.S;
  game.showSetup(); assert.equal(game.canTake(),false);
  game.closeSetup(); assert.equal(game.S,state); assert.equal(game.canTake(),true);
});
test('full map ends even with tiles in all supplies',()=>{
  sealed(); game.S.deck=['house']; game.S.market=[{type:'park',mask:0}]; game.S.roads=[15];
  assert.equal(game.gameShouldEnd(),true);
});
test('inaccessible holes do not prevent an ending',()=>{
  sealed(); game.S.grid[3][0]=null; game.S.deck=['house']; game.S.roads=[15];
  assert.equal(game.gameShouldEnd(),true);
});
test('a drawable building keeps the game alive with empty hands',()=>{
  sealed(); game.S.grid[5][3]=null; game.S.deck=['house'];
  assert.equal(game.gameShouldEnd(),false);
});
test('a rotated road still in supply keeps the game alive',()=>{
  sealed(); game.S.grid[0][4]=null; game.S.roads=[game.N|game.E];
  assert.equal(game.gameShouldEnd(),false);
});
test('a fitting road below an unusable top road is counted',()=>{
  sealed(); game.S.grid[3][3]=null;
  game.S.grid[3][2]={type:'road',owner:'you',mask:game.E};
  game.S.grid[2][3]={type:'road',owner:'you',mask:game.Sd};
  game.S.roads=[game.N|game.Wd,game.N|game.Sd];
  assert.equal(game.gameShouldEnd(),false);
  game.S.roads.pop(); game.S.roads.pop(); game.S.roads.push(game.N|game.Sd);
  assert.equal(game.gameShouldEnd(),true);
});
test('sports centres require a complete 2×2 footprint',()=>{
  sealed(); game.S.grid[5][3]=null; game.S.deck=['sports'];
  assert.equal(game.gameShouldEnd(),true);
});
test('remaining civic buildings cannot bypass the ownership limit',()=>{
  sealed(); game.S.grid[5][3]=null; game.S.grid[4][0]={type:'school',owner:'you'};
  game.S.deck=['school']; assert.equal(game.gameShouldEnd(),true);
});
test('one blocked player can pass while the other continues',()=>{
  sealed(); game.S.grid[1][3]=null; game.S.bot.hand=[{type:'house',mask:0}];
  assert.equal(game.gameShouldEnd(),false);
  assert.equal(game.canPass(game.S.you),true);
  game.render(); assert.equal(game.document.getElementById('endturn').disabled,false);
  assert.equal(game.document.getElementById('endturn').textContent,'Pass');
});
test('human final placement scores immediately, even on the first action',()=>{
  sealed(); game.S.grid[5][3]=null; game.S.you.hand=[{type:'house',mask:0}];
  game.S.selected=0; game.place(5,3);
  assert.equal(game.S.over,true); assert.equal(game.S.used,1);
  assert.equal(game.document.getElementById('over').open,true);
});
test('Ada final placement ends immediately and later callbacks do nothing',()=>{
  sealed(); game.S.grid[1][3]=null; game.S.bot.hand=[{type:'house',mask:0}];
  game.S.turn='bot'; game.botTurn(); assert.equal(game.S.over,true);
  const snapshot=JSON.stringify(game.S); game.botTurn();
  assert.equal(JSON.stringify(game.S),snapshot);
});
test('paused Ada cannot change the board',()=>{
  game.newGame(7); game.S.turn='bot'; game.showSetup();
  const snapshot=JSON.stringify(game.S); game.botTurn();
  assert.equal(JSON.stringify(game.S),snapshot);
});
for(const size of [7,9]) test(`complete seeded ${size}×${size} game reaches a natural ending`,()=>{
  game.newGame(size);
  let turns=0;
  while(!game.gameShouldEnd() && turns<350) {
    for(const player of [game.S.you,game.S.bot]) {
      game.S.mode=null; player.tookRoad=false;
      for(let i=0;i<2;i++) {
        if(game.gameShouldEnd()||!game.botAct(player)) break;
      }
    }
    turns++;
  }
  assert.ok(turns<350,`game stalled after ${turns} rounds`);
  assert.equal(game.canDevelop(game.S.you),false);
  assert.equal(game.canDevelop(game.S.bot),false);
  console.log(`  Ended after ${turns} rounds with ${game.S.deck.length+game.S.market.length} buildings left`);
});
console.log(`${checked} checks passed.`);
