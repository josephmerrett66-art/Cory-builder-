// shared browser stub for the test harnesses
const fs=require('fs'), vm=require('vm');
function fakeEl(){
  const properties={};
  return {dataset:{},clientWidth:390,innerHTML:'',textContent:'',title:'',type:'',
    className:'',disabled:false,open:false,
    style:{cssText:'',setProperty(key,value){properties[key]=String(value);},getPropertyValue(key){return properties[key]||'';}},
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},
    appendChild(){},querySelector(){return fakeEl();},
    showModal(){this.open=true;},close(){this.open=false;}};
}
function load(file, seed){
  const script=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
  let M=Math;
  if(seed!==undefined){
    let s=seed;
    M=Object.create(Math);
    M.random=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  }
  const elements={};
  const ctx={
    document:{getElementById(id){return elements[id]||(elements[id]=fakeEl());},createElement(){return fakeEl();},
      querySelector(){return fakeEl();},addEventListener(){}},
    window:{addEventListener(){},visualViewport:{addEventListener(){}}},
    setTimeout(){},clearTimeout(){},console,Math:M,JSON,Object,Array,String,Number,Boolean,Error,
    isNaN,parseInt,parseFloat
  };
  // Match the browser's read-only Window.history, catching accidental globals.
  Object.defineProperty(ctx,'history',{get(){return {};},configurable:false});
  vm.createContext(ctx); vm.runInContext(script,ctx);
  return ctx;
}
module.exports={load,fakeEl};
