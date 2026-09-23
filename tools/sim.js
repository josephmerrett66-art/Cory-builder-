// Deterministic balance harness. Both players use the same placement evaluator.
const path=require('node:path');
const {load}=require('./stub');
const game=load(path.join(__dirname,'..','index.html'));
const runs=Math.max(1,Math.min(100,Number(process.argv[2])||5));
const prefix=process.argv[3]||'balance';
game.render=()=>{};game.renderLegend=()=>{};game.showResults=()=>{};
const report=[];
for(let i=0;i<runs;i++){
  const seed=`${prefix}-${i+1}`;
  game.newGame({mode:'local',seed});
  let actions=0;
  while(!game.S.over&&actions<300){
    const move=game.chooseBotMove(game.S.turn);
    if(move)game.commitPlacement(move,move.r,move.c);else game.passTurn();
    actions++;
  }
  const p1=game.calculateTown('you'),p2=game.calculateTown('bot');
  report.push({seed,actions,end:game.S.result?.reason||'stalled',
    p1Capacity:p1.accommodation,p1Attraction:p1.attraction,p1Population:p1.population,
    p2Capacity:p2.accommodation,p2Attraction:p2.attraction,p2Population:p2.population,
    buildingsLeft:game.S.deck.length+game.S.market.length});
  if(!game.S.over)process.exitCode=1;
}
console.table(report);
