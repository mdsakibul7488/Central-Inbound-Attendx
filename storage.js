// =============================================
// CONFIGURATION
// =============================================
const CONFIG = {
  SHEET_URL: 'https://script.google.com/macros/s/AKfycbz6PVi3DmTHqgzB0HQqr9Q32SXr78XC-ZtMpmFbwPWHautapjGkS74AzuGyKT1WHcxa/exec',
  ADMIN_ID: 'ADMIN001',
  ADMIN_PLAIN: 'Admin@1234',
};

async function verifyAdminPassword(input) {
  const stored = localStorage.getItem('admin_pass');
  if (stored) return input === stored;
  return input === CONFIG.ADMIN_PLAIN;
}

function setAdminPassword(newPass) {
  localStorage.setItem('admin_pass', newPass);
}

// =============================================
// REFRESH PROTECTION (logout after 5 refreshes)
// =============================================
function initRefreshProtection() {
  const count = parseInt(sessionStorage.getItem('refresh_count') || '0') + 1;
  sessionStorage.setItem('refresh_count', count);
  if (count > 5) {
    clearCurrentUser();
    sessionStorage.setItem('refresh_count', '0');
  }
}

// =============================================
// KEYS
// =============================================
const KEYS = {
  USERS: 'attendx_users',
  ATTENDANCE: 'attendx_attendance',
  CURRENT_USER: 'attendx_current',
  SAVED_ACCOUNTS: 'attendx_saved_accounts',
  OFFICE_LOCATION: 'attendx_office_location',
  OFFICE_RADIUS: 'attendx_office_radius',
  DAYOFFS: 'attendx_dayoffs',
};

// =============================================
// USER STORAGE
// =============================================
function getUsers() { return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); }
function saveUsers(u) { localStorage.setItem(KEYS.USERS, JSON.stringify(u)); }
function getUserByEID(eid) { return getUsers().find(u => u.eid === eid) || null; }
function addUser(user) { const u = getUsers(); u.push(user); saveUsers(u); }
function updateUser(eid, updates) {
  const u = getUsers();
  const i = u.findIndex(x => x.eid === eid);
  if (i !== -1) { u[i] = { ...u[i], ...updates }; saveUsers(u); }
}

// =============================================
// PENDING
// =============================================
function getPendingUsers() { return JSON.parse(localStorage.getItem('attendx_pending') || '[]'); }
function savePendingUsers(l) { localStorage.setItem('attendx_pending', JSON.stringify(l)); }
function addPendingUser(user) {
  const l = getPendingUsers();
  l.push({ ...user, requestedAt: new Date().toISOString() });
  savePendingUsers(l);
}
function approveUser(eid) {
  const l = getPendingUsers();
  const user = l.find(u => u.eid === eid);
  if (!user) return;
  addUser({ ...user, status: 'active' });
  savePendingUsers(l.filter(u => u.eid !== eid));
  if (CONFIG.SHEET_URL) syncUserToSheet(user);
}
function rejectUser(eid) { savePendingUsers(getPendingUsers().filter(u => u.eid !== eid)); }
function blockUser(eid) { updateUser(eid, { status: 'blocked' }); }
function unblockUser(eid) { updateUser(eid, { status: 'active' }); }

// =============================================
// ATTENDANCE
// =============================================
function getAttendance() { return JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]'); }
function saveAttendance(r) { localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(r)); }

function getTodayRecord(eid) {
  const today = getDateStr();
  return getAttendance().find(r => r.eid === eid && r.date === today) || null;
}

function getLast3Days(eid) {
  const all = getAttendance().filter(r => r.eid === eid);
  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(getDateStr(d));
  }
  return dates.map(date => ({ date, record: all.find(r => r.date === date) || null }));
}

async function addAttendanceRecord(record) {
  const records = getAttendance();
  const idx = records.findIndex(r => r.eid === record.eid && r.date === record.date);
  if (idx !== -1) { records[idx] = { ...records[idx], ...record }; }
  else { records.push(record); }
  saveAttendance(records);
  if (CONFIG.SHEET_URL) await syncToSheetWithRetry(record);
}

// =============================================
// CHECK IN/OUT RESET (6AM daily)
// =============================================
function shouldResetToday() {
  const lastReset = localStorage.getItem('last_reset');
  const today = getDateStr();
  const hour = new Date().getHours();
  if (hour >= 6 && lastReset !== today) {
    localStorage.setItem('last_reset', today);
    return true;
  }
  return false;
}

// =============================================
// MULTI-ACCOUNT
// =============================================
function getSavedAccounts() { return JSON.parse(localStorage.getItem(KEYS.SAVED_ACCOUNTS) || '[]'); }
function addSavedAccount(eid, name) {
  const a = getSavedAccounts();
  if (!a.find(x => x.eid === eid)) { a.push({ eid, name }); localStorage.setItem(KEYS.SAVED_ACCOUNTS, JSON.stringify(a)); }
}
function getCurrentUser() { return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || 'null'); }
function setCurrentUser(user) { localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user)); }
function clearCurrentUser() { localStorage.removeItem(KEYS.CURRENT_USER); }

// =============================================
// OFFICE LOCATION + RADIUS
// =============================================
function getOfficeLocation() { const s = localStorage.getItem(KEYS.OFFICE_LOCATION); return s ? JSON.parse(s) : null; }
function setOfficeLocation(lat, lng) { localStorage.setItem(KEYS.OFFICE_LOCATION, JSON.stringify({ lat, lng })); }
function getOfficeRadius() { return parseInt(localStorage.getItem(KEYS.OFFICE_RADIUS) || '200'); }
function setOfficeRadius(m) { localStorage.setItem(KEYS.OFFICE_RADIUS, String(m)); }

// =============================================
// DAY OFFS
// =============================================
function getDayOffs() { return JSON.parse(localStorage.getItem(KEYS.DAYOFFS) || '[]'); }
function setDayOff(eid, weeklyOff) {
  const l = getDayOffs();
  const i = l.findIndex(d => d.eid === eid);
  if (i !== -1) { l[i].weeklyOff = weeklyOff; } else { l.push({ eid, weeklyOff }); }
  localStorage.setItem(KEYS.DAYOFFS, JSON.stringify(l));
}

// =============================================
// HELPERS
// =============================================
function getDateStr(date = new Date()) { return date.toISOString().split('T')[0]; }
function getTimeStr() { return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}
async function getIP() {
  try { const r = await fetch('https://api.ipify.org?format=json'); const d = await r.json(); return d.ip; } catch { return 'Unknown'; }
}

// =============================================
// SHEET SYNC WITH RETRY
// =============================================
async function syncToSheetWithRetry(record, attempts=3) {
  if (!CONFIG.SHEET_URL) return;
  for (let i=0; i<attempts; i++) {
    try {
      await fetch(CONFIG.SHEET_URL, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'attendance', ...record })
      });
      return;
    } catch { if (i<attempts-1) await new Promise(r=>setTimeout(r,2000)); }
  }
}
async function syncUserToSheet(user) {
  if (!CONFIG.SHEET_URL) return;
  try {
    await fetch(CONFIG.SHEET_URL, {
      method:'POST', mode:'no-cors',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type:'user', eid:user.eid, name:user.name, createdAt:user.createdAt||new Date().toISOString() })
    });
  } catch {}
}

// =============================================
// CYCLE HELPERS
// =============================================
function getCurrentCycle() {
  const now = new Date(), day=now.getDate(), month=now.getMonth(), year=now.getFullYear();
  if (day>=26) return { start:new Date(year,month,26), end:new Date(year,month+1,25), label:now.toLocaleString('default',{month:'long'})+' cycle' };
  return { start:new Date(year,month-1,26), end:new Date(year,month,25), label:new Date(year,month-1).toLocaleString('default',{month:'long'})+' cycle' };
}
function getPrevCycle() {
  const cur=getCurrentCycle(), prevEnd=new Date(cur.start.getTime()-86400000);
  return { start:new Date(prevEnd.getFullYear(),prevEnd.getMonth()-1,26), end:prevEnd, label:prevEnd.toLocaleString('default',{month:'long'})+' cycle' };
}
function isInCycle(dateStr, cycle) { const d=new Date(dateStr+'T00:00:00'); return d>=cycle.start&&d<=cycle.end; }
function shouldClearOldData() {
  const today=new Date();
  if(today.getDate()!==26) return false;
  return localStorage.getItem('last_cycle_clear')!==getDateStr();
}
function clearPreviousCycleData() {
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-32);
  saveAttendance(getAttendance().filter(r=>new Date(r.date+'T00:00:00')>cutoff));
  localStorage.setItem('last_cycle_clear',getDateStr());
}
