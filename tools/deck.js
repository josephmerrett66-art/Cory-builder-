const {load}=require('./stub');
const fs=require('fs');
const ctx=load('/home/claude/work/dusk-town.html');

// a fixed, balanced deck for the physical set (the digital one randomises within bands)
const square=[];
const tall=[];
const big=[];
function add(list,type,mask,variant,n,label){
  for(let i=0;i<n;i++) list.push({type,mask,variant,label});
}
// homes and amenities
add(square,'house',0,0,11,'House'); add(square,'house',0,1,10,'House');
add(square,'park',0,0,4,'Park'); add(square,'park',0,1,3,'Park');
add(square,'park',0,2,3,'Park'); add(square,'park',0,3,3,'Park');
add(square,'shop',0,0,7,'Shop'); add(square,'shop',0,1,6,'Shop');
add(square,'industrial',0,0,8,'Industrial'); add(square,'industrial',0,1,7,'Industrial');
// civics (the sports centre covers 2x2, so it prints as one big tile)
add(square,'school',0,0,2,'School');
add(square,'hospital',0,0,2,'Hospital');
// roads
add(square,'road',5,0,14,'Road'); add(square,'road',10,0,14,'Road');
[3,6,12,9].forEach(m=>add(square,'road',m,0,4,'Road'));
[7,14,13,11].forEach(m=>add(square,'road',m,0,3,'Road'));
add(square,'road',15,0,4,'Road');
// two starting tiles
add(square,'road',7,0,1,'Start'); add(square,'road',13,0,1,'Start');
// apartments are taller than a cell
add(tall,'apartment',0,0,3,'Apartment'); add(tall,'apartment',0,1,3,'Apartment');
add(big,'sportsbig',0,0,2,'Sports centre');

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
function gridFor(t){
  if(t.type==='sportsbig') return ctx.sportsBig();
  if(t.type==='road') return ctx.roadSprite(t.mask);
  if(t.type==='house') return ctx.houseSprite(t.variant);
  if(t.type==='park') return ctx.parkSprite(t.variant);
  if(t.type==='shop') return ctx.shopSprite(t.variant);
  if(t.type==='industrial') return ctx.industrialSprite(t.variant);
  if(t.type==='school') return ctx.schoolSprite();
  if(t.type==='hospital') return ctx.hospitalSprite();
  if(t.type==='sports') return ctx.sportsSprite(t.variant);
  if(t.type==='apartment') return ctx.apartmentSprite(t.variant);
}
function pack(list){
  return list.map(t=>{
    const g=gridFor(t);
    return {label:t.label, w:g[0].length, h:g.length, runs:runs(g)};
  });
}
const out={square:pack(square), tall:pack(tall), big:pack(big)};
fs.writeFileSync('/home/claude/deck.json',JSON.stringify(out));
const tally={};
square.concat(tall,big).forEach(t=>tally[t.label]=(tally[t.label]||0)+1);
console.log('square:',out.square.length,' tall:',out.tall.length,' 2x2:',out.big.length,
            ' total pieces:',out.square.length+out.tall.length+out.big.length);
console.log(JSON.stringify(tally));
