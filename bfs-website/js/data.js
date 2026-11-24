/* =========================================================
   BFS WEBSITE — সব তথ্য এই ফাইলে (বাংলা + English)
   লেখা বদলাতে শুধু এখানে এডিট করুন — EDIT-GUIDE.txt দেখুন
   ========================================================= */

const CONFIG = {
  brand: "Bright Future by Sam",
  chatWhatsapp: "8801884098203",                    // লাইভ চ্যাট ও বুকিং এই নাম্বারে যাবে (আপাতত)
  officeWhatsapp: ["8801712344868", "8801341084428"],
  phoneDisplay: ["+880 1712-344868", "+880 1341-084428"],
  chatDisplay: "+880 1884-098203",
  address: { bn: "হাউস নং ৫৬, সেক্টর ১৩, গরীবে নেওয়াজ এভিনিউ (জমজম টাওয়ার মোড়), উত্তরা, ঢাকা",
             en: "House 56, Sector 13, Gareeb-E-Newaz Ave (Zam Zam Tower mor), Uttara, Dhaka" },
  mapQuery: "Zam Zam Tower, Gareeb-E-Newaz Ave, Sector 13, Uttara, Dhaka",
  officeDays: [6, 0, 1, 2, 3, 4],   // 0=রবি … 5=শুক্র, 6=শনি → শুক্রবার বন্ধ (VERIFY)
  officeSlots: ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"],
  myrToBdt: 31.5,                   // ১ রিংগিত = ৩১.৫ টাকা ধরে হিসাব
  emgsDefault: 2500,                // যে ইউনিভার্সিটির EMGS/ভিসা ফি জানা নেই — আনুমানিক (RM)
  livingMonthly: 1370,              // থাকা-খাওয়া প্রতি মাসে আনুমানিক (RM)
  sheetUrl: "https://script.google.com/macros/s/AKfycbxAFMppru_1--2JpnnbY1Y6Y5-0KRbzcoQtt2EymQ55Sr2Fiokip210KdA4L3IAWFj7lA/exec",                     // google-sheet-script.txt দেখুন
  tawkId: "",                       // Tawk.to ফ্রি লাইভ চ্যাট — "propertyId/widgetId" বসালে কাউন্সেলর সাইটেই চ্যাট করতে পারবেন
  facebook: "",
};

/* EMGS / ভিসা প্রসেসিং ফি (RM) — প্রতিটা ইউনিভার্সিটির অফিশিয়াল ওয়েবসাইট থেকে (যাচাই: ২৮ অক্টোবর ২০২৬)।
   ফি প্রায়ই বদলায় — url-এ গিয়ে নতুন সংখ্যা দেখে rm বদলে দিন। যেটা নেই, সেখানে emgsDefault (আনুমানিক) দেখাবে।
   inFee: true = প্রোগ্রামের মোট ফি-তে ভিসা ফি আগেই ধরা আছে, তাই খরচের হিসাবে আবার যোগ হবে না। */
const EMGS = {
  segi: { rm: 3150, inFee: true, url: "https://university.segi.edu.my/international-students/", src: { bn: "SEGi ওয়েবসাইট — ভর্তি ও ভিসা আবেদন ফি (প্রোগ্রামের মোট ফি-তে ধরা)", en: "SEGi website — admission & visa application fee (included in programme totals)" } },
  city: { rm: 3810, url: "https://city.edu.my/admission-scholarships/international-students/", src: { bn: "City University ওয়েবসাইট — আবেদন ও EMGS ভিসা ফি (আনুমানিক)", en: "City University website — application & EMGS visa fee (approx.)" } },
  lincoln: { rm: 3500, url: "https://web.lincoln.edu.my/Student/frequently_asked_questions", src: { bn: "Lincoln ২০২৬ ফি-শিট (ওয়েবসাইটে লেখা USD 800 — প্রায় একই)", en: "Lincoln 2026 fee sheet (website says USD 800 — about the same)" } },
  alfa: { rm: 3500, src: { bn: "ALFA ২০২৫ ফি-শিট (ওয়েবসাইটে ভিসা ফি দেওয়া নেই)", en: "ALFA 2025 fee sheet (no visa fee on the website)" } },
  inti: { rm: 3600, url: "https://newinti.edu.my/international-students/how-to-apply/", src: { bn: "INTI — আবেদন ও EMGS ভিসা প্রসেসিং (মোট, অফিসের হিসাব)", en: "INTI — application & EMGS visa processing (total, office figure)" } },
  ucsi: { rm: 3100, url: "https://www.ucsiuniversity.edu.my/admission-procedure/international/Kuala-lumpur", src: { bn: "UCSI ওয়েবসাইট — আবেদন ফি (EMGS সহ, প্রথম বছর)", en: "UCSI website — application fee incl. EMGS (first year)" } },
  taylors: { rm: 1657, url: "https://university.taylors.edu.my/content/dam/taylorsrevamp/university/study/scholarships-and-financial-aid/fees-schedule/school-of-computer-science/undergraduate/taylors-computer-ug-fees-usd-v211024.pdf", src: { bn: "Taylor's ফি-শিডিউল — EMGS ভিসা আবেদন ফি (৩ বছরের কোর্স)", en: "Taylor's fee schedule — EMGS visa application fee (3-year course)" } },
  apu: { rm: 3400, url: "https://publicwebsite-media.apu.edu.my/assets/2026-02/e2026Jan-APU%20Fee%20Guide_Int%20UG_3.8.pdf", src: { bn: "APU ২০২৬ ফি-গাইড — আবেদন ও EMGS ভিসা প্রসেসিং (ভিসা পাওয়ার পর আরও RM ২,০০০)", en: "APU 2026 fee guide — application & EMGS visa processing (another RM 2,000 after visa approval)" } },
  cyberjaya: { rm: 2800, inFee: true, url: "https://cyberjaya.edu.my/admission/financial-aid-options/fees-structure-international", src: { bn: "Cyberjaya ওয়েবসাইট — EMGS ফি (প্রোগ্রামের মোট ফি-তে ধরা)", en: "Cyberjaya website — EMGS fee (included in programme totals)" } },
  nottingham: { rm: 3900, url: "https://www.nottingham.edu.my/International/Offerholders/Visasandimmigration/New-students.aspx", src: { bn: "Nottingham ওয়েবসাইট — Student Pass প্রসেসিং ফি (এর বাইরে RM ২,০০০ ফেরতযোগ্য ডিপোজিট)", en: "Nottingham website — Student Pass processing fee (plus RM 2,000 refundable deposit)" } },
  uow: { rm: 3200, url: "https://www.uow.edu.my/study-at-uow-malaysia/international-student/application/", src: { bn: "UOW ওয়েবসাইট — EMGS ফি", en: "UOW website — EMGS fee" } },
  unitar: { rm: 2700, url: "https://www.unitar.my/admissions/international-student/", src: { bn: "UNITAR ওয়েবসাইট — আবেদন ফি (EMGS সহ, প্রথম বছর)", en: "UNITAR website — application fee incl. EMGS (first year)" } },
  nilai: { rm: 1310, url: "https://www.nilai.edu.my/sites/default/files/e-brochure/NU_FEE_INT_%202709203%20(2).pdf", src: { bn: "Nilai ফি-শিট — ভিসা আবেদন RM ১,০৬০ + হেলথ স্ক্রিনিং RM ২৫০ (ইন্স্যুরেন্স আলাদা)", en: "Nilai fee sheet — visa application RM 1,060 + health screening RM 250 (insurance extra)" } },
  bac: { rm: 4600, url: "https://www.bac.edu.my/bac/applying-for-your-student-visa/", src: { bn: "BAC ওয়েবসাইট — স্টুডেন্ট ভিসা পেমেন্ট", en: "BAC website — student visa payment" } },
  lsbf: { rm: 3000, url: "https://lsbf.edu.my/admissions/international-students/", src: { bn: "LSBF ওয়েবসাইট — আবেদন ও স্টুডেন্ট ভিসা প্রসেসিং ফি", en: "LSBF website — application & student visa processing fee" } },
  klust: { rm: 3100, url: "https://klust.edu.my/admissions/international-students/", src: { bn: "KLUST ওয়েবসাইট — ইন্টারন্যাশনাল প্রসেসিং ফি", en: "KLUST website — international processing fee" } },
  genovasi: { rm: 3150, url: "https://www.genovasi.edu.my/copy-of-malaysia", src: { bn: "Genovasi ওয়েবসাইট — আবেদন ও EMGS ভিসা ফি (আনুমানিক)", en: "Genovasi website — application & EMGS visa fee (approx.)" } },
};

/* লেভেল অনুযায়ী ডকুমেন্ট চেকলিস্ট — req: true = অবশ্যই লাগবে */
const DOCS_BY_LEVEL = {
  ssc: [
    { id: "passport", req: true, t: { bn: "পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ)", en: "Passport (valid 18+ months)" } },
    { id: "ssc", req: true, t: { bn: "SSC সার্টিফিকেট ও মার্কশিট", en: "SSC certificate & marksheet" } },
    { id: "photo", req: true, t: { bn: "পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)", en: "Passport photo (white background)" } },
  ],
  hsc: [
    { id: "passport", req: true, t: { bn: "পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ)", en: "Passport (valid 18+ months)" } },
    { id: "ssc", req: true, t: { bn: "SSC সার্টিফিকেট ও মার্কশিট", en: "SSC certificate & marksheet" } },
    { id: "hsc", req: true, t: { bn: "HSC সার্টিফিকেট ও মার্কশিট", en: "HSC certificate & marksheet" } },
    { id: "english", req: true, t: { bn: "English Proficiency রেজাল্ট — IELTS / PTE / TOEFL / Linguaskill / Duolingo (HSC-র পর অবশ্যই লাগবে)", en: "English proficiency result — IELTS / PTE / TOEFL / Linguaskill / Duolingo (required after HSC)" } },
    { id: "photo", req: true, t: { bn: "পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)", en: "Passport photo (white background)" } },
  ],
  diploma: [
    { id: "passport", req: true, t: { bn: "পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ)", en: "Passport (valid 18+ months)" } },
    { id: "ssc", req: true, t: { bn: "SSC সার্টিফিকেট ও মার্কশিট", en: "SSC certificate & marksheet" } },
    { id: "diploma", req: true, t: { bn: "Diploma সার্টিফিকেট ও ট্রান্সক্রিপ্ট", en: "Diploma certificate & transcript" } },
    { id: "english", req: true, t: { bn: "English Proficiency রেজাল্ট (Bachelor's-এর জন্য লাগবে)", en: "English proficiency result (needed for a Bachelor's)" } },
    { id: "photo", req: true, t: { bn: "পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)", en: "Passport photo (white background)" } },
  ],
  bachelor: [
    { id: "passport", req: true, t: { bn: "পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ)", en: "Passport (valid 18+ months)" } },
    { id: "ssc", req: true, t: { bn: "SSC সার্টিফিকেট ও মার্কশিট", en: "SSC certificate & marksheet" } },
    { id: "hsc", req: true, t: { bn: "HSC সার্টিফিকেট ও মার্কশিট", en: "HSC certificate & marksheet" } },
    { id: "bachelor", req: true, t: { bn: "Bachelor's সার্টিফিকেট ও ট্রান্সক্রিপ্ট", en: "Bachelor's certificate & transcript" } },
    { id: "cv", req: false, t: { bn: "CV (কাজের অভিজ্ঞতা থাকলে)", en: "CV (if you have work experience)" } },
    { id: "english", req: false, t: { bn: "English টেস্ট রেজাল্ট (থাকলে ভালো — Master's-এ বাধ্যতামূলক নয়)", en: "English test result (helpful — not required for Master's)" } },
    { id: "photo", req: true, t: { bn: "পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)", en: "Passport photo (white background)" } },
  ],
  master: [
    { id: "passport", req: true, t: { bn: "পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ)", en: "Passport (valid 18+ months)" } },
    { id: "ssc", req: true, t: { bn: "SSC ও HSC সার্টিফিকেট", en: "SSC & HSC certificates" } },
    { id: "bachelor", req: true, t: { bn: "Bachelor's সার্টিফিকেট ও ট্রান্সক্রিপ্ট", en: "Bachelor's certificate & transcript" } },
    { id: "master", req: true, t: { bn: "Master's সার্টিফিকেট ও ট্রান্সক্রিপ্ট", en: "Master's certificate & transcript" } },
    { id: "proposal", req: true, t: { bn: "Research Proposal (PhD-র জন্য)", en: "Research proposal (for PhD)" } },
    { id: "cv", req: true, t: { bn: "CV", en: "CV" } },
    { id: "photo", req: true, t: { bn: "পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)", en: "Passport photo (white background)" } },
  ],
};
const EDU_LABEL = { ssc: "SSC / O-Level", hsc: "HSC / A-Level", diploma: "Diploma", bachelor: "Bachelor's", master: "Master's" };

const TEAM = [
  { name: "Ummay Sadia Sami", role: { bn: "সিইও ও প্রতিষ্ঠাতা", en: "CEO & Founder" }, photo: "images/team/ummay-sadia-sami.jpg" },
];

const WHY_MALAYSIA = [
  { icon: "globe", title: { bn: "১–২ বছর পর UK, USA, Australia-য় Credit Transfer", en: "Credit transfer to UK, USA, Australia & Europe after 1–2 years" },
    text: { bn: "Malaysia-তে ১–২ বছর পড়ে শর্ত পূরণ করলে Credit Transfer করে ওসব দেশে যাওয়ার সুযোগ — যারা ভিসার অপেক্ষায় বা রিজেক্ট হয়েছেন তাদের জন্য স্মার্ট অপশন।",
            en: "Study 1–2 years in Malaysia, meet the conditions and transfer your credits abroad — a smart route if you've been waiting for or refused a visa." } },
  { icon: "bolt", title: { bn: "২০–৩০ দিনে Student Visa", en: "Student visa in 20–30 days" },
    text: { bn: "সব ডকুমেন্ট ঠিক থাকলে Malaysia-র স্টুডেন্ট ভিসা সাধারণত ২০–৩০ দিনে হয়ে যায়।", en: "With complete documents, a Malaysian student visa usually takes 20–30 days." } },
  { icon: "doc", title: { bn: "IELTS ও Bank Statement ছাড়াই", en: "No IELTS, no bank statement" },
    text: { bn: "SSC-র পর ও Master's-এ IELTS লাগে না। Bachelor's-এর মেইন কোর্সে একটি English টেস্ট লাগে — কিন্তু ভিসা হয় এটা ছাড়াই।", en: "No IELTS after SSC or for Master's. Bachelor's main courses need an English test — but your visa is issued without it." } },
  { icon: "wallet", title: { bn: "সাশ্রয়ী টিউশন ফি", en: "Affordable tuition" },
    text: { bn: "বছরে টিউশন RM ১৩,০০০ থেকে শুরু — বাজেট অনুযায়ী ভালো মানের ইউনিভার্সিটি; মান UK, USA, Australia-র সমমান।", en: "Tuition from around RM 13,000 a year — quality universities for every budget, on par with the UK, USA and Australia." } },
  { icon: "home", title: { bn: "কম খরচে আরামের থাকা", en: "Low living cost" },
    text: { bn: "রুম ভাড়া ৪০০ RM থেকে, Fully Furnished রুম; অনেক বাসায় Free Swimming Pool ও Gym।", en: "Rooms from RM 400, fully furnished — many with free swimming pool and gym." } },
  { icon: "cap", title: { bn: "SSC-র পরেই আবেদন", en: "Apply right after SSC" },
    text: { bn: "SSC-র পর Foundation বা Diploma; Foundation ১ বছর শেষে সরাসরি Bachelor's।", en: "Start Foundation or Diploma after SSC — one year of Foundation leads straight to a Bachelor's." } },
  { icon: "family", title: { bn: "Spouse ও সন্তান নিয়ে যাওয়া যায়", en: "Bring your spouse & children" },
    text: { bn: "Master's ও PhD-তে Spouse ও সন্তানকে সাথে নেওয়া যায়।", en: "Master's and PhD students can bring their spouse and children." } },
];

const SERVICES = [
  { icon: "plane", t: { bn: "ফ্রি এয়ারপোর্ট পিকআপ", en: "Free airport pickup" } },
  { icon: "home", t: { bn: "ফ্রি বাসা দেখিয়ে দেওয়া", en: "Free help finding a place to live" } },
  { icon: "mic", t: { bn: "ইন্টারভিউ ট্রেনিং", en: "Interview training" } },
  { icon: "doc", t: { bn: "ইন্টারন্যাশনাল CV তৈরি", en: "International CV making" } },
  { icon: "phone", t: { bn: "২৪/৭ হটলাইন", en: "24/7 hotline" } },
  { icon: "hand", t: { bn: "মালয়েশিয়ায় ১ মাস সাপোর্ট", en: "1-month student support in Malaysia" } },
];

const FIELDS = {
  business: { bn: "বিজনেস / অ্যাকাউন্টিং", en: "Business & Accounting" },
  it: { bn: "IT / কম্পিউটার সায়েন্স", en: "IT & Computer Science" },
  engineering: { bn: "ইঞ্জিনিয়ারিং / আর্কিটেকচার", en: "Engineering & Architecture" },
  medical: { bn: "মেডিসিন / ডেন্টাল / ফার্মেসি", en: "Medicine, Dental & Pharmacy" },
  health: { bn: "নার্সিং / হেলথ সায়েন্স", en: "Nursing & Health Science" },
  design: { bn: "ডিজাইন / মিডিয়া", en: "Design & Media" },
  hospitality: { bn: "হোটেল / ট্যুরিজম", en: "Hospitality & Tourism" },
  education: { bn: "এডুকেশন", en: "Education" },
  psychology: { bn: "সাইকোলজি", en: "Psychology" },
  law: { bn: "ল / ইসলামিক স্টাডিজ", en: "Law & Islamic Studies" },
  science: { bn: "সায়েন্স / বায়োটেক", en: "Science & Biotech" },
  arts: { bn: "আর্টস / ভাষা / সোশ্যাল সায়েন্স", en: "Arts, Languages & Social Science" },
  english: { bn: "ইংলিশ কোর্স", en: "English Programme" },
};

/* কোন গ্রুপ থেকে কোন বিষয় বেছে নেওয়া যাবে (Eligibility চেক ও বুকিং ফর্ম)। বাকি বিষয় দেখা যাবে, কিন্তু বেছে নেওয়া যাবে না।
   "other" (অন্যান্য) = সব বিষয় খোলা। বদলাতে চাইলে এখানে বিষয়ের নাম যোগ/বাদ দিন। */
const GROUP_FIELDS = {
  science: ["it", "engineering", "medical", "health", "science", "psychology"],
  commerce: ["business", "hospitality", "education", "law"],
  arts: ["arts", "law", "education", "psychology", "design", "hospitality"],
};
const fieldOk = (group, f) => f === "any" || !GROUP_FIELDS[group] || GROUP_FIELDS[group].includes(f);

const LEVEL_NAME = {
  E: { bn: "ইংলিশ প্রোগ্রাম", en: "English" }, C: { bn: "সার্টিফিকেট", en: "Certificate" },
  F: { bn: "ফাউন্ডেশন", en: "Foundation" }, D: { bn: "ডিপ্লোমা", en: "Diploma" },
  B: { bn: "ব্যাচেলর", en: "Bachelor's" }, M: { bn: "মাস্টার্স", en: "Master's" }, P: { bn: "পিএইচডি", en: "PhD" },
};

/* প্রোগ্রাম: [লেভেল, ফিল্ড, নাম, বছর, ফি (RM), সর্বোচ্চ ফি (ঐচ্ছিক)]
   ফি = আনুমানিক মোট কোর্স ফি — কম-বেশি হতে পারে (±) */
const UNIVERSITIES = [
  { id: "segi", name: "SEGi University & Colleges", city: "Kota Damansara, Selangor", type: "private", ct: true, featured: true,
    about: { bn: "মেডিসিন থেকে বিজনেস — প্রায় সব বিষয় পড়ানো হয়। অনেক কোর্সে UK-র University of Chichester-এর সাথে Credit Transfer।",
             en: "Covers almost every field from medicine to business, with UK credit transfer to the University of Chichester on many courses." },
    highlights: [{ bn: "UK Credit Transfer (Chichester)", en: "UK credit transfer (Chichester)" }, { bn: "মেডিকেল, ডেন্টাল, ফার্মেসি", en: "Medicine, dentistry & pharmacy" }, { bn: "KL, Subang, Penang-এও ক্যাম্পাস", en: "Campuses in KL, Subang & Penang" }],
    feeNote: { bn: "SEGi University Kota Damansara ২০২৬ ইন্টারন্যাশনাল ফি (রেজিস্ট্রেশন, ভিসা ও SST সহ মোট)", en: "SEGi University Kota Damansara 2026 international fees (grand total incl. registration, visa & SST)" },
    programs: [
      ["E","english","Intensive English Programme (Full Module)",0.5,30462],["E","english","Certificate of English Proficiency (CEP)",0.5,29210],
      ["C","business","Certificate in Business Studies",1,31871],["C","it","Certificate in Information Technology",1,31871],["C","hospitality","Certificate in Hotel Operations",1,31871],["C","education","Certificate in Early Child Education",1,31871],["C","engineering","Certificate in Welding Technology",1,41278],
      ["F","science","Foundation in Science",1,39828],["F","business","Foundation in Arts",1,38068],
      ["D","business","Diploma in Business Administration",2.5,60268],["D","business","Diploma of Accountancy",2.5,60268],["D","business","Diploma in Logistics & Supply Chain Management",2.5,60268],["D","design","Diploma in Mass Communications",2.5,60268],["D","it","Diploma in Information Technology",2.5,64024],["D","it","Diploma in Computer Science",2.5,60268],["D","hospitality","Diploma in Hotel Management",2.5,61904],["D","hospitality","Diploma in Culinary Art",2.5,61904],["D","education","Diploma in Early Childhood Education",2.5,55544],["D","psychology","Diploma in Psychology",2.5,60268],
      ["B","medical","Bachelor of Medicine & Surgery (MBBS)",5,420064],["B","medical","Bachelor of Dental Surgery (BDS)",5,423212],["B","medical","Bachelor of Pharmacy (Hons)",4,174914],["B","health","Bachelor of Optometry (Hons)",4,141524],["B","health","Bachelor of Physiotherapy (Hons)",4,131868],["B","health","Bachelor of Biomedical Science (Hons)",3,132034],
      ["B","business","Bachelor of Business Management (Hons) — UK Credit Transfer",3,101500],["B","business","Bachelor of Accounting & Finance (Hons) — UK Credit Transfer",3,96492],["B","business","Bachelor of International Business (Hons)",3,94759],
      ["B","it","Bachelor of Computer Science (Hons)",3,102576],["B","it","Bachelor of Information Technology (Hons) — UK Credit Transfer",3,101500],
      ["B","engineering","Bachelor of Electrical / Civil / Mechanical / Chemical / Mechatronics Engineering — UK Credit Transfer",4,134380],["B","engineering","Bachelor of Science (Hons) Architecture",3,115487],["B","engineering","Bachelor of Arts (Hons) Interior Architecture",3.5,105315],["B","engineering","Bachelor in Quantity Surveying",3.5,92653],
      ["B","design","Bachelor of Mass Communications (Hons) — UK Credit Transfer",3,104590],["B","design","BA (Hons) Visual Communication Design",3,95453],["B","design","BA (Hons) Multimedia Design",3,95453],["B","arts","BA (Hons) English & Public Relations — UK Credit Transfer",3,99025],["B","arts","Bachelor of Music (Hons)",3,95453],
      ["B","hospitality","Bachelor of Hospitality Management (Hons) — UK Credit Transfer",3,101500],["B","education","Bachelor of Education (Hons) — UK Credit Transfer",3,105618],["B","psychology","Bachelor of Psychology (Hons)",3,104914],
      ["M","business","MBA (Finance / Marketing / HRM / Global Business) — UK Credit Transfer",1.5,62363],["M","business","MBA (8 Modules)",1,54116],["M","business","Master of Accountancy",1.5,63232],["M","business","Master in Financial Planning",1.5,60005],["M","business","MSc (Management) by Research",2,60734],["M","design","MA in Corporate Communications",2,54666],["M","design","Master in Creative Design Management",1.5,55611],["M","law","Master of Law (LL.M) Advanced Legal Practice",1.5,60005],
      ["M","education","Master of Education (Coursework)",1.5,52214],["M","education","Master of Education by Research",2,56335],["M","it","MSc Information Technology (Coursework)",1.5,53200],["M","it","MSc (Information Technology) by Research",2,59674],["M","engineering","MSc (Engineering) by Research",2,66130],["M","psychology","Master of Social Science in Psychology",1.5,55611],["M","health","Master of Medical Science (Non-Lab)",2,57226],["M","health","Master of Medical Science (Lab)",2,65462],["M","health","MSc (Vision Science) by Research",2,63459],["M","medical","MSc (Pharmaceutical Sciences) by Research",2,57226],["M","science","MSc Environmental Sustainability with AI",1.5,55611],
      ["P","business","Doctor of Business Administration (DBA)",3,90286],["P","business","PhD (Management)",3,77820],["P","it","PhD (Information Technology)",3,77820],["P","education","PhD (Education)",3,86501],["P","engineering","PhD (Engineering)",3,86501],["P","health","PhD in Medical Science (Non-Lab)",3,69854],["P","health","PhD in Medical Science (Lab)",3,85754],
    ] },

  { id: "inti", name: "INTI International University & Colleges", city: "Subang Jaya / Nilai / KL", type: "private", ct: true,
    about: { bn: "UK, Australia ও USA-র ইউনিভার্সিটির ডিগ্রি মালয়েশিয়াতেই (3+0) — Hertfordshire, Swinburne, Sheffield Hallam, SNHU।",
             en: "Earn UK, Australian or US degrees entirely in Malaysia (3+0) — Hertfordshire, Swinburne, Sheffield Hallam and SNHU." },
    highlights: [{ bn: "3+0 বিদেশি ডিগ্রি", en: "3+0 foreign degrees" }, { bn: "American Degree Transfer", en: "American Degree Transfer" }, { bn: "একাধিক ক্যাম্পাস", en: "Multiple campuses" }],
    feeNote: { bn: "INTI International College Subang ২০২৫ — আনুমানিক টিউশন ফি", en: "INTI International College Subang 2025 — approximate tuition fees" },
    programs: [
      ["E","english","Intensive English Program (per 8-week level)",0.2,5000],
      ["C","design","Certificate in Art & Design",1.3,16860],["C","business","Certificate in Business Studies",1.3,15956],["C","it","Certificate in Information Technology",1.6,16332],["C","hospitality","Certificate in Hotel Operations",1.3,15279],
      ["F","business","Foundation (Business / IT / Design / Science / Arts)",1,21112],["F","science","Cambridge A-Level (3 subjects)",1.5,29997],["F","business","American Degree Transfer Program",2,44380],
      ["D","business","Diploma in Business",2,35787],["D","business","Diploma in Marketing",2,38639],["D","business","Diploma in Financial Informatics",2,42986],["D","design","Diploma in Mass Communication",2,41940],["D","design","Diploma in Digital Media",2,45416],["D","design","Diploma in Graphic Design",2.3,47625],["D","design","Diploma in Interior Design",2.3,42795],["D","design","Diploma in Fashion Design",2.3,49437],["D","design","Diploma in Digital Media Design",2.3,45798],["D","it","Diploma in Information Technology",2,42260],["D","it","Diploma in Computer Science",2,44380],["D","engineering","Diploma in Quantity Surveying",2.5,43062],["D","hospitality","Diploma in Culinary Arts",2,47396],["D","hospitality","Diploma in Hotel Management",2,43744],
      ["B","business","BA (Hons) Accounting & Finance — Univ. of Hertfordshire, UK (3+0)",3,81370],["B","business","BA (Hons) Business / Finance / Marketing — Univ. of Hertfordshire, UK (3+0)",3,81340],["B","business","Bachelor of Business — Swinburne, Australia (3+0)",3,86882],["B","business","BSc Business Administration — SNHU, USA (4+0)",4,93560],
      ["B","design","BA (Hons) Mass Communication — Univ. of Hertfordshire, UK",3,80450],["B","design","Bachelor of Media & Communication — Swinburne, Australia",3,86900],["B","design","BA (Hons) Graphic Design — Sheffield Hallam, UK",3,83324],["B","design","BA (Hons) Fashion Management & Communication — Sheffield Hallam, UK",3,83330],["B","engineering","BA (Hons) Interior Architecture & Design — Sheffield Hallam, UK",3.5,88688],
      ["B","it","Bachelor of Computer Science — Swinburne, Australia (3+0)",3,86900],["B","it","Bachelor of ICT — Swinburne, Australia (3+0)",3,86900],["B","arts","BA in Communication — SNHU, USA (4+0)",4,93560],["B","psychology","BA in Psychology — SNHU, USA (4+0)",4,95744],["B","hospitality","Bachelor of Food Service Management with Culinary Arts — CY Cergy Paris",3,84977],
    ] },

  { id: "um", name: "Universiti Malaya (UM)", city: "Kuala Lumpur", type: "public", top: true,
    about: { bn: "মালয়েশিয়ার সবচেয়ে পুরনো ও সবচেয়ে উঁচু র‍্যাংকের পাবলিক ইউনিভার্সিটি। ভালো রেজাল্ট লাগে।",
             en: "Malaysia's oldest and highest-ranked public university. Strong academic results are required." },
    highlights: [{ bn: "দেশের ১ নম্বর পাবলিক ইউনিভার্সিটি", en: "Malaysia's top public university" }, { bn: "বিশ্ব র‍্যাংকিংয়ে শীর্ষে", en: "Highly ranked worldwide" }, { bn: "কুয়ালালামপুর শহরে ক্যাম্পাস", en: "Campus in Kuala Lumpur city" }],
    feeNote: { bn: "Universiti Malaya ব্যাচেলর ২০২৫/২০২৬ — ইন্টারন্যাশনাল টিউশন ফি (থাকা-খাওয়া আলাদা)", en: "Universiti Malaya bachelor's 2025/2026 — international tuition (accommodation not included)" },
    programs: [
      ["B","medical","Bachelor of Medicine & Bachelor of Surgery (MBBS)",5,673200],["B","medical","Bachelor of Dentistry",5,655000],["B","medical","Bachelor of Pharmacy",4,280100],["B","health","Bachelor of Biomedical Science",4,149200],["B","health","Bachelor of Nursing Science",4,149200],
      ["B","engineering","Bachelor of Civil Engineering",4,132100],["B","engineering","Bachelor of Electrical Engineering",4,132100],["B","engineering","Bachelor of Mechanical Engineering",4,132100],["B","engineering","Bachelor of Chemical Engineering",4,132100],["B","engineering","Bachelor of Biomedical Engineering",4,132100],["B","engineering","Bachelor of Science in Architecture",3,103900],["B","engineering","Bachelor of Quantity Surveying",4,92900],["B","engineering","Bachelor of Building Surveying",4,85000],["B","engineering","Bachelor of Real Estate",4,90100],["B","engineering","Bachelor of Urban & Regional Planning",4,96100],
      ["B","it","Bachelor of Computer Science (Artificial Intelligence)",4,89200],["B","it","Bachelor of Computer Science (Software Engineering)",4,89200],["B","it","Bachelor of Computer Science (Computer System & Network)",4,89200],["B","it","Bachelor of Computer Science (Information Systems)",4,89200],["B","it","Bachelor of Computer Science (Multimedia Computing)",4,89200],
      ["B","business","Bachelor of Accounting",4,99100],["B","business","Bachelor of Business Administration",4,77100],["B","business","Bachelor of Economics",4,77100],["B","business","Bachelor of Finance",4,84100],["B","science","Bachelor of Actuarial Science",4,78400],
      ["B","science","BSc Biotechnology",4,70600],["B","science","BSc Biochemistry",4,70600],["B","science","BSc Microbiology & Molecular Genetics",4,70600],["B","science","BSc Chemistry",4,78500],["B","science","BSc Physics",4,70600],["B","science","BSc Mathematics",4,78400],["B","science","BSc Statistics",4,70600],["B","science","BSc Applied Geology",4,78400],["B","science","BSc Ecology & Biodiversity",4,70600],["B","science","BSc Environmental Management",4,70600],
      ["B","arts","BA English",4,60900],["B","arts","Bachelor of English Language & Linguistics",4,65100],["B","arts","Bachelor of Arabic / Chinese / Tamil Language & Linguistics",4,65100],["B","arts","Bachelor of Japanese Language & Linguistics",4,70000],["B","arts","Bachelor of French Language & Linguistics",4,70100],["B","arts","Bachelor of German / Spanish / Italian Language & Linguistics",4,65000],
      ["B","arts","BA International & Strategic Studies",4,65100],["B","arts","Bachelor of Media Studies",4,66600],["B","arts","BA Anthropology & Sociology",4,60900],["B","arts","Bachelor of Geography",4,68100],["B","arts","Bachelor of Environmental Studies",4,75900],["B","arts","BA History",4,60900],["B","arts","Bachelor of Social Administration",4,60900],["B","arts","BA Chinese / Southeast Asian / Indian Studies",4,60900],["B","arts","Bachelor of East Asian Studies",4,59400],["B","arts","Bachelor of Malay Studies",4,76300],
      ["B","arts","Bachelor of Music / Dance / Performing Arts",4,62500],["B","arts","Bachelor of Drama",4,62100],["B","hospitality","Bachelor of Sports Management",4,75100],["B","health","Bachelor of Sports Science (Exercise Science)",4,82400],
      ["B","education","Bachelor of Education (TESL)",4,75100],["B","education","Bachelor of Early Childhood Education",4,69600],["B","psychology","Bachelor of Counselling",4,69600],
      ["B","law","Bachelor of Shariah & Law",4,82500],["B","law","Bachelor of Muamalat Management",4,69600],["B","law","Bachelor of Syariah / Usuluddin / Al-Quran & Al-Hadith",4,60900],
    ] },

  { id: "city", name: "City University Malaysia", city: "Petaling Jaya / Cyberjaya / Johor Bahru", type: "private", ct: true,
    about: { bn: "বাংলাদেশি স্টুডেন্টদের জন্য বিশেষ প্রোমো ফি (টিউশনে ৫০% পর্যন্ত ছাড়)। QS 5-Star রেটেড, MQA স্বীকৃত।",
             en: "Special Bangladesh promo fees with up to 50% off tuition. QS 5-Star rated and fully MQA accredited." },
    highlights: [{ bn: "বাংলাদেশের জন্য বিশেষ ফি", en: "Special fees for Bangladesh" }, { bn: "৫০% পর্যন্ত স্কলারশিপ", en: "Up to 50% scholarship" }, { bn: "Canada, UK, USA, Australia-য় Credit Transfer", en: "Credit transfer to Canada, UK, USA & Australia" }],
    feeNote: { bn: "City University ২০২৫ — বাংলাদেশের জন্য বিশেষ প্রোমো ফি (টিউশন + রিসোর্স + অন্যান্য ফি মিলিয়ে মোট)", en: "City University 2025 — special Bangladesh promo fees (total of tuition + resource + miscellaneous)" },
    programs: [
      ["F","business","Foundation in Business",1,24985],["F","design","Foundation in Arts (Communication / English / Graphic & Multimedia / Fashion)",1,24985],["F","science","Foundation in Science",1,24985],["F","it","Foundation in Information Technology",1,24985],
      ["D","business","Diploma in Business Management / HRM / Office Management",3,43150],["D","business","Diploma in Accounting",3,42850],["D","business","Diploma in Islamic Banking",3,43150],["D","it","Diploma in Information Technology",3,42850],["D","design","Diploma in Graphic Design / Fashion Design",3,43150],["D","design","Diploma in Mass Communication / Corporate Communication",3,43150],["D","health","Diploma in Nursing",3,42450],["D","health","Diploma in Medical Lab Technology / Environmental Health",3,43150],["D","hospitality","Diploma in Culinary Arts / Hotel Management",3,43150],["D","education","Diploma in Early Childhood Education",3,43150],["D","engineering","Diploma in Civil / Mechanical Engineering",3,43150],["D","engineering","Diploma in Architectural Technology / Interior Design",3,43150],
      ["B","business","Bachelor of Business Administration (Hons)",3,54850],["B","business","Bachelor of Accounting (Hons)",3.5,55750],["B","business","BSc (Hons) Accounting & Finance",3,54850],["B","business","Bachelor of Engineering Management (Hons)",3,54850],["B","it","Bachelor of Information Technology (Hons)",3,54850],["B","it","Bachelor of Computer Science (Hons) Software Engineering",3,54850],
      ["B","design","Bachelor of Graphic Design / Fashion Design / Multimedia (Hons)",3,54850],["B","design","Bachelor of Communication (Mass Comm / Corporate Comm / Journalism)",3,54850],["B","health","Bachelor of Nursing",4,54750],["B","health","Bachelor of Biomedical Science / Environmental Health (Hons)",4,64250],["B","hospitality","Bachelor of Hospitality Management (Hons)",3,54850],["B","education","Bachelor of Education (Early Childhood / TESL)",3,53950],["B","psychology","Bachelor of Applied Psychology (Hons)",3,54350],["B","engineering","Bachelor of Civil / Mechanical Engineering (Hons)",4,64750],["B","engineering","BSc (Hons) Architectural Design / Interior Design",3.5,55050],
      ["M","business","Master of Business Administration (MBA)",1,33885],["M","business","Master of Accounting (MACC)",1,33885],["M","business","MSc Business Administration (by Research)",2,35385],["M","it","Master of Information Technology (MIT)",1,33885],["M","education","Master of Education (MEd)",1,33885],["M","engineering","Master of Mechanical Engineering",1,33885],["M","engineering","Master of Architecture / Architecture Project Management",1,33885,34385],["M","design","Master of Creative Industries & Communication",1,33885],["M","health","Master of Sport Studies (by Research)",2,35385],
      ["P","business","PhD in Business Administration",3,61550],["P","education","PhD in Education",3,61550],
    ] },

  { id: "apu", name: "Asia Pacific University (APU)", city: "Bukit Jalil, Kuala Lumpur", type: "private", top: true, fields: ["it","business","engineering","design"],
    about: { bn: "IT, Computing, Cyber Security ও AI-এর জন্য বিখ্যাত। UK-র Staffordshire University-র সাথে Dual Award।", en: "Renowned for IT, computing, cyber security and AI, with a dual award from Staffordshire University, UK." },
    highlights: [{ bn: "টেক ও IT-তে সেরা", en: "Leader in tech & IT" }, { bn: "আধুনিক ক্যাম্পাস", en: "Modern campus" }] },
  { id: "taylors", name: "Taylor's University", city: "Subang Jaya, Selangor", type: "private", top: true, fields: ["business","it","engineering","medical","health","design","hospitality","law","education","psychology"],
    about: { bn: "মালয়েশিয়ার শীর্ষ প্রাইভেট ইউনিভার্সিটিগুলোর একটি — Hospitality ও Business-এ খুব পরিচিত।", en: "One of Malaysia's top private universities, best known for hospitality and business." },
    highlights: [{ bn: "লেকসাইড ক্যাম্পাস", en: "Lakeside campus" }, { bn: "শীর্ষ প্রাইভেট ইউনিভার্সিটি", en: "Top private university" }] },
  { id: "lsbf", name: "LSBF — London School of Business & Finance", city: "Kuala Lumpur", type: "private", fields: ["business"],
    about: { bn: "Accounting, Finance ও Business — ACCA-র মতো প্রফেশনাল কোর্সের জন্য পরিচিত।", en: "Accounting, finance and business — known for professional qualifications like ACCA." },
    highlights: [{ bn: "ACCA ও প্রফেশনাল কোর্স", en: "ACCA & professional courses" }] },
  { id: "cyberjaya", name: "University of Cyberjaya", city: "Cyberjaya", type: "private", fields: ["medical","health","psychology","business"],
    about: { bn: "মেডিকেল ও হেলথ সায়েন্সের জন্য পরিচিত ইউনিভার্সিটি।", en: "A university focused on medicine and health sciences." },
    highlights: [{ bn: "মেডিসিন ও ফার্মেসি", en: "Medicine & pharmacy" }] },
  { id: "nottingham", name: "University of Nottingham Malaysia", city: "Semenyih", type: "private", top: true, fields: ["business","it","engineering","health","education","psychology"],
    about: { bn: "UK-র University of Nottingham-এর ক্যাম্পাস — UK-র ডিগ্রি মালয়েশিয়াতেই।", en: "The Malaysian campus of the UK's University of Nottingham — a UK degree in Malaysia." },
    highlights: [{ bn: "UK ডিগ্রি", en: "UK degree" }, { bn: "বড় সবুজ ক্যাম্পাস", en: "Large green campus" }] },
  { id: "klust", name: "Kuala Lumpur University of Science & Technology (KLUST)", city: "Kajang", type: "private", fields: ["engineering","it","business"],
    about: { bn: "ইঞ্জিনিয়ারিং ও টেকনোলজি ভিত্তিক ইউনিভার্সিটি।", en: "A university focused on engineering and technology." }, highlights: [] },
  { id: "genovasi", name: "Genovasi University College", city: "Petaling Jaya", type: "private", fields: ["design","business","it"],
    about: { bn: "ডিজাইন, ইনোভেশন ও ক্রিয়েটিভ কোর্স।", en: "Design, innovation and creative courses." }, highlights: [] },
  { id: "unitar", name: "UNITAR International University", city: "Kelana Jaya", type: "private", fields: ["business","it","education","hospitality"],
    about: { bn: "সাশ্রয়ী ফি-তে বিজনেস ও এডুকেশন কোর্স।", en: "Affordable business and education courses." }, highlights: [] },
  { id: "uow", name: "UOW Malaysia", city: "Shah Alam / Glenmarie", type: "private", fields: ["business","it","engineering","design","hospitality","psychology"],
    about: { bn: "অস্ট্রেলিয়ার University of Wollongong-এর মালয়েশিয়া ক্যাম্পাস।", en: "The Malaysian campus of Australia's University of Wollongong." }, highlights: [{ bn: "অস্ট্রেলিয়ান ডিগ্রি", en: "Australian degree" }] },
  { id: "bac", name: "Brickfields Asia College (BAC)", city: "KL / Petaling Jaya", type: "private", ct: true, fields: ["law","business"],
    about: { bn: "Law ও Business — UK ইউনিভার্সিটিতে Transfer প্রোগ্রামের জন্য পরিচিত।", en: "Law and business, known for transfer programmes to UK universities." }, highlights: [] },
  { id: "unikl", name: "UniKL — Universiti Kuala Lumpur", city: "Kuala Lumpur", type: "private", fields: ["engineering","it","business","health"],
    about: { bn: "ইঞ্জিনিয়ারিং টেকনোলজি ও প্র্যাক্টিক্যাল স্কিলের জন্য পরিচিত।", en: "Known for engineering technology and practical skills." }, highlights: [] },
  { id: "lincoln", name: "Lincoln University College", city: "Petaling Jaya, Selangor", type: "private",
    about: { bn: "১৮০+ প্রোগ্রাম, সাশ্রয়ী প্রোমো ফি। মেডিসিন, ফার্মেসি, নার্সিং থেকে বিজনেস ও IT।", en: "180+ programmes with affordable promo fees — from medicine, pharmacy and nursing to business and IT." },
    highlights: [{ bn: "সাশ্রয়ী প্রোমো ফি", en: "Affordable promo fees" }, { bn: "MD ও DDS প্রোগ্রাম", en: "MD & DDS programmes" }, { bn: "American Degree Transfer", en: "American Degree Transfer" }],
    feeNote: { bn: "Lincoln University College ২০২৬ — প্রোমো ফি (বন্ধনীতে সাধারণ ফি)। EMGS RM 3,500 ও রেজিস্ট্রেশন RM 6,000 আলাদা।", en: "Lincoln University College 2026 — promo fee (standard fee shown as the upper range). EMGS RM 3,500 and registration RM 6,000 are extra." },
    programs: [
      ["F","business","Foundation in Arts",1,15000],["F","it","Foundation in Business & Computing",1.5,15000],["F","science","Foundation in Science",1,15000],["F","arts","American Degree Transfer Programme (Arts)",2,49000,50000],
      ["D","medical","Diploma in Pharmacy",3,27000,45000],["D","health","Diploma in Nursing",3,27000,45000],["D","health","Diploma in Medical & Health Sciences",3,27000,45000],["D","health","Diploma in Physiotherapy",3,27000,45000],["D","engineering","Diploma in Aeronautical Engineering Technology",3,27000,45000],["D","engineering","Diploma in Electrical & Electronic Engineering",2.5,27000,45000],["D","education","Diploma in Early Childhood Education",2.5,27000,45000],["D","education","Diploma in TESL",2.5,27000,45000],["D","psychology","Diploma in Psychology",2.5,27000,45000],["D","it","Diploma in Computer Science",2.5,27000,45000],["D","design","Diploma in Multimedia Applications",2.5,27000,45000],["D","business","Diploma in Accounting",2.5,27000,45000],["D","business","Diploma in Business Administration",2.5,27000,45000],["D","hospitality","Diploma in Culinary Arts",2,27000,45000],["D","hospitality","Diploma in Hotel Management",2.5,27000,45000],
      ["B","medical","Doctor of Medicine (MD)",5,315000,360000],["B","medical","Doctor of Dental Surgery (DDS)",5,315000,360000],["B","medical","Bachelor of Pharmacy (Hons)",4,65000,85000],["B","health","Bachelor in Cosmetic Science (Hons)",4,65000,85000],["B","health","Bachelor of Medical Imaging (Hons)",4,65000,85000],["B","health","Bachelor of Cardiopulmonary & Perfusion Technology",4,65000,85000],["B","health","Bachelor of Nursing Sciences (Hons)",4,65000,85000],["B","health","Bachelor of Biomedical Sciences (Hons)",4,49000,60000],["B","health","Bachelor in Physiotherapy (Hons)",4,49000,60000],["B","science","Bachelor of Biotechnology (Hons)",3,49000,60000],["B","science","BSc Agriculture (Hons)",3,49000,60000],["B","health","BSc Sports & Fitness",3,49000,60000],
      ["B","engineering","Bachelor of Civil Engineering Technology (Hons)",4,49000,60000],["B","engineering","Bachelor of Electrical & Electronics Engineering Technology (Hons)",4,49000,60000],["B","engineering","Bachelor of Mechanical Engineering Technology (Hons)",4,49000,60000],["B","engineering","Bachelor of Mechanical Engineering Technology — Aeronautics",4,49000,60000],["B","engineering","Bachelor of Mechatronics Engineering Technology (Hons)",4,49000,60000],
      ["B","it","Bachelor of Computer Science (Hons) Artificial Intelligence",3,38000,60000],["B","it","Bachelor of Computer Science (Hons) Network Technology & Cybersecurity",3,38000,60000],["B","it","Bachelor of Information Technology (Hons) / Data Analytics / Cloud Computing",3,38000,60000],["B","design","BA (Hons) Creative Multimedia Technology",3,38000,60000],["B","design","Bachelor in Digital Film Technology (Hons)",3,38000,60000],["B","design","BA in Mass Communication (Hons)",3,38000,60000],["B","design","Bachelor in Fashion Design Management (Hons)",3,38000,60000],
      ["B","business","Bachelor (Hons) in Business Administration",3,38000,60000],["B","business","Bachelor of Accountancy",3,38000,60000],["B","business","BBA in Human Resource Management",3,38000,60000],["B","business","Bachelor of Finance",3,38000,60000],["B","business","Bachelor of Business Information Systems",3,38000,60000],["B","business","Bachelor of Business Entrepreneurship",3,38000,60000],["B","hospitality","BBA in Airline & Airport Management",3,38000,60000],["B","hospitality","Bachelor in Tourism Management",3,38000,60000],["B","hospitality","BSc (Hons) Hospitality Management",3,38000,60000],
      ["B","education","Bachelor of Education (Hons) / TESL",3,38000,60000],["B","education","Bachelor of Early Childhood Education (Hons)",3,38000,60000],["B","psychology","Bachelor of Psychology (Hons)",3.3,38000,60000],["B","law","Bachelor of Islamic Studies (Hons)",3,38000,60000],
      ["M","business","Master of Business Administration (MBA)",1,22000,40000],["M","business","MBA (Global Business / HRM / Project Mgmt / Healthcare)",1.5,22000,40000],["M","business","Master of Accountancy",1.3,22000,40000],["M","business","MSc in Management",2,22000,45000],["M","business","Master of Economics / Public Administration",1.5,22000,45000],["M","it","Master of Computer Science",1.5,22000,40000],["M","it","MSc Data Science & Analytics",1.5,22000,40000],["M","it","Master in Financial Technology",1,22000,40000],["M","education","Master of Education",1.5,22000,40000],["M","education","MA Teaching English as a Second Language",1.5,22000,40000],["M","psychology","MSc (Psychology)",2,22000,45000],["M","arts","Master of International Relations & Policies",1.5,22000,40000],["M","design","Master of Communication / Mass Communication",1.5,22000,45000],["M","hospitality","MBA in Hospitality Management / Master in Tourism",1.5,22000,40000],
      ["M","health","Master of Science in Public Health",1.5,27000,45000],["M","health","Master of Medical Sciences",1,27000,45000],["M","health","Master in Nursing",2,27000,45000],["M","medical","Master of Pharmacy",2,27000,45000],["M","science","MSc Biotechnology / Microbiology / Nutrition",1.5,27000,45000],["M","engineering","Master of Engineering / Mechanical / Civil / E&E",1.5,27000,45000],["M","engineering","Master in Construction Management",1.3,27000,45000],
      ["P","business","Doctor of Business Administration / PhD Management",3,38000,60000],["P","it","PhD in IT / Computer Science / Data Science / Cybersecurity",3,38000,60000],["P","education","PhD in Education / English",3,38000,60000],["P","psychology","PhD in Psychology",3,38000,60000],["P","arts","PhD in Social Sciences / Mass Communication",3,38000,60000],["P","health","PhD in Medical Sciences / Nursing / Health Sciences",3,43000,70000],["P","medical","PhD in Pharmacy / Dentistry",3,43000,70000],["P","engineering","PhD (Engineering)",3,43000,70000],
    ] },

  { id: "unirazak", name: "UniRazak — Universiti Tun Abdul Razak", city: "Kuala Lumpur", type: "private", fields: ["business","education"],
    about: { bn: "বিজনেস ও ম্যানেজমেন্ট কোর্সের জন্য পরিচিত।", en: "Known for business and management courses." }, highlights: [] },
  { id: "maiwp", name: "University College MAIWP International (UCMI)", city: "Kuala Lumpur", type: "private", fields: ["business","education","it"],
    about: { bn: "সাশ্রয়ী ফি-তে ডিপ্লোমা ও ডিগ্রি প্রোগ্রাম।", en: "Diploma and degree programmes at affordable fees." }, highlights: [] },
  { id: "kings", name: "Kings College", city: "Malaysia", type: "private", fields: ["business","english"],
    about: { bn: "ডিপ্লোমা ও ইংলিশ প্রোগ্রাম।", en: "Diploma and English programmes." }, highlights: [] },

  { id: "alfa", name: "ALFA University College", city: "Subang Jaya, Selangor", type: "private",
    about: { bn: "আর্ট, ডিজাইন, আর্কিটেকচার ও বিজনেস — খুব সাশ্রয়ী ফি।", en: "Art, design, architecture and business at very affordable fees." },
    highlights: [{ bn: "সবচেয়ে কম ফি-র মধ্যে", en: "Among the most affordable" }, { bn: "ক্রিয়েটিভ কোর্সে শক্তিশালী", en: "Strong in creative courses" }],
    feeNote: { bn: "ALFA University College ২০২৫ — মোট টিউশন ফি। শুরুতে আলাদা RM 6,000 (EMGS, ভিসা, রেজিস্ট্রেশন)।", en: "ALFA University College 2025 — total tuition. An initial RM 6,000 (EMGS, visa, registration) is extra." },
    programs: [
      ["E","english","Graduate Certificate in English Proficiency",1,16500],
      ["F","business","Foundation in Business",1,14700],["F","design","Foundation in Arts & Design",1,14700],
      ["D","business","Diploma in Accountancy",2.5,30500],["D","business","Diploma in Business Administration",2.5,30500],["D","business","Diploma in E-Business",2.5,30500],["D","business","Diploma in Retail Management",2.5,33500],["D","it","Diploma in Information Technology",2.5,33500],["D","education","Diploma in Early Childhood",2.5,30500],["D","education","Diploma in TESL",2.5,30500],["D","design","Diploma in Graphic Design",2.5,33500],["D","design","Diploma in Multimedia Design",2.5,33500],["D","engineering","Diploma in Architecture",3,48500],["D","engineering","Diploma in Interior Architecture",3,48500],["D","hospitality","Diploma in Culinary Arts",2.5,37500],["D","hospitality","Diploma in Tourism Management",2.5,37000],["D","hospitality","Diploma in Hotel Management",2.5,38000],["D","hospitality","Diploma in Event Management",2.5,33500],["D","law","Diploma in Law Enforcement",2.5,33500],["D","health","Diploma in Health Care Management",3,42000],["D","medical","Diploma in Pharmacy",3,47500],
      ["B","business","BA (Hons) Business Administration",3,40500],["B","business","Bachelor of E-Business (Hons)",3,40500],["B","business","Bachelor (Hons) Human Resource Management",3,40500],["B","education","Bachelor of Early Childhood Education (Hons)",3,40500],["B","it","Bachelor of Information Technology (Hons)",3,43000],["B","it","Bachelor in Computer Science (Cyber Security & Networks)",3,48000],["B","hospitality","BSc (Hons) Hospitality Management",3,44500],["B","design","BA (Hons) Graphic Design",3,43000],["B","design","BA (Hons) Creative Multimedia",3,43000],["B","engineering","BSc (Hons) Architecture",3,59000],["B","law","Bachelor of Law Enforcement",3,42500],
      ["M","business","Master of Business Administration (MBA)",1.4,27500],["M","business","MBA (International Business)",1.4,27500],["M","business","MBA in Oil & Gas",1.4,33500],["M","business","Master of Project Management",1.4,28500],["M","business","Master in Supply Chain Management",1.4,31000],["M","business","MSc in Management (Research)",2,40000],["M","it","Master in Information Technology",1.4,30500],["M","education","Master of Education (ECE / TESL)",2,27500],["M","education","Master of Education (Research)",2,37000],["M","design","Master of Art & Design (Research)",2,40000],["M","arts","Master of Music (Research)",2,40000],["M","engineering","Master of Philosophy in Engineering",2,47500],
      ["P","business","Doctor of Business Administration (DBA)",3,45000],["P","business","PhD in Management",3,39500],["P","it","PhD in Information Technology",3,39500],["P","education","PhD in Education",3,39500],["P","arts","PhD in Social Sciences",3,39500],["P","design","PhD in Art & Design / Performing Arts",3,39500],["P","health","PhD in Sports Science",3,39500],
    ] },

  { id: "ucsi", name: "UCSI University", city: "Cheras, Kuala Lumpur", type: "private", top: true,
    about: { bn: "র‍্যাংকিংয়ে শীর্ষ প্রাইভেট ইউনিভার্সিটিগুলোর একটি — মেডিসিন, ফার্মেসি, মিউজিক, ইঞ্জিনিয়ারিং, বিজনেস।", en: "One of the top-ranked private universities — medicine, pharmacy, music, engineering and business." },
    highlights: [{ bn: "উঁচু র‍্যাংকিং", en: "Highly ranked" }, { bn: "মিউজিক ও মেডিসিনে বিখ্যাত", en: "Famous for music & medicine" }, { bn: "KL ও Kuching ক্যাম্পাস", en: "KL & Kuching campuses" }],
    feeNote: { bn: "UCSI University (KL ক্যাম্পাস) — আনুমানিক মোট টিউশন ফি, পুরনো শিডিউল থেকে; নতুন ফি কিছুটা বেশি হতে পারে।", en: "UCSI University (KL campus) — approximate total tuition from an earlier schedule; current fees may be slightly higher." },
    programs: [
      ["E","english","English for Tertiary Education (per 1-month level)",0.1,1900],
      ["F","science","Foundation in Science",1,20700],["F","business","Foundation in Arts",1,20300],["F","arts","Foundation in Music",1,24200],
      ["D","it","Diploma in Information Technology",2,44130],["D","business","Diploma in Management / Logistics / Finance",2,44630,45110],["D","health","Diploma in Nursing",3,54140],["D","medical","Diploma in Pharmacy",2,51650],["D","hospitality","Diploma in Hotel Management / Culinary Arts",2,41350,44420],["D","design","Diploma in Graphic / Fashion / 3D Animation Design",2,48420,51840],["D","engineering","Diploma in Interior Architecture / Architectural Studies",2,46395,49995],["D","arts","Diploma in Music Performance",2,51240],
      ["B","medical","Doctor of Medicine (MD)",5,341340],["B","medical","Bachelor of Pharmacy (Hons)",4,160698],["B","health","Bachelor of Optometry (Hons)",4,102750],["B","health","Bachelor of Nursing (Hons)",4,76850],["B","health","Bachelor of Formulation Science (Hons)",3,81330],["B","science","BSc (Hons) Biotechnology / Food Science / Nutrition",3,80365,92570],["B","science","BSc (Hons) Forensic Science",4,99600],["B","science","BSc (Hons) Actuarial Science",3,68900,79350],
      ["B","it","Bachelor of Computer Science (Hons)",3,65820],["B","it","Bachelor of Computer Science in Data Science",3,69040],["B","it","BSc (Hons) Business Information Systems",3,65220,65820],
      ["B","business","BA (Hons) Business Administration / Marketing / Logistics",3,65400],["B","business","BA (Hons) Accounting & Finance",3,65400,67380],["B","business","BSc (Hons) Finance & Investment / Financial Technology",3,65490,66490],["B","business","BA (Hons) Entrepreneurship / International & Sustainable Business",3,67440,67950],
      ["B","engineering","Bachelor of Electrical & Electronic / Mechatronic / Mechanical Engineering",4,82205,82715],["B","engineering","Bachelor of Chemical / Civil / Petroleum Engineering",4,87170,88820],["B","engineering","Bachelor of Computer Engineering (AI) / Energy Engineering",4,88990,90470],["B","engineering","BSc (Hons) Architecture",3.5,83110],["B","engineering","Bachelor of Quantity Surveying (Hons)",3.5,91144],["B","engineering","BA (Hons) Interior Architecture",3,73000],
      ["B","hospitality","Bachelor of Hospitality Administration",3,72050],["B","hospitality","BA (Hons) Culinary Management",3,73100],["B","design","BA (Hons) Mass Communication",3,68330],["B","design","BA (Hons) Graphic / Multimedia / Game Design",3,65305,68415],["B","design","BCA (Hons) 3D Animation / Fashion Design",3,70850,71850],["B","psychology","BA (Hons) Psychology",3,68730],["B","arts","BA (Hons) English Language & Communication",3,61300],["B","education","Bachelor of Early Childhood Education (Hons)",3,66750],["B","arts","BMus (Hons) Classical / Contemporary Music",3,89180],
    ] },

  { id: "mahsa", name: "MAHSA University", city: "Jenjarom, Selangor", type: "private", fields: ["medical","health","business","it"],
    about: { bn: "মেডিসিন, ডেন্টাল, ফার্মেসি, নার্সিং — হেলথ সায়েন্সে শক্তিশালী।", en: "Strong in health sciences — medicine, dentistry, pharmacy and nursing." }, highlights: [] },
  { id: "icms", name: "ICMS — International College of Management & Sports", city: "Malaysia", type: "private", fields: ["business","hospitality"],
    about: { bn: "ম্যানেজমেন্ট ও স্পোর্টস ভিত্তিক কোর্স।", en: "Management and sports-focused courses." }, highlights: [] },
  { id: "nilai", name: "Nilai University", city: "Nilai, Negeri Sembilan", type: "private", fields: ["business","it","engineering","health","hospitality"],
    about: { bn: "শান্ত পরিবেশে সাশ্রয়ী ক্যাম্পাস — নার্সিং ও বিজনেস।", en: "An affordable campus in a calm setting — nursing and business." }, highlights: [] },
];

const ENGLISH_TESTS = {
  none:       { label: { bn: "কোনো টেস্ট দিইনি", en: "No test yet" }, min: null },
  ielts:      { label: "IELTS", min: 5.5, step: 0.5, max: 9 },
  pte:        { label: "PTE Academic", min: 42, step: 1, max: 90 },
  toefl:      { label: "TOEFL iBT", min: 46, step: 1, max: 120 },
  duolingo:   { label: "Duolingo", min: 95, step: 5, max: 160 },
  linguaskill:{ label: "Linguaskill", min: 160, step: 1, max: 180 },
  muet:       { label: "MUET", min: 3.5, step: 0.5, max: 5 },
  medium:     { label: { bn: "English Medium / O-A Level", en: "English medium / O & A Level" }, min: null, medium: true },
};

const OLD_DOC_CHECKLIST = [
  { bn: "পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ)", en: "Passport (valid for at least 18 months)" },
  { bn: "SSC সার্টিফিকেট ও মার্কশিট", en: "SSC certificate & transcript" },
  { bn: "HSC সার্টিফিকেট ও মার্কশিট (থাকলে)", en: "HSC certificate & transcript (if any)" },
  { bn: "Bachelor's সার্টিফিকেট ও ট্রান্সক্রিপ্ট (Master's-এর জন্য)", en: "Bachelor's certificate & transcript (for Master's)" },
  { bn: "পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)", en: "Passport-size photo (white background)" },
  { bn: "English টেস্ট রেজাল্ট (থাকলে — বাধ্যতামূলক নয়)", en: "English test result (optional)" },
];

const JOURNEY = [
  { t: { bn: "ফ্রি কাউন্সেলিং", en: "Free counselling" }, d: { bn: "রেজাল্ট, বাজেট আর স্বপ্ন নিয়ে কথা", en: "We talk about your results, budget and goals" } },
  { t: { bn: "অফিস ভিজিট", en: "Office visit" }, d: { bn: "ডকুমেন্ট চেক ও কোর্স ফাইনাল", en: "Document check & course decision" } },
  { t: { bn: "আবেদন", en: "Application" }, d: { bn: "ইউনিভার্সিটিতে আবেদন, Offer Letter", en: "University application & offer letter" } },
  { t: { bn: "ভিসা (EMGS)", en: "Visa (EMGS)" }, d: { bn: "২০–৩০ দিনে ভিসা প্রসেস", en: "Visa processed in 20–30 days" } },
  { t: { bn: "ফ্লাই টু মালয়েশিয়া", en: "Fly to Malaysia" }, d: { bn: "ফ্রি এয়ারপোর্ট পিকআপ ও বাসা দেখিয়ে দেওয়া", en: "Free airport pickup & help finding housing" } },
];

const FAQ = [
  { q: { bn: "IELTS ছাড়া কি মালয়েশিয়ায় পড়া যাবে?", en: "Can I study in Malaysia without IELTS?" },
    a: { bn: "হ্যাঁ। SSC-র পর (Foundation/Diploma) ও Master's-এ IELTS লাগে না। Bachelor's-এর মেইন কোর্সের আগে একটি English Proficiency লাগে, তবে সেটা ছাড়াই ভিসা হয়।", en: "Yes. No IELTS is needed after SSC (Foundation/Diploma) or for Master's. Bachelor's main courses need an English proficiency test, but the visa is issued without it." } },
  { q: { bn: "Bank Statement লাগবে?", en: "Do I need a bank statement?" },
    a: { bn: "আমাদের প্রসেসে Bank Statement-এর ঝামেলা নেই — শুধু সার্টিফিকেট, ট্রান্সক্রিপ্ট আর পাসপোর্ট।", en: "No bank statement hassle in our process — just certificates, transcripts and passport." } },
  { q: { bn: "মোট খরচ কত হতে পারে?", en: "How much will it cost in total?" },
    a: { bn: "বছরে টিউশন সাধারণত RM ১৩,০০০ থেকে শুরু, থাকা-খাওয়া মাসে প্রায় RM ১,৩৭০। Cost Calculator দিয়ে ধারণা নিন, বিস্তারিত অফিসে এসে জানুন।", en: "Tuition usually starts around RM 13,000 a year, plus about RM 1,370 a month to live. Use our cost calculator, then visit us for details." } },
  { q: { bn: "ভিসা পেতে কত দিন লাগে?", en: "How long does the visa take?" },
    a: { bn: "সব ডকুমেন্ট ঠিক থাকলে সাধারণত ২০–৩০ দিন।", en: "Usually 20–30 days with complete documents." } },
  { q: { bn: "পড়ার পর অন্য দেশে যাওয়া যাবে?", en: "Can I move to another country later?" },
    a: { bn: "অনেক কোর্সে ১–২ বছর পর Credit Transfer করে UK, USA, Australia বা Europe-এ যাওয়ার সুযোগ আছে।", en: "Many courses allow credit transfer to the UK, USA, Australia or Europe after 1–2 years." } },
  { q: { bn: "স্বামী/স্ত্রী ও সন্তান নিয়ে যাওয়া যাবে?", en: "Can I bring my spouse and children?" },
    a: { bn: "Master's ও PhD স্টুডেন্টরা পারেন।", en: "Yes, Master's and PhD students can." } },
  { q: { bn: "কাউন্সেলিং কি সত্যিই ফ্রি?", en: "Is counselling really free?" },
    a: { bn: "হ্যাঁ, সম্পূর্ণ ফ্রি। অফিসে এসে সরাসরি কথা বললে সবচেয়ে ভালো গাইডলাইন পাবেন।", en: "Yes, completely free. Visiting our office gives you the best guidance." } },
];

/* লাইভ চ্যাটের প্রশ্ন-উত্তর — স্টুডেন্ট প্রশ্নে ক্লিক করলে সাথে সাথে এই উত্তর দেখাবে। নতুন প্রশ্ন একই নিয়মে যোগ করুন */
const CHAT_QA = [
  { q: { bn: "IELTS ছাড়া কি মালয়েশিয়ায় পড়া যাবে?", en: "Can I study in Malaysia without IELTS?" },
    a: { bn: "হ্যাঁ। SSC-র পর Foundation/Diploma আর Master's-এ IELTS লাগে না। HSC-র পর Bachelor's-এ একটি English টেস্ট (IELTS / PTE / TOEFL / Linguaskill / Duolingo) লাগবে — তবে ভিসা এটা ছাড়াই হয়, মেইন কোর্স শুরুর আগে দিলেই চলে।", en: "Yes. Foundation/Diploma after SSC and Master's need no IELTS. A Bachelor's after HSC needs an English test (IELTS / PTE / TOEFL / Linguaskill / Duolingo) — but the visa is issued without it; you just need it before the main course." } },
  { q: { bn: "Bank Statement লাগবে?", en: "Do I need a bank statement?" },
    a: { bn: "না, আমাদের প্রসেসে Bank Statement-এর ঝামেলা নেই — পাসপোর্ট, সার্টিফিকেট-মার্কশিট আর ছবি হলেই হয়।", en: "No — our process needs no bank statement. Just your passport, certificates & marksheets and a photo." } },
  { q: { bn: "কী কী ডকুমেন্ট লাগবে?", en: "Which documents do I need?" },
    a: { bn: "সাধারণত: পাসপোর্ট (কমপক্ষে ১৮ মাস মেয়াদ), SSC/HSC সার্টিফিকেট ও মার্কশিট, সাদা ব্যাকগ্রাউন্ডের পাসপোর্ট সাইজ ছবি। HSC-র পর Bachelor's-এ English টেস্ট, Master's-এ Bachelor's সার্টিফিকেট ও ট্রান্সক্রিপ্ট।", en: "Usually: passport (valid 18+ months), SSC/HSC certificates & marksheets, a passport photo on white. A Bachelor's after HSC also needs an English test; a Master's needs your Bachelor's certificate & transcript." } },
  { q: { bn: "মোট খরচ কত হবে?", en: "How much will it cost in total?" },
    a: { bn: "বছরে টিউশন সাধারণত RM ১৩,০০০ থেকে শুরু, থাকা-খাওয়া মাসে প্রায় RM ১,৩৭০, আর প্রথম বছরে EMGS/ভিসা ফি। কোর্স ধরে সঠিক হিসাব খরচ ক্যালকুলেটরে দেখুন।", en: "Tuition usually starts around RM 13,000 a year, living costs about RM 1,370 a month, plus the EMGS/visa fee in year one. See the exact figure per course in the cost calculator." } },
  { q: { bn: "ভিসা পেতে কত দিন লাগে?", en: "How long does the visa take?" },
    a: { bn: "সব ডকুমেন্ট ঠিক থাকলে স্টুডেন্ট ভিসা সাধারণত ২০–৩০ দিনে হয়।", en: "With complete documents, the student visa usually takes 20–30 days." } },
  { q: { bn: "SSC-র পর কী পড়া যায়?", en: "What can I study after SSC?" },
    a: { bn: "SSC-র পর Foundation (১ বছর, তারপর সরাসরি Bachelor's) বা Diploma (২–৩ বছর) করা যায় — IELTS লাগে না।", en: "After SSC you can do a Foundation (1 year, then straight into a Bachelor's) or a Diploma (2–3 years) — no IELTS needed." } },
  { q: { bn: "পড়ার পাশাপাশি পার্ট-টাইম কাজ করা যাবে?", en: "Can I work part-time while studying?" },
    a: { bn: "স্টুডেন্ট ভিসায় সাধারণত সেমিস্টার ছুটির সময় সপ্তাহে ২০ ঘণ্টা পর্যন্ত পার্ট-টাইম কাজের সুযোগ থাকে (মালয়েশিয়ার নিয়ম অনুযায়ী)।", en: "Student-pass holders can usually work part-time up to 20 hours a week during semester breaks (under Malaysian rules)." } },
  { q: { bn: "থাকার ব্যবস্থা কেমন? ভাড়া কত?", en: "What about accommodation and rent?" },
    a: { bn: "রুম ভাড়া RM ৪০০ থেকে শুরু, Fully Furnished; অনেক বাসায় ফ্রি সুইমিং পুল ও জিম। আমরা ফ্রিতে বাসা খুঁজে দিই আর এয়ারপোর্ট থেকে পিকআপ করি।", en: "Rooms start from RM 400, fully furnished, often with a free pool and gym. We help you find a place for free and pick you up at the airport." } },
  { q: { bn: "কখন ভর্তি হওয়া যায় (ইনটেক)?", en: "When are the intakes?" },
    a: { bn: "বেশিরভাগ ইউনিভার্সিটিতে বছরে ৩টা ইনটেক — সাধারণত জানুয়ারি, এপ্রিল/মে আর আগস্ট/সেপ্টেম্বর।", en: "Most universities have three intakes a year — usually January, April/May and August/September." } },
  { q: { bn: "স্কলারশিপ পাওয়া যায়?", en: "Are scholarships available?" },
    a: { bn: "হ্যাঁ, অনেক ইউনিভার্সিটিতে আছে — যেমন City University-তে টিউশনে ৫০% পর্যন্ত। রেজাল্ট দেখে সঠিক স্কলারশিপ বলে দেওয়া হবে।", en: "Yes, many universities offer them — e.g. up to 50% tuition at City University. We'll match you based on your results." } },
  { q: { bn: "স্টাডি গ্যাপ থাকলে আবেদন করা যাবে?", en: "Can I apply with a study gap?" },
    a: { bn: "হ্যাঁ, যাবে। গ্যাপের কারণ ও ডকুমেন্ট কাউন্সেলিংয়ে দেখে সঠিক অপশন বলে দেওয়া হবে।", en: "Yes. We'll review your reason and documents at counselling and suggest the right option." } },
  { q: { bn: "স্বামী/স্ত্রী ও সন্তান নিয়ে যাওয়া যাবে?", en: "Can I bring my spouse and children?" },
    a: { bn: "Master's ও PhD স্টুডেন্টরা Spouse ও সন্তানকে সাথে নিতে পারেন।", en: "Master's and PhD students can bring their spouse and children." } },
  { q: { bn: "মালয়েশিয়া থেকে অন্য দেশে যাওয়া যাবে?", en: "Can I move to another country later?" },
    a: { bn: "অনেক কোর্সে ১–২ বছর মালয়েশিয়ায় পড়ে Credit Transfer করে UK, USA, Australia বা Europe-এ যাওয়ার সুযোগ আছে (শর্ত সাপেক্ষে)।", en: "Many courses let you study 1–2 years in Malaysia, then transfer credits to the UK, USA, Australia or Europe (conditions apply)." } },
  { q: { bn: "কাউন্সেলিং কি ফ্রি? অফিস কোথায়?", en: "Is counselling free? Where is the office?" },
    a: { bn: "হ্যাঁ, কাউন্সেলিং সম্পূর্ণ ফ্রি। অফিস: হাউস নং ৫৬, সেক্টর ১৩, উত্তরা, ঢাকা — শুক্রবার বন্ধ, সকাল ১০টা – সন্ধ্যা ৬টা।", en: "Yes, counselling is completely free. Office: House 56, Sector 13, Uttara, Dhaka — closed Fridays, open 10 AM – 6 PM." } },
];

/* কুইজ — প্রতিটা উত্তর একাধিক ফিল্ডে পয়েন্ট দেয় */
const QUIZ = [
  { icon: "spark", q: { bn: "ছুটির দিনে তোমাকে কোথায় পাওয়া যাবে?", en: "Where would we find you on a day off?" }, a: [
    [{ bn: "নতুন অ্যাপ বা গেম ঘাঁটছি", en: "Exploring a new app or game" }, { it: 2, engineering: 1 }],
    [{ bn: "বন্ধুদের নিয়ে প্ল্যান করছি", en: "Planning something with friends" }, { business: 2, hospitality: 1 }],
    [{ bn: "আঁকছি / ছবি-ভিডিও এডিট করছি", en: "Drawing or editing photos & videos" }, { design: 2, arts: 1 }],
    [{ bn: "কাউকে সাহায্য করছি", en: "Helping someone out" }, { health: 2, psychology: 1 }]] },
  { icon: "book", q: { bn: "স্কুলে কোন বিষয়টা সবচেয়ে সহজ লাগত?", en: "Which subject came easiest at school?" }, a: [
    [{ bn: "Math / Physics", en: "Maths / Physics" }, { engineering: 2, it: 1 }],
    [{ bn: "Biology / Chemistry", en: "Biology / Chemistry" }, { medical: 2, health: 1, science: 1 }],
    [{ bn: "Accounting / Economics", en: "Accounting / Economics" }, { business: 2 }],
    [{ bn: "English / সাহিত্য / ইতিহাস", en: "English / Literature / History" }, { arts: 2, education: 1, law: 1 }]] },
  { icon: "target", q: { bn: "১০ বছর পর নিজেকে কোথায় দেখতে চাও?", en: "Where do you see yourself in 10 years?" }, a: [
    [{ bn: "নিজের ব্যবসা চালাচ্ছি", en: "Running my own business" }, { business: 2 }],
    [{ bn: "Google-এর মতো Tech কোম্পানিতে", en: "At a tech company like Google" }, { it: 2 }],
    [{ bn: "হাসপাতালে রোগী দেখছি", en: "Treating patients at a hospital" }, { medical: 2, health: 1 }],
    [{ bn: "ফাইভ স্টার হোটেল বা এয়ারলাইনে", en: "At a 5-star hotel or airline" }, { hospitality: 2 }]] },
  { icon: "puzzle", q: { bn: "কোন কাজে সময় কোথা দিয়ে যায় টেরই পাও না?", en: "What makes you lose track of time?" }, a: [
    [{ bn: "কোনো যন্ত্র খুলে দেখা কীভাবে চলে", en: "Taking a gadget apart to see how it works" }, { engineering: 2 }],
    [{ bn: "মানুষের মন বোঝা, গল্প শোনা", en: "Understanding people and their stories" }, { psychology: 2, education: 1 }],
    [{ bn: "সোশ্যাল মিডিয়ার কনটেন্ট বানানো", en: "Creating social media content" }, { design: 2, business: 1 }],
    [{ bn: "ল্যাবে এক্সপেরিমেন্ট", en: "Running experiments in a lab" }, { science: 2, medical: 1 }]] },
  { icon: "users", q: { bn: "গ্রুপ প্রজেক্টে তুমি সাধারণত কে?", en: "In a group project, you are usually…" }, a: [
    [{ bn: "লিডার — সবাইকে কাজ ভাগ করে দিই", en: "The leader who divides the work" }, { business: 2, law: 1 }],
    [{ bn: "টেক এক্সপার্ট — সব টেকনিক্যাল কাজ আমার", en: "The tech expert" }, { it: 2, engineering: 1 }],
    [{ bn: "ডিজাইনার — দেখতে সুন্দর করি", en: "The designer who makes it look great" }, { design: 2 }],
    [{ bn: "টিচার — সবাইকে বুঝিয়ে দিই", en: "The explainer who teaches everyone" }, { education: 2, psychology: 1 }]] },
  { icon: "briefcase", q: { bn: "কোন পরিবেশে কাজ করতে চাও?", en: "Your ideal workplace?" }, a: [
    [{ bn: "কর্পোরেট অফিস", en: "A corporate office" }, { business: 2 }],
    [{ bn: "হাসপাতাল বা ল্যাব", en: "A hospital or lab" }, { health: 2, medical: 1, science: 1 }],
    [{ bn: "ল্যাপটপ নিয়ে যেকোনো জায়গায়", en: "Anywhere with my laptop" }, { it: 2, design: 1 }],
    [{ bn: "সাইটে, বড় প্রজেক্টে", en: "On site, building big projects" }, { engineering: 2 }]] },
  { icon: "heart", q: { bn: "কোন প্রশংসাটা শুনলে সবচেয়ে খুশি হও?", en: "Which compliment makes you happiest?" }, a: [
    [{ bn: "\"তুমি খুব স্মার্ট!\"", en: "\"You're so smart!\"" }, { it: 1, engineering: 1, science: 1 }],
    [{ bn: "\"তুমি খুব ক্রিয়েটিভ!\"", en: "\"You're so creative!\"" }, { design: 2, arts: 1 }],
    [{ bn: "\"তোমার সাথে কথা বলে ভালো লাগে\"", en: "\"You're great to talk to\"" }, { psychology: 1, hospitality: 1, education: 1 }],
    [{ bn: "\"তুমি দারুণ ম্যানেজ করো\"", en: "\"You manage things brilliantly\"" }, { business: 2 }]] },
];

/* ===== Google/ওয়েব থেকে নেওয়া আনুমানিক ফি (ইউনিভার্সিটির নিজের ফি-শিট পেলে এগুলো বদলে দিন) ===== */
const WEB_NOTE = { bn: "ওয়েবের শিক্ষা-পোর্টাল (UniEnrol, EduAdvisor, EasyUni ইত্যাদি) থেকে আনুমানিক ফি — অফিসে এসে লেটেস্ট ফি নিশ্চিত করুন", en: "Approximate fees from education portals (UniEnrol, EduAdvisor, EasyUni etc.) — confirm the latest fees with us" };
const WEB_PROGRAMS = {
  apu: [["D","it","Diploma in ICT / Business Administration / Accounting",2,54200],["B","it","BSc (Hons) Computer Science (Cyber Security)",3,108500],["B","it","BSc (Hons) Computer Science / Software Engineering / AI",3,108500],["B","business","Bachelor degrees in Business / Accounting & Finance",3,108500],["B","engineering","Bachelor of Mechatronic / Mechanical / Computer / Electrical Engineering",4,137200]],
  cyberjaya: [["F","science","Foundation in Science (Medicine / Pharmacy)",1,28000],["B","medical","Bachelor of Medicine & Bachelor of Surgery (MBBS)",5,434300],["B","medical","Bachelor of Pharmacy (Hons)",4,140600]],
  mahsa: [["B","medical","Bachelor of Medicine & Bachelor of Surgery (MBBS)",5,392750,402750]],
  nottingham: [["B","engineering","MEng (Hons) Chemical / Civil / Electrical & Electronic Engineering",4,276000],["B","business","BSc (Hons) Finance, Accounting & Management",3,177000],["B","business","BSc (Hons) Economics",3,171000],["B","it","BSc (Hons) Computer Science",3,177000]],
  uow: [["B","business","Bachelor of Business (Hons) — Single / Dual Award",3,101310,115110]],
  unitar: [["B","business","Bachelor of Business Administration (Hons)",3,41910],["B","business","Bachelor of International Business",3,46155],["M","business","Master of Business Administration (MBA)",1,24600]],
  nilai: [["D","health","Diploma in Nursing",3,45732],["B","health","BSc (Hons) Nursing",4,72884]],
  unikl: [["B","engineering","Bachelor of Mechanical Engineering Technology (Machine Manufacturing)",4,78000],["B","engineering","Bachelor of Aircraft Engineering Technology (Avionics)",4,145365]],
  bac: [["B","law","LLB (Hons) — University of London (3+0)",3,63000]],
  unirazak: [["B","business","Bachelor of Management (Hons)",3,35900,37500],["M","business","Master of Business Administration (MBA)",1,18800]],
  lsbf: [["C","business","ACCA Qualification",2.5,28000],["D","business","Diploma in Accounting",2.5,22500],["D","business","Diploma in Business Administration",2.5,18000]],
  klust: [["B","it","Bachelor of Software Engineering (Hons)",3,56400],["B","engineering","Bachelor of Technology (Hons) Electro-mechanical",4,62145],["B","engineering","Bachelor of Electronics / Civil Engineering (Hons)",4,75600,82600]],
  genovasi: [["B","design","Bachelor's degree (Design / Business / IT)",3,33000]],
  icms: [["D","business","Diploma in Business Administration / Computer Science / Sport Science",2.5,21400]],
};
/* যেসব ইউনিভার্সিটির ফি অফিশিয়াল ওয়েবসাইট থেকে নেওয়া (অক্টোবর ২০২৬-এ যাচাই) — বাকিগুলো WEB_NOTE অনুযায়ী আনুমানিক */
const WEB_SRC = {
  apu: { bn: "APU অফিশিয়াল ২০২৬ ইন্টারন্যাশনাল ফি-গাইড (টিউশন; ৬% SST ও RM ৫,০০০ রেজিস্ট্রেশন আলাদা)", en: "APU official 2026 international fee guide (tuition; 6% SST and RM 5,000 registration extra)" },
  cyberjaya: { bn: "University of Cyberjaya অফিশিয়াল ইন্টারন্যাশনাল ফি (রেজিস্ট্রেশন, অ্যাডমিন ও EMGS সহ মোট)", en: "University of Cyberjaya official international fees (total incl. registration, admin & EMGS)" },
  nottingham: { bn: "Nottingham Malaysia অফিশিয়াল ফি — জানুয়ারি ২০২৭ থেকে (বছরে ফি × বছর; ৬% SST আলাদা)", en: "Nottingham Malaysia official fees from January 2027 (annual fee × years; 6% SST extra)" },
  uow: { bn: "UOW Malaysia অফিশিয়াল আনুমানিক ইন্টারন্যাশনাল ফি (EMGS ও SST আলাদা)", en: "UOW Malaysia official estimated international fees (EMGS & SST extra)" },
  nilai: { bn: "Nilai University অফিশিয়াল ইন্টারন্যাশনাল ফি-শিট (২০২৩ — নতুন শিট প্রকাশিত হয়নি)", en: "Nilai University official international fee sheet (2023 — no newer sheet published)" },
  unikl: { bn: "UniKL অফিশিয়াল প্রোগ্রাম পেজ (ইন্টারন্যাশনাল টিউশন; ভিসা ফি ও ৬% SST আলাদা)", en: "UniKL official programme pages (international tuition; visa fee & 6% SST extra)" },
  bac: { bn: "BAC অফিশিয়াল ফি — RM ২০,০০০/বছর টিউশন + RM ১,০০০/বছর রিসোর্স; University of London-এর ফি পাউন্ডে আলাদা", en: "BAC official fees — RM 20,000/yr tuition + RM 1,000/yr resource; University of London fees extra in GBP" },
};
UNIVERSITIES.forEach((u) => { if (!u.programs && WEB_PROGRAMS[u.id]) { u.programs = WEB_PROGRAMS[u.id]; u.feeNote = WEB_SRC[u.id] || WEB_NOTE; u.webFee = !WEB_SRC[u.id]; } });
(UNIVERSITIES.find((u) => u.id === "genovasi") || {}).highlights?.push({ bn: "খেয়াল করুন: Foundation ও Diploma বাংলাদেশি স্টুডেন্টদের জন্য খোলা নাও থাকতে পারে", en: "Note: Foundation & Diploma may not be open to Bangladeshi students" });
/* লাইভ EMGS: Google Apps Script প্রতিদিন ইউনিভার্সিটির ওয়েবসাইট থেকে ফি পড়ে রাখে (google-sheet-script.txt দেখুন)।
   সাইট খুললে সেই লেটেস্ট সংখ্যা এনে এখানকার সংখ্যার জায়গায় বসায়; না পেলে নিচের/উপরের সংখ্যাই দেখায়। */
const EMGS_LIVE_KEY = "bfs_emgs_live";
function applyLiveEmgs(d) {
  if (!d || typeof d !== "object") return false;
  let changed = false;
  Object.entries(d).forEach(([id, v]) => {
    const rm = +v?.rm;
    if (!(rm >= 500 && rm <= 9000) || !EMGS[id] || EMGS[id].crm) return;     // CRM-এ অফিসের লেখা ফি থাকলে সেটাই থাকে        // অদ্ভুত সংখ্যা এলে বাদ
    if (EMGS[id].rm !== rm || !EMGS[id].live) changed = true;
    EMGS[id].rm = rm; EMGS[id].live = v.checked || true;
  });
  return changed;
}
try { applyLiveEmgs(JSON.parse(localStorage.getItem(EMGS_LIVE_KEY) || "null")?.d); } catch {}

EMGS.unikl = { rm: 3300, src: { bn: "UniKL প্রাথমিক পেমেন্টের হিসাব (ওয়েব)", en: "UniKL initial payment estimate (web)" } };

/* প্রতি বছর ভিসা রিনিউ (RM) — লম্বা কোর্সে (যেমন MBBS ৫ বছর) মোট ভিসা খরচ বেশি হয়।
   SEGi-র ফি-তে রিনিউ আগেই ধরা আছে, তাই ০ */
const VISA_RENEW = { default: 1000, segi: 0, lincoln: 1600, alfa: 1000 };

/* অফিশিয়াল ওয়েবসাইট (যাদের ফি সাইট থেকে নেওয়া, তাদের ক্ষেত্রে সরাসরি ফি-পেজ) — ইউনিভার্সিটি ও প্রোগ্রামের পপআপে ফি-সূত্রের শেষে ছোট্ট "°" লিংক (শুধু নিজের যাচাইয়ের জন্য) */
const UNI_SITE = {
  segi: "https://www.segi.edu.my/", inti: "https://newinti.edu.my/", um: "https://www.um.edu.my/", city: "https://www.city.edu.my/",
  apu: "https://publicwebsite-media.apu.edu.my/assets/2026-02/e2026Jan-APU%20Fee%20Guide_Int%20UG_3.8.pdf", taylors: "https://www.taylors.edu.my/", lsbf: "https://lsbf.edu.my/", cyberjaya: "https://cyberjaya.edu.my/admission/financial-aid-options/fees-structure-international",
  nottingham: "https://www.nottingham.edu.my/study/undergraduate-courses/tuition-fees.aspx", klust: "https://klust.edu.my/", genovasi: "https://www.genovasi.edu.my/", unitar: "https://www.unitar.my/",
  uow: "https://www.uow.edu.my/programme/bachelor-of-business-hons/", bac: "https://www.bac.edu.my/courses/llb-hons/", unikl: "https://www.unikl.edu.my/programme/bachelor-of-aircraft-engineering-technology-hons-in-avionics/", lincoln: "https://www.lincoln.edu.my/",
  unirazak: "https://unirazak.edu.my/", maiwp: "https://www.unimaiwp.edu.my/", kings: "https://kingsuniversitycollege.edu.my/", alfa: "https://alfa.edu.my/",
  ucsi: "https://www.ucsiuniversity.edu.my/", mahsa: "https://www.mahsa.edu.my/", icms: "https://icms.edu.my/", nilai: "https://www.nilai.edu.my/sites/default/files/e-brochure/NU_FEE_INT_%202709203%20(2).pdf",
};

/* QS World University Rankings 2027 (প্রকাশ জুন ২০২৬) — নতুন র‍্যাংকিং এলে এখানে বদলান।
   তালিকায় না থাকলে ইউনিভার্সিটির পাতায় "QS র‍্যাংকিংয়ে নেই" দেখায়। */
const QS_RANK = { um: "56", taylors: "272", ucsi: "282", inti: "406", apu: "528", lincoln: "701–710", segi: "701–710", cyberjaya: "951–1000", unikl: "1401+",
  nottingham: { rank: "97", note: { bn: "মূল University of Nottingham (UK)-এর র‍্যাংক — এটা তাদের মালয়েশিয়া ক্যাম্পাস", en: "Rank of the main University of Nottingham (UK) — this is its Malaysia campus" } } };
const QS_YEAR = "2027";

/* আমাদের সম্পর্কে — ভিশন, মিশন, মূল্যবোধ, কেন আমরা */
const ABOUT = {
  vision: { bn: "বাংলাদেশের প্রতিটা স্বপ্নবাজ শিক্ষার্থী যেন সঠিক তথ্য আর সৎ পরামর্শ নিয়ে, কোনো ভয় বা প্রতারণা ছাড়াই বিদেশে মানসম্মত শিক্ষা নিতে পারে — এমন এক ভরসার নাম হওয়া।",
            en: "To be the most trusted name for every ambitious Bangladeshi student — so they can study abroad with the right information and honest advice, free from fear or fraud." },
  mission: [
    { bn: "প্রতিটা শিক্ষার্থীকে তার রেজাল্ট, বাজেট আর লক্ষ্য অনুযায়ী সঠিক দেশ, ইউনিভার্সিটি আর কোর্স বেছে দেওয়া", en: "Match every student to the right country, university and course for their results, budget and goals" },
    { bn: "ফি, খরচ আর ভিসার প্রতিটা ধাপ খোলাখুলি জানানো — কোনো লুকানো খরচ নয়", en: "Be open about every fee, cost and visa step — no hidden charges" },
    { bn: "আবেদন, অফার লেটার, ভিসা থেকে শুরু করে বিদেশে পৌঁছানো পর্যন্ত পাশে থাকা", en: "Stay beside the student from application and offer letter to visa and arrival" },
    { bn: "অভিভাবকদের সবসময় জানিয়ে রাখা, যাতে পরিবার নিশ্চিন্ত থাকে", en: "Keep parents informed at every stage so families can stay at ease" },
  ],
  values: [
    { icon: "check", t: { bn: "সততা", en: "Honesty" }, d: { bn: "যা সত্যি তাই বলি — যোগ্যতা না থাকলে সেটাও জানাই", en: "We tell the truth — even when a student isn't eligible" } },
    { icon: "users", t: { bn: "শিক্ষার্থী আগে", en: "Students first" }, d: { bn: "আমাদের লাভের আগে শিক্ষার্থীর ভবিষ্যৎ", en: "A student's future comes before our profit" } },
    { icon: "doc", t: { bn: "স্বচ্ছতা", en: "Transparency" }, d: { bn: "প্রতিটা টাকার রসিদ, প্রতিটা ধাপের আপডেট", en: "A receipt for every payment, an update at every step" } },
    { icon: "heart", t: { bn: "দায়িত্ব", en: "Care" }, d: { bn: "বিদেশে পৌঁছানোর পরও যোগাযোগ রাখি", en: "We stay in touch even after you arrive abroad" } },
  ],
  why: [
    { bn: "সম্পূর্ণ ফ্রি কাউন্সেলিং আর Eligibility চেক", en: "Completely free counselling and eligibility check" },
    { bn: "২৪+ পার্টনার ইউনিভার্সিটি থেকে বাছাইয়ের সুযোগ", en: "Choice of 24+ partner universities" },
    { bn: "IELTS ও Bank Statement-এর ঝামেলা ছাড়া অনেক কোর্সে ভর্তি", en: "Many courses without IELTS or bank-statement hassle" },
    { bn: "আবেদন থেকে ভিসা পর্যন্ত সব কাজ এক জায়গায়, অনলাইনে নিজের ফাইলের অবস্থা দেখার সুবিধা", en: "Everything from application to visa in one place — track your file online" },
    { bn: "এয়ারপোর্ট পিকআপ আর থাকার জায়গা খুঁজে দেওয়ায় সাহায্য", en: "Help with airport pickup and finding accommodation" },
    { bn: "ঢাকায় নিজস্ব অফিস — সরাসরি এসে কথা বলতে পারবেন", en: "Our own office in Dhaka — come and talk in person" },
  ],
};
