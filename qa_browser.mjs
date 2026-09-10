import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const require=createRequire(import.meta.url);
const { chromium }=require('C:/Users/fonse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1600,height:920}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.goto(pathToFileURL(path.resolve('application/Duty List Helper.html')).href,{waitUntil:'load'});
await page.waitForSelector('.dashboard-command',{timeout:30000});
await page.screenshot({path:'tmp/dashboard.png',fullPage:true});
const result=await page.evaluate(async()=>{
  sessionStorage.setItem('dlh.admin.unlocked','1');updateLock();
  const settingsResponse=await fetch('/api/settings',{method:'PUT',body:JSON.stringify({duty_list_mode:'all_days'})});
  await load();setPage('duty-list');
  const weekly=await DLH_EXPORTS.week({week_start:'2026-09-07',document_number:'NUMBER'},state);
  const calendar=await DLH_EXPORTS.calendar('2026-09-01',state);
  return {settingsStatus:settingsResponse.status,people:state.people.length,assignments:state.duty_assignments.length,weeklyName:weekly.name,weeklyBytes:weekly.bytes.length,pdfName:calendar.name,pdfBytes:calendar.bytes.length,logo:document.querySelector('.brand img').naturalWidth,calendarCells:document.querySelectorAll('.duty-table tbody .duty-day').length};
});
await page.screenshot({path:'tmp/duty-list.png',fullPage:true});
console.log(JSON.stringify({errors,result},null,2));
await browser.close();
