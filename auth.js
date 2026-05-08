// =============================================
// VALIDATION
// =============================================
function validateEID(eid) { return /^C \d{5}$/.test(eid); }
function validatePassword(pass) {
  if (pass.length < 8) return 'short';
  if (!/[a-zA-Z]/.test(pass)) return 'format';
  if (!/[0-9]/.test(pass)) return 'format';
  return 'ok';
}
function validatePIN(pin) { return /^\d{4}$/.test(pin); }

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
  else if (getUserByEID(eid) || getPendingUsers().find(u=>u.eid===eid)) {
    showFieldError('err-eid', t('err-eid-taken')); valid=false;
  }
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

  // Check pending
  const pending = getPendingUsers().find(u => u.eid === eid);
  if (pending) { showFieldError('err-login-pass', 'Your account is pending admin approval.'); return; }

  const user = getUserByEID(eid);
  if (!user || user.pass !== pass) { showFieldError('err-login-pass', t('err-login-fail')); return; }
  if (user.status === 'blocked') { showFieldError('err-login-pass', 'Your account has been blocked. Contact admin.'); return; }

  setCurrentUser(user);
  addSavedAccount(eid, user.name);
  renderDashboard();
  showScreen('screen-dashboard');
}

// =============================================
// ADMIN LOGIN
// =============================================
async function doAdminLogin() {
  const id   = document.getElementById('admin-id').value.trim();
  const pass = document.getElementById('admin-pass').value;
  if (id === CONFIG.ADMIN_ID && await verifyAdminPassword(pass)) {
    adminSelectedDate = getDateStr();
    renderAdminDashboard();
    showScreen('screen-admin');
  } else {
    showFieldError('err-admin', t('err-admin-fail'));
  }
}

// =============================================
// GEOFENCING CHECK
// =============================================
async function checkGeofence() {
  const office = getOfficeLocation();
  if (!office) return { allowed: false, reason: 'no_location', distance: null };

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calcDistance(pos.coords.latitude, pos.coords.longitude, office.lat, office.lng);
        const radius = getOfficeRadius();
        if (dist <= radius) {
          resolve({ allowed: true, distance: dist, lat: pos.coords.latitude, lng: pos.coords.longitude });
        } else {
          resolve({ allowed: false, reason: 'too_far', distance: dist, lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      },
      () => resolve({ allowed: false, reason: 'location_denied', distance: null }),
      { timeout: 8000 }
    );
  });
}

// =============================================
// HOLD-TO-SUBMIT CIRCLE
// =============================================
let holdTimer = null;
let holdProgress = 0;
let holdAnimFrame = null;
let holdType = null;

function startHold(type, btnEl) {
  if (btnEl.classList.contains('done')) return;
  holdType = type;
  holdProgress = 0;
  const duration = 1800; // ms to complete
  const start = performance.now();
  const svg = btnEl.querySelector('.progress-ring-circle');

  function animate(now) {
    const elapsed = now - start;
    holdProgress = Math.min(elapsed / duration, 1);
    if (svg) {
      const circumference = 2 * Math.PI * 40;
      svg.style.strokeDashoffset = circumference * (1 - holdProgress);
    }
    if (holdProgress < 1) {
      holdAnimFrame = requestAnimationFrame(animate);
    } else {
      onHoldComplete(type);
    }
  }
  holdAnimFrame = requestAnimationFrame(animate);
}

function cancelHold(btnEl) {
  if (holdAnimFrame) cancelAnimationFrame(holdAnimFrame);
  holdProgress = 0;
  const svg = btnEl.querySelector('.progress-ring-circle');
  if (svg) {
    const circumference = 2 * Math.PI * 40;
    svg.style.strokeDashoffset = circumference;
  }
}

async function onHoldComplete(type) {
  const office = getOfficeLocation();
  if (!office) {
    showToast('Admin has not set office location yet.', 'error');
    renderDashboard();
    return;
  }
  const geo = await checkGeofence();
  if (!geo.allowed) {
    if (geo.reason === 'too_far') {
      showToast(`You are ${geo.distance}m away. Must be within ${getOfficeRadius()}m.`, 'error');
    } else if (geo.reason === 'location_denied') {
      showToast(t('err-location'), 'error');
    } else {
      showToast('Admin has not set office location yet.', 'error');
    }
    renderDashboard();
    return;
  }
  // Geofence passed — now fingerprint or PIN
  holdType = type;
  if (window.PublicKeyCredential) {
    tryFingerprint(type, geo);
  } else {
    openPINScreen(type, geo);
  }
}

// =============================================
// FINGERPRINT / PIN
// =============================================
let pendingGeo = null;
let pinAction = null;

async function tryFingerprint(type, geo) {
  pendingGeo = geo;
  pinAction = type;
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credential = await navigator.credentials.get({
      publicKey: { challenge, timeout: 30000, userVerification: 'required', rpId: window.location.hostname || 'localhost' }
    });
    if (credential) {
      showToast(t('msg-fp-success'), 'success');
      processAttendance(type, geo);
    }
  } catch {
    openPINScreen(type, geo);
  }
}

function openPINScreen(type, geo) {
  pendingGeo = geo;
  pinAction = type;
  document.getElementById('pin-input').value = '';
  document.getElementById('err-pin-verify').style.display = 'none';
  showScreen('screen-pin');
}

function verifyPIN() {
  const user = getCurrentUser();
  const pin  = document.getElementById('pin-input').value.trim();
  if (pin !== user.pin) {
    const el = document.getElementById('err-pin-verify');
    el.textContent = t('err-pin-wrong'); el.style.display = 'block';
    return;
  }
  showScreen('screen-dashboard');
  processAttendance(pinAction, pendingGeo);
}

function cancelPIN() {
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

  if (type==='checkin' && existing && existing.checkIn) { showToast(t('msg-already-checkin'),'error'); return; }
  if (type==='checkout') {
    if (!existing || !existing.checkIn) { showToast(t('msg-checkin-first'),'error'); return; }
    if (existing.checkOut) { showToast(t('msg-already-checkout'),'error'); return; }
  }

  const ip = await getIP();
  const distanceM = geo && geo.distance !== null ? geo.distance + 'm' : 'N/A';

  const record = {
    eid: user.eid, name: user.name, date: today, ip,
    lat: geo?.lat || null, lng: geo?.lng || null,
    distanceFromOffice: distanceM,
    checkIn: type==='checkin' ? getTimeStr() : (existing?.checkIn || null),
    checkOut: type==='checkout' ? getTimeStr() : (existing?.checkOut || null),
  };

  showToast(type==='checkin' ? t('msg-checkin-ok') : t('msg-checkout-ok'), 'success');
  await addAttendanceRecord(record);
  renderDashboard();
}

// =============================================
// LOGOUT
// =============================================
function doLogout() {
  clearCurrentUser();
  renderSavedAccounts();
  showScreen('screen-login');
}
