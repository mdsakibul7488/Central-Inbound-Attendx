# Central Inbound AttendX — Setup Guide

## ধাপ ১: Google Sheet + Apps Script

1. sheets.google.com → নতুন sheet → নাম: **Central Inbound AttendX**
2. Extensions → Apps Script → সব delete করে `google-apps-script.js` এর code paste করো
3. Save → Deploy → New deployment → Web app
4. Execute as: Me | Who has access: Anyone → Deploy → Allow
5. URL copy করো

## ধাপ ২: URL বসাও

`js/storage.js` এ:
```
SHEET_URL: 'তোমার-URL-এখানে',
```

## ধাপ ৩: Admin credentials পরিবর্তন করো

`js/storage.js` এ:
```
ADMIN_ID: 'তোমার-নতুন-ID',
ADMIN_PLAIN: 'তোমার-নতুন-password',
```

## ধাপ ৪: GitHub এ push করো

Changes করার পর GitHub এ upload করলে Netlify automatically deploy করবে।

## ধাপ ৫: Admin থেকে office location set করো

Admin Panel → 🛡 → Office Location & Radius → Use My Current Location & Save

## Default Admin Credentials (পরিবর্তন করো!)
- ID: ADMIN001
- Password: Admin@1234
