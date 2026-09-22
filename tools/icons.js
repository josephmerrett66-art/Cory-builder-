const {load}=require('./stub');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const outDir=path.join(root,'tmp','pdfs');
fs.mkdirSync(outDir,{recursive:true});
const ctx=load(path.join(root,'index.html'));
function runs(grid){
  const out=[];
  grid.forEach((row,y)=>{
    let x=0;
    while(x<row.length){
      const ch=row[x]; let w=1;
      while(x+w<row.length && row[x+w]===ch) w++;
      const col=ctx.PAL[ch];
      if(col) out.push([x,y,w,col]);
      x+=w;
    }
  });
  return out;
}
const set={
  house:ctx.houseSprite(0), apartment:ctx.apartmentSprite(0),
  park:ctx.parkSprite(1), shop:ctx.shopSprite(0), industrial:ctx.industrialSprite(0),
  sports:ctx.sportsSprite(0), school:ctx.schoolSprite(), hospital:ctx.hospitalSprite(),
  upgrade:ctx.upgradeSprite(),
  road:ctx.roadSprite(7)
};
const out={};
for(const k in set){ out[k]={w:set[k][0].length,h:set[k].length,runs:runs(set[k])}; }
fs.writeFileSync(path.join(outDir,'icons.json'),JSON.stringify(out));
console.log('icons exported:',Object.keys(out).join(', '));
