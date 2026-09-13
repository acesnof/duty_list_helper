const DEN=[10000,5000,2000,1000,500],$=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('pt-PT').format(n),KEY='nota.session.v1';
let nextId=2,result=null,busy=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
$('notes').innerHTML=DEN.map(v=>`<label class="note-row"><img src="${NOTE_IMAGES[v]}" alt="Nota de ${fmt(v)}"><span class="note-value">${fmt(v)}<small>VALOR DA NOTA</small></span><input aria-label="Quantidade de notas de ${v}" type="number" min="0" max="100000" step="1" value="0" data-note="${v}"></label>`).join('');
function addRow(name,value=''){
  const row=document.createElement('div');row.className='dist-row';
  row.innerHTML=`<input class="name" aria-label="Nome da distribuição" maxlength="80"><input class="amount" aria-label="Valor da distribuição" type="number" min="1" max="1000000000" step="1" placeholder="0"><button class="duplicate" aria-label="Duplicar distribuição" title="Duplicar distribuição"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button><button class="remove" aria-label="Apagar distribuição" title="Apagar distribuição"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg></button>`;
  row.querySelector('.name').value=name;row.querySelector('.amount').value=value;
  row.querySelector('.remove').onclick=()=>{if(document.querySelectorAll('.dist-row').length===1){row.querySelector('.amount').value='';}else row.remove();changed();};
  row.querySelector('.duplicate').onclick=()=>{
    if(document.querySelectorAll('.dist-row').length>=100)return;
    const copy=addRow((row.querySelector('.name').value.slice(0,72)+' (cópia)').trim(),row.querySelector('.amount').value);
    row.after(copy);changed();copy.querySelector('.name').focus();copy.scrollIntoView({block:'nearest'});
  };
  $('distributions').append(row);
  return row;
}
function readState(){return {version:1,nextId,stock:[...document.querySelectorAll('[data-note]')].map(x=>Number(x.value)),distributions:[...document.querySelectorAll('.dist-row')].map((row,i)=>({name:row.querySelector('.name').value.trim()||`Distribuição ${i+1}`,amount:Number(row.querySelector('.amount').value)}))};}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(readState()));}catch{}}
function totals(){const s=readState(),available=s.stock.reduce((sum,n,i)=>sum+(Number.isFinite(n)?n:0)*DEN[i],0),requested=s.distributions.reduce((sum,r)=>sum+(Number.isFinite(r.amount)?r.amount:0),0),count=s.stock.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);$('available').textContent=fmt(available);$('requested').textContent=fmt(requested);$('balance').textContent=fmt(result?result.remaining.reduce((sum,n,j)=>sum+n*DEN[j],0):Math.max(0,available-requested));$('balance').classList.remove('negative');$('balanceHint').textContent=result?'Saldo após o cálculo':requested>available?'Stock inferior ao valor pedido':'Estimativa antes do cálculo';$('stockCount').textContent=fmt(count)+' notas em caixa';$('inventoryTotal').textContent=fmt(count)+' notas';$('distCount').textContent=s.distributions.length+(s.distributions.length===1?' distribuição':' distribuições');$('rowCount').textContent=String(s.distributions.length).padStart(2,'0');$('add').disabled=s.distributions.length>=100;document.querySelectorAll('.duplicate').forEach(button=>button.disabled=s.distributions.length>=100);}
function message(text,success=false){$('message').textContent=text;$('message').className=success?'success':'';}
function changed(){result=null;$('resultBody').hidden=true;$('empty').hidden=false;$('resultStatus').textContent='Por calcular';$('resultStatus').classList.remove('shortfall');$('excel').disabled=$('pdf').disabled=true;$('exportHint').textContent='Calcule para exportar o plano';message('');totals();persist();}
document.querySelector('.inputs').addEventListener('input',changed);
$('add').onclick=()=>{if(document.querySelectorAll('.dist-row').length>=100)return;addRow(`Distribuição ${nextId++}`);changed();$('distributions').lastElementChild.querySelector('.amount').focus();};
function validate(s){
  document.querySelectorAll('input[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
  let error='';
  [...document.querySelectorAll('[data-note]')].forEach((el,i)=>{if(!Number.isSafeInteger(s.stock[i])||s.stock[i]<0||s.stock[i]>100000||el.validity.badInput){el.setAttribute('aria-invalid','true');error='As quantidades devem ser números inteiros entre 0 e 100 000.';}});
  [...document.querySelectorAll('.amount')].forEach((el,i)=>{const n=s.distributions[i].amount;if(!Number.isSafeInteger(n)||n<=0||n>1000000000||el.validity.badInput){el.setAttribute('aria-invalid','true');error='Cada distribuição deve ter um valor inteiro positivo, até 1 000 000 000.';}});
  if(error)document.querySelector('[aria-invalid=true]').focus();return error;
}
function displayResult(s,solved){
  result={...s,...solved};const used=DEN.map((_,j)=>solved.rows.reduce((sum,r)=>sum+r[j],0)),requested=s.distributions.reduce((sum,r)=>sum+r.amount,0),paid=solved.paid.reduce((a,b)=>a+b,0),partial=solved.totalMissing>0;
  const observation=n=>n?'Falta entregar '+fmt(n):'—';
  $('resultTable').innerHTML='<thead><tr><th>Distribuição</th><th>Valor pedido</th><th>Valor entregue</th>'+DEN.map(d=>'<th>'+fmt(d)+'</th>').join('')+(partial?'<th class="observation-heading">Observações</th>':'')+'</tr></thead><tbody>'+s.distributions.map((d,i)=>'<tr><td>'+esc(d.name)+'</td><td>'+fmt(d.amount)+'</td><td>'+fmt(solved.paid[i])+'</td>'+solved.rows[i].map(n=>'<td>'+(n?fmt(n):'—')+'</td>').join('')+(partial?'<td class="'+(solved.missing[i]?'shortfall':'observation-ok')+'">'+observation(solved.missing[i])+'</td>':'')+'</tr>').join('')+'</tbody><tfoot><tr><td>Total</td><td>'+fmt(requested)+'</td><td>'+fmt(paid)+'</td>'+used.map(n=>'<td>'+fmt(n)+'</td>').join('')+(partial?'<td class="shortfall">'+observation(solved.totalMissing)+'</td>':'')+'</tr></tfoot>';
  $('remainingValue').textContent=fmt(solved.remaining.reduce((sum,n,i)=>sum+n*DEN[i],0))+' · '+fmt(solved.remaining.reduce((sum,n)=>sum+n,0))+' notas';
  $('remainingNotes').innerHTML=solved.remaining.map((n,i)=>'<div><small>Notas de '+fmt(DEN[i])+'</small><b>'+fmt(n)+' <small style="display:inline">notas</small></b><span class="remaining-subtotal">Total: '+fmt(n*DEN[i])+'</span></div>').join('');
  $('empty').hidden=true;$('resultBody').hidden=false;$('resultStatus').textContent=partial?'⚠ Valor em falta':'✓ Calculado';$('resultStatus').classList.toggle('shortfall',partial);$('excel').disabled=$('pdf').disabled=false;$('exportHint').textContent='Entregue: '+fmt(paid)+(partial?' · Em falta: '+fmt(solved.totalMissing):'');
  message(partial?'Atenção: falta entregar '+fmt(solved.totalMissing)+' no total. Foram distribuídos '+fmt(paid)+' de '+fmt(requested)+', sem ultrapassar os valores pedidos.':'Distribuição concluída. Todos os valores pedidos foram entregues.',!partial);
  if(solved.searchLimited)message($('message').textContent+' A procura conjunta atingiu o limite; foi aplicado o cálculo por ordem da lista.');
}
$('calculate').onclick=async()=>{
  if(busy)return;const s=readState(),error=validate(s);if(error){message(error);return;}busy=true;$('calculate').disabled=true;$('calculate').textContent='A calcular…';
  // Yield a paint before bounded integer search. Inputs are briefly disabled.
  const controls=[...document.querySelectorAll('.inputs input,.inputs button,#reset,#restore')],previous=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);
  await new Promise(resolve=>setTimeout(resolve,30));
  try{const solved=solveDistribution(s.stock,s.distributions.map(d=>d.amount));if(solved.error){message({funds:'Stock insuficiente. Adicione notas ou reduza o valor das distribuições.',impossible:'Não existe uma combinação exata com estas notas para todos os destinos. Ajuste o stock ou os valores.',limit:'A procura atingiu o limite de cálculo. Não foi possível confirmar uma solução. Tente menos distribuições ou valores menores.',invalid:'Verifique as quantidades e os valores introduzidos.'}[solved.error]);}else displayResult(s,solved);}catch(err){message('Não foi possível calcular. Verifique os dados e tente novamente.');console.error(err);}finally{controls.forEach((el,i)=>el.disabled=previous[i]);busy=false;$('calculate').disabled=false;$('calculate').innerHTML='Calcular distribuição <span>→</span>';totals();}
};
function loadState(s){if(!s||s.version!==1||!Array.isArray(s.stock)||s.stock.length!==5||s.stock.some(n=>!Number.isSafeInteger(n)||n<0||n>100000)||!Array.isArray(s.distributions)||s.distributions.length<1||s.distributions.length>100||s.distributions.some(d=>!d||typeof d.name!=='string'||d.name.length>80||!Number.isSafeInteger(d.amount)||d.amount<0||d.amount>1000000000))throw Error('invalid');document.querySelectorAll('[data-note]').forEach((el,i)=>el.value=s.stock[i]);$('distributions').innerHTML='';s.distributions.forEach(d=>addRow(d.name,d.amount||''));nextId=Math.max(s.distributions.length+1,Number.isSafeInteger(s.nextId)?s.nextId:1);changed();}
function hasData(){const s=readState();return s.stock.some(Boolean)||s.distributions.some(d=>d.amount)||s.distributions.length>1;}
$('reset').onclick=()=>{if(hasData()&&!confirm('Limpar todas as quantidades e distribuições?'))return;loadState({version:1,nextId:2,stock:[0,0,0,0,0],distributions:[{name:'Distribuição 1',amount:0}]});};
function download(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('backup').onclick=()=>download(JSON.stringify(readState(),null,2),'nota-sessao.json','application/json');
$('restore').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('large');const data=JSON.parse(await file.text());if(hasData()&&!confirm('Substituir os dados atuais pela sessão guardada?'))return;loadState(data);}catch{message('Não foi possível abrir a sessão. Selecione um ficheiro JSON guardado por esta aplicação.');}finally{e.target.value='';}};
function exportRows(r){
  const used=DEN.map((_,j)=>r.rows.reduce((sum,row)=>sum+row[j],0)),sum=a=>a.reduce((x,y)=>x+y,0),partial=r.totalMissing>0,obs=n=>n?'Falta entregar '+fmt(n):'';
  return [['Distribuição','Valor pedido','Valor entregue',...DEN.map(String),...(partial?['Observações']:[])],...r.distributions.map((d,i)=>[d.name,d.amount,r.paid[i],...r.rows[i],...(partial?[obs(r.missing[i])]:[])]),['Total',sum(r.distributions.map(d=>d.amount)),sum(r.paid),...used,...(partial?[obs(r.totalMissing)]:[])],['Stock inicial','',sum(r.stock.map((n,i)=>n*DEN[i])),...r.stock,...(partial?['']:[])],['Saldo em caixa','',sum(r.remaining.map((n,i)=>n*DEN[i])),...r.remaining,...(partial?['']:[])]];
}
async function exportExcel(){
  if(!result)return;const rows=exportRows(result),zip=new JSZip();
  const cell=(v,r,c)=>{const ref=String.fromCharCode(65+c)+(r+1),style=c===8&&r>0&&v?4:r===0?1:(r>=rows.length-3?3:2);return typeof v==='number'?`<c r="${ref}" s="${style}"><v>${v}</v></c>`:`<c r="${ref}" s="${c===8&&r>0&&v?4:r===0?1:r>=rows.length-3?3:0}" t="inlineStr"><is><t xml:space="preserve">${esc(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')}</t></is></c>`;};
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
  zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Distribuição" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  zip.file('xl/styles.xml','<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FF8A420D"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF174F40"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE4B5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment wrapText="1" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
  zip.file('xl/worksheets/sheet1.xml',`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="40" customWidth="1"/><col min="2" max="8" width="18" customWidth="1"/><col min="9" max="9" width="30" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}" ht="${i&&i<rows.length-3?34:26}" customHeight="1">${row.map((v,j)=>cell(v,i,j)).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${String.fromCharCode(64+rows[0].length)}${rows.length-3}"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>`);
  download(await zip.generateAsync({type:'blob'}),'distribuicao-notas.xlsx');
}
async function exportPdf(){
  if(!result)return;const {PDFDocument,StandardFonts,rgb}=PDFLib,doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),green=rgb(.09,.31,.25),ink=rgb(.15,.23,.19),light=rgb(.94,.96,.92),gray=rgb(.47,.53,.45),rows=exportRows(result);
  // Standard PDF fonts cover Portuguese. Unsupported glyphs are visibly substituted.
  const safe=s=>Array.from(String(s)).map(c=>{try{font.encodeText(c);return c;}catch{return '?';}}).join('');
  const widths=rows[0].length===9?[180,90,90,52,52,52,52,52,150]:[220,115,115,64,64,64,64,64],left=36,tableWidth=widths.reduce((a,b)=>a+b,0);let page,y,number=0;
  function drawText(text,x,yy,size=9,strong=false,color=ink){page.drawText(safe(text),{x,y:yy,size,font:strong?bold:font,color});}
  function wrap(text,width){let lines=[''];for(const char of safe(text)){const last=lines.length-1;if(font.widthOfTextAtSize(lines[last]+char,9)>width)lines.push(char);else lines[last]+=char;}return lines;}
  function drawRow(row,header=false,summary=false){
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
  function newPage(){page=doc.addPage([842,595]);number++;drawText('nota. / Plano de distribuição',left,551,19,true,green);drawText('Valores e quantidades de notas • '+new Date().toLocaleDateString('pt-PT'),left,530,9,false,gray);drawText('Página '+number,748,28,8,false,gray);drawText('Gerado localmente • Valores entregues sem ultrapassar os pedidos',left,28,8,false,gray);y=506;drawRow(rows[0],true);}
  newPage();for(let i=1;i<rows.length;i++)drawRow(rows[i],false,i>=rows.length-3);
  download(await doc.save(),'distribuicao-notas.pdf','application/pdf');
}
async function runExport(fn,button){button.disabled=true;try{await fn();}catch(error){console.error(error);message('Não foi possível exportar. Tente novamente.');}finally{button.disabled=!result;}}
$('excel').onclick=()=>runExport(exportExcel,$('excel'));$('pdf').onclick=()=>runExport(exportPdf,$('pdf'));
try{const saved=localStorage.getItem(KEY);if(saved)loadState(JSON.parse(saved));else{addRow('Distribuição 1');totals();}}catch{addRow('Distribuição 1');totals();}
