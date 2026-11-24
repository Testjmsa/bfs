/* =========================================================
   BFS CRM — সংযোগ সেটিং
   নিচের দুটো ঘর খালি থাকলে CRM "DEMO MODE"-এ চলে (ডেটা শুধু এই ব্রাউজারে থাকে)।
   আসল অফিসে ব্যবহারের জন্য Supabase project খুলে URL আর anon key বসান।
   বিস্তারিত: SETUP-GUIDE.txt
   (anon key গোপন না — সুরক্ষা আসে supabase/schema.sql-এর Row Level Security থেকে)
   ========================================================= */
window.CRM_CONFIG = {
  supabaseUrl: "https://fluapiazsxexpogpqffw.supabase.co",      // যেমন "https://abcdxyz.supabase.co"
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsdWFwaWF6c3hleHBvZ3BxZmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MjY2MzIsImV4cCI6MjExMDQwMjYzMn0.IOQR7AxpX7hiEiihZ06sGOa9rGthB2-sqWBroMjHCMY",      // Project Settings → API → "anon public" key
  loginDomain: "staff.bfscrm.app",   // Login ID-র পেছনে ভেতরে ভেতরে এটা বসে (যেমন rakib → rakib@staff.bfscrm.app)। চালুর পর বদলাবেন না
  defaultPassword: "12345678",       // নতুন কর্মীর প্রথম পাসওয়ার্ড। প্রথম login-এ CRM নিজের পাসওয়ার্ড বসাতে বাধ্য করে। খালি ("") রাখলে প্রত্যেকের আলাদা random পাসওয়ার্ড হয়
  storeKey: "bfscrm5:",              // DEMO ডেটার নাম (ব্রাউজারে) — বদলানোর দরকার নেই
  maxUploadMB: 180,                  // একটা ফাইলের সর্বোচ্চ সাইজ (MB)। Supabase Free plan-এ ৫০ MB-এর বেশি চলে না — Pro plan-এ Storage settings থেকে বাড়াতে হয়
  // ওয়েবসাইট আর CRM আলাদা ঠিকানায় থাকলে দুটো ঠিকানা এখানে বসান (শেষে / ছাড়া)। খালি থাকলে একই ফোল্ডার ধরে নেয়
  websiteUrl: "https://bfsem.netlify.app",                    // যেমন "https://bfsam.netlify.app"
  crmUrl: "https://bfsam-crm.netlify.app",                        // যেমন "https://bfs-crm.netlify.app"
  orgName: "Bright Future by Sam",
  orgAddress: "Uttara, Dhaka",
};
