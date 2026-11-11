import sys, json, re
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)
import os
D = os.path.dirname(os.path.abspath(__file__)) + '/'
js = lambda t: json.dumps(t, ensure_ascii=False).replace('</', '<\\/')
kho = open(D+'apps-script/Kho_full.gs').read()
sheetdb = open(D+'sheetdb2.js').read().replace('__KHO_GS__', js(kho))

# 1. bỏ Firebase, nạp lớp dữ liệu kho chi nhánh
rep('''<script defer src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script defer src="config.js"></script>
<link rel="preconnect" href="https://firestore.googleapis.com" crossorigin>
<link rel="preconnect" href="https://www.gstatic.com" crossorigin>
''', '''<script src="/config.js"></script>
<script>
'''+sheetdb.replace('</script', '<\\/script')+'''
</script>
<link rel="preconnect" href="https://script.google.com" crossorigin>
''')
rep('/* ---------- Boot (Firebase) ---------- */', '/* ---------- Boot (kho Google Sheet của chi nhánh) ---------- */')
rep('<meta name="app-v" content="48">', '<meta name="app-v" content="50">')
# đường dẫn tuyệt đối (link /hpl-quan-7 trên GitHub Pages dùng 404.html)
s = s.replace('href="manifest.json"', 'href="/manifest.json"').replace('register("sw.js")', 'register("/sw.js")')
s = s.replace('src="icon-192.png"', 'src="/icon-192.png"').replace('href="icon-192.png"', 'href="/icon-192.png"')
rep('const LINK_SLUG=(()=>{ const m=location.pathname.match(', 'const LINK_SLUG=(()=>{ const m=(window.__pvPath||location.pathname).match(')

# link riêng lấy theo slug trong branches.json (nếu có)
rep('const brSlug=b=>{ const t=', 'const brSlug=b=>{ if(b&&b.slug) return String(b.slug); const t=')
rep('<link rel="manifest" href="/manifest.json">', open(D+'pwa_head.html').read().strip())
# 2. bỏ kiểm tra trùng số điện thoại ba mẹ
rep('async function queryPhoneUses(sdt){ const n=normSdt(sdt); if(!n) return [];', 'async function queryPhoneUses(sdt){ return []; const n=normSdt(sdt); if(!n) return [];')
rep('async function updatePhoneUse(sid,pid,rec,overrides){\n  const n=normSdt(rec.sdt); if(!n) return;', 'async function updatePhoneUse(sid,pid,rec,overrides){ return;\n  const n=normSdt(rec.sdt); if(!n) return;')
rep('async function removePhoneUseIfSdtChanged(sid,pid,oldSdt,newSdt){ const o=normSdt(oldSdt)', 'async function removePhoneUseIfSdtChanged(sid,pid,oldSdt,newSdt){ return; const o=normSdt(oldSdt)')

# 3. không còn GĐ Vùng
rep('Khi Giám đốc chi nhánh hoặc Giám đốc vùng duyệt, trang này tự mở sổ cho bạn.', 'Khi Giám đốc chi nhánh duyệt, trang này tự mở sổ cho bạn.')

# 4. chip trạng thái lưu
i = s.index('<small id="whoami">'); j = s.index('</small>', i) + len('</small>')
s = s[:j] + '<span class="drv-chip" id="drvChip" hidden></span>' + s[j:]

# 5. mục kho chi nhánh thay sao lưu cũ
a = s.index('function backupBlock(b){'); b = s.index('document.addEventListener("click",async e=>{\n  const r=e.target.closest("[data-bkrun]")')
s = s[:a] + open(D+'kb2.js').read() + '\n' + s[b:]
a = s.index('const BK_AUTO_GS="'); b = s.index('\n', a); s = s[:a] + 'const BK_AUTO_GS="";' + s[b:]
rep('function bkBanner(){ let el=$("bkBanner"); const bid=S.myBranch;', 'function bkBanner(){ const old=$("bkBanner"); if(old) old.remove(); return; let el=null; const bid=S.myBranch;')

css = open(D+'wide.css').read() + '''/* v2: kho Google Sheet */
.drv-chip{display:block;width:max-content;max-width:100%;margin-top:3px;overflow:hidden;text-overflow:ellipsis;padding:2px 8px;border-radius:999px;font:600 11.5px/1.5 "Be Vietnam Pro",system-ui,sans-serif;background:rgba(255,255,255,.22);color:var(--hdr-ink);white-space:nowrap}
.drv-chip.wait{background:#fef3e2;color:#92400e}.drv-chip.bad{background:#fee2e2;color:#991b1b}
.drv-msg{margin:0;font-weight:600;font-size:13.5px;overflow-wrap:anywhere}
'''
k = s.index('.bk2-st b.ok{color:var(--ok)}'); k = s.index('\n', k) + 1
s = s[:k] + css + s[k:]
open(dst, 'w').write(s)
print('ok', len(s))

# ===== v2.1: tìm ba mẹ nhanh hơn + Điểm danh chuyển sang tab Ca =====
s = open(dst).read()
# 1. all(): dùng lại kết quả trong cùng một lượt vẽ (trước đây mỗi lần gọi chép lại toàn bộ dữ liệu)
rep('const all = kind => { const rows=visibleSids().flatMap(sid => ((S.data[sid]||{})[kind]||[]).map(x=>({...x,_sid:sid})));',
    'let _allC=null; const allClear=()=>{ _allC=null; };\nconst all = kind => { if(!_allC){ _allC={}; setTimeout(allClear,0); } const ck=kind+"|"+S.scope; let rows=_allC[ck]; if(rows) return rows.slice(); rows=visibleSids().flatMap(sid => ((S.data[sid]||{})[kind]||[]).map(x=>({...x,_sid:sid})));\n  if(S.scope==="to"){ const T=new Set(myTo()); rows=rows.filter(x=>{ const p=(kind==="parents"||kind==="trash")?x:parentOf(x._sid,x.parentId); return p && T.has(p.to||""); }); }\n  _allC[ck]=rows; return rows.slice();\n  if(S.scope!=="to") return rows;')
rep('function renderNow(){\n  if(!S.db || $("tabs").hidden) return;', 'function renderNow(){\n  allClear();\n  if(!S.db || $("tabs").hidden) return;')
# 2. gõ tìm: kết quả gợi ý hiện ngay, danh sách bên dưới vẽ lại khi ngừng gõ
rep('$("bmSearch").oninput = ()=>{ renderParents("chinh_thuc","bmList","bmCount","bmSearch"); renderSearchRes(); };',
    'let _bmT=0; $("bmSearch").oninput = ()=>{ renderSearchRes(); clearTimeout(_bmT); _bmT=setTimeout(()=>{ allClear(); renderParents("chinh_thuc","bmList","bmCount","bmSearch"); }, 350); };')
# 3. Điểm danh: từ Danh sách sang tab Ca
rep('      <button type="button" data-lv="att" aria-pressed="false">Điểm danh</button>\n', '')
a = s.index('    <div id="lvAtt" hidden>'); b = s.index('  </section>', a)
att = s[a:b]; s = s[:a] + s[b:]
rep('''  <section id="v-ca" hidden>
    <div class="sec-head"><h2>Ca tập</h2><span class="count" id="caCount"></span></div>
    <p class="day-label" id="caDayLabel"></p>
    <div class="ca-grid" id="caGrid"></div>
    <div class="panel ca-head" id="caHead"></div>
    <div id="caList"></div>
  </section>''', '''  <section id="v-ca" hidden>
    <div class="seg" role="group" aria-label="Ca tập hoặc Điểm danh" style="margin-bottom:14px">
      <button type="button" data-cv="ca" aria-pressed="true">Ca tập</button>
      <button type="button" data-cv="att" aria-pressed="false">Điểm danh</button>
    </div>
    <div id="cvCa">
    <div class="sec-head"><h2>Ca tập</h2><span class="count" id="caCount"></span></div>
    <p class="day-label" id="caDayLabel"></p>
    <div class="ca-grid" id="caGrid"></div>
    <div class="panel ca-head" id="caHead"></div>
    <div id="caList"></div>
    </div>
''' + att + '''  </section>''')
rep(' $("lvAtt").hidden=S.lv!=="att"; renderAll(); renderAtt(); });', ' renderAll(); });\nS.cv="ca"; document.querySelectorAll("[data-cv]").forEach(b=>b.onclick=()=>{ S.cv=b.dataset.cv; document.querySelectorAll("[data-cv]").forEach(x=>x.setAttribute("aria-pressed",x===b)); $("cvCa").hidden=S.cv!=="ca"; $("lvAtt").hidden=S.cv!=="att"; renderAll(); });')
rep('  if(S.lv!=="att" || !$("lvAtt")) return;', '  if(S.tab!=="ca" || S.cv!=="att" || !$("lvAtt")) return;')
rep('renderToday(); renderAtt(); renderPh(); }', 'renderToday(); renderPh(); }')
rep('  if(t==="ca") renderCa();', '  if(t==="ca"){ if(S.cv==="att") renderAtt(); else renderCa(); }')
open(dst, 'w').write(s)
print('v2.1 ok')

# ===== v2.1: ô tìm tên ba mẹ trong tab Ca (dùng cho cả Ca tập và Điểm danh) =====
s = open(dst).read()
rep('''      <button type="button" data-cv="att" aria-pressed="false">Điểm danh</button>
    </div>''', '''      <button type="button" data-cv="att" aria-pressed="false">Điểm danh</button>
    </div>
    <div class="srch-wrap" style="margin-bottom:12px"><input id="caSearch" type="search" placeholder="Tìm tên ba mẹ (vd: Sĩ, Hằng) hoặc SĐT…" autocomplete="off"></div>''')
rep('const list=ps.filter(p=>C.inCa(p,S.caSel)).sort(cmpParents),', 'const caQ=(($("caSearch")||{}).value||"").trim(), list=ps.filter(p=>C.inCa(p,S.caSel)&&(!caQ||bmMatch(p,caQ))).sort(cmpParents),')
_k='  const groups=new Map(); rows.forEach(p=>{ const k=p.to||NONE;'; _i=s.index(_k, s.index('function renderAtt(){'))
s=s[:_i]+'  const caQ2=(($("caSearch")||{}).value||"").trim(); const groups=new Map(); rows.filter(p=>!caQ2||bmMatch(p,caQ2)).forEach(p=>{ const k=p.to||NONE;'+s[_i+len(_k):]
rep('S.cv="ca"; document.querySelectorAll("[data-cv]")', 'let _caT=0; $("caSearch").oninput=()=>{ clearTimeout(_caT); _caT=setTimeout(()=>renderAll(),200); };\nS.cv="ca"; document.querySelectorAll("[data-cv]")')
open(dst, 'w').write(s)
print('v2.1 tìm trong Ca ok')
