"""v54: Sổ ghi chú nhanh (chỉ điện thoại & iPad): gõ @ gắn tên ba mẹ, bấm thẻ mở bảng trượt, tự lưu theo ngày.
Mã ở sonote.js + sonote_pen.js (bút đổi thành chữ) + sonote.css, chèn vào cuối khối chính của app. Chạy sau p53:  python3 p54.py vào ra"""
import os, sys
D = os.path.dirname(os.path.abspath(__file__)) + '/'
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)

# 1. giao diện
rep('\n</style>\n\n</head>', open(D+'sonote.css').read() + '</style>\n\n</head>')
# 2. mã chức năng: đặt cùng khối với khung chat để dùng chung dữ liệu S.*
a = 'plansOf,staffName,fmtDay,logTime,logTs,quick,toast,renderAll});\n'
rep(a, a + '\n' + (open(D+'sonote_pen.js').read() + open(D+'sonote.js').read()).replace('</script', '<\\/script'))
# 3. đang viết ghi chú thì không tự tải lại để cập nhật bản mới
rep('const busyTyping=()=> !!S.editing', 'const busyTyping=()=> !!window.__snOpen || !!S.editing')
# 4. chặn "chạm đúp phóng to" không được nuốt thao tác trong khung ghi chú
rep('!e.target.closest("input,textarea,select")) e.preventDefault(); lastT=n;', '!e.target.closest("input,textarea,select,#snRoot")) e.preventDefault(); lastT=n;')
# 4b. iPhone: khung chat / ghi chú bị tụt xuống, hở trang phía sau. Chỉ bám theo "vùng nhìn thấy" khi bàn phím đang mở,
#     còn lại phủ kín màn hình; khi khung đang mở thì khoá trang phía sau để không bị kéo nảy theo.
a = 'const t=Math.round(vv.offsetTop), h=Math.round(vv.height), k=t+"|"+h; if(k===_fitK) return; _fitK=k;\n  sheet.style.top=t+"px"; sheet.style.height=h+"px"; sheet.style.bottom="auto"; if(near) th.scrollTop=th.scrollHeight; }); }'
rep(a, 'const b=window.__kbBox(vv), k=b?b.t+"|"+b.h:"full"; if(k===_fitK) return; _fitK=k;\n'
       '  sheet.style.top=b?b.t+"px":"0px"; sheet.style.height=b?b.h+"px":"auto"; sheet.style.bottom=b?"auto":"0px"; if(near) th.scrollTop=th.scrollHeight; }); }\n'
       '["focusin","focusout"].forEach(e=>document.addEventListener(e,()=>setTimeout(fit,80)));\n'
       'new MutationObserver(()=>window.__lockPage("chat",!sheet.hidden)).observe(sheet,{attributes:true,attributeFilter:["hidden"]});')
s_helper = open(D+'khung.js').read()
a2 = 'plansOf,staffName,fmtDay,logTime,logTs,quick,toast,renderAll});\n'
rep(a2, a2 + '\n' + s_helper)
# 5. tăng số phiên bản để máy đang mở app tự tải bản mới
old_v = '48' if '<meta name="app-v" content="48">' in s else '51'      # app cũ (Firebase) còn số 48 sau chuỗi vá
rep('<meta name="app-v" content="%s">' % old_v, '<meta name="app-v" content="55">')
open(dst, 'w').write(s); print('p54 ok')
