const LANG = {
  en: {
    'lbl-good-morning':'Good morning','lbl-good-afternoon':'Good afternoon',
    'lbl-good-evening':'Good evening','lbl-good-night':'Good night',
    'lbl-name':'Full Name','lbl-eid':'Employee ID',
    'hint-eid':'Format: C, S or M + space + 4-6 digits',
    'lbl-pass':'Password','lbl-pin':'4-Digit PIN',
    'hint-pin':'Used when fingerprint unavailable',
    'lbl-have-acc':'Already have an account?','lbl-go-login':'Sign in',
    'lbl-login-eid':'Employee ID','lbl-login-pass':'Password',
    'lbl-no-acc':"Don't have an account?",'lbl-go-signup':'Sign up',
    'lbl-checkin':'Check In','lbl-checkout':'Check Out',
    'lbl-checked-in':'Checked In','lbl-checked-out':'Checked Out','lbl-not-marked':'Not Marked',
    'lbl-today':"Today's Status",'lbl-history':'Last 3 Days','lbl-view-all':'View all',
    'lbl-settings':'Settings','lbl-distance':'Distance from office',
    'lbl-present':'Present','lbl-absent':'Absent','lbl-dayoff':'Day Off','lbl-exchange':'Exchange',
    'lbl-location-saved':'Office location saved!',
    'err-name-req':'Name is required',
    'err-eid-format':'Format: C, S or M + space + 4-6 digits (e.g. C 00123)',
    'err-pass-short':'Password must be at least 8 characters',
    'err-pass-format':'Password must contain both letters and numbers',
    'err-pin-digits':'PIN must be exactly 4 digits',
    'err-eid-taken':'This Employee ID is already registered',
    'err-login-fail':'Invalid Employee ID or password',
    'err-admin-fail':'Invalid admin credentials',
    'err-pin-wrong':'Incorrect PIN. Try again.',
    'err-location':'Could not get your location. Please allow location access.',
    'msg-signup-ok':'Account created successfully!',
    'msg-checkin-ok':'Checked in successfully!',
    'msg-checkout-ok':'Checked out successfully!',
    'msg-settings-ok':'Settings saved!',
    'msg-pin-changed':'PIN changed successfully!',
    'msg-pass-changed':'Password changed successfully!',
    'msg-fp-success':'Fingerprint verified!',
    'msg-already-checkin':'You already checked in today.',
    'msg-already-checkout':'You already checked out today.',
    'msg-checkin-first':'Please check in first.',
  },
  bn: {
    'lbl-good-morning':'শুভ সকাল','lbl-good-afternoon':'শুভ অপরাহ্ন',
    'lbl-good-evening':'শুভ সন্ধ্যা','lbl-good-night':'শুভ রাত্রি',
    'lbl-name':'পূর্ণ নাম','lbl-eid':'কর্মচারী আইডি',
    'hint-eid':'ফরম্যাট: C, S বা M + স্পেস + ৪-৬ সংখ্যা',
    'lbl-pass':'পাসওয়ার্ড','lbl-pin':'৪ সংখ্যার পিন',
    'hint-pin':'ফিঙ্গারপ্রিন্ট না থাকলে এটি ব্যবহার হবে',
    'lbl-have-acc':'আগে থেকে অ্যাকাউন্ট আছে?','lbl-go-login':'সাইন ইন করুন',
    'lbl-login-eid':'কর্মচারী আইডি','lbl-login-pass':'পাসওয়ার্ড',
    'lbl-no-acc':'অ্যাকাউন্ট নেই?','lbl-go-signup':'সাইন আপ করুন',
    'lbl-checkin':'চেক ইন','lbl-checkout':'চেক আউট',
    'lbl-checked-in':'চেক ইন হয়েছে','lbl-checked-out':'চেক আউট হয়েছে','lbl-not-marked':'মার্ক হয়নি',
    'lbl-today':'আজকের অবস্থা','lbl-history':'শেষ ৩ দিন','lbl-view-all':'সব দেখুন',
    'lbl-settings':'সেটিংস','lbl-distance':'অফিস থেকে দূরত্ব',
    'lbl-present':'উপস্থিত','lbl-absent':'অনুপস্থিত','lbl-dayoff':'ছুটি','lbl-exchange':'এক্সচেঞ্জ',
    'lbl-location-saved':'অফিসের অবস্থান সংরক্ষিত হয়েছে!',
    'err-name-req':'নাম আবশ্যক',
    'err-eid-format':'ফরম্যাট: C, S বা M + স্পেস + ৪-৬ সংখ্যা',
    'err-pass-short':'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
    'err-pass-format':'পাসওয়ার্ডে অক্ষর ও সংখ্যা উভয়ই থাকতে হবে',
    'err-pin-digits':'পিন অবশ্যই ৪ সংখ্যার হতে হবে',
    'err-eid-taken':'এই কর্মচারী আইডি ইতিমধ্যে নিবন্ধিত',
    'err-login-fail':'ভুল কর্মচারী আইডি বা পাসওয়ার্ড',
    'err-admin-fail':'ভুল অ্যাডমিন তথ্য',
    'err-pin-wrong':'ভুল পিন। আবার চেষ্টা করুন।',
    'err-location':'অবস্থান পাওয়া যায়নি। লোকেশন অ্যাক্সেস দিন।',
    'msg-signup-ok':'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
    'msg-checkin-ok':'সফলভাবে চেক ইন হয়েছে!',
    'msg-checkout-ok':'সফলভাবে চেক আউট হয়েছে!',
    'msg-settings-ok':'সেটিংস সংরক্ষিত হয়েছে!',
    'msg-pin-changed':'পিন সফলভাবে পরিবর্তিত হয়েছে!',
    'msg-pass-changed':'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!',
    'msg-fp-success':'ফিঙ্গারপ্রিন্ট যাচাই হয়েছে!',
    'msg-already-checkin':'আজ ইতিমধ্যে চেক ইন করা হয়েছে।',
    'msg-already-checkout':'আজ ইতিমধ্যে চেক আউট করা হয়েছে।',
    'msg-checkin-first':'আগে চেক ইন করুন।',
  }
};

let currentLang = localStorage.getItem('lang') || 'en';
function t(key) { return (LANG[currentLang]||{})[key] || (LANG['en']||{})[key] || key; }
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim()===(lang==='en'?'English':'বাংলা'));
  });
  applyLang();
}
function applyLang() {
  const ids = ['lbl-name','lbl-eid','hint-eid','lbl-pass','lbl-pin','hint-pin',
    'lbl-have-acc','lbl-go-login','lbl-login-eid','lbl-login-pass','lbl-no-acc','lbl-go-signup'];
  ids.forEach(id => { const el=document.getElementById(id); if(el) el.textContent=t(id); });
}
document.addEventListener('DOMContentLoaded', applyLang);
