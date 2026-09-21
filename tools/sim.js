const fs = require('fs');
const vm = require('vm');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = src.match(/<script>([\s\S]*)<\/script>/)[1];

function fakeEl(){
  const el = {
    dataset: {},
    innerHTML:'', textContent:'', title:'', type:'', className:'', disabled:false, open:false,
    style:{ cssText:'', setProperty(){} },
    classList:{ add(){}, remove(){}, toggle(){} },
    addEventListener(){}, setAttribute(){}, appendChild(){},
    querySelector(){ return fakeEl(); },
    showModal(){ this.open = true; }, close(){ this.open = false; }
  };
  return el;
}
const doc = {
  getElementById(){ return fakeEl(); },
  querySelector(){ return fakeEl(); },
  createElement(){ return fakeEl(); },
  addEventListener(){}
};

const ctx = {
  document: doc,
  window: { addEventListener(){}, visualViewport:{ addEventListener(){} } },
  setTimeout(){}, clearTimeout(){}, // stop the bot auto-chaining; we drive it manually
  console,
  Math, JSON, Object, Array, String, Number, Boolean, Error, isNaN, parseInt, parseFloat
};
vm.createContext(ctx);
vm.runInContext(script, ctx);

const { SIZE } = ctx;

function townReport(owner){
  const S = ctx.S;
  const tally = {};
  let tiles = 0;
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    const q = S.grid[r][c];
    if(!q || q.owner!==owner || q.type==='entrance') continue;
    tally[q.type] = (tally[q.type]||0)+1;
    tiles++;
  }
  return { tiles, tally };
}

function takeTurn(P){
  const S = ctx.S;
  S.mode = null; S.used = 0; P.tookRoad = false;
  let acted = 0;
  for(let i=0;i<2;i++){ if(ctx.botAct(P)) acted++; else break; }
  S.mode = null; S.used = 0; P.tookRoad = false;
  return acted;
}

function playOne(seedLabel){
  ctx.newGame();
  const S = ctx.S;

  let turns = 0, idle = 0;
  while(turns < 500){
    turns++;
    const a = takeTurn(S.you);
    const b = takeTurn(S.bot);
    if(!a && !b){ idle++; if(idle > 2) break; } else idle = 0;
    if(!S.deck.length && !S.market.length &&
       !ctx.anyLegal(S.you) && !ctx.anyLegal(S.bot)) break;
  }
  const you = ctx.score(S.you), bot = ctx.score(S.bot);
  return {
    label: seedLabel, turns,
    yTiles: townReport('you').tiles, bTiles: townReport('bot').tiles,
    yHouses: you.houses, bHouses: bot.houses,
    yTotal: you.total, bTotal: bot.total,
    yHand: S.you.hand.length, bHand: S.bot.hand.length,
    yUnpl: you.unplaced, bUnpl: bot.unplaced,
    tally: townReport('bot').tally,
    deckLeft: S.deck.length + S.market.length
  };
}

const runs = [];
for(let i=0;i<8;i++) runs.push(playOne('g'+(i+1)));

console.log('label turns | yTiles yHouse yTotal yHand | bTiles bHouse bTotal bHand | deckL');
for(const r of runs){
  console.log([r.label, r.turns, '|', r.yTiles, r.yHouses, r.yTotal, r.yHand,
    '|', r.bTiles, r.bHouses, r.bTotal, r.bHand, '|', r.deckLeft].join('\t'));
}
const avg = k => (runs.reduce((s,r)=>s+r[k],0)/runs.length).toFixed(1);
console.log('\nAVG  yTiles', avg('yTiles'), 'yHouses', avg('yHouses'), 'yTotal', avg('yTotal'),
            '| bTiles', avg('bTiles'), 'bHouses', avg('bHouses'), 'bTotal', avg('bTotal'));
console.log('AVG  tiles stranded in hand: you', avg('yHand'), ' bot', avg('bHand'));
console.log('plants never built:', runs.filter(r=>r.yUnpl||r.bUnpl).length, '/', runs.length);
console.log('bot scored under 40:', runs.filter(r=>r.bTotal<40).length, '/', runs.length);
