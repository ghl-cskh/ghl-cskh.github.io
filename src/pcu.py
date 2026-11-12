"""pcu: riêng cho APP CŨ (Firebase): chuyển Điểm danh từ tab Danh sách sang tab Ca (giống v2.1).
Dùng lại đúng phần vá trong p2.py để hai app giống hệt nhau. python3 pcu.py vào ra"""
import sys, os
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)
p2 = open(os.path.dirname(os.path.abspath(__file__))+'/p2.py').read()
a = p2.index('# 3. Điểm danh: từ Danh sách sang tab Ca'); b = p2.index("open(dst, 'w').write(s)\nprint('v2.1 ok')")
exec(p2[a:b])
# ô tìm tên trong tab Ca
a = p2.index('rep(\'\'\'      <button type="button" data-cv="att"'); b = p2.index("open(dst, 'w').write(s)\nprint('v2.1 tìm trong Ca ok')")
pre = "bmMatch" in s
exec(p2[a:b]) if pre else None
open(dst, 'w').write(s); print('app cũ ok', len(s), 'tìm trong Ca:', pre)
