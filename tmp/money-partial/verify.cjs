const assert=require('node:assert/strict'),{solveDistribution,nearestBelow}=require('./solver.js');
const den=[10000,5000,2000,1000,500];
function brute(stock,target){let best=0;function f(j,value){if(j===5){best=Math.max(best,value);return;}for(let n=0;n<=stock[j]&&value+n*den[j]<=target;n++)f(j+1,value+n*den[j]);}f(0,0);return best;}
let seed=557;const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
for(let i=0;i<1500;i++){const stock=den.map(()=>rand(5)),target=rand(180000)+1,row=nearestBelow(stock,target),paid=row.reduce((s,n,j)=>s+n*den[j],0);assert.equal(paid,brute(stock,target));}
for(let i=0;i<250;i++){const stock=den.map(()=>rand(6)),amounts=Array.from({length:1+rand(5)},()=>1+rand(120000)),r=solveDistribution(stock,amounts);assert.ok(!r.error);r.rows.forEach((row,k)=>{assert.equal(row.reduce((s,n,j)=>s+n*den[j],0),r.paid[k]);assert.ok(r.paid[k]<=amounts[k]);assert.equal(r.missing[k],amounts[k]-r.paid[k]);});den.forEach((_,j)=>assert.equal(r.remaining[j]+r.rows.reduce((s,row)=>s+row[j],0),stock[j]));}
assert.deepEqual(solveDistribution([30,0,0,0,0],[205000]).paid,[200000]);assert.deepEqual(solveDistribution([30,0,0,0,0],[205000]).missing,[5000]);
assert.deepEqual(solveDistribution([0,0,0,0,0],[205000]).missing,[205000]);
assert.deepEqual(solveDistribution([0,1,3,0,0],[6000]).paid,[6000]);
assert.deepEqual(solveDistribution([1,0,0,0,0],[10000,10000]).paid,[10000,0]);
assert.deepEqual(solveDistribution([20,20,20,20,20],[18500,18500]).missing,[0,0]);
console.log('1755 solver checks passed.');
const {chromium}=require('C:/Users/fonse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}),page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(require('node:url').pathToFileURL(require('node:path').join(__dirname,'Distribuidor de Notas.html')).href);
await page.evaluate(()=>loadState({version:1,stock:[30,0,0,0,0],distributions:[{name:'Equipa Alfa',amount:205000},{name:'Equipa Bravo',amount:100000}]}));await page.locator('#calculate').click();await page.waitForSelector('#resultBody:not([hidden])');
const headers=await page.locator('#resultTable th').allTextContents();assert.ok(!headers.includes('Notas'));assert.ok(headers.includes('Observações'));assert.equal(await page.locator('#resultTable tbody .shortfall').count(),1);assert.match(await page.locator('#resultTable tbody .shortfall').innerText(),/5\s?000/);
assert.equal(await page.locator('#balance').innerText(),'0');
await page.screenshot({path:require('node:path').join(__dirname,'preview.png'),fullPage:true});
for(const id of ['excel','pdf']){const pending=page.waitForEvent('download');await page.locator('#'+id).click();const file=await pending;await file.saveAs(require('node:path').join(__dirname,'test.'+(id==='excel'?'xlsx':'pdf')));}
await page.evaluate(()=>loadState({version:1,stock:[10,10,10,10,10],distributions:[{name:'Exato',amount:18500}]}));await page.locator('#calculate').click();await page.waitForSelector('#resultBody:not([hidden])');assert.ok(!(await page.locator('#resultTable th').allTextContents()).includes('Observações'));
assert.equal((await page.evaluate(()=>exportRows(result)))[0].length,8);
await page.evaluate(()=>loadState({version:1,stock:[0,0,0,0,0],distributions:[{name:'Vazio',amount:750}]}));await page.locator('#calculate').click();await page.waitForSelector('#resultBody:not([hidden])');assert.match(await page.locator('#resultTable tbody .shortfall').innerText(),/750/);
assert.deepEqual(errors,[]);console.log('Browser: exact, partial, empty stock, arbitrary amounts, exports and conditional columns verified.');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});

