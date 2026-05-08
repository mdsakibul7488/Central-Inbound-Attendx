// ================================================
// Central Inbound AttendX — Google Apps Script
// ================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'attendance') {
      handleAttendance(ss, data);
    } else if (data.type === 'user') {
      handleUser(ss, data);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAttendance(ss, data) {
  let sheet = ss.getSheetByName('Attendance');
  if (!sheet) {
    sheet = ss.insertSheet('Attendance');
    sheet.appendRow(['Employee ID','Name','Date','Check In','Check Out','Status','Distance From Office','IP Address','Latitude','Longitude','Recorded At']);
    sheet.getRange(1,1,1,11).setFontWeight('bold').setBackground('#E8192C').setFontColor('white');
    sheet.setFrozenRows(1);
  }
  const allData = sheet.getDataRange().getValues();
  let existingRow = -1;
  for (let i=1; i<allData.length; i++) {
    if (allData[i][0]===data.eid && allData[i][2]===data.date) { existingRow=i+1; break; }
  }
  const row = [data.eid,data.name,data.date,data.checkIn||'',data.checkOut||'',data.status||'',data.distanceFromOffice||'N/A',data.ip||'',data.lat||'',data.lng||'',new Date().toISOString()];
  if (existingRow>0) { sheet.getRange(existingRow,1,1,11).setValues([row]); }
  else { sheet.appendRow(row); }
}

function handleUser(ss, data) {
  let sheet = ss.getSheetByName('Users');
  if (!sheet) {
    sheet = ss.insertSheet('Users');
    sheet.appendRow(['Employee ID','Name','Registered At']);
    sheet.getRange(1,1,1,3).setFontWeight('bold').setBackground('#E8192C').setFontColor('white');
    sheet.setFrozenRows(1);
  }
  const allData = sheet.getDataRange().getValues();
  const exists = allData.some(row => row[0]===data.eid);
  if (!exists) { sheet.appendRow([data.eid, data.name, data.createdAt||new Date().toISOString()]); }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'Central Inbound AttendX running' })).setMimeType(ContentService.MimeType.JSON);
}
