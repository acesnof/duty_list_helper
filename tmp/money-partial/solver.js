/* Integer search: all amounts use units of 500. No rounding of money. */
function solveExactDistribution(stock, amounts, maxNodes=400000){
  const den=[20,10,4,2,1];
  if(stock.length!==5||stock.some(n=>!Number.isSafeInteger(n)||n<0)||!amounts.length||amounts.some(n=>!Number.isSafeInteger(n)||n<=0||n%500))return {error:'invalid'};
  const values=amounts.map(n=>n/500),total=values.reduce((a,b)=>a+b,0);
  if(total>stock.reduce((s,n,j)=>s+n*den[j],0))return {error:'funds'};
  // Water-fill a common note count, capping each denomination at its stock.
  let lo=0,hi=Math.max(...stock);
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(den.reduce((s,d,j)=>s+d*Math.min(stock[j],mid),0)<total)lo=mid;else hi=mid;}
  const targets=stock.map(s=>Math.min(s,hi));
  const order=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value||a.index-b.index);
  const remaining=stock.slice(),rows=values.map(()=>Array(5).fill(0)),failed=new Set();
  let nodes=0,limited=false;
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  function possible(amount,from){let capacity=0,g=0;for(let j=from;j<5;j++){capacity+=remaining[j]*den[j];if(remaining[j])g=gcd(g,den[j]);}return amount<=capacity&&(!amount||(g&&amount%g===0));}
  function visit(r){
    if(r===order.length)return true;
    if(++nodes>maxNodes){limited=true;return false;}
    const key=r+':'+remaining.join(',');if(failed.has(key))return false;
    const {value,index}=order[r];
    function choose(j,amount){
      if(++nodes>maxNodes){limited=true;return false;}
      if(!possible(amount,j))return false;
      if(j===4){
        if(amount>remaining[4])return false;
        rows[index][4]=amount;remaining[4]-=amount;
        if(visit(r+1))return true;
        remaining[4]+=amount;return false;
      }
      const later=den.reduce((s,d,k)=>s+(k>j?remaining[k]*d:0),0);
      const min=Math.max(0,Math.ceil((amount-later)/den[j])),max=Math.min(remaining[j],Math.floor(amount/den[j]));
      if(min>max)return false;
      const ideal=targets[j]*value/total;
      const center=Math.max(min,Math.min(max,Math.round(ideal)));
      for(let offset=0;offset<=Math.max(center-min,max-center);offset++){
        const candidates=offset===0?[center]:[center-offset,center+offset];
        for(const count of candidates){
          if(count<min||count>max)continue;
          rows[index][j]=count;remaining[j]-=count;
          if(choose(j+1,amount-count*den[j]))return true;
          remaining[j]+=count;if(limited)return false;
        }
      }
      return false;
    }
    if(choose(0,value))return true;
    failed.add(key);return false;
  }
  if(!visit(0))return {error:limited?'limit':'impossible',nodes};
  // Improve the full mixture, rather than favouring the first denominations.
  // Each replacement preserves an exact amount and the shared inventory.
  let improveNodes=0;
  const cost=(row,i)=>row.reduce((s,n,j)=>s+(n-targets[j]*values[i]/total)**2,0);
  for(let pass=0;pass<3;pass++){
    let changed=false;
    const priority=values.map((_,i)=>i).sort((a,b)=>cost(rows[b],b)-cost(rows[a],a));
    for(const i of priority){
      if(improveNodes>200000)break;
      const available=remaining.map((n,j)=>n+rows[i][j]),ideal=targets.map(n=>n*values[i]/total);
      let best=rows[i].slice(),bestCost=cost(best,i);const candidate=Array(5).fill(0);
      function improve(j,amount,score){
        if(++improveNodes>200000||score>=bestCost-1e-9)return;
        if(j===4){if(amount<=available[4]){const final=score+(amount-ideal[4])**2;if(final<bestCost-1e-9){candidate[4]=amount;best=candidate.slice();bestCost=final;}}return;}
        const capacity=den.reduce((s,d,k)=>s+(k>j?available[k]*d:0),0),radius=Math.sqrt(bestCost-score);
        const min=Math.max(0,Math.ceil((amount-capacity)/den[j]),Math.ceil(ideal[j]-radius)),max=Math.min(available[j],Math.floor(amount/den[j]),Math.floor(ideal[j]+radius));
        const center=Math.max(min,Math.min(max,Math.round(ideal[j])));
        for(let delta=0;delta<=Math.max(center-min,max-center);delta++){
          for(const n of delta===0?[center]:[center-delta,center+delta]){
            if(n<min||n>max)continue;candidate[j]=n;improve(j+1,amount-n*den[j],score+(n-ideal[j])**2);if(improveNodes>200000)return;
          }
        }
      }
      improve(0,values[i],0);
      if(best.some((n,j)=>n!==rows[i][j]))changed=true;
      for(let j=0;j<5;j++)remaining[j]=available[j]-best[j];rows[i]=best;
    }
    if(!changed)break;
  }
  return {rows,remaining,nodes};
}
// Exact bounded maximum below a requested amount. The upper bounds account
// for both remaining stock and the GCD of remaining denominations.
function nearestBelow(stock, amount){
  const den=[20,10,4,2,1],target=Math.floor(amount/500),candidate=Array(5).fill(0);
  let best=-1,bestRow=Array(5).fill(0);
  const gcd=(a,b)=>b?gcd(b,a%b):a,capacity=Array(6).fill(0),divisor=Array(6).fill(0);
  for(let j=4;j>=0;j--){capacity[j]=capacity[j+1]+stock[j]*den[j];divisor[j]=stock[j]?gcd(den[j],divisor[j+1]):divisor[j+1];}
  function search(j,left,paid){
    const upper=divisor[j]?Math.floor(Math.min(left,capacity[j])/divisor[j])*divisor[j]:0;
    if(paid+upper<=best)return;
    if(j===5||!upper){best=paid;bestRow=candidate.slice();for(let k=j;k<5;k++)bestRow[k]=0;return;}
    const max=Math.min(stock[j],Math.floor(left/den[j]));
    for(let n=max;n>=0;n--){
      if(paid+n*den[j]+capacity[j+1]<=best)break;
      candidate[j]=n;search(j+1,left-n*den[j],paid+n*den[j]);
      if(best===paid+upper)return;
    }
  }
  search(0,target,0);return bestRow;
}
function solveDistribution(stock,amounts,maxNodes=400000){
  if(stock.length!==5||stock.some(n=>!Number.isSafeInteger(n)||n<0)||!amounts.length||amounts.some(n=>!Number.isSafeInteger(n)||n<=0))return {error:'invalid'};
  const den=[10000,5000,2000,1000,500],rounded=amounts.map(n=>Math.floor(n/500)*500);
  const active=rounded.map((n,i)=>i).filter(i=>rounded[i]>0);
  let rows=amounts.map(()=>Array(5).fill(0)),remaining=stock.slice();
  const exact=active.length?solveExactDistribution(stock,active.map(i=>rounded[i]),maxNodes):{rows:[],remaining:stock.slice()};
  if(!exact.error){active.forEach((i,k)=>rows[i]=exact.rows[k]);remaining=exact.remaining;}
  else{
    // Shared stock: when all requests cannot be fulfilled, earlier rows take
    // priority. Each row gets the greatest attainable value without overshoot.
    for(let i=0;i<amounts.length;i++){
      rows[i]=nearestBelow(remaining,amounts[i]);
      remaining=remaining.map((n,j)=>n-rows[i][j]);
    }
    // Improve the mixture while preserving every attained amount.
    const paid=rows.map(row=>row.reduce((s,n,j)=>s+n*den[j],0)),positive=paid.map((n,i)=>i).filter(i=>paid[i]>0);
    if(positive.length){const balanced=solveExactDistribution(stock,positive.map(i=>paid[i]),maxNodes);if(!balanced.error){positive.forEach((i,k)=>rows[i]=balanced.rows[k]);remaining=balanced.remaining;}}
  }
  const paid=rows.map(row=>row.reduce((s,n,j)=>s+n*den[j],0)),missing=amounts.map((amount,i)=>amount-paid[i]);
  return {rows,remaining,paid,missing,totalMissing:missing.reduce((a,b)=>a+b,0),searchLimited:exact.error==='limit'};
}
if(typeof module!=='undefined')module.exports={solveDistribution,solveExactDistribution,nearestBelow};
