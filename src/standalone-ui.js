(() => {
  'use strict';
  window.flagSrc=code=>window.DLH_FLAGS[String(code||'').toUpperCase()]||'';
  window.openManual=()=>{const blob=new Blob([window.DLH_MANUAL_HTML],{type:'text/html'}),url=URL.createObjectURL(blob),tab=window.open(url,'_blank');if(!tab)alert('Allow pop-ups to open the user manual.');setTimeout(()=>URL.revokeObjectURL(url),60000)};
  window.toggleAdminLock=()=>{const unlocked=sessionStorage.getItem('dlh.admin.unlocked')==='1';if(unlocked){sessionStorage.removeItem('dlh.admin.unlocked');updateLock();toast('Editing locked');return}const code=prompt('Administration unlock code');if(code==='1234'){sessionStorage.setItem('dlh.admin.unlocked','1');updateLock();toast('Editing unlocked')}else if(code!==null)toast('Incorrect administration code')};
  window.updateLock=()=>{const button=document.querySelector('#admin-lock');if(!button)return;const unlocked=sessionStorage.getItem('dlh.admin.unlocked')==='1';button.classList.toggle('unlocked',unlocked);button.innerHTML=`${unlocked?'●':'○'} ${unlocked?'Editing unlocked':'Protected'}`};
  window.exportDatabase=()=>{const blob=new Blob([JSON.stringify(window.DLH_DB.export(),null,2)],{type:'application/json'}),a=document.createElement('a'),now=new Date();a.href=URL.createObjectURL(blob);a.download=`DLH_BACKUP_${now.toISOString().replace(/[-:]/g,'').slice(0,15)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  window.importDatabase=()=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const value=JSON.parse(await input.files[0].text());if(!value.people||!value.settings)throw Error('Invalid Duty List Helper backup.');window.DLH_DB.import(value);await load();toast('Database restored')}catch(error){toast(error.message)}};input.click()};
  window.resetDatabase=async()=>{if(!confirm('Restore the original supplied database? Current browser data will be replaced.'))return;window.DLH_DB.reset();await load();toast('Original database restored')};
  document.addEventListener('DOMContentLoaded',updateLock);
})();
