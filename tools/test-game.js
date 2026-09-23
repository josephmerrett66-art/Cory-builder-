const assert=require('node:assert/strict');
const path=require('node:path');
const {load}=require('./stub');
const game=load(path.join(__dirname,'..','index.html'),42);
const defaults=JSON.parse(JSON.stringify(game.GAME_CONFIG));
let passed=0;
function test(name,run){
  game.GAME_CONFIG=JSON.parse(JSON.stringify(defaults));
  run();passed++;console.log('PASS',name);
}
function start(mode='local',seed='regression'){game.newGame({mode,seed});}
function housedStart(){start();tile('house',12,5);tile('house',0,7,'bot');}
function empty(){start();for(let r=0;r<game.SIZE;r++)for(let c=0;c<game.SIZE;c++)game.S.grid[r][c]=null;}
function tile(type,r,c,owner='you',extra={}){game.S.grid[r][c]={type,owner,v:0,mask:0,root:`${r},${c}`,...extra};}
function town(owner='you'){return game.calculateTown(owner);}
function select(type,source='market'){
  if(source==='market')game.S.market=[{type,mask:type==='road'?5:0,v:0}];
  const list=source==='market'?game.S.market:game.activePlayer().civics;
  game.selectTile(source,list.findIndex(t=>t.type===type));
}
function move(type,r,c,source='market'){
  select(type,source);game.stagePlacement(r,c);
  assert.ok(game.S.preview,`${type} must be legal at ${r},${c}`);
  game.confirmPlacement();
}
function closedBoard(){empty();for(let r=0;r<13;r++)for(let c=0;c<13;c++)tile('house',r,c);}

test('first load requires setup and exposes no playable actions',()=>{
  assert.equal(game.S.started,false);assert.equal(game.humanTurn(),false);
  assert.equal(game.document.getElementById('setup').open,true);
});
test('13×13 shared board starts with only opposing T-intersections and all town values zero',()=>{
  start();assert.equal(game.SIZE,13);assert.equal(game.cellEls.length,169);
  assert.equal(game.at(12,6).mask,game.N|game.E|game.Wd);
  assert.equal(game.at(0,6).mask,game.Sd|game.E|game.Wd);
  assert.equal(game.at(12,5),null);assert.equal(game.at(0,7),null);
  assert.equal(game.S.grid.flat().filter(Boolean).length,2);
  for(const owner of ['you','bot']){
    assert.equal(town(owner).accommodation,0);assert.equal(town(owner).attraction,0);assert.equal(town(owner).population,0);
    assert.deepEqual(Array.from(game.S[owner].civics,t=>t.type),['school','hospital','sports']);
  }
});
test('three-building market excludes roads and civics; separate stack contains only roads',()=>{
  start();assert.equal(game.S.market.length,3);
  const supply=[...game.S.market,...game.S.deck];assert.equal(supply.length,68);
  assert.equal(supply.filter(t=>t.type==='road').length,0);
  assert.equal(game.S.roads.length,60);assert.ok(game.S.roads.every(t=>t.type==='road'));
  assert.equal(game.choices('you').filter(c=>c.source==='road').length,1);
  assert.ok(supply.every(t=>!['school','sports','hospital','upgrade'].includes(t.type)));
});
test('a turn is either two takes or two placements, never a mixed turn',()=>{
  start();
  game.takeChoice('market',0);assert.equal(game.S.mode,'take');assert.equal(game.S.used,1);assert.equal(game.S.you.hand.length,1);assert.equal(game.S.turn,'you');
  game.takeChoice('market',0);assert.equal(game.S.turn,'bot');assert.equal(game.S.you.turns,1);assert.equal(game.S.you.hand.length,2);
  game.S.turn='you';game.S.mode=null;game.S.used=0;game.S.you.hand=[{type:'house',mask:0,v:0},{type:'house',mask:0,v:0}];
  game.selectTile('hand',0);game.stagePlacement(12,5);game.confirmPlacement();assert.equal(game.S.mode,'place');assert.equal(game.S.used,1);
  game.selectTile('hand',0);game.stagePlacement(12,7);game.confirmPlacement();assert.equal(game.S.turn,'bot');assert.equal(game.S.you.turns,2);
});
test('road placement consumes only the separate stack and reveals its next tile',()=>{
  start();const before=game.S.roads.length;const choice=game.choices('you').find(c=>c.source==='road');
  let placement=null;game.eachPlacement('you',choice.item,(item,r,c)=>{placement={item,r,c};return false;});
  assert.ok(placement,'the face-up road should have a legal starting placement');
  assert.equal(game.commitPlacement({source:'road',index:choice.index,item:placement.item},placement.r,placement.c),true);
  assert.equal(game.S.roads.length,before-1);assert.equal(game.S.market.length,3);assert.equal(game.S.turn,'bot');
});
test('board sizing emits a valid CSS length in both preserved art styles',()=>{
  start();
  for(const style of ['pixel','illustrated']){
    game.setArtStyle(style);
    assert.match(game.document.getElementById('board').style.getPropertyValue('--cellpx'),/^\d+px$/);
    assert.equal(game.document.getElementById('board').style.getPropertyValue('--mapsize'),'13');
  }
});
test('same seed reproduces supply and variants, another seed changes it',()=>{
  start('local','seed-A');const first=JSON.stringify({deck:game.S.deck,roads:game.S.roads,land:game.S.land,market:game.S.market});
  start('local','seed-A');assert.equal(JSON.stringify({deck:game.S.deck,roads:game.S.roads,land:game.S.land,market:game.S.market}),first);
  start('local','seed-B');assert.notEqual(JSON.stringify({deck:game.S.deck,roads:game.S.roads,land:game.S.land,market:game.S.market}),first);
});
test('House has capacity only; Population is bounded by both totals',()=>{
  empty();tile('house',6,6);assert.equal(town().accommodation,4);assert.equal(town().population,0);
  tile('shop',1,1);tile('shop',1,2);tile('shop',1,3);
  assert.equal(town().attraction,8);assert.equal(town().population,4);
  tile('house',7,6);tile('house',8,6);assert.equal(town().population,8);
});
test('Apartment dynamically activates and deactivates, with own orthogonal Park AND Shop',()=>{
  empty();tile('apartment',6,6);tile('park',6,5);assert.equal(town().accommodation,0);
  tile('shop',5,6,'bot');assert.equal(town().accommodation,0);
  tile('shop',5,6);assert.equal(town().accommodation,8);
  game.S.grid[6][5]=null;tile('park',5,5);assert.equal(town().accommodation,0);
  tile('park',6,5);assert.equal(town().accommodation,8);
});
test('Park is +1 total regardless of House count, and ignores Apartments and opponents',()=>{
  empty();tile('park',6,6);tile('apartment',6,5);tile('house',5,6,'bot');assert.equal(town().breakdown.parks,0);
  tile('house',6,7);assert.equal(town().breakdown.parks,1);tile('house',7,6);assert.equal(town().breakdown.parks,1);
  game.S.grid[6][7]=null;game.S.grid[7][6]=null;tile('house',7,7);assert.equal(town().breakdown.parks,0);
});
test('Shops score 1 / 4 / 8 / 8 per connected group',()=>{
  empty();[1,4,8,8].forEach((expected,i)=>{tile('shop',6,i+3);assert.equal(town().breakdown.shops,expected);});
});
test('separate Shop groups score independently, merge once, and ignore diagonal/opponent links',()=>{
  empty();tile('shop',5,2);tile('shop',5,3);tile('shop',5,5);tile('shop',5,6);
  assert.equal(town().breakdown.shops,8);assert.equal(town().shopGroups.length,2);
  tile('shop',5,4);assert.equal(town().breakdown.shops,8);assert.equal(town().shopGroups.length,1);
  tile('shop',6,7);assert.equal(town().breakdown.shops,9);
  tile('shop',5,7,'bot');assert.equal(town().breakdown.shops,9);assert.equal(town('bot').breakdown.shops,1);
});
test('Industry excludes only own Houses at Manhattan distance <=2',()=>{
  empty();tile('industrial',6,6);assert.equal(town().breakdown.industry,4);
  tile('apartment',6,7);tile('house',5,6,'bot');assert.equal(town().breakdown.industry,4);
  tile('house',7,8);assert.equal(town().breakdown.industry,4);
  tile('house',7,7);assert.equal(town().breakdown.industry,0);
  game.S.grid[7][7]=null;assert.equal(town().breakdown.industry,4);
});
test('distance convention is configurable in one place',()=>{
  empty();assert.equal(game.gridDistance(0,0,2,2),4);
  game.GAME_CONFIG.distanceMetric='chebyshev';assert.equal(game.gridDistance(0,0,2,2),2);
  tile('industrial',0,0);tile('house',2,2);assert.equal(town().breakdown.industry,0);
});
test('School rewards House-equivalents in its catchment and penalises those outside it',()=>{
  empty();tile('school',0,0);tile('house',0,3);tile('house',1,2);tile('house',2,2);tile('house',1,0,'bot');tile('apartment',2,0);
  assert.equal(town().breakdown.school,11);tile('industrial',0,1);assert.equal(town().breakdown.school,11);
  tile('apartment',4,0);assert.equal(town().breakdown.school,9);
  tile('house',3,0);assert.equal(town().breakdown.school,12);
});
test('School has no Attraction cap; overlapping civic ranges calculate independently',()=>{
  empty();tile('school',6,6);
  for(const [r,c] of [[6,3],[6,4],[6,5],[6,7],[6,8],[6,9],[5,6]])tile('house',r,c);
  assert.equal(town().breakdown.school,21);
  game.putTile('you',{type:'sports'},3,5);
  assert.equal(town().breakdown.school,21);assert.equal(town().breakdown.sports,4);
});
test('Hospital uses pre-placement Population, rounds down, caps and never grows later',()=>{
  empty();for(let c=0;c<3;c++)tile('house',12,c);
  for(let c=0;c<3;c++)tile('shop',0,c);tile('shop',0,6);
  assert.equal(town().population,9);
  game.putTile('you',{type:'hospital'},6,6);assert.equal(game.at(6,6).lockedAttraction,4);
  assert.equal(town().breakdown.hospital,4);
  for(let c=3;c<8;c++)tile('house',12,c);
  for(let c=0;c<3;c++)tile('shop',2,c);
  assert.equal(town().breakdown.hospital,4);
  assert.equal(game.hospitalValue(24),12);assert.equal(game.hospitalValue(30),12);
  assert.equal(game.hospitalValue(0),0);
});
test('Sports counts unique own building types, ignores roads/opponents/self and caps at 12',()=>{
  empty();game.putTile('you',{type:'sports'},5,5);
  tile('house',4,5);tile('house',4,6);tile('park',7,5);tile('shop',5,7);
  assert.equal(town().breakdown.sports,6);
  tile('hospital',3,5,'bot',{lockedAttraction:12});tile('road',6,7,'you',{mask:5});assert.equal(town().breakdown.sports,6);
  tile('apartment',6,8);assert.equal(town().breakdown.sports,8);
  tile('school',8,6);tile('industrial',5,3);assert.equal(town().breakdown.sports,12);
  tile('hospital',3,5,'you',{lockedAttraction:0});assert.equal(town().breakdown.sports,12);
  assert.equal(Object.values(town().effects).filter(t=>t.type==='sports').length,1);
});
test('Sports range uses nearest footprint square and works at board edges',()=>{
  empty();game.putTile('you',{type:'sports'},0,0);tile('house',3,1);assert.equal(town().breakdown.sports,2);
  tile('shop',3,2);assert.equal(town().breakdown.sports,2);
});
test('all scoring effects isolate ownership',()=>{
  empty();tile('school',6,6);tile('industrial',4,4);tile('park',5,5);tile('apartment',5,4);
  tile('house',5,6,'bot');tile('park',5,3,'bot');tile('shop',4,4,'bot');
  assert.equal(town().accommodation,0);assert.equal(town().breakdown.school,6);assert.equal(town().breakdown.parks,0);
});
test('roads rotate and must connect to own network with matching edges',()=>{
  start();assert.equal(game.legalRoad(11,6,5,'you'),true);assert.equal(game.legalRoad(11,6,10,'you'),false);
  assert.equal(game.rotateMask(5),10);assert.equal(game.rotateMask(10),5);
  assert.equal(game.legalRoad(1,6,5,'you'),false);assert.equal(game.legalRoad(1,6,5,'bot'),true);
  tile('road',11,5,'you',{mask:5});assert.equal(game.legalRoad(11,6,14,'you'),false);
  tile('road',11,5,'you',{mask:game.E});assert.equal(game.legalRoad(11,6,14,'you'),true);
});
test('touching enemy roads must match but never supply ownership connectivity',()=>{
  empty();tile('road',6,5,'you',{mask:game.E});tile('road',5,6,'bot',{mask:game.E|game.Wd});
  assert.equal(game.legalRoad(6,6,game.N|game.Wd,'you'),false);
  assert.equal(game.legalRoad(6,6,game.E|game.Wd,'you'),true);
  game.S.grid[6][5]=null;tile('road',5,6,'bot',{mask:game.Sd});
  assert.equal(game.legalRoad(6,6,game.N|game.Sd,'you'),false);
});
test('buildings require an own edge-adjacent road and empty in-bounds footprint',()=>{
  start();const house={type:'house'};
  assert.equal(game.legalFor(house,11,6,'you'),true);
  assert.equal(game.legalFor(house,11,5,'you'),false);
  assert.equal(game.legalFor(house,1,6,'you'),false);
  assert.equal(game.legalFor(house,12,5,'you'),true);
  assert.equal(game.legalFor(house,12,6,'you'),false);
  assert.equal(game.legalFor({type:'sports'},11,7,'you'),true);
  assert.equal(game.legalFor({type:'sports'},12,7,'you'),false);
  assert.equal(game.legalFor({type:'upgrade'},12,5,'you'),false);
});
test('preview shows House disabling Industry and entering School range without mutating the board',()=>{
  empty();tile('road',6,6,'you',{mask:15});tile('industrial',6,9);tile('school',4,7);
  const snapshot=JSON.stringify(game.S),p=game.previewPlacement('you',{type:'house'},6,7);
  assert.equal(p.before.accommodation,0);assert.equal(p.after.accommodation,4);
  assert.equal(p.before.attraction,4);assert.equal(p.after.attraction,3);
  assert.ok(p.changes.some(c=>c.type==='industrial'&&c.from===4&&c.to===0));
  assert.ok(p.changes.some(c=>c.type==='school'&&c.from===0&&c.to===3));
  assert.equal(JSON.stringify(game.S),snapshot);
});
test('Hospital preview agrees with the committed lock and leaves no phantom tiles',()=>{
  empty();tile('road',6,6,'you',{mask:15});tile('house',0,0);tile('shop',1,0);tile('shop',1,1);
  const p=game.previewPlacement('you',{type:'hospital'},6,7);assert.equal(p.after.breakdown.hospital,2);assert.equal(game.at(6,7),null);
  game.putTile('you',{type:'hospital'},6,7);assert.equal(game.at(6,7).lockedAttraction,2);
});
test('selection and staging consume nothing; confirmation places once, refills same market slot and ends turn',()=>{
  start();select('shop');const deck=game.S.deck.length,slot=game.S.deck[deck-1];
  game.stagePlacement(11,6);assert.equal(game.at(11,6),null);assert.equal(game.S.market[0].type,'shop');
  game.confirmPlacement();assert.equal(game.at(11,6).type,'shop');assert.equal(game.S.turn,'bot');assert.equal(game.S.you.turns,1);
  assert.equal(game.S.market[0].type,slot.type);assert.equal(game.S.deck.length,deck-1);
  game.confirmPlacement();assert.equal(game.S.you.turns,1);
});
test('both local players can select and place from the same market',()=>{
  start();move('shop',11,6);assert.equal(game.humanTurn(),true);
  move('shop',1,6);assert.equal(game.at(1,6).owner,'bot');assert.equal(game.S.turn,'you');assert.equal(game.S.bot.turns,1);
});
test('Civic placement consumes only its personal tile and leaves market/deck intact',()=>{
  start();const supply=JSON.stringify([game.S.market,game.S.deck]);move('school',11,6,'civic');
  assert.equal(game.S.you.civics.length,2);assert.equal(game.S.bot.civics.length,3);
  assert.equal(game.S.you.civics.some(t=>t.type==='school'),false);
  assert.equal(JSON.stringify([game.S.market,game.S.deck]),supply);
  assert.equal(town().breakdown.school,0);
});
test('Sports occupies four squares but is consumed once',()=>{
  start();move('sports',11,7,'civic');
  for(const [r,c] of [[11,7],[11,8],[12,7],[12,8]])assert.equal(game.at(r,c).type,'sports');
  assert.equal(game.S.you.civics.length,2);assert.equal(town().breakdown.sports,0);
});
test('invalid moves and double use of a Civic do not mutate state',()=>{
  start();const snapshot=JSON.stringify(game.S);
  const fake={source:'civic',index:9,item:{type:'school'}};
  assert.equal(game.commitPlacement(fake,11,6),false);assert.equal(JSON.stringify(game.S),snapshot);
  assert.equal(game.commitPlacement({source:'market',index:0,item:{type:'upgrade'}},12,5),false);
});
test('Player 1 reaching target gives Player 2 a full final turn, allowing a draw',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=1;move('shop',11,6);
  assert.equal(game.S.finalTurn,true);assert.equal(game.S.over,false);assert.equal(game.S.turn,'bot');
  move('shop',1,6);assert.equal(game.S.over,true);assert.equal(game.S.result.winner,null);
  assert.equal(game.S.you.turns,game.S.bot.turns);
});
test('Player 2 can win on the reply with higher Population',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=1;move('shop',11,6);move('school',1,6,'civic');
  assert.equal(game.S.result.winner,'bot');assert.equal(town('bot').population,3);
});
test('Player 2 reaching target first ends immediately after equal turns',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=2;move('house',11,6);move('school',1,6,'civic');
  assert.equal(game.S.over,true);assert.equal(game.S.finalTurn,false);assert.equal(game.S.result.winner,'bot');
  assert.equal(game.S.you.turns,1);assert.equal(game.S.bot.turns,1);
});
test('Player 1 wins when final reply does not catch up',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=2;move('school',11,6,'civic');move('shop',1,6);
  assert.equal(game.S.result.winner,'you');
});
test('a blocked Player 2 can pass the final turn and equalise turn counts',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=1;move('shop',11,6);
  game.S.bot.civics=[];game.S.market=[];game.S.roads=[];assert.equal(game.canPass('bot'),true);
  assert.equal(game.passTurn(),true);assert.equal(game.S.over,true);assert.equal(game.S.result.winner,'you');
  assert.equal(game.S.you.turns,game.S.bot.turns);
});
test('passing is disallowed while any market or Civic tile fits',()=>{
  start();assert.equal(game.passTurn(),false);assert.equal(game.S.you.turns,0);
  game.S.market=[];assert.equal(game.canPass('you'),false);
});
test('blocked shared market cannot cause endless passing even with unseen tiles in supply',()=>{
  closedBoard();assert.equal(game.hasLegalChoice('you'),false);assert.equal(game.hasLegalChoice('bot'),false);
  game.passTurn();assert.equal(game.S.over,true);assert.equal(game.S.result.reason,'blocked');
});
test('Undo restores market, civic supply, hospital locks, population and final-turn state',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=2;const before=JSON.stringify(game.S);move('school',11,6,'civic');
  assert.equal(game.S.finalTurn,true);game.undoMove();assert.equal(JSON.stringify(game.S),before);
  move('hospital',11,6,'civic');assert.equal(game.at(11,6).lockedAttraction,0);game.undoMove();assert.equal(JSON.stringify(game.S),before);
});
test('Undo works after a finished game',()=>{
  housedStart();game.GAME_CONFIG.winPopulation=1;move('shop',11,6);move('shop',1,6);
  assert.equal(game.S.over,true);game.undoMove();assert.equal(game.S.over,false);assert.equal(game.S.finalTurn,true);
  assert.equal(game.S.turn,'bot');assert.equal(game.document.getElementById('over').open,false);
});
test('Ada plays a legal single-tile turn and Undo restores the whole human/Ada exchange',()=>{
  start('bot');select('shop');const before=JSON.stringify({...game.S,selected:null});
  game.stagePlacement(11,6);game.confirmPlacement();assert.equal(game.humanTurn(),false);
  game.botTurn();assert.equal(game.S.turn,'you');assert.equal(game.S.you.turns,1);assert.equal(game.S.bot.turns,1);
  game.undoMove();assert.equal(JSON.stringify(game.S),before);
});
test('setup pause prevents stale bot callbacks, and restart clears all state',()=>{
  start('bot');move('shop',11,6);game.showSetup();const snapshot=JSON.stringify(game.S);game.botTurn();assert.equal(JSON.stringify(game.S),snapshot);
  game.closeSetup();assert.equal(game.S.paused,false);
  start();assert.equal(game.moveHistory.length,0);assert.equal(game.S.selected,null);assert.equal(game.S.preview,null);
  assert.equal(game.S.you.turns,0);assert.equal(game.S.bot.turns,0);assert.equal(game.S.over,false);assert.equal(game.S.finalTurn,false);
});
test('art style switch preserves the entire game state',()=>{
  start();const before=JSON.stringify(game.S);game.setArtStyle('pixel');assert.match(game.sprite('house',0,0),/^<svg/);
  game.setArtStyle('illustrated');assert.match(game.sprite('house',0,0),/illustrated-sprite/);assert.equal(JSON.stringify(game.S),before);
});
test('rendered rules and metrics have the new values and no legacy score systems',()=>{
  start();game.render();game.renderLegend();
  const rules=game.document.getElementById('legend').innerHTML;
  assert.match(rules,/Population = min/);assert.match(rules,/Manhattan/);assert.doesNotMatch(rules,/employment|upgrade|points|tax/i);
  for(const owner of ['you','bot'])assert.match(game.document.getElementById('town-'+owner).innerHTML,/Accommodation.*Attraction.*Population/);
});
for(const seed of ['full-loop-1','full-loop-2'])test(`complete seeded game (${seed}) ends without illegal moves or stale counters`,()=>{
  start('local',seed);let moves=0;
  while(!game.S.over&&moves<160){
    const owner=game.S.turn,m=game.chooseBotMove(owner);
    if(m){assert.equal(game.legalFor(m.item,m.r,m.c,owner),true);assert.equal(game.commitPlacement(m,m.r,m.c),true);}
    else assert.equal(game.passTurn(),true);
    for(const who of ['you','bot']){const t=town(who);assert.equal(t.population,Math.min(t.accommodation,t.attraction));}
    moves++;
  }
  assert.ok(game.S.over,`game stalled at ${moves} turns`);
  console.log(`  ${moves} turns: ${town().population} / ${town('bot').population}, ${game.S.result.reason}`);
});
console.log(`${passed} checks passed.`);
