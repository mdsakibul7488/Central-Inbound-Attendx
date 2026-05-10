// =============================================
// SCREEN + TOAST
// =============================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0,0);
}
function showToast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 3500);
}
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => { e.textContent=''; e.classList.remove('show'); });
}

// =============================================
// GREETING
// =============================================
function getGreeting() {
  const h = new Date().getHours();
  if (h>=5&&h<12) return t('lbl-good-morning');
  if (h>=12&&h<17) return t('lbl-good-afternoon');
  if (h>=17&&h<21) return t('lbl-good-evening');
  return t('lbl-good-night');
}

// =============================================
// SAVED ACCOUNTS
// =============================================
function renderSavedAccounts() {
  const accounts = getSavedAccounts();
  const wrap = document.getElementById('saved-accounts-wrap');
  const list = document.getElementById('saved-accounts-list');
  if (!wrap||!list) return;
  if (accounts.length===0) { wrap.style.display='none'; return; }
  wrap.style.display='block';
  list.innerHTML = accounts.map(a=>`
    <div class="saved-acc-item" onclick="switchAccount('${a.eid}')">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--red-light);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--red);">${a.name[0].toUpperCase()}</div>
      <div style="flex:1;"><div style="font-size:14px;font-weight:500;">${a.name}</div><div style="font-size:12px;color:var(--text-sub);">${a.eid}</div></div>
      <div style="font-size:12px;color:var(--text-sub);">→</div>
    </div>`).join('');
}
function switchAccount(eid) {
  document.getElementById('login-eid').value = eid;
  document.getElementById('login-pass').value = '';
  document.getElementById('login-pass').focus();
}

// =============================================
// CIRCLE BUTTON RENDERER
// =============================================
function renderCircleBtn(type, isDisabled, isDone, color, glowColor, icon, label) {
  const circumference = 2 * Math.PI * 40;
  const ringColor = isDone ? '#22C55E' : isDisabled ? '#D1D5DB' : color;
  const glowAnim = !isDisabled && !isDone ? `box-shadow:0 0 0 3px ${glowColor}, 0 0 16px ${glowColor}80;` : '';
  const pulseStyle = !isDisabled && !isDone ? `animation:glowPulse 2s ease-in-out infinite;` : '';

  return `
    <div class="circle-btn-wrap">
      <div class="circle-outer" style="position:relative;width:96px;height:96px;">
        <svg style="position:absolute;top:0;left:0;transform:rotate(-90deg);" width="96" height="96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#F0F1F5" stroke-width="5"/>
          <circle class="progress-ring-circle" cx="48" cy="48" r="40" fill="none"
            stroke="${ringColor}" stroke-width="5" stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${isDone ? 0 : circumference}"
            style="transition:stroke-dashoffset 0.05s linear;"/>
        </svg>
        <button
          ${isDisabled ? 'disabled' : ''}
          style="position:absolute;top:4px;left:4px;width:88px;height:88px;border-radius:50%;
            background:var(--surface);border:none;
            cursor:${isDisabled ? 'default' : 'pointer'};
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
            opacity:${isDisabled ? '0.4' : '1'};
            ${glowAnim}${pulseStyle}"
          onmousedown="if(!this.disabled)startHold('${type}',this)"
          ontouchstart="if(!this.disabled){event.preventDefault();startHold('${type}',this)}"
          onmouseup="cancelHold(this)" onmouseleave="cancelHold(this)"
          ontouchend="cancelHold(this)" ontouchcancel="cancelHold(this)"
        >
          <span style="font-size:24px;">${isDone ? '✓' : icon}</span>
          <span style="font-size:11px;font-weight:600;color:${isDisabled ? '#9CA3AF' : color};">${label}</span>
        </button>
      </div>
      <span style="font-size:10px;color:var(--text-sub);margin-top:5px;">
        ${isDone ? '✓ Done' : isDisabled ? 'Not available' : 'Hold to ' + label.toLowerCase()}
      </span>
    </div>`;
}

// =============================================
// EMPLOYEE DASHBOARD
// =============================================
function renderDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  // 6AM reset check
  shouldResetToday();

  const today = getTodayRecord(user.eid);
  const checkedIn = today && today.checkIn;
  const checkedOut = today && today.checkOut;
  const office = getOfficeLocation();

  // Check-in/out button states:
  // Both live → only if no record or after checkout (reset at 6am)
  // After check-in: in=done, out=live
  // After check-out: both=done (reset at 6am next day)
  const inDone = !!checkedIn;
  const outDone = !!checkedOut;
  const inDisabled = inDone || !office;
  const outDisabled = outDone || !office;

  const statusLabel = checkedOut ? t('lbl-checked-out') : checkedIn ? t('lbl-checked-in') : t('lbl-not-marked');
  const statusColor = checkedOut ? '#A32D2D' : checkedIn ? '#0F6E56' : '#6B7280';
  const statusBg = checkedOut ? '#FCEBEB' : checkedIn ? 'var(--green-light)' : '#F3F4F6';

  const history = getLast3Days(user.eid);
  const historyHTML = history.map(({date, record}) => {
    const d = new Date(date+'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
    const present = record && record.checkIn;
    const isDayOff = record && record.status === 'dayoff';
    const isExchange = record && record.status === 'exchange';
    let pillClass='pill-absent', pillLabel=t('lbl-absent');
    if (present) { pillClass='pill-present'; pillLabel=t('lbl-present'); }
    if (isDayOff) { pillClass='pill-dayoff'; pillLabel=t('lbl-dayoff'); }
    if (isExchange) { pillClass='pill-exchange'; pillLabel=t('lbl-exchange'); }
    return `<div class="day-row">
      <div>
        <div style="font-size:13px;color:var(--text-sub);">${dayName}</div>
        ${present ? `<div style="font-size:11px;color:var(--text-sub);margin-top:1px;">${record.checkIn}${record.checkOut?' – '+record.checkOut:''}</div>` : ''}
      </div>
      <span class="status-pill ${pillClass}">${pillLabel}</span>
    </div>`;
  }).join('');

  document.getElementById('dashboard-content').innerHTML = `
    <div class="dash-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="dash-greeting">${getGreeting()},</div>
          <div class="dash-name">${user.name}</div>
          <div class="dash-eid">${user.eid}</div>
        </div>
        <div class="avatar-wrap" onclick="renderSettings();showScreen('screen-settings')">
          <div class="avatar-circle">${user.name[0].toUpperCase()}</div>
          <div class="avatar-gear">⚙</div>
        </div>
      </div>
    </div>

    <div style="margin:32px 16px 8px;">
      <div class="card" style="border-left:4px solid ${statusColor};border-radius:0 var(--radius) var(--radius) 0;">
        <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">${t('lbl-today')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:14px;font-weight:600;color:${statusColor};background:${statusBg};padding:5px 14px;border-radius:20px;">${statusLabel}</span>
          <div style="font-size:12px;color:var(--text-sub);text-align:right;">
            ${checkedIn ? `<div>In: ${today.checkIn}</div>` : ''}
            ${checkedOut ? `<div>Out: ${today.checkOut}</div>` : ''}
          </div>
        </div>
        ${today&&today.distanceFromOffice&&today.distanceFromOffice!=='N/A' ? `<div style="font-size:12px;color:var(--text-sub);margin-top:6px;">📍 ${t('lbl-distance')}: <b>${today.distanceFromOffice}</b></div>` : ''}
      </div>
    </div>

    <div style="display:flex;justify-content:center;gap:32px;padding:16px 0 20px;">
      ${renderCircleBtn('checkin', inDisabled, inDone, '#00A07A', '#9FE1CB', '✓', t('lbl-checkin'))}
      ${renderCircleBtn('checkout', outDisabled, outDone, '#B45309', '#FAC775', '✕', t('lbl-checkout'))}
    </div>

    <div style="margin:0 16px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:0.5px;">${t('lbl-history')}</span>
        <button class="view-all-btn" onclick="renderFullHistory()">${t('lbl-view-all')}</button>
      </div>
      <div class="card" style="padding:0 16px;">${historyHTML}</div>
    </div>
  `;
}

// =============================================
// FULL HISTORY (Employee) - FIXED
// =============================================
function renderFullHistory() {
  const user = getCurrentUser();
  const cycles = [getCurrentCycle(), getPrevCycle()];
  document.getElementById('history-sub-label').textContent = user.eid;

  function render(idx) {
    const cycle = cycles[idx];
    const allRecords = getAttendance().filter(r => r.eid===user.eid && isInCycle(r.date, cycle));
    const dates = [];
    let d = new Date(cycle.start);
    while (d <= cycle.end && d <= new Date()) { dates.push(getDateStr(new Date(d))); d.setDate(d.getDate()+1); }

    const rows = dates.reverse().map(date => {
      const rec = allRecords.find(r => r.date===date);
      const dt = new Date(date+'T00:00:00');
      const dayName = dt.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
      const present = rec && rec.checkIn;
      const isDayOff = rec && rec.status==='dayoff';
      const isExchange = rec && rec.status==='exchange';
      let pillClass='pill-absent', pillLabel='Absent';
      if (present) { pillClass='pill-present'; pillLabel='Present'; }
      if (isDayOff) { pillClass='pill-dayoff'; pillLabel='Day off'; }
      if (isExchange) { pillClass='pill-exchange'; pillLabel='Exchange'; }
      return `<div class="day-row">
        <div>
          <div style="font-size:13px;color:var(--text);">${dayName}</div>
          ${present ? `<div style="font-size:11px;color:var(--text-sub);margin-top:1px;">${rec.checkIn}${rec.checkOut?' – '+rec.checkOut:''}</div>` : ''}
        </div>
        <span class="status-pill ${pillClass}">${pillLabel}</span>
      </div>`;
    }).join('');

    document.getElementById('history-content').innerHTML = `
      <div class="month-tabs">
        ${cycles.map((c,i) => `<button class="month-tab ${i===idx?'active':''}" onclick="renderFullHistoryIdx(${i})">${c.label}</button>`).join('')}
      </div>
      <div class="card" style="padding:0 16px;">${rows || '<div style="padding:16px;color:var(--text-sub);">No records found.</div>'}</div>`;
  }

  window.renderFullHistoryIdx = render;
  render(0);
  showScreen('screen-history');
}

// =============================================
// SETTINGS
// =============================================
function renderSettings() {
  const user = getCurrentUser();
  document.getElementById('settings-content').innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:72px;height:72px;border-radius:50%;background:var(--red-light);display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:var(--red);border:3px solid var(--red);">${user.name[0].toUpperCase()}</div>
      <div style="font-size:16px;font-weight:600;margin-top:10px;">${user.name}</div>
      <div style="font-size:13px;color:var(--text-sub);">${user.eid}</div>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Profile</div>
      <div class="card">
        <div class="field"><label>Full Name</label><input type="text" id="set-name" value="${user.name}" /></div>
        <button class="btn btn-red" onclick="saveProfile()">Save Changes</button>
      </div>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Change PIN</div>
      <div class="card">
        <div class="field"><label>New PIN</label>
          <div style="position:relative;">
            <input type="password" id="set-pin" placeholder="••••" maxlength="4" inputmode="numeric" style="padding-right:44px;"/>
            <button onclick="togglePass('set-pin',this)" type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;">👁</button>
          </div>
          <div class="field-error" id="err-set-pin"></div>
        </div>
        <button class="btn btn-red" onclick="savePIN()">Change PIN</button>
      </div>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Change Password</div>
      <div class="card">
        <div class="field"><label>Current Password</label>
          <div style="position:relative;">
            <input type="password" id="set-old-pass" placeholder="Current password" style="padding-right:44px;"/>
            <button onclick="togglePass('set-old-pass',this)" type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;">👁</button>
          </div>
        </div>
        <div class="field"><label>New Password</label>
          <div style="position:relative;">
            <input type="password" id="set-new-pass" placeholder="Min 8 chars, letters + numbers" style="padding-right:44px;"/>
            <button onclick="togglePass('set-new-pass',this)" type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;">👁</button>
          </div>
          <div class="field-error" id="err-set-pass"></div>
        </div>
        <button class="btn btn-red" onclick="savePassword()">Change Password</button>
      </div>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Account</div>
      <div class="card" style="padding:0;">
        <div onclick="showScreen('screen-login');renderSavedAccounts();" style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);">
          <span>🔄</span><span style="font-size:14px;">Switch Account</span>
        </div>
        <div onclick="doLogout()" style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;color:var(--error);">
          <span>↩</span><span style="font-size:14px;">Sign Out</span>
        </div>
      </div>
    </div>
  `;
}

function saveProfile() {
  const user=getCurrentUser(); const name=document.getElementById('set-name').value.trim();
  if(!name) return; updateUser(user.eid,{name}); setCurrentUser({...user,name});
  showToast(t('msg-settings-ok'),'success');
}
function savePIN() {
  const user=getCurrentUser(); const pin=document.getElementById('set-pin').value.trim();
  if(!validatePIN(pin)){showFieldError('err-set-pin',t('err-pin-digits'));return;}
  updateUser(user.eid,{pin}); setCurrentUser({...user,pin});
  document.getElementById('set-pin').value='';
  showToast(t('msg-pin-changed'),'success');
}
function savePassword() {
  const user=getCurrentUser();
  const oldPass=document.getElementById('set-old-pass').value;
  const newPass=document.getElementById('set-new-pass').value;
  if(oldPass!==user.pass){showFieldError('err-set-pass','Current password is incorrect');return;}
  const check=validatePassword(newPass);
  if(check==='short'){showFieldError('err-set-pass',t('err-pass-short'));return;}
  if(check==='format'){showFieldError('err-set-pass',t('err-pass-format'));return;}
  updateUser(user.eid,{pass:newPass}); setCurrentUser({...user,pass:newPass});
  document.getElementById('set-old-pass').value='';
  document.getElementById('set-new-pass').value='';
  showToast(t('msg-pass-changed'),'success');
}

// =============================================
// ADMIN DASHBOARD
// =============================================
let adminSelectedDate = getDateStr();

function renderAdminDashboard() {
  const users=getUsers(), allAtt=getAttendance();
  const recs=allAtt.filter(r=>r.date===adminSelectedDate);
  const pending=getPendingUsers();
  const dayOffs=getDayOffs();
  const office=getOfficeLocation();
  const radius=getOfficeRadius();
  const curCycle=getCurrentCycle(), prevCycle=getPrevCycle();

  let presentCount=0, absentCount=0, dayoffCount=0;
  const activeUsers=users.filter(u=>u.status!=='blocked');
  activeUsers.forEach(u=>{
    const rec=recs.find(r=>r.eid===u.eid);
    const dow=dayOffs.find(d=>d.eid===u.eid);
    const selDay=new Date(adminSelectedDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long'});
    const isWeeklyOff=dow&&dow.weeklyOff&&dow.weeklyOff.toLowerCase()===selDay.toLowerCase();
    if(rec&&rec.checkIn) presentCount++;
    else if(isWeeklyOff||(rec&&rec.status==='dayoff')) dayoffCount++;
    else absentCount++;
  });
  const pendingAtt=Math.max(0, activeUsers.length-presentCount-dayoffCount);

  const empRows=users.map(u=>{
    const rec=recs.find(r=>r.eid===u.eid);
    const dow=dayOffs.find(d=>d.eid===u.eid);
    const selDay=new Date(adminSelectedDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long'});
    const isWeeklyOff=dow&&dow.weeklyOff&&dow.weeklyOff.toLowerCase()===selDay.toLowerCase();
    const isPresent=rec&&rec.checkIn;
    const isDayOff=isWeeklyOff||(rec&&rec.status==='dayoff');
    const isExchange=rec&&rec.status==='exchange';
    const isBlocked=u.status==='blocked';
    let pillClass='pill-absent', pillLabel='Absent';
    if(isPresent){pillClass='pill-present';pillLabel='Present';}
    if(isDayOff){pillClass='pill-dayoff';pillLabel='Day off';}
    if(isExchange){pillClass='pill-exchange';pillLabel='Exchange';}
    if(isBlocked){pillLabel='Blocked';}
    return `<div class="emp-row" style="${isBlocked?'opacity:0.5':''}">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--red-light);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--red);flex-shrink:0;">${u.name[0].toUpperCase()}</div>
      <div style="flex:1;margin-left:8px;">
        <div style="font-size:13px;font-weight:500;">${u.name} <span style="font-size:11px;color:var(--text-sub);">${u.eid}</span></div>
        <div style="font-size:11px;color:var(--text-sub);">${isPresent?`${rec.checkIn}${rec.checkOut?' – '+rec.checkOut:''}`:isDayOff?'Day off':isExchange?'Exchange':isBlocked?'Blocked':'No check in'}${isPresent&&rec.distanceFromOffice&&rec.distanceFromOffice!=='N/A'?' · 📍'+rec.distanceFromOffice:''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
        <span class="status-pill ${pillClass}" style="${isBlocked?'background:#F3F4F6;color:#6B7280;':''}">${pillLabel}</span>
        ${isDayOff&&!isExchange?`<span onclick="markExchange('${u.eid}')" style="font-size:10px;color:#185FA5;background:#E6F1FB;padding:2px 7px;border-radius:20px;cursor:pointer;">Exchange</span>`:''}
        ${isExchange?`<span onclick="undoExchange('${u.eid}')" style="font-size:10px;color:#6B7280;background:#F3F4F6;padding:2px 7px;border-radius:20px;cursor:pointer;">Undo</span>`:''}
        ${isBlocked?`<span onclick="unblockUser('${u.eid}');renderAdminDashboard();" style="font-size:10px;color:#0F6E56;background:var(--green-light);padding:2px 7px;border-radius:20px;cursor:pointer;">Unblock</span>`:
        `<span onclick="blockUser('${u.eid}');renderAdminDashboard();" style="font-size:10px;color:#A32D2D;background:#FCEBEB;padding:2px 7px;border-radius:20px;cursor:pointer;">Block</span>`}
        <span onclick="viewEmpHistory('${u.eid}','${u.name}')" style="font-size:10px;color:var(--indigo);background:var(--indigo-light);padding:2px 7px;border-radius:20px;cursor:pointer;">History</span>
      </div>
    </div>`;
  }).join('')||'<div style="padding:16px;color:var(--text-sub);font-size:13px;">No employees yet.</div>';

  const pendingRows=pending.map(u=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
      <div><div style="font-size:13px;font-weight:500;">${u.name}</div><div style="font-size:11px;color:var(--text-sub);">${u.eid}</div></div>
      <div style="display:flex;gap:6px;">
        <span onclick="approveUser('${u.eid}');renderAdminDashboard();" style="font-size:11px;font-weight:500;color:#0F6E56;background:var(--green-light);padding:4px 10px;border-radius:20px;cursor:pointer;">Approve</span>
        <span onclick="rejectUser('${u.eid}');renderAdminDashboard();" style="font-size:11px;font-weight:500;color:#A32D2D;background:#FCEBEB;padding:4px 10px;border-radius:20px;cursor:pointer;">Reject</span>
      </div>
    </div>`).join('');

  document.getElementById('admin-content').innerHTML = `
    <div class="admin-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);">Central Inbound AttendX</div>
          <div style="font-size:18px;font-weight:700;color:white;margin-top:2px;">${new Date(adminSelectedDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        </div>
        <div style="position:relative;">
          <button onclick="toggleShield()" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.15);border:none;cursor:pointer;color:white;font-size:20px;display:flex;align-items:center;justify-content:center;">🛡</button>
          <div id="shield-drop" style="position:absolute;top:46px;right:0;background:var(--surface);border-radius:var(--radius-sm);border:1px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:6px;min-width:190px;z-index:100;display:none;">
            <div onclick="selectAdminCycle('cur');closeShield()" style="padding:9px 12px;border-radius:8px;font-size:13px;cursor:pointer;">📅 ${curCycle.label}</div>
            <div onclick="selectAdminCycle('prev');closeShield()" style="padding:9px 12px;border-radius:8px;font-size:13px;cursor:pointer;">📅 ${prevCycle.label}</div>
            <div style="border-top:1px solid var(--border);margin:4px 0;"></div>
            <div onclick="openLocationSetup();closeShield()" style="padding:9px 12px;border-radius:8px;font-size:13px;cursor:pointer;">📍 Office Location & Radius</div>
            <div onclick="openAdminPassChange();closeShield()" style="padding:9px 12px;border-radius:8px;font-size:13px;cursor:pointer;">🔑 Change Admin Password</div>
            <div onclick="doAdminLogout()" style="padding:9px 12px;border-radius:8px;font-size:13px;cursor:pointer;color:var(--error);">↩ Exit Admin</div>
          </div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-label">Total resources</div><div class="stat-val">${users.length}</div></div>
        <div class="stat-box"><div class="stat-label">Present</div><div class="stat-val green">${presentCount}</div></div>
        <div class="stat-box"><div class="stat-label">Absent</div><div class="stat-val red">${absentCount}</div></div>
        <div class="stat-box"><div class="stat-label">Day off</div><div class="stat-val yellow">${dayoffCount}</div></div>
        <div class="stat-box full"><div class="stat-label">Attendance pending</div><div class="stat-val orange">${pendingAtt} not submitted</div></div>
      </div>
    </div>

    <div class="admin-body">
      ${pending.length>0?`
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:600;color:var(--error);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">⏳ Pending Approval (${pending.length})</div>
        <div class="card" style="padding:0 16px;">${pendingRows}</div>
      </div>`:''}

      <div class="filter-bar" onclick="openDatePicker()">
        <span>📅</span>
        <span id="date-filter-label">${new Date(adminSelectedDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span>
        <input type="date" id="date-picker" style="position:absolute;opacity:0;pointer-events:none;" onchange="onDateChange(this.value)"/>
        <span style="color:var(--text-sub);font-size:12px;">▾</span>
      </div>

      <div style="font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Employees</div>
      <div class="card" style="padding:0 16px;">${empRows}</div>
    </div>
  `;
}

function openAdminPassChange() {
  const el = document.createElement('div');
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:flex-end;';
  el.innerHTML=`
    <div style="background:var(--surface);border-radius:var(--radius) var(--radius) 0 0;padding:24px;width:100%;max-width:430px;margin:0 auto;">
      <div style="font-size:16px;font-weight:700;margin-bottom:16px;">🔑 Change Admin Password</div>
      <div class="field">
        <label>Current Password</label>
        <div style="position:relative;">
          <input type="password" id="admin-old-pass" placeholder="Current password" style="width:100%;padding:13px 44px 13px 16px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;outline:none;"/>
          <button onclick="togglePass('admin-old-pass',this)" type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;">👁</button>
        </div>
      </div>
      <div class="field">
        <label>New Password</label>
        <div style="position:relative;">
          <input type="password" id="admin-new-pass" placeholder="Min 8 chars, letters + numbers" style="width:100%;padding:13px 44px 13px 16px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;outline:none;"/>
          <button onclick="togglePass('admin-new-pass',this)" type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;">👁</button>
        </div>
        <div class="field-error" id="err-admin-pass"></div>
      </div>
      <button onclick="saveAdminPass()" class="btn btn-indigo" style="margin-bottom:8px;">Save New Password</button>
      <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-ghost">Cancel</button>
    </div>`;
  document.body.appendChild(el);
}

async function saveAdminPass() {
  const oldPass = document.getElementById('admin-old-pass').value;
  const newPass = document.getElementById('admin-new-pass').value;
  const errEl = document.getElementById('err-admin-pass');
  if (!await verifyAdminPassword(oldPass)) { errEl.textContent='Current password is incorrect'; errEl.classList.add('show'); return; }
  const check = validatePassword(newPass);
  if (check==='short') { errEl.textContent=t('err-pass-short'); errEl.classList.add('show'); return; }
  if (check==='format') { errEl.textContent=t('err-pass-format'); errEl.classList.add('show'); return; }
  setAdminPassword(newPass);
  document.querySelectorAll('div[style*="position:fixed"]').forEach(e=>e.remove());
  showToast('Admin password changed!', 'success');
}

function openLocationSetup() {
  const office=getOfficeLocation(), radius=getOfficeRadius();
  const el=document.createElement('div');
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:flex-end;';
  el.innerHTML=`
    <div style="background:var(--surface);border-radius:var(--radius) var(--radius) 0 0;padding:24px;width:100%;max-width:430px;margin:0 auto;">
      <div style="font-size:16px;font-weight:700;margin-bottom:16px;">📍 Office Location & Radius</div>
      ${office?`<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px;background:var(--bg);padding:8px 12px;border-radius:8px;">Current: ${office.lat.toFixed(5)}, ${office.lng.toFixed(5)}</div>`:'<div style="font-size:12px;color:var(--error);margin-bottom:12px;">⚠ No location set yet</div>'}
      <div class="field" style="margin-bottom:14px;">
        <label>Check-in Radius (meters)</label>
        <input type="number" id="radius-input" value="${radius}" min="50" max="2000" style="width:100%;padding:12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:14px;outline:none;"/>
        <div style="font-size:11px;color:var(--text-sub);margin-top:4px;">Recommended: 200m</div>
      </div>
      <button onclick="captureOfficeLocation(document.getElementById('radius-input').value)" class="btn btn-red" style="margin-bottom:8px;">📍 Use My Current Location & Save</button>
      <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-ghost">Cancel</button>
    </div>`;
  document.body.appendChild(el);
}

function captureOfficeLocation(radiusVal) {
  const radius=parseInt(radiusVal)||200;
  navigator.geolocation.getCurrentPosition(
    pos=>{
      setOfficeLocation(pos.coords.latitude,pos.coords.longitude);
      setOfficeRadius(radius);
      document.querySelectorAll('div[style*="position:fixed"]').forEach(e=>e.remove());
      showToast(`Office location saved! Radius: ${radius}m`,'success');
      renderAdminDashboard();
    },
    ()=>showToast(t('err-location'),'error'),
    {timeout:8000}
  );
}

function toggleShield() {
  const d=document.getElementById('shield-drop');
  if(d) d.style.display=d.style.display==='none'?'block':'none';
}
function closeShield() { const d=document.getElementById('shield-drop'); if(d) d.style.display='none'; }
function openDatePicker() {
  const p=document.getElementById('date-picker');
  if(p){p.value=adminSelectedDate; p.showPicker?p.showPicker():p.click();}
}
function onDateChange(val) { if(val){adminSelectedDate=val;renderAdminDashboard();} }
function markExchange(eid) {
  const u=getUserByEID(eid);
  const rec=getTodayRecord(eid)||{eid,date:adminSelectedDate,name:u?.name||''};
  rec.status='exchange'; addAttendanceRecord(rec);
  renderAdminDashboard(); showToast('Marked as Exchange','success');
}
function undoExchange(eid) {
  const records=getAttendance();
  const idx=records.findIndex(r=>r.eid===eid&&r.date===adminSelectedDate);
  if(idx!==-1){delete records[idx].status;saveAttendance(records);}
  renderAdminDashboard();
}
function viewEmpHistory(eid, name) {
  const cycles=[getCurrentCycle(),getPrevCycle()];
  document.getElementById('admin-history-sub').textContent=name+' · '+eid;
  function render(idx) {
    const cycle=cycles[idx];
    const allRecs=getAttendance().filter(r=>r.eid===eid&&isInCycle(r.date,cycle));
    const dates=[];let d=new Date(cycle.start);
    while(d<=cycle.end&&d<=new Date()){dates.push(getDateStr(new Date(d)));d.setDate(d.getDate()+1);}
    const rows=dates.reverse().map(date=>{
      const rec=allRecs.find(r=>r.date===date);
      const dt=new Date(date+'T00:00:00');
      const dayName=dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      const present=rec&&rec.checkIn,isDayOff=rec&&rec.status==='dayoff',isExchange=rec&&rec.status==='exchange';
      let pillClass='pill-absent',pillLabel='Absent';
      if(present){pillClass='pill-present';pillLabel='Present';}
      if(isDayOff){pillClass='pill-dayoff';pillLabel='Day off';}
      if(isExchange){pillClass='pill-exchange';pillLabel='Exchange';}
      return `<div class="day-row">
        <div><div style="font-size:13px;">${dayName}</div>${present?`<div style="font-size:11px;color:var(--text-sub);">${rec.checkIn}${rec.checkOut?' – '+rec.checkOut:''}</div>`:''}</div>
        <span class="status-pill ${pillClass}">${pillLabel}</span>
      </div>`;
    }).join('');
    document.getElementById('admin-history-content').innerHTML=`
      <div class="month-tabs">${cycles.map((c,i)=>`<button class="month-tab ${i===idx?'active':''}" onclick="viewEmpHistoryIdx(${i},'${eid}','${name}')">${c.label}</button>`).join('')}</div>
      <div class="card" style="padding:0 16px;">${rows||'<div style="padding:16px;color:var(--text-sub);">No records.</div>'}</div>`;
  }
  window.viewEmpHistoryIdx = (idx, e, n) => viewEmpHistory(e, n);
  render(0);
  showScreen('screen-admin-history');
}
function selectAdminCycle(which) {
  const cycle=which==='cur'?getCurrentCycle():getPrevCycle();
  const users=getUsers(),allAtt=getAttendance();
  document.getElementById('admin-history-sub').textContent=cycle.label;
  const dates=[];let d=new Date(cycle.start);
  while(d<=cycle.end&&d<=new Date()){dates.push(getDateStr(new Date(d)));d.setDate(d.getDate()+1);}
  const rows=dates.reverse().map(date=>{
    const recs=allAtt.filter(r=>r.date===date);
    const presentCount=recs.filter(r=>r.checkIn).length;
    const dt=new Date(date+'T00:00:00');
    const dayName=dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    return `<div class="day-row" style="cursor:pointer;" onclick="adminSelectedDate='${date}';renderAdminDashboard();showScreen('screen-admin');">
      <div><div style="font-size:13px;">${dayName}</div><div style="font-size:11px;color:var(--text-sub);">${presentCount} present of ${users.length}</div></div>
      <span style="font-size:12px;color:var(--indigo);">View →</span>
    </div>`;
  }).join('');
  document.getElementById('admin-history-content').innerHTML=`<div class="card" style="padding:0 16px;">${rows||'<div style="padding:16px;color:var(--text-sub);">No data.</div>'}</div>`;
  showScreen('screen-admin-history');
}
function doAdminLogout() {
  sessionStorage.removeItem('admin_logged_in');
  showScreen('screen-login');
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', ()=>{
  initRefreshProtection();
  if(shouldClearOldData()) clearPreviousCycleData();

  setTimeout(()=>{
    // Check admin session
    if(sessionStorage.getItem('admin_logged_in')==='1') {
      adminSelectedDate = getDateStr();
      renderAdminDashboard();
      showScreen('screen-admin');
      applyLang();
      return;
    }
    const user=getCurrentUser();
    if(user){ renderDashboard(); showScreen('screen-dashboard'); }
    else { renderSavedAccounts(); showScreen('screen-login'); }
    applyLang();
  }, 1400);
});

document.addEventListener('click', e=>{
  const d=document.getElementById('shield-drop');
  if(d&&d.style.display==='block'&&!e.target.closest('[onclick*="toggleShield"]')&&!e.target.closest('#shield-drop'))
    d.style.display='none';
});
