const U = {
  rand: (a,b)=> a + Math.random()*(b-a),
  randInt: (a,b)=> Math.floor(U.rand(a,b+1)),
  pick: (arr)=> arr[Math.floor(Math.random()*arr.length)],
  clamp: (v,a,b)=> Math.max(a,Math.min(b,v)),
  uid: ()=> 'id'+Math.random().toString(36).slice(2,10),
  weightedPick(list, weightFn){
    const w = list.map(weightFn);
    const total = w.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<list.length;i++){ r-=w[i]; if(r<=0) return list[i]; }
    return list[list.length-1];
  },
  fmtSigned(n){ return (n>0?'+':'') + n; }
};
