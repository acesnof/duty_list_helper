const {chromium}=require('C:/Users/fonse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('file:///C:/Users/fonse/Desktop/money/_count/Distribuidor%20de%20Notas.html');
assert.equal(await page.locator('.intro,#example').count(),0);
await page.locator('.name').fill('Equipa Alfa');await page.locator('.amount').fill('18500');await page.locator('[data-note]').evaluateAll(els=>els.forEach(el=>{el.value=20;el.dispatchEvent(new Event('input',{bubbles:true}));}));
await page.locator('.duplicate').click();assert.equal(await page.locator('.dist-row').count(),2);assert.equal(await page.locator('.amount').nth(1).inputValue(),'18500');assert.equal(await page.locator('.name').nth(1).inputValue(),'Equipa Alfa (cópia)');
await page.locator('.remove').nth(1).click();assert.equal(await page.locator('.dist-row').count(),1);
for(let i=0;i<5;i++)await page.locator('.duplicate').last().click();
await page.locator('#calculate').click();await page.waitForSelector('#resultBody:not([hidden])');
assert.equal(await page.locator('#resultTable tbody tr').count(),6);assert.equal(await page.locator('.remaining-subtotal').first().innerText().then(t=>t.replace(/\s/g,' ')),'Total: 140 000');assert.match(await page.locator('#remainingValue').innerText(),/70 notas/);
await page.screenshot({path:'tmp/money-updated.png',fullPage:true});
assert.deepEqual(errors,[]);console.log('Verified: intro removed; duplicate, delete, six distributions, cash subtotals, no browser errors.');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});

