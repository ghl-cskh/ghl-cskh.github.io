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
# 5. tăng số phiên bản để máy đang mở app tự tải bản mới
rep('<meta name="app-v" content="51">', '<meta name="app-v" content="54">')
open(dst, 'w').write(s); print('p54 ok')
