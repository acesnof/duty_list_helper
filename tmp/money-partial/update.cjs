const fs=require('node:fs'),path=require('node:path'),dir=__dirname;
let app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
app=app.replace('min="500" max="1000000000" step="500"','min="1" max="1000000000" step="1"');
app=app.replace('||n%500','').replace('um valor positivo, múltiplo de 500, até','um valor inteiro positivo, até');
app=app.replace("$('balance').textContent=fmt(available-requested);$('balance').classList.toggle('negative',requested>available);$('balanceHint').textContent=requested>available?'O valor pedido excede o stock':'Após a distribuição';", "$('balance').textContent=fmt(result?result.remaining.reduce((sum,n,j)=>sum+n*DEN[j],0):Math.max(0,available-requested));$('balance').classList.remove('negative');$('balanceHint').textContent=result?'Saldo após o cálculo':requested>available?'Stock inferior ao valor pedido':'Estimativa antes do cálculo';");
const start=app.indexOf('function displayResult('),end=app.indexOf("$('calculate').onclick",start);
app=app.slice(0,start)+`function displayResult(s,solved){
  result={...s,...solved};const used=DEN.map((_,j)=>solved.rows.reduce((sum,r)=>sum+r[j],0)),requested=s.distributions.reduce((sum,r)=>sum+r.amount,0),paid=solved.paid.reduce((a,b)=>a+b,0),partial=solved.totalMissing>0;
  const observation=n=>n?'Falta entregar '+fmt(n):'—';
  $('resultTable').innerHTML='<thead><tr><th>Distribuição</th><th>Valor pedido</th><th>Valor entregue</th>'+DEN.map(d=>'<th>'+fmt(d)+'</th>').join('')+(partial?'<th class="observation-heading">Observações</th>':'')+'</tr></thead><tbody>'+s.distributions.map((d,i)=>'<tr><td>'+esc(d.name)+'</td><td>'+fmt(d.amount)+'</td><td>'+fmt(solved.paid[i])+'</td>'+solved.rows[i].map(n=>'<td>'+(n?fmt(n):'—')+'</td>').join('')+(partial?'<td class="'+(solved.missing[i]?'shortfall':'observation-ok')+'">'+observation(solved.missing[i])+'</td>':'')+'</tr>').join('')+'</tbody><tfoot><tr><td>Total</td><td>'+fmt(requested)+'</td><td>'+fmt(paid)+'</td>'+used.map(n=>'<td>'+fmt(n)+'</td>').join('')+(partial?'<td class="shortfall">'+observation(solved.totalMissing)+'</td>':'')+'</tr></tfoot>';
  $('remainingValue').textContent=fmt(solved.remaining.reduce((sum,n,i)=>sum+n*DEN[i],0))+' · '+fmt(solved.remaining.reduce((sum,n)=>sum+n,0))+' notas';
  $('remainingNotes').innerHTML=solved.remaining.map((n,i)=>'<div><small>Notas de '+fmt(DEN[i])+'</small><b>'+fmt(n)+' <small style="display:inline">notas</small></b><span class="remaining-subtotal">Total: '+fmt(n*DEN[i])+'</span></div>').join('');
  $('empty').hidden=true;$('resultBody').hidden=false;$('resultStatus').textContent=partial?'⚠ Valor em falta':'✓ Calculado';$('resultStatus').classList.toggle('shortfall',partial);$('excel').disabled=$('pdf').disabled=false;$('exportHint').textContent='Entregue: '+fmt(paid)+(partial?' · Em falta: '+fmt(solved.totalMissing):'');
  message(partial?'Atenção: falta entregar '+fmt(solved.totalMissing)+' no total. Foram distribuídos '+fmt(paid)+' de '+fmt(requested)+', sem ultrapassar os valores pedidos.':'Distribuição concluída. Todos os valores pedidos foram entregues.',!partial);
  if(solved.searchLimited)message($('message').textContent+' A procura conjunta atingiu o limite; foi aplicado o cálculo por ordem da lista.');
}
`+app.slice(end);
app=app.replace("$('resultStatus').textContent='Por calcular';","$('resultStatus').textContent='Por calcular';$('resultStatus').classList.remove('shortfall');");
const eStart=app.indexOf('function exportRows('),eEnd=app.indexOf('async function exportExcel',eStart);
app=app.slice(0,eStart)+`function exportRows(r){
  const used=DEN.map((_,j)=>r.rows.reduce((sum,row)=>sum+row[j],0)),sum=a=>a.reduce((x,y)=>x+y,0),partial=r.totalMissing>0,obs=n=>n?'Falta entregar '+fmt(n):'';
  return [['Distribuição','Valor pedido','Valor entregue',...DEN.map(String),...(partial?['Observações']:[])],...r.distributions.map((d,i)=>[d.name,d.amount,r.paid[i],...r.rows[i],...(partial?[obs(r.missing[i])]:[])]),['Total',sum(r.distributions.map(d=>d.amount)),sum(r.paid),...used,...(partial?[obs(r.totalMissing)]:[])],['Stock inicial','',sum(r.stock.map((n,i)=>n*DEN[i])),...r.stock,...(partial?['']:[])],['Saldo em caixa','',sum(r.remaining.map((n,i)=>n*DEN[i])),...r.remaining,...(partial?['']:[])]];
}
`+app.slice(eEnd);
app=app.replace("style=r===0?1:(r>=rows.length-3?3:2)","style=c===8&&r>0&&v?4:r===0?1:(r>=rows.length-3?3:2)");
app=app.replace('s="${r===0?1:r>=rows.length-3?3:0}"','s="${c===8&&r>0&&v?4:r===0?1:r>=rows.length-3?3:0}"');
app=app.replace('<fonts count="2">','<fonts count="3">').replace('</fonts>','<font><b/><color rgb="FF8A420D"/><sz val="11"/><name val="Calibri"/></font></fonts>');
app=app.replace('<fills count="3">','<fills count="4">').replace('</fills>','<fill><patternFill patternType="solid"><fgColor rgb="FFFFE4B5"/><bgColor indexed="64"/></patternFill></fill></fills>');
app=app.replace('<cellXfs count="4">','<cellXfs count="5">').replace('</cellXfs>','<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment wrapText="1" vertical="center"/></xf></cellXfs>');
app=app.replace('<col min="2" max="8" width="18" customWidth="1"/>','<col min="2" max="8" width="18" customWidth="1"/><col min="9" max="9" width="30" customWidth="1"/>');
app=app.replace('ref="A1:H${rows.length-3}"','ref="A1:${String.fromCharCode(64+rows[0].length)}${rows.length-3}"');
app=app.replace('const widths=[200,105,72,72,72,72,72,105]', 'const widths=rows[0].length===9?[180,90,90,52,52,52,52,52,150]:[220,115,115,64,64,64,64,64]');
const pStart=app.indexOf('  function drawRow('),pEnd=app.indexOf('  function newPage()',pStart);
app=app.slice(0,pStart)+`  function drawRow(row,header=false,summary=false){
    const texts=row.map(v=>typeof v==='number'?fmt(v):String(v)),lines=texts.map((text,j)=>wrap(text,widths[j]-20)),height=Math.max(29,...lines.map(a=>a.length*12+16));
    if(y-height<55)newPage();
    if(header||summary)page.drawRectangle({x:left,y:y-height,width:tableWidth,height,color:header?green:light});
    let x=left;
    row.forEach((v,j)=>{
      const warning=j===8&&!header&&!!v,strong=header||summary||warning,color=header?rgb(1,1,1):warning?rgb(.54,.26,.05):ink;
      if(warning)page.drawRectangle({x,y:y-height,width:widths[j],height,color:rgb(1,.89,.71)});
      const f=strong?bold:font;
      lines[j].forEach((line,k)=>drawText(line,j===0||j===8?x+10:x+widths[j]-10-f.widthOfTextAtSize(safe(line),9),y-18-k*12,9,strong,color));
      x+=widths[j];
    });
    page.drawLine({start:{x:left,y:y-height},end:{x:left+tableWidth,y:y-height},thickness:.4,color:rgb(.87,.9,.85)});y-=height;
  }
`+app.slice(pEnd);
app=app.replace('Gerado localmente • Valores exatos e stock respeitado','Gerado localmente • Valores entregues sem ultrapassar os pedidos');
fs.writeFileSync(path.join(dir,'app.js'),app);
let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
html=html.replace('Valores em múltiplos de 500.','Nunca ultrapassa o valor pedido.').replace('Valores exatos, com respeito','Valores até ao pedido, com respeito').replace('✓ Valores exatos','✓ Sem ultrapassar');
html=html.replace('O equilíbrio procura quantidades semelhantes de cada tipo de nota, ajustadas ao stock. Entre destinos, a mistura é proporcional ao valor pedido.','O cálculo procura uma mistura equilibrada sem ultrapassar os valores pedidos. Se não for possível satisfazer todos, segue a ordem da lista e indica o valor em falta.');
fs.writeFileSync(path.join(dir,'index.html'),html);
fs.appendFileSync(path.join(dir,'style.css'),`\n/* Important shortfall observations */\n#resultTable .shortfall,.shortfall{background:#ffe4b5;color:#8a420d;font-weight:750}#resultTable .shortfall{border-bottom:1px solid #efc785;border-left:3px solid #e5a53c;white-space:normal;min-width:135px;text-align:left}#resultTable .observation-heading{background:#fff1d7;color:#95601b;text-align:left}.observation-ok{color:#98a18f;text-align:left}#resultTable th{letter-spacing:0}#resultTable td,#resultTable th{padding-left:8px;padding-right:8px}#message:not(:empty):not(.success){background:#fff0d3;border:1px solid #edc67e;color:#865017;font-weight:600}\n`);
