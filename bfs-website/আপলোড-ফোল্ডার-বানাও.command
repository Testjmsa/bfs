#!/bin/bash
# =========================================================
#  BFS — ওয়েবসাইট আর CRM আলাদা করে আপলোডের ফোল্ডার বানায়
#  ডাবল-ক্লিক করুন। ফল: ~/Downloads/BFS-UPLOAD/website  আর  ~/Downloads/BFS-UPLOAD/crm
#  প্রতিবার কিছু বদলানোর পর আবার চালান, তারপর Netlify-তে নতুন ফোল্ডারটা আবার টেনে ছাড়ুন।
#  ব্যক্তিগত ফাইল (ছাত্রের PDF, পাসওয়ার্ডের তালিকা, ব্যাকআপ, নোট) কখনো এই ফোল্ডারে যায় না।
# =========================================================
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
OUT="$HOME/Downloads/BFS-UPLOAD"
CRM="$SRC/CRM Site"
rm -rf "$OUT"; mkdir -p "$OUT/website" "$OUT/crm"

# ---------- ১) ওয়েবসাইট ----------
rsync -a \
  --exclude='.*' --exclude='CRM Site' --exclude='*.pdf' --exclude='*.txt' --exclude='*.log' \
  --exclude='*.command' --exclude='*.md' --exclude='*.code-workspace' \
  "$SRC/" "$OUT/website/"
mkdir -p "$OUT/website/js/crm"
cp "$CRM/js/config.js" "$CRM/js/catalog.js" "$CRM/js/weblink.js" "$OUT/website/js/crm/"
for f in "$OUT/website/"*.html; do sed -i '' 's#CRM Site/js/#js/crm/#g' "$f"; done

# ---------- ২) CRM ----------
rsync -a \
  --exclude='.*' --exclude='*.txt' --exclude='*.md' --exclude='*.pdf' --exclude='supabase' \
  "$CRM/" "$OUT/crm/"
cp "$SRC/js/data.js" "$OUT/crm/js/data.js"
for f in "$OUT/crm/"*.html; do sed -i '' 's#\.\./js/data\.js#js/data.js#g' "$f"; done

# ---------- ৩) যাচাই ----------
echo ""
echo "✅ তৈরি হয়েছে:"
echo "   ওয়েবসাইট → $OUT/website"
echo "   CRM      → $OUT/crm"
if grep -rqE 'CRM Site/|\.\./js/' "$OUT/website/"*.html "$OUT/crm/"*.html; then echo "⚠️  কিছু পুরোনো লিংক রয়ে গেছে — ঠিক করতে হবে"; fi
if find "$OUT" -name '*.pdf' -o -name '*.txt' | grep -q .; then echo "⚠️  PDF/TXT ফাইল ঢুকে গেছে — আপলোড করবেন না!"; fi
if grep -q 'supabaseUrl: ""' "$CRM/js/config.js"; then
  echo ""
  echo "ℹ️  config.js-এ Supabase এখনো বসানো হয়নি → দুটো সাইট DEMO মোডে চলবে,"
  echo "    আর ওয়েবসাইটের লিড অনলাইন CRM-এ পৌঁছাবে না। আগে SETUP-GUIDE অনুযায়ী Supabase চালু করুন।"
fi
if grep -q 'crmUrl: ""' "$CRM/js/config.js"; then
  echo "ℹ️  config.js-এ websiteUrl / crmUrl খালি — Netlify ঠিকানা পেলে বসিয়ে আবার এটা চালান।"
fi
[ -z "$NO_OPEN" ] && open "$OUT" 2>/dev/null || true
