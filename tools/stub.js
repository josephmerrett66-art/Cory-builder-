// shared browser stub for the test harnesses
const fs=require('fs'), vm=require('vm');
function fakeEl(){
  return {dataset:{},clientWidth:390,innerHTML:'',textContent:'',title:'',type:'',
    className:'',disabled:false,open:false,
    style:{cssText:'',setProperty(){},getPropertyValue(){return '';}},
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},
    appendChild(){},querySelector(){return fakeEl();},showModal(){},close(){}};
}
function load(file, seed){
  const script=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
  let M=Math;
  if(seed!==undefined){
    let s=seed;
    M=Object.create(Math);
    M.random=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  }
  const ctx={
    document:{getElementById(){return fakeEl();},createElement(){return fakeEl();},
      querySelector(){return fakeEl();},addEventListener(){}},
    window:{addEventListener(){},visualViewport:{addEventListener(){}}},
    setTimeout(){},console,Math:M,JSON,Object,Array,String,Number,Boolean,Error,
    isNaN,parseInt,parseFloat
  };
  vm.createContext(ctx); vm.runInContext(script,ctx);
  return ctx;
}
module.exports={load,fakeEl};
