#!/bin/bash
# BFS Website + CRM — লোকাল সার্ভার
# এই ফাইলে ডাবল-ক্লিক করলেই সাইট চালু হবে। বন্ধ করতে এই Terminal উইন্ডো বন্ধ করুন (বা Ctrl+C)।
cd "$(dirname "$0")" || exit 1
PORT=8000
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo ""
echo "  Website : http://localhost:$PORT/"
echo "  CRM     : http://localhost:$PORT/CRM%20Site/"
echo "  Student : http://localhost:$PORT/CRM%20Site/student.html"
echo ""
echo "  বন্ধ করতে: এই উইন্ডো বন্ধ করুন বা Ctrl+C চাপুন"
echo ""
(sleep 1; [ -z "$NOOPEN" ] && open "http://localhost:$PORT/") &
python3 -m http.server $PORT --bind 127.0.0.1
