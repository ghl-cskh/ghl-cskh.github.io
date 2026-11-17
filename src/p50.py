"""p50: sửa giao diện dùng chung app cũ và mới: Báo cáo có tình trạng sức khoẻ trước/sau, chat bớt giật, bấm @tên trong chat mở hồ sơ.
python3 p50.py vào ra"""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)

# 1. Độ nhẹ: ghi rõ tình trạng sức khoẻ TRƯỚC và SAU tập
rep('''<div class="dn-row">${f(o.truoc,"Trước")}<span class="dn-ar">→</span>${f(o.sau,"Sau")}</div></div>`; }''',
    '''<div class="dn-row">${f(o.truoc,"Trước")}<span class="dn-ar">→</span>${f(o.sau,"Sau")}</div>`
    +`<div class="dn-tt2"><b>Tình trạng sức khoẻ trước tập:</b> ${o.truoc.tt?esc(o.truoc.tt):"<i>chưa ghi</i>"}</div>`
    +`<div class="dn-tt2"><b>Tình trạng sức khoẻ sau tập:</b> ${o.sau.tt?esc(o.sau.tt):"<i>chưa ghi</i>"}</div></div>`; }''')
rep('\n</style>\n\n</head>', '\n.dn-tt2{margin-top:6px;font-size:14px;line-height:1.45}.dn-tt2 i{color:var(--muted)}\n.ch-at[data-o]{cursor:pointer;text-decoration:underline;text-underline-offset:2px}\n</style>\n\n</head>')

# 2. Chat: @tên ba mẹ bấm vào là mở thẳng hồ sơ
rep('<span class="ch-at">@${esc(p.tenBaMe||"Ba mẹ")}</span>', '<span class="ch-at" data-o="${esc(l._sid)}|${esc(l.parentId)}" role="button">@${esc(p.tenBaMe||"Ba mẹ")}</span>')
rep('$("chThread").onclick=e=>{ if(e.target.closest("#chMore")){',
    '$("chThread").onclick=e=>{ const at=e.target.closest(".ch-at[data-o]"); if(at){ const [sid,pid]=at.dataset.o.split("|"); if(parentOf(sid,pid)){ closeChat(); openDetail(sid,pid); } return; }\n  if(e.target.closest("#chMore")){')

# 3. Chat bớt giật: chỉ tính lại khi dữ liệu thật sự có thay đổi (trước đây tính lại cả luồng tin mỗi 2,5 giây)
rep('setInterval(()=>{ if(sheet.hidden||document.hidden) return; const s=sigOf();',
    'setInterval(()=>{ if(sheet.hidden||document.hidden) return; const rv=window.__sdbRev; if(rv!==undefined){ if(rv===ch._rv) return; ch._rv=rv; } const s=sigOf();')
open(dst, 'w').write(s); print('p50 ok')
