// =============================================
// VALIDATION
// =============================================
function validateEID(eid) { return /^[CSM] \d{4,6}$/.test(eid); }
function validatePassword(pass) {
  if (pass.length < 8) return 'short';
  if (!/[a-zA-Z]/.test(pass)) return 'format';
  if (!/[0-9]/.test(pass)) return 'format';
  return 'ok';
}
function validatePIN(pin) { return /^\d{4}$/.test(pin); }

function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

// =============================================
// SIGNUP
// =============================================
function doSignup() {
  clearErrors();
  const name = document.getElementById('signup-name').value.trim();
  const eid  = document.getElementById('signup-eid').value.trim();
  const pass = document.getElementById('signup-pass').value;
  const pin  = document.getElementById('signup-pin').value.trim();
  let valid = true;

  if (!name) { showFieldError('err-name', t('err-name-req')); valid=false; }
  if (!validateEID(eid)) { showFieldError('err-eid', t('err-eid-format')); valid=false; }
  else if (getUserByEID(eid) || getPendingUsers().find(u=>u.eid===eid)) { showFieldError('err-eid', t('err-eid-taken')); valid=false; }
  const pc = validatePassword(pass);
  if (pc==='short') { showFieldError('err-pass', t('err-pass-short')); valid=false; }
  else if (pc==='format') { showFieldError('err-pass', t('err-pass-format')); valid=false; }
  if (!validatePIN(pin)) { showFieldError('err-pin', t('err-pin-digits')); valid=false; }
  if (!valid) return;

  addPendingUser({ name, eid, pass, pin });
  showScreen('screen-pending');
}

// =============================================
// LOGIN
// =============================================
function doLogin() {
  clearErrors();
  const eid  = document.getElementById('login-eid').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (getPendingUsers().find(u=>u.eid===eid)) {
    showFieldError('err-login-pass', 'Your account is pending admin approval.'); return;
  }
  const user = getUserByEID(eid);
  if (!user || user.pass !== pass) { showFieldError('err-login-pass', t('err-login-fail')); return; }
  if (user.status === 'blocked') { showFieldError('err-login-pass', 'Your account has been blocked. Contact admin.'); return; }

  sessionStorage.setItem('refresh_count', '0');
  setCurrentUser(user);
  addSavedAccount(eid, user.name);
  updateUser(eid, { lastLogin: new Date().toISOString() });
  renderDashboard();
  showScreen('screen-dashboard');
}

// =============================================
// ADMIN LOGIN
// =============================================
function doAdminLogin() {
  const id   = document.getElementById('admin-id').value.trim();
  const pass = document.getElementById('admin-pass').value;
  if (id === CONFIG.ADMIN_ID && verifyAdminPassword(pass)) {
    sessionStorage.setItem('refresh_count', '0');
    sessionStorage.setItem('admin_logged_in', '1');
    adminSelectedDate = getDateStr();
    renderAdminDashboard();
    showScreen('screen-admin');
  } else {
    showFieldError('err-admin', t('err-admin-fail'));
  }
}

// =============================================
// GEOFENCING
// =============================================
async function checkGeofence() {
  const office = getOfficeLocation();
  if (!office) return { allowed: false, reason: 'no_location', distance: null };
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calcDistance(pos.coords.latitude, pos.coords.longitude, office.lat, office.lng);
        if (dist <= getOfficeRadius()) resolve({ allowed: true, distance: dist, lat: pos.coords.latitude, lng: pos.coords.longitude });
        else resolve({ allowed: false, reason: 'too_far', distance: dist, lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => resolve({ allowed: false, reason: 'location_denied', distance: null }),
      { timeout: 8000 }
    );
  });
}

// =============================================
// HOLD-TO-SUBMIT CIRCLE
// Circle fills completely → then fingerprint/PIN
// =============================================
let holdAnimFrame = null;
let holdType = null;
let holdFinished = false;

function startHold(type, btnEl) {
  if (btnEl.disabled) return;
  holdType = type;
  holdFinished = false;
  const duration = 2000;
  const start = performance.now();
  const outer = btnEl.closest('.circle-outer');
  const circle = outer ? outer.querySelector('.progress-ring-circle') : null;
  const circumference = 2 * Math.PI * 40;

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    if (circle) circle.style.strokeDashoffset = circumference * (1 - progress);
    if (progress < 1) {
      holdAnimFrame = requestAnimationFrame(animate);
    } else {
      holdFinished = true;
      // Circle complete — now trigger fingerprint or PIN
      onCircleComplete(type, btnEl);
    }
  }
  holdAnimFrame = requestAnimationFrame(animate);
}

function endHold(btnEl) {
  // If circle not complete yet, cancel and reset
  if (!holdFinished) {
    if (holdAnimFrame) { cancelAnimationFrame(holdAnimFrame); holdAnimFrame = null; }
    const outer = btnEl.closest('.circle-outer');
    const circle = outer ? outer.querySelector('.progress-ring-circle') : null;
    if (circle) circle.style.strokeDashoffset = 2 * Math.PI * 40;
  }
}

async function onCircleComplete(type, btnEl) {
  // Check geofence first
  const office = getOfficeLocation();
  if (!office) { showToast('Admin has not set office location yet.', 'error'); resetCircle(btnEl); return; }

  const geo = await checkGeofence();
  if (!geo.allowed) {
    if (geo.reason === 'too_far') showToast(`You are ${geo.distance}m away. Must be within ${getOfficeRadius()}m.`, 'error');
    else if (geo.reason === 'location_denied') showToast(t('err-location'), 'error');
    else showToast('Admin has not set office location yet.', 'error');
    resetCircle(btnEl);
    renderDashboard();
    return;
  }

  // Geofence passed — now fingerprint or PIN
  pendingGeo = geo;
  pinAction = type;

  if (window.PublicKeyCredential) {
    tryFingerprint(type, geo);
  } else {
    openPINScreen(type, geo);
  }
}

function resetCircle(btnEl) {
  holdFinished = false;
  const outer = btnEl ? btnEl.closest('.circle-outer') : null;
  const circle = outer ? outer.querySelector('.progress-ring-circle') : null;
  if (circle) circle.style.strokeDashoffset = 2 * Math.PI * 40;
}

// =============================================
// FINGERPRINT / PIN
// =============================================
let pendingGeo = null;
let pinAction = null;

async function tryFingerprint(type, geo) {
  pendingGeo = geo; pinAction = type;
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credential = await navigator.credentials.get({
      publicKey: { challenge, timeout: 30000, userVerification: 'required', rpId: window.location.hostname || 'localhost' }
    });
    if (credential) { showToast(t('msg-fp-success'), 'success'); processAttendance(type, geo); }
  } catch {
    // Fingerprint failed or not available — use PIN
    openPINScreen(type, geo);
  }
}

function openPINScreen(type, geo) {
  pendingGeo = geo; pinAction = type;
  document.getElementById('pin-input').value = '';
  document.getElementById('err-pin-verify').style.display = 'none';
  screenHistory.push('screen-dashboard');
  showScreen('screen-pin');
}

function verifyPIN() {
  const user = getCurrentUser();
  const pin  = document.getElementById('pin-input').value.trim();
  if (pin !== user.pin) {
    const el = document.getElementById('err-pin-verify');
    el.textContent = t('err-pin-wrong'); el.style.display = 'block'; return;
  }
  screenHistory.pop();
  showScreen('screen-dashboard');
  processAttendance(pinAction, pendingGeo);
}

function cancelPIN() {
  screenHistory.pop();
  showScreen('screen-dashboard');
  renderDashboard();
}

// =============================================
// PROCESS ATTENDANCE
// =============================================
async function processAttendance(type, geo) {
  const user = getCurrentUser();
  const today = getDateStr();
  const existing = getTodayRecord(user.eid);

  if (type === 'checkin' && existing && existing.checkIn) { showToast(t('msg-already-checkin'), 'error'); return; }
  if (type === 'checkout' && existing && existing.checkOut) { showToast(t('msg-already-checkout'), 'error'); return; }

  const ip = await getIP();
  const distanceM = geo && geo.distance !== null ? geo.distance + 'm' : 'N/A';

  const record = {
    eid: user.eid, name: user.name, date: today, ip,
    lat: geo?.lat || null, lng: geo?.lng || null,
    distanceFromOffice: distanceM,
    checkIn: type === 'checkin' ? getTimeStr() : (existing?.checkIn || null),
    checkOut: type === 'checkout' ? getTimeStr() : (existing?.checkOut || null),
    status: existing?.status || '',
  };

  showToast(type === 'checkin' ? t('msg-checkin-ok') : t('msg-checkout-ok'), 'success');
  await addAttendanceRecord(record);
  renderDashboard();
}

// =============================================
// LOGOUT
// =============================================
function doLogout() {
  clearCurrentUser();
  sessionStorage.setItem('refresh_count', '0');
  renderSavedAccounts();
  showScreen('screen-login');
}
