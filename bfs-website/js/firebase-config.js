/* =========================================================
   Firebase সেটআপ — স্টাফ পোর্টাল (staff.html) আর স্টুডেন্টের অনলাইন আবেদন (apply.html)
   Firebase console → Project settings → Your apps → Web app → "firebaseConfig" থেকে
   নিচের ঘরগুলো কপি করে বসান। (এগুলো গোপন না — সুরক্ষা আসে firestore.rules থেকে)
   বিস্তারিত: Downloads/bfs-firebase-setup/সেটআপ-গাইড.txt
   ========================================================= */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/* টাকা পাঠানোর নাম্বার/অ্যাকাউন্ট — স্টুডেন্টের পেমেন্ট পেজে দেখাবে। খালি থাকলে "অফিসে জিজ্ঞেস করুন" দেখাবে */
window.PAYMENT_INFO = {
  bkash: "",        // যেমন "01XXXXXXXXX (Personal)" বা "Merchant: 01XXXXXXXXX"
  nagad: "",
  bank: "",         // যেমন "Bright Future by Sam, A/C 1234567890, Dutch-Bangla Bank, Uttara Branch"
};
