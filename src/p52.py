"""p52: dùng chung app cũ và mới: bớt các tác vụ nền gây đơ khi dùng lâu.
python3 p52.py vào ra"""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)

# 1. forceSync: trước đây tắt rồi bật lại kết nối dữ liệu MỖI 60 giây, MỖI 10 giây khi chạm/bấm màn hình và mỗi lần vào tab Báo cáo.
#    Mỗi lần như vậy mọi luồng dữ liệu (hàng chục bộ sưu tập) bị ngắt và dựng lại, lượt lưu đang gửi bị kẹt → lưu chậm, đơ khi dùng lâu.
#    Nay chỉ nối lại khi app quay về từ nền (ẩn quá 10 giây), còn lại cách nhau tối thiểu 60 giây.
rep('async function forceSync(){','async function forceSync(force){')
rep('if(now - _lastSyncAt < 1500) return; /* chống spam */','if(force ? now-_lastSyncAt<3000 : now-_lastSyncAt<60000) return; /* chống spam */')
rep('if(was && Date.now()-was > 10_000) forceSync();','if(was && Date.now()-was > 10_000) forceSync(true);')
rep('if(hiddenAt && Date.now()-hiddenAt>10_000){ hiddenAt=0; forceSync(); }','if(hiddenAt && Date.now()-hiddenAt>10_000){ hiddenAt=0; forceSync(true); }')
rep('  setInterval(()=>{ if(!document.hidden) forceSync(); }, 60_000);\n','')
rep('  document.addEventListener("touchstart", ()=>{ if(!document.hidden && Date.now()-_lastSyncAt > 10_000) forceSync(); }, {passive:true});\n','')
rep('  document.addEventListener("click", ()=>{ if(!document.hidden && Date.now()-_lastSyncAt > 10_000) forceSync(); }, {passive:true});\n','')
# 2. vẽ lại cả màn hình mỗi phút kể cả khi app đang ẩn
rep('setInterval(()=>{ renderAll(); checkLate(); if(typeof renderMsg==="function") renderMsg(); },60000);','setInterval(()=>{ if(document.hidden) return; renderAll(); checkLate(); if(typeof renderMsg==="function") renderMsg(); },60000);')
open(dst, 'w').write(s); print('p52 ok')
