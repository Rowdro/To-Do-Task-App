/* ================== PAGE SWITCHER (final patch) ================== */
function showPage(id){
  const pages = [
    'loginPage','registerPage','dashboardPage',
    'aboutPage','privacyPage','settingsPage','editProfilePage'
  ];
  pages.forEach(p=>{
    const el = document.getElementById(p);
    if(!el) return;

    /* old pages use .hidden */
    if(['loginPage','registerPage','dashboardPage','editProfilePage'].includes(p)){
      el.classList.toggle('hidden', p !== id);
    }
    /* new static pages use .show */
    else{
      el.classList.toggle('show', p === id);
    }
    el.setAttribute('aria-hidden', p !== id ? 'true' : 'false');
  });
}
showPage('loginPage');

/* ---------- auth navigation ---------- */
document.getElementById('goRegister').addEventListener('click', ()=> showPage('registerPage'));
document.getElementById('goLogin').addEventListener('click', ()=> showPage('loginPage'));

/* ---------- password toggles ---------- */
function togglePassword(inputId, toggleId){
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if(!input||!toggle) return;
  toggle.addEventListener('click', ()=> {
    if(input.type === 'password'){ input.type='text'; toggle.textContent='🙈'; }
    else{ input.type='password'; toggle.textContent='👁️‍🗨️'; }
  });
}
togglePassword('loginPass','toggleLoginPass');
togglePassword('registerPass','toggleRegisterPass');
togglePassword('registerConfirm','toggleRegisterConfirm');

/* ---------- register ---------- */
document.getElementById('registerBtn').addEventListener('click', ()=> {
  const fName = document.getElementById('registerFirstName').value.trim();
  const lName = document.getElementById('registerLastName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const pass = document.getElementById('registerPass').value.trim();
  const conf = document.getElementById('registerConfirm').value.trim();
  if(!fName||!lName||!email||!pass||!conf){ alert('Fill all fields'); return; }
  if(pass !== conf){ alert('Passwords do not match'); return; }
  localStorage.setItem('tasklyUser', JSON.stringify({fName,lName,email,pass}));
  alert('Registered — please sign in');
  showPage('loginPage');
});

/* ---------- login ---------- */
document.getElementById('loginBtn').addEventListener('click', ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const user = JSON.parse(localStorage.getItem('tasklyUser') || 'null');
  if(!user){ alert('No account found. Please register.'); return; }
  if(email === user.email && pass === user.pass){
    showPage('dashboardPage');
    loadTasks();
    loadProfilePreview();
    startReminderTimers();
  } else alert('Incorrect email or password');
});

/* ================== SIDEBAR ================== */
const hamburger = document.getElementById('hamburger');
const sidebar   = document.getElementById('sidebar');
let hambOpen = false;

hamburger.addEventListener('click', () => {
  hambOpen = true;
  sidebar.classList.add('show');
  hamburger.classList.toggle('open', true);
  hamburger.querySelector('.line').textContent = '✖';
});
document.getElementById('closeSidebarBtn').addEventListener('click', () => {
  hambOpen = false;
  sidebar.classList.remove('show');
  hamburger.classList.toggle('open', false);
  hamburger.querySelector('.line').textContent = '☰';
});
function closeSidebar(){
  hambOpen = false;
  sidebar.classList.remove('show');
  hamburger.classList.toggle('open', false);
  hamburger.querySelector('.line').textContent = '☰';
}

/* ---------- sidebar nav ---------- */
document.getElementById('navAbout').addEventListener('click', () => { closeSidebar(); showPage('aboutPage'); });
document.getElementById('navPrivacy').addEventListener('click', () => { closeSidebar(); showPage('privacyPage'); });
document.getElementById('navSettings').addEventListener('click', () => { closeSidebar(); showPage('settingsPage'); });
document.getElementById('navProfile').addEventListener('click', () => { closeSidebar(); showPage('editProfilePage'); });

/* ================== PROFILE PANEL ================== */
const profileIcon = document.getElementById('profileIcon');
const profilePanel = document.getElementById('profilePanel');
function loadProfilePreview(){
  const user = JSON.parse(localStorage.getItem('tasklyUser') || 'null');
  const img = localStorage.getItem('tasklyProfileImg') || '';
  if(user){
    document.getElementById('profileNameText').textContent = `${user.fName||''} ${user.lName||''}`;
    document.getElementById('profileEmailText').textContent = user.email||'';
  } else {
    document.getElementById('profileNameText').textContent = 'Guest';
    document.getElementById('profileEmailText').textContent = '';
  }
}
profileIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  notifyPanelClose();
  profilePanel.classList.toggle('show') ? loadProfilePreview() : profilePanel.classList.remove('show');
});
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  profilePanel.classList.remove('show');
  showPage('loginPage');
});
document.getElementById('openEditProfileFromPopup').addEventListener('click', ()=>{
  profilePanel.classList.remove('show');
  showPage('editProfilePage');
});

/* ================== FULL PAGE EDIT PROFILE ================== */
const editFirstFull  = document.getElementById('editFirstFull');
const editLastFull   = document.getElementById('editLastFull');
const editEmailFull  = document.getElementById('editEmailFull');
const editProfilePreviewFull = document.getElementById('editProfilePreviewFull');
const editImageInputFull     = document.getElementById('editImageInputFull');
const saveEditFull           = document.getElementById('saveEditFull');

/* pre-fill when page opens */
(function(){
  const user = JSON.parse(localStorage.getItem('tasklyUser') || '{}');
  editFirstFull.value = user.fName||'';
  editLastFull.value  = user.lName||'';
  editEmailFull.value = user.email||'';
  const img = localStorage.getItem('tasklyProfileImg');
  if(img) editProfilePreviewFull.src = img;
})();

/* save */
saveEditFull.addEventListener('click', ()=>{
  const fName = editFirstFull.value.trim();
  const lName = editLastFull.value.trim();
  const email = editEmailFull.value.trim();
  if(!fName||!lName||!email){ alert('Fill all fields'); return; }
  const prev = JSON.parse(localStorage.getItem('tasklyUser')||'{}');
  const updated = {fName,lName,email,pass:prev.pass};
  localStorage.setItem('tasklyUser', JSON.stringify(updated));
  localStorage.setItem('tasklyProfileImg', editProfilePreviewFull.src);
  alert('Profile updated!');
  showPage('dashboardPage');
});

/* image upload */
editImageInputFull.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=> editProfilePreviewFull.src = r.result;
  r.readAsDataURL(f);
});

/* ================== NOTIFICATIONS ================== */
const notifyIcon = document.getElementById('notifyIcon');
const notifyPanel = document.getElementById('notifyPanel');
function notifyPanelOpen(){
  const list = document.getElementById('notifyList');
  const rems = JSON.parse(localStorage.getItem('tasklyReminders')||'[]');
  list.innerHTML = rems.length ? rems.slice().reverse().map(r=>`
    <div class="pop-item">${r.title} — ${new Date(r.reminderAt).toLocaleString()}</div>
  `).join('') : '<div style="color:#666">No reminders</div>';
  notifyPanel.classList.add('show');
}
function notifyPanelClose(){ notifyPanel.classList.remove('show'); }
notifyIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  profilePanel.classList.remove('show');
  notifyPanel.classList.contains('show') ? notifyPanelClose() : notifyPanelOpen();
});
document.getElementById('clearNotifications').addEventListener('click', ()=>{
  document.getElementById('notifyList').innerHTML = '<div style="color:#666">Cleared</div>';
});

/* close panels on outside click */
document.addEventListener('click', (e)=>{
  if(!e.target.closest('#profilePanel')&&!e.target.closest('#profileIcon')) profilePanel.classList.remove('show');
  if(!e.target.closest('#notifyPanel')&&!e.target.closest('#notifyIcon')) notifyPanelClose();
});

/* ================== SEARCH ================== */
const searchIcon = document.getElementById('searchIcon');
const searchInput = document.getElementById('searchInput');
searchIcon.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(searchInput.classList.contains('show')){ searchInput.classList.remove('show'); searchInput.value=''; loadTasks(); }
  else { searchInput.classList.add('show'); searchInput.focus(); }
});
searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  renderTasksList(tasks.filter(t=>(t.title+' '+t.desc).toLowerCase().includes(q)));
});

/* ================== BACKDROP ================== */
const backdrop = document.getElementById('backdrop');
const frame = document.getElementById('frame');
function showBackdrop(){ backdrop.classList.add('show'); frame.classList.add('scaled'); }
function hideBackdrop(){ backdrop.classList.remove('show'); frame.classList.remove('scaled'); }
backdrop.addEventListener('click', ()=>{ hideAddCard(); hideBackdrop(); });

/* ================== TASK CRUD & REMINDERS (with Gmail swipe) ========== */
const tasksContainer = document.getElementById('tasksContainer');
const openAddTaskBtn = document.getElementById('openAddTask');
const addTaskCard = document.getElementById('addTaskCard');
const closeTaskCard = document.getElementById('closeTaskCard');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const taskReminderSelect = document.getElementById('taskReminder');
const taskReminderCustom = document.getElementById('taskReminderCustom');

let editingIndex = null;
let reminderTimers = [];

openAddTaskBtn.addEventListener('click', ()=> openAddCard());
closeTaskCard.addEventListener('click', hideAddCard);
cancelAddBtn.addEventListener('click', hideAddCard);

function openAddCard(editIndex=null, taskObj=null){
  editingIndex = editIndex;
  document.getElementById('addCardTitle').textContent = editIndex===null ? 'Add New Task' : 'Edit Task';
  if(taskObj){
    document.getElementById('taskTitle').value = taskObj.title;
    document.getElementById('taskDescription').value = taskObj.desc;
    document.getElementById('taskDate').value = taskObj.date;
    document.getElementById('taskTime').value = taskObj.time;
    document.getElementById('taskPriority').value = taskObj.priority||'';
    if(taskObj.reminder&&taskObj.reminder.offsetMin!=null){
      const off = taskObj.reminder.offsetMin;
      if([5,10,30].includes(off)){ taskReminderSelect.value=String(off); taskReminderCustom.style.display='none'; }
      else { taskReminderSelect.value='custom'; taskReminderCustom.style.display='inline-block'; taskReminderCustom.value=off; }
    } else { taskReminderSelect.value='none'; taskReminderCustom.style.display='none'; taskReminderCustom.value=''; }
  } else resetAddForm();
  addTaskCard.classList.add('show');
  addTaskCard.setAttribute('aria-hidden','false');
  showBackdrop();
  addTaskCard.scrollTop = 0;
}
function hideAddCard(){
  addTaskCard.classList.remove('show');
  addTaskCard.setAttribute('aria-hidden','true');
  resetAddForm();
  hideBackdrop();
}
function resetAddForm(){
  ['taskTitle','taskDescription','taskDate','taskTime'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('taskPriority').selectedIndex=0;
  taskReminderSelect.value='none';
  taskReminderCustom.style.display='none'; taskReminderCustom.value='';
  editingIndex=null;
}
taskReminderSelect.addEventListener('change', (e)=>{
  taskReminderCustom.style.display = e.target.value==='custom' ? 'inline-block' : 'none';
});

saveTaskBtn.addEventListener('click', ()=>{
  const title = document.getElementById('taskTitle').value.trim();
  const desc  = document.getElementById('taskDescription').value.trim();
  const date  = document.getElementById('taskDate').value;
  const time  = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  const remind = taskReminderSelect.value;
  const customMin = taskReminderCustom.value ? parseInt(taskReminderCustom.value,10) : null;
  if(!title||!desc||!date||!time||!priority){ alert('Fill all fields'); return; }

  let offsetMin = null;
  if(remind==='5') offsetMin=5;
  else if(remind==='10') offsetMin=10;
  else if(remind==='30') offsetMin=30;
  else if(remind==='custom' && customMin && !isNaN(customMin)) offsetMin=customMin;

  const taskDateTime = new Date(date+'T'+time);
  let reminderAt = null;
  if(offsetMin!==null) reminderAt = new Date(taskDateTime.getTime() - offsetMin*60*1000);

  const taskObj = {
    title,desc,date,time,priority,
    reminder: reminderAt ? {reminderAt:reminderAt.getTime(),reminderAtHuman:reminderAt.toLocaleString(),offsetMin} : null
  };
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  editingIndex===null ? tasks.push(taskObj) : tasks[editingIndex]=taskObj;
  localStorage.setItem('tasklyTasks', JSON.stringify(tasks));
  persistReminders();
  scheduleAllReminders();
  hideAddCard();
  renderTasksList(tasks);
});

/* reminders */
function persistReminders(){
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  const rems = [];
  tasks.forEach((t,idx)=>{
    if(t.reminder&&t.reminder.reminderAt) rems.push({index:idx,title:t.title,reminderAt:t.reminder.reminderAt});
  });
  localStorage.setItem('tasklyReminders', JSON.stringify(rems));
}
function clearAllTimers(){ reminderTimers.forEach(t=>clearTimeout(t.id)); reminderTimers=[]; }
function scheduleAllReminders(){
  clearAllTimers();
  const tasks = JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  tasks.forEach((t,idx)=>{
    if(t.reminder&&t.reminder.reminderAt){
      const ms = t.reminder.reminderAt - Date.now();
      if(ms>0){
        const id = setTimeout(()=>{
          alert('Reminder — '+t.title+' at '+new Date(t.reminder.reminderAt).toLocaleString());
          notifyPanelOpen();
          reminderTimers = reminderTimers.filter(x=>x.id!==id);
        },ms);
        reminderTimers.push({id,index:idx});
      }
    }
  });
}
function startReminderTimers(){ scheduleAllReminders(); }

/* ---------- NEW GMAIL-STYLE RENDER ---------- */
function renderTasksList(tasks){
  tasksContainer.innerHTML='';
  if(!tasks||!tasks.length){
    const empty=document.createElement('div');
    empty.style.color='#fff'; empty.style.opacity='0.95';
    empty.textContent='No tasks yet — add your first one!';
    tasksContainer.appendChild(empty); return;
  }
  tasks.forEach((t,idx)=>{
    const wrap=document.createElement('div'); wrap.className='swipe-wrap'; wrap.dataset.index=idx;

    /* red delete background */
    const delBg=document.createElement('div'); delBg.className='delete-bg'; delBg.innerHTML='<span>🗑</span>';

    const surface=document.createElement('div'); surface.className='task-surface';
    surface.innerHTML=`
      <div style="position:relative;">
        <div class="priority ${t.priority}">${t.priority}</div>
        <strong>${escapeHtml(t.title)}</strong>
        <p>${escapeHtml(t.desc)}</p>
        <small>${t.date} ${t.time}</small>
      </div>`;
    surface.addEventListener('click',()=>openAddCard(idx,t));

    attachSwipeHandlers(surface,delBg,idx);

    wrap.appendChild(delBg); wrap.appendChild(surface); tasksContainer.appendChild(wrap);
  });
}
function doDeleteTask(index){
  const tasks=JSON.parse(localStorage.getItem('tasklyTasks')||'[]');
  tasks.splice(index,1);
  localStorage.setItem('tasklyTasks',JSON.stringify(tasks));
  persistReminders(); scheduleAllReminders(); loadTasks();
}

/* ---------- GMAIL-STYLE SWIPE HANDLER ---------- */
function attachSwipeHandlers(surface, delBg, index) {
  let startX = 0, currentX = 0, touching = false;
  const threshold = 80; // px to trigger delete

  function unify(e) { return e.changedTouches ? e.changedTouches[0] : e; }

  function onStart(e) {
    const ev = unify(e);
    startX = ev.clientX;
    currentX = 0;
    touching = true;
    surface.style.transition = 'none';
    if (e.type === 'mousedown') document.addEventListener('mousemove', onMove);
  }

  function onMove(e) {
    if (!touching) return;
    const ev = unify(e);
    currentX = ev.clientX - startX;

    if (currentX < 0) {
      const tx = Math.max(currentX, -120);
      surface.style.transform = `translateX(${tx}px)`;
      const ratio = Math.min(Math.abs(tx) / threshold, 1);
      delBg.style.opacity = ratio;
      delBg.querySelector('span').style.transform = `scale(${0.8 + 0.2 * ratio})`;
    }
  }

  function onEnd(e) {
    touching = false;
    surface.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    if (Math.abs(currentX) > threshold) {
      surface.style.transform = 'translateX(-100%)';
      setTimeout(() => doDeleteTask(index), 300);
    } else {
      surface.style.transform = '';
      delBg.style.opacity = 0;
      delBg.querySelector('span').style.transform = 'scale(0.8)';
    }

    if (e.type === 'mouseup') document.removeEventListener('mousemove', onMove);
  }

  surface.addEventListener('touchstart', onStart, { passive: true });
  surface.addEventListener('touchmove', onMove, { passive: true });
  surface.addEventListener('touchend', onEnd, { passive: true });
  surface.addEventListener('mousedown', onStart);
  surface.addEventListener('mouseup', onEnd);
  surface.addEventListener('mouseleave', () => { if (touching) onEnd({ type: 'mouseup' }); });

  /* tap the red background to delete too */
  delBg.addEventListener('click', () => {
    surface.style.transform = 'translateX(-100%)';
    setTimeout(() => doDeleteTask(index), 300);
  });
}

/* ---------- UTIL ---------- */
function escapeHtml(str){
  if(!str)return''; return String(str).replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

/* ---------- init ---------- */
function loadTasks(){ renderTasksList(JSON.parse(localStorage.getItem('tasklyTasks')||'[]')); persistReminders();}
window.loadTasks=loadTasks;
loadProfilePreview();
startReminderTimers();

/* ---------- keyboard ESC ---------- */
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ hideAddCard(); hideBackdrop(); } });

/* ---------- remember me ---------- */
const rememberCk=document.getElementById('rememberMe');
const emailInput=document.getElementById('loginEmail');
window.addEventListener('DOMContentLoaded',()=>{
  const saved=localStorage.getItem('rememberedEmail');
  if(saved){ emailInput.value=saved; rememberCk.checked=true; }
});
document.getElementById('loginBtn').addEventListener('click',()=>{
  if(rememberCk.checked)localStorage.setItem('rememberedEmail',emailInput.value.trim());
  else localStorage.removeItem('rememberedEmail');
});

/* ---------- universal back-button handler ---------- */
document.addEventListener('click',e=>{
  if(!e.target.matches('.back-btn'))return;
  e.stopPropagation();
  showPage('dashboardPage');
});

/* ---- profile photo picker ---- */
document.querySelector('.edit-photo').addEventListener('click', e => {
  if (e.target.matches('::after') || e.offsetY > 130)
    document.getElementById('editImageInputFull').click();
});