const fs=require('node:fs');
const dir='C:/Users/fonse/Desktop/money/_count/';
let html=fs.readFileSync(dir+'index.html','utf8');
html=html.replace(/<main><div class="intro">[\s\S]*?<\/button><\/div>/,'<main>');
let app=fs.readFileSync(dir+'app.js','utf8');
app=app.replace('<button class="remove" aria-label="Remover distribuição" title="Remover distribuição">×</button>','<button class="duplicate" aria-label="Duplicar distribuição" title="Duplicar distribuição"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button><button class="remove" aria-label="Apagar distribuição" title="Apagar distribuição"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg></button>');
app=app.replace("row.querySelector('button').onclick", "row.querySelector('.remove').onclick");
app=app.replace("  $('distributions').append(row);",`  row.querySelector('.duplicate').onclick=()=>{
    if(document.querySelectorAll('.dist-row').length>=100)return;
    const copy=addRow((row.querySelector('.name').value.slice(0,72)+' (cópia)').trim(),row.querySelector('.amount').value);
    row.after(copy);changed();copy.querySelector('.name').focus();copy.scrollIntoView({block:'nearest'});
  };
  $('distributions').append(row);
  return row;`);
app=app.replace("$('add').disabled=s.distributions.length>=100;", "$('add').disabled=s.distributions.length>=100;document.querySelectorAll('.duplicate').forEach(button=>button.disabled=s.distributions.length>=100);");
app=app.replace(/\$\('example'\)\.onclick=[^\r\n]+[\r\n]+/,'');
app=app.replace(',#example,#reset',',#reset');
app=app.replace("$('remainingValue').textContent=fmt(solved.remaining.reduce((sum,n,i)=>sum+n*DEN[i],0));", "$('remainingValue').textContent=fmt(solved.remaining.reduce((sum,n,i)=>sum+n*DEN[i],0))+' · '+fmt(solved.remaining.reduce((sum,n)=>sum+n,0))+' notas';");
app=app.replace('<small>${fmt(DEN[i])}</small><b>${fmt(n)} <small style="display:inline">notas</small></b>', '<small>Notas de ${fmt(DEN[i])}</small><b>${fmt(n)} <small style="display:inline">notas</small></b><span class="remaining-subtotal">Total: ${fmt(n*DEN[i])}</span>');
let css=fs.readFileSync(dir+'style.css','utf8');
css+=`\n/* Distribution actions and cash subtotals */
.dist-row{grid-template-columns:minmax(0,1fr) 90px 27px 27px;gap:5px}
.dist-row .duplicate,.dist-row .remove{display:grid;place-items:center;padding:0;border:1px solid var(--line);background:#fafbf8;border-radius:6px;width:27px;height:35px;color:#78916b}
.dist-row .remove{color:#a47d70}.dist-row button:hover{background:#edf3e5}.dist-row svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.dist-labels{display:grid;grid-template-columns:minmax(0,1fr) 90px 59px;gap:5px;padding-right:0}
#distributions{overflow:auto;max-height:360px;scrollbar-width:thin;scrollbar-color:#c9d4c0 transparent}
.remaining-subtotal{display:block;margin-top:7px;font-size:10px;color:#71836b}
#remainingValue{font-size:12px}.distributions-panel .section-head,.calculate-area,.distributions-panel .add,.dist-labels{flex-shrink:0}
@media(min-width:1100px) and (min-height:850px){.distributions-panel #distributions{max-height:none}}
@media(max-width:760px){#remainingNotes{grid-template-columns:repeat(3,1fr)}.remainder .section-head{gap:10px;flex-wrap:wrap}}
`;
fs.writeFileSync(dir+'index.html',html);fs.writeFileSync(dir+'app.js',app);fs.writeFileSync(dir+'style.css',css);
