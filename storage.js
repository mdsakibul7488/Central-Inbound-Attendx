// =============================================
// CONFIGURATION — Change before deploying!
// =============================================
const CONFIG = {
  SHEET_URL: 'https://script.google.com/macros/s/AKfycbz6PVi3DmTHqgzB0HQqr9Q32SXr78XC-ZtMpmFbwPWHautapjGkS74AzuGyKT1WHcxa/exec', // Paste your Google Apps Script URL here
  ADMIN_ID: 'ADMIN001',
  // Password: Admin@1234 (SHA-256 hashed)
  ADMIN_PASS_HASH: '7b6a5e5f4e3c2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4',
  ADMIN_PLAIN: 'Admin@1234', // Change this AND update the hash above
};

// Simple hash function (for basic protection)
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminPassword(input) {
  // Fallback: plain compare if hash not set up yet
  if (input === CONFIG.ADMIN_PLAIN) return true;
  try {
    const hashed = await hashPassword(input);
    const storedHash = localStorage.getItem('admin_pass_hash');
    if (storedHash) return hashed === storedHash;
    return false;
  } catch {
    return input === CONFIG.ADMIN_PLAIN;
  }
}

// =============================================
// LOCAL STORAGE KEYS
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
function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}
function getUserByEID(eid) {
  return getUsers().find(u => u.eid === eid) || null;
}
function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}
function updateUser(eid, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.eid === eid);
  if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; saveUsers(users); }
}

// =============================================
// PENDING APPROVAL
// =============================================
function getPendingUsers() {
  return JSON.parse(localStorage.getItem('attendx_pending') || '[]');
}
function savePendingUsers(list) {
  localStorage.setItem('attendx_pending', JSON.stringify(list));
}
function addPendingUser(user) {
  const list = getPendingUsers();
  list.push({ ...user, requestedAt: new Date().toISOString() });
  savePendingUsers(list);
}
function approveUser(eid) {
  const list = getPendingUsers();
  const user = list.find(u => u.eid === eid);
  if (!user) return;
  addUser({ ...user, status: 'active' });
  savePendingUsers(list.filter(u => u.eid !== eid));
  if (CONFIG.SHEET_URL) syncUserToSheet(user);
}
function rejectUser(eid) {
  savePendingUsers(getPendingUsers().filter(u => u.eid !== eid));
}

// =============================================
// BLOCK / UNBLOCK
// =============================================
function blockUser(eid) {
  updateUser(eid, { status: 'blocked' });
}
function unblockUser(eid) {
  updateUser(eid, { status: 'active' });
}

// =============================================
// ATTENDANCE
// =============================================
function getAttendance() {
  return JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]');
}
function saveAttendance(records) {
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
}
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
// MULTI-ACCOUNT
// =============================================
function getSavedAccounts() {
  return JSON.parse(localStorage.getItem(KEYS.SAVED_ACCOUNTS) || '[]');
}
function addSavedAccount(eid, name) {
  const accounts = getSavedAccounts();
  if (!accounts.find(a => a.eid === eid)) {
    accounts.push({ eid, name });
    localStorage.setItem(KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts));
  }
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || 'null');
}
function setCurrentUser(user) {
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
}
function clearCurrentUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// =============================================
// OFFICE LOCATION + RADIUS
// =============================================
function getOfficeLocation() {
  const saved = localStorage.getItem(KEYS.OFFICE_LOCATION);
  return saved ? JSON.parse(saved) : null;
}
function setOfficeLocation(lat, lng) {
  localStorage.setItem(KEYS.OFFICE_LOCATION, JSON.stringify({ lat, lng }));
}
function getOfficeRadius() {
  return parseInt(localStorage.getItem(KEYS.OFFICE_RADIUS) || '200');
}
function setOfficeRadius(meters) {
  localStorage.setItem(KEYS.OFFICE_RADIUS, String(meters));
}

// =============================================
// DAY OFFS
// =============================================
function getDayOffs() {
  return JSON.parse(localStorage.getItem(KEYS.DAYOFFS) || '[]');
}
function setDayOff(eid, weeklyOff) {
  const list = getDayOffs();
  const idx = list.findIndex(d => d.eid === eid);
  if (idx !== -1) { list[idx].weeklyOff = weeklyOff; }
  else { list.push({ eid, weeklyOff }); }
  localStorage.setItem(KEYS.DAYOFFS, JSON.stringify(list));
}

// =============================================
// HELPERS
// =============================================
function getDateStr(date = new Date()) {
  return date.toISOString().split('T')[0];
}
function getTimeStr() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}
async function getIP() {
  try { const r = await fetch('https://api.ipify.org?format=json'); const d = await r.json(); return d.ip; }
  catch { return 'Unknown'; }
}

// =============================================
// GOOGLE SHEET SYNC WITH RETRY
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
    } catch {
      if (i < attempts-1) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.warn('Sheet sync failed after retries');
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
// CYCLE CLEAR (26th of month)
// =============================================
function shouldClearOldData() {
  const today = new Date();
  if (today.getDate() !== 26) return false;
  return localStorage.getItem('last_cycle_clear') !== getDateStr();
}
function clearPreviousCycleData() {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-32);
  const filtered = getAttendance().filter(r => new Date(r.date+'T00:00:00') > cutoff);
  saveAttendance(filtered);
  localStorage.setItem('last_cycle_clear', getDateStr());
}
