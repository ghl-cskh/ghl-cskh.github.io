/* ===================== v54: SỔ GHI CHÚ NHANH (chỉ điện thoại & iPad) =====================
 * Dữ liệu: dùng lại ba mẹ / điểm danh / kế hoạch / báo cáo sẵn có. Ghi chú lưu 2 lớp:
 *   1) localStorage  cskh_sonote_<chi nhánh>_<nhân viên>_<ngày>  (lưu ngay từng phím)
 *   2) kho chi nhánh staff/{nhân viên}/sonote/{ngày}              (gửi sau khi ngừng gõ)
 * Nội dung là chữ thường; thẻ ba mẹ ghi dạng ⟦sid|pid|Tên⟧, đoạn tô dạ quang ghi dạng ⟪chữ⟫ (không lưu HTML).
 * Chế độ Bút (sonote_pen.js) không lưu nét mực: nét được đổi thành chữ rồi chèn vào đúng hàng. */
(function(E){
const {S,$,esc,pad,today,addDays,parentOf,staffName,fmtDay,fmtShort,norm,quick,benhList,plansOf,dayLogOf,saveDay,talksHtml,skBlock,hqBlock,khBlock,addTomorrowPlans,tempClass}=E;

/* ---------- chỉ bật trên điện thoại / iPad ---------- */
const mq=window.matchMedia("(max-width:1024px), (hover:none) and (pointer:coarse)");
const isIpad=/iPad/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
/* máy tính bảng Android có bút đôi khi tự báo là "dùng chuột": nhận thêm theo hệ điều hành */
const isAndroid=/Android/.test(navigator.userAgent)&&navigator.maxTouchPoints>0;
const allowed=()=>mq.matches||isIpad||isAndroid;

/* ---------- khung giao diện ---------- */
const openBtn=document.createElement("button");
openBtn.type="button"; openBtn.id="snOpen"; openBtn.className="zalo-grp"; openBtn.hidden=true;
openBtn.setAttribute("aria-label","Mở Sổ ghi chú nhanh"); openBtn.title="Sổ ghi chú nhanh";
openBtn.innerHTML=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg><span class="lbl">Ghi chú</span>`;
const acts=document.querySelector(".top-acts"); if(acts) acts.prepend(openBtn);

const root=document.createElement("div"); root.id="snRoot"; root.hidden=true;
root.setAttribute("role","dialog"); root.setAttribute("aria-label","Sổ ghi chú nhanh");
root.innerHTML=`
<div class="sn-head">
  <button type="button" class="sn-ib" id="snBack" aria-label="Đóng sổ ghi chú">‹</button>
  <div class="sn-title"><b>Ghi chú nhanh</b><small id="snStatus" aria-live="polite"></small></div>
  <div class="sn-dates">
    <button type="button" class="sn-ib" id="snPrev" aria-label="Ngày trước">‹</button>
    <label class="sn-date"><span id="snDateTxt"></span><input type="date" id="snDate" aria-label="Chọn ngày ghi chú"></label>
    <button type="button" class="sn-ib" id="snNext" aria-label="Ngày sau">›</button>
  </div>
</div>
<div class="sn-scroll" id="snScroll">
  <div class="sn-page">
    <div class="sn-day" id="snDay"></div>
    <div class="sn-past" id="snPast" hidden><span>Đang xem lại ngày cũ (chỉ đọc)</span><button type="button" id="snToday">Về hôm nay</button></div>
    <div class="sn-paper" id="snPaper"><div id="snEd" role="textbox" aria-multiline="true" aria-label="Nội dung ghi chú" spellcheck="false"></div></div>
  </div>
</div>
<div class="sn-sug" id="snSug" role="listbox" aria-label="Gợi ý ba mẹ" hidden></div>
<div class="sn-bar" id="snBar">
  <button type="button" data-sntool="at"><b>@</b> Ba mẹ</button>
  <button type="button" data-sntool="dot" aria-label="Chèn đầu dòng">• Dòng</button>
  <button type="button" data-sntool="time" aria-label="Chèn giờ hiện tại">🕒 Giờ</button>
  <button type="button" data-sntool="done" class="sn-done">Xong</button>
</div>
<div class="sn-bar" id="snTempBar" hidden><button type="button" data-tkey="/" aria-label="Dấu gạch chéo">&nbsp;/&nbsp;</button><button type="button" data-tkey="." aria-label="Dấu chấm">&nbsp;.&nbsp;</button><span class="sn-tip">Trên / Dưới</span><button type="button" data-tkey="done" class="sn-done">Xong</button></div>
<div class="sn-ask" id="snAsk" role="dialog" aria-label="Chọn ba mẹ" hidden></div>
<div class="sn-veil" id="snVeil" hidden></div>
<aside class="sn-sheet" id="snSheet" role="dialog" aria-modal="true" aria-labelledby="snName" tabindex="-1" hidden>
  <div class="sn-grab" aria-hidden="true"></div>
  <div class="sn-shead"><div><h3 id="snName"></h3><small id="snSub"></small></div><button type="button" class="sn-ib" id="snClose" aria-label="Đóng">✕</button></div>
  <div class="sn-sbody" id="snBody">
    <section class="sn-card sn-today" id="snTodayBox">
      <h4 id="snTodayH">Kế hoạch hôm nay</h4>
      <div id="snTodayList"></div>
      <div id="snPlanForm">
        <textarea id="snPlanTxt" rows="2" placeholder="Thêm việc cần làm hôm nay…"></textarea>
        <div class="sn-row"><button type="button" class="btn line sm" id="snPlanCancel" hidden>Huỷ sửa</button><button type="button" class="btn sm" id="snPlanSave">Thêm vào kế hoạch</button></div>
      </div>
    </section>
    <section class="sn-card" id="snPrevPlan"></section>
    <section class="sn-card" id="snReport"></section>
    <section class="sn-card" id="snTnBox">
      <h4>Báo cáo hôm nay</h4>
      <div class="sn-lab">Thân nhiệt (°C) · 2 ô viền đậm hiện cạnh tên</div>
      <div class="sn-tn"><span></span><b>Thân trên</b><b>Thân dưới</b>
        <span>Trước tập</span><input class="sn-linked" inputmode="decimal" data-sntn="truocTren" aria-label="Trước tập, thân trên"><input inputmode="decimal" data-sntn="truocDuoi" aria-label="Trước tập, thân dưới">
        <span>Sau tập</span><input class="sn-linked" inputmode="decimal" data-sntn="sauTren" aria-label="Sau tập, thân trên"><input inputmode="decimal" data-sntn="sauDuoi" aria-label="Sau tập, thân dưới"></div>
      <label class="sn-lab" for="snRep">Báo cáo / vấn đề của ba mẹ</label>
      <textarea id="snRep" data-snf="rep" rows="3" placeholder="Ba mẹ chia sẻ gì, tình trạng ra sao…"></textarea>
      <small class="sn-hint" id="snRepHint" hidden>Lấy từ ghi chú của ba mẹ này.</small>
      <label class="sn-check"><input type="checkbox" id="snPy" data-snf="py"> Có phản ứng PƯPH</label>
      <textarea id="snPyNote" data-snf="pyNote" rows="2" placeholder="Phản ứng thế nào…" hidden></textarea>
      <label class="sn-lab" for="snKm">Kế hoạch ngày mai (mỗi dòng một việc)</label>
      <textarea id="snKm" data-snf="km" rows="2" placeholder="Việc cần làm ngày mai…"></textarea>
      <p class="sn-err" id="snTnErr" role="alert" hidden></p>
      <div class="sn-row"><small>Tự lưu sau 2 giây · ô trống giữ như cũ</small><button type="button" class="btn sm" id="snTnSave">Lưu báo cáo</button></div>
    </section>
    <details class="sn-more" id="snMore"><summary>Thông tin khác</summary>
      <section class="sn-card" id="snInfo"></section>
    </details>
  </div>
</aside>`;
document.body.appendChild(root);
/* Độ nhẹ: dùng đúng thanh 0–10 của hồ sơ (app tự xử lý chạm/kéo cho mọi .dn-bar), chỉ khác tiền tố id */
const dnBlock=(k,cls,title,sub)=>`<div class="dn-b ${cls}"><div class="dn-h"><span><b>${title}</b><small>${sub}</small></span><span class="dn-v" id="sndnV${k}">–</span></div><div class="dn-bar" id="sndnB${k}" data-dn="sndn|${k}" role="slider" tabindex="0" aria-label="Mức độ ${sub} (0–10)" aria-valuemin="0" aria-valuemax="10">${[0,1,2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" tabindex="-1" data-n="${n}">${n}</button>`).join("")}</div><div class="dn-sc"><span>0 · không còn triệu chứng</span><span>10 · rất nặng</span></div><label class="dn-l"><span>TÌNH TRẠNG SỨC KHOẺ</span><input id="sndnT${k}" autocomplete="off" placeholder="VD: Đau lưng nhiều, khó ngủ…"></label></div>`;
$("snKm").previousElementSibling.insertAdjacentHTML("beforebegin",`<label class="sn-check"><input type="checkbox" id="snDnChk"> 💚 Độ nhẹ (nếu có)</label><div class="sn-dn" id="snDnBox" hidden>${dnBlock(1,"truoc","TRƯỚC","trước tập máy")}${dnBlock(2,"sau","SAU","sau tập máy")}</div>`);
$("snDnChk").onchange=e=>{ $("snDnBox").hidden=!e.target.checked; };

const ed=$("snEd"), sug=$("snSug"), sheetEl=$("snSheet"), veil=$("snVeil"), scroller=$("snScroll");

/* ---------- dữ liệu ba mẹ (mọi ba mẹ đã tải, không phụ thuộc ô lọc "xem của ai") ---------- */
const everyone=()=>Object.keys(S.data).flatMap(sid=>((S.data[sid]||{}).parents||[]).map(p=>({sid,id:p.id,p})));
function findParent(sid,pid){ const p=parentOf(sid,pid); if(p) return {sid,p};
  for(const s in S.data){ const q=parentOf(s,pid); if(q) return {sid:s,p:q}; }   // ba mẹ đã chuyển người phụ trách
  return null; }
const attOn=(sid,pid,d)=>((S.data[sid]||{}).att||[]).find(a=>a.parentId===pid&&a.date===d)||null;

/* tìm không dấu: mỗi chữ gõ là phần đầu của một chữ trong tên, theo đúng thứ tự. Điểm nhỏ = khớp hơn */
function score(name,q){ const w=norm(name).split(/[^a-z0-9]+/).filter(Boolean), qw=norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  if(!qw.length) return 0;
  const last=w.slice(-qw.length); if(last.length===qw.length && qw.every((x,i)=>last[i].startsWith(x))) return 1;   // trùng tên gọi
  let i=0; for(const x of w){ if(x.startsWith(qw[i])) i++; if(i===qw.length) return 2; }
  return -1; }
const HON=new Set("bác cô chú anh chị ông bà dì cậu mợ thím em ba mẹ bố má".split(" "));
const words=t=>String(t||"").normalize("NFC").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
const noHon=w=>w.length>1&&HON.has(w[0])?w.slice(1):w;
const came=x=>{ const a=attOn(x.sid,x.id,today()); return !!(a&&a.status==="co"); };
function suggest(q){ const t=today(); q=q.replace(/^\s*(bác|cô|chú|anh|chị|ông|bà|dì|cậu|mợ|thím)\s+/i,"");
  return everyone().map(x=>{ const a=attOn(x.sid,x.id,t); return {...x, name:x.p.tenBaMe||"Ba mẹ", s:score(x.p.tenBaMe||"",q), came:!!(a&&a.status==="co"), ca:a&&a.ca}; })
    .filter(x=>x.s>=0).sort((a,b)=>(b.came-a.came)||(a.s-b.s)||a.name.localeCompare(b.name,"vi")).slice(0,40); }

/* ---------- chữ <-> khung soạn ---------- */
const TOK=/⟦([^|⟦⟧]*)\|([^|⟦⟧]*)\|([^⟦⟧]*)⟧/g;
/* hai ô cạnh tên: Trước tập và Sau tập, mỗi ô ghi dạng "thân trên/thân dưới" (vd 36.3/36.0) */
const TN_INLINE=[["truoc","Trước"],["sau","Sau"]];
/* ---- đọc số đo ---- */
const hasV=v=>v!=null&&v!=="";
const okTemp=n=>n>=25&&n<=45;
const toTemp=t=>{ t=String(t).replace(/\s/g,"").replace(",","."); let n=Number(t); if(/^\d{3}$/.test(t)&&n>=250&&n<=450) n/=10; return /^(\d{2}(\.\d)?|\d{3})$/.test(t)&&okTemp(n)?n:null; };
/* nội dung gõ trong ô: "36,3 / 36", "36.3", "/36"… trả {up?,down?}; sai thì trả null */
function parseTemp(v){ v=String(v).replace(/[–_]/g,"").trim(); if(!v||v==="/") return {};
  let parts=v.split(/\s*[\/|\\]\s*/); if(parts.length===1){ const two=v.match(/^(\d{2}(?:[.,]\d)?)\s+(\d{2}(?:[.,]\d)?)$/); if(two) parts=[two[1],two[2]]; }
  if(parts.length>2) return null; const out={};
  for(let i=0;i<parts.length;i++){ if(!parts[i].trim()) continue; const n=toTemp(parts[i]); if(n==null) return null; out[i?"down":"up"]=n; }
  return out; }
/* tìm cặp trên/dưới trong một câu (có dấu / thật). Ngày tháng như 26/11 không lọt vì ngoài khoảng đo */
const PAIR=/(^|[^\d.,])(\d{2}(?:\s*[.,]\s*\d)?)\s*[\/|\\]\s*(\d{2}(?:\s*[.,]\s*\d)?)(?!\d)/;
function pairIn(t){ const m=PAIR.exec(String(t).replace(/(\d)[oO]/g,"$10")); if(!m) return null; const up=toTemp(m[2]), down=toTemp(m[3]);
  return up==null||down==null?null:{up,down,start:m.index+m[1].length,end:m.index+m[0].length}; }
/* máy hay đọc nhầm dấu / thành số 1: chỉ dùng để HỎI lại, không tự ghi */
function guessPair(t){ const m=/^\W*(\d{2}(?:[.,]\d)?)\s*[1lI]\s*(\d{2}(?:[.,]\d)?)\W*$/.exec(String(t)); if(!m) return null; const up=toTemp(m[1]), down=toTemp(m[2]); return up==null||down==null?null:{up,down}; }
const showPair=(up,down)=>hasV(up)||hasV(down)?[up,down].map(v=>hasV(v)?Number(v).toFixed(1):"–").join("/"):"";
function chip(sid,pid,name){ const s=document.createElement("span"); s.className="sn-tag"; s.contentEditable="false";
  s.dataset.sid=sid; s.dataset.pid=pid; s.dataset.name=name;
  const f=findParent(sid,pid), b=document.createElement("span"); b.className="sn-name"; b.setAttribute("role","button"); b.textContent="@"+((f&&f.p.tenBaMe)||name);
  s.append(b);
  TN_INLINE.forEach(([k,label])=>{ const t=document.createElement("span"); t.className="sn-temp"; t.dataset.tnk=k;
    t.innerHTML=`<em>${label}</em><input data-tnk="${k}" inputmode="decimal" autocomplete="off" maxlength="13" placeholder="__/__" aria-label="Thân nhiệt ${label.toLowerCase()} tập: thân trên / thân dưới, độ C">`; s.append(t); });
  if(!f&&Object.keys(S.data).length) s.classList.add("gone"); fillTemp(s); return s; }
const savedAt={};                                   // dấu ✓ sau khi kho nhận
const canWrite=f=>!!(f&&curDate===today()&&S.loaded&&S.loaded[f.sid]&&S.loaded[f.sid].has("logs"));   // chưa tải xong báo cáo thì chưa cho ghi, kẻo đè
const tnOn=(f,pid,d)=>{ const l=f&&dayLogOf(f.sid,pid,d); return (l&&l.tn)||{}; };
/* hiện số đo của NGÀY trang đang xem; chỉ hôm nay mới sửa được (giống báo cáo trong hồ sơ) */
function fillTemp(tag,force){ const pid=tag.dataset.pid, f=findParent(tag.dataset.sid,pid), tn=tnOn(f,pid,curDate);
  tag.querySelectorAll(".sn-temp input").forEach(i=>{ const k=i.dataset.tnk, up=tn[k+"Tren"], down=tn[k+"Duoi"], box=i.parentElement, val=showPair(up,down);
    if((force||document.activeElement!==i)&&i.value!==val) i.value=val;
    i.readOnly=!canWrite(f);
    box.className="sn-temp"+(hasV(up)?" "+tempClass(Number(up))[0]:""); box.title=hasV(up)?"Thân trên: "+tempClass(Number(up))[1]:"";
    box.toggleAttribute("data-saved",(savedAt[pid+k]||0)>Date.now()); });
  fillPlans(tag,f); }
/* ---------- ô kế hoạch cạnh tên: cùng dữ liệu với mục Kế hoạch trong hồ sơ ----------
 * Mỗi việc của NGÀY trang đang xem là một ô (thêm việc mới ở bảng bấm @Tên). Ngày đó chưa có việc thì hiện mờ kế hoạch lần trước. */
const canPlan=f=>!!(f&&curDate===today()&&S.loaded&&S.loaded[f.sid]&&S.loaded[f.sid].has("plans"));
const planAll=(f,pid)=>((S.data[f.sid]||{}).plans||[]).filter(x=>x.parentId===pid&&x.noiDung);
const byMade=(m,n)=>(m.createdAt||0)-(n.createdAt||0);
/* khung ngày mai cao một dòng, có từ hai việc trở lên mới cao hai dòng */
function fitMai(a){ a.parentElement.classList.toggle("tall",a.value.includes("\n")); }
function fitPlan(i){ i.style.width=/^dnm/.test(i.dataset.x||"")?"2.6em":Math.max(7,(i.value||i.placeholder).length*0.58+1)+"em"; }
const secOpen=new Set();                              // ô đã tích mở nhưng chưa có nội dung (pid|mục)
function fillPlans(tag,f){ if(tag.contains(document.activeElement)&&document.activeElement.closest(".sn-kh")) return;
  const pid=tag.dataset.pid, all=f?planAll(f,pid):[], now=all.filter(x=>x.date===curDate).sort(byMade), edit=canPlan(f);
  let old=null;
  if(f&&!now.length){ const dates=[...new Set(all.filter(x=>x.date<curDate).map(x=>x.date))].sort().reverse(), d=dates.find(k=>(attOn(f.sid,pid,k)||{}).status!=="vang")||dates[0];
    if(d) old={d, text:all.filter(x=>x.date===d).sort(byMade).map(x=>x.noiDung).join(" · ")}; }
  const c=(f&&dayLogOf(f.sid,pid,curDate))||null, rw=canWrite(f), dn=dnOf(c)||dnEmpty(), mai=String((c&&c.khMai)||"");
  const has_={py:!!(c&&c.pyph), dn:dnHas(dn), mai:!!mai.trim()}, shown=k=>has_[k]||(rw&&secOpen.has(pid+"|"+k));
  const sig=JSON.stringify([curDate,edit,rw,now.map(x=>[x.id,x.noiDung,!!x.done]),old,c&&[!!c.pyph,c.pyphNote||"",dn,mai],shown("py"),shown("dn"),shown("mai")]);
  if(tag.dataset.kh===sig) return; tag.dataset.kh=sig;
  tag.querySelectorAll(".sn-kh").forEach(el=>el.remove());
  const box=(cls,html)=>{ const s=document.createElement("span"); s.className="sn-kh"+(cls?" "+cls:""); s.innerHTML=html; tag.append(s); return s; };
  const field=(id,value,ph)=>`<input data-khid="${esc(id)}" value="${esc(value)}" placeholder="${ph}" maxlength="300" autocomplete="off" enterkeyhint="done" aria-label="Sửa việc trong kế hoạch"${edit?"":" readonly"}>`;
  now.forEach(x=>box(x.done?"done":"",`<button type="button" class="sn-khk" data-khk="${esc(x.id)}" aria-pressed="${!!x.done}" aria-label="Đã làm xong"${edit?"":" disabled"}>${x.done?"✓":""}</button><em>KH</em>${field(x.id,x.noiDung,"")}`));
  if(old){ const s=box("old",`<em>KH ${esc(fmtShort(old.d).slice(0,5))}</em><span>${esc(old.text)}</span>`); s.setAttribute("role","button"); s.title=old.text; }
  /* còn lại: mỗi mục một ô tích, tích mới hiện khung để gõ hoặc viết. Thứ tự: PƯPH → Độ nhẹ → Kế hoạch ngày mai */
  const area=(x,value,ph,label)=>`<textarea data-x="${x}" rows="2" placeholder="${ph}" aria-label="${label}" maxlength="600"${rw?"":" readonly"}>${esc(value)}</textarea>`;
  const num=(x,value,label)=>`<input data-x="${x}" value="${esc(value)}" placeholder="0–10" aria-label="${label}" inputmode="numeric" maxlength="2" autocomplete="off"${rw?"":" readonly"}>`;
  const toggle=(k,label)=>{ if(!rw) return; const b=document.createElement("button"); b.type="button"; b.className="sn-kh sn-tg"; b.dataset.sec=k; b.setAttribute("role","checkbox"); b.setAttribute("aria-checked",String(shown(k))); b.innerHTML=`<i>${shown(k)?"✓":""}</i>${label}`; tag.append(b); };
  toggle("py","PƯPH"); toggle("dn","💚 Độ nhẹ"); toggle("mai","📅 KH mai");
  if(shown("py")) box("wide xpy",`<em>PƯPH</em>${area("pyn",(c&&c.pyphNote)||"","Phản ứng thế nào…","Nội dung phản ứng PƯPH")}`);
  if(shown("dn")) [[1,"truoc","Trước"],[2,"sau","Sau"]].forEach(([n,k,ten])=>{ const v=dn[k]||{m:null,tt:""};
    box("wide xdn",`<em>Độ nhẹ<br>${ten}</em>${num("dnm"+n,v.m==null?"":v.m,"Mức độ "+ten+" tập, từ 0 đến 10")}${area("dnt"+n,v.tt||"","Tình trạng sức khoẻ…","Tình trạng sức khoẻ "+ten+" tập")}`); });
  if(shown("mai")) fitMai(box("wide xmai",`<em>Mai</em>${area("mai",mai,"Việc ngày mai…","Kế hoạch ngày mai")}`).querySelector("textarea"));
  tag.querySelectorAll(".sn-kh input").forEach(fitPlan); }
const refill=()=>setTimeout(fillTemps,60);
function penIntoBox(box,text){ text=String(text||"").trim(); if(!box||!text) return false;
  const first=box.querySelector("input,textarea"); if(!first||first.readOnly) return false;
  let area=box.querySelector("textarea"); const num=box.querySelector('input[data-x^="dnm"]');
  if(num){ const m=text.replace(/[oO](?!\p{L})/gu,"0").match(/^\s*(10|\d)(?![\d\p{L}])/u); if(m){ num.value=m[1]; saveExtra(num); text=text.slice(m[0].length).replace(/^[\s,.:\-]+/,""); if(!text) return true; } }
  if(!area) return false;
  area.value=[area.value.trim(), text].filter(Boolean).join(area.dataset.x==="mai"?"\n":" "); if(area.dataset.x==="mai") fitMai(area);
  if(num) setTimeout(()=>{ const a=box.isConnected?area:null; saveExtra(a||area); },0); else saveExtra(area);
  return true; }
/* Độ nhẹ: ghi vào báo cáo, đồng thời cập nhật phần theo dõi sức khoẻ trong hồ sơ như khi lưu ở hồ sơ */
function dnPatch(sid,pid,l,doNhe){ const d=today(), now=Date.now(), c=l||{}, pp=parentOf(sid,pid), upd={};
  const sucKhoe=dnToSk(doNhe), hieuQua=doNhe?doNhe.sau.tt:"", lid=l?l.id:`${pid}_${d}`;
  if(pp){ if(sucKhoe.length&&JSON.stringify(sucKhoe)!==JSON.stringify(c.sucKhoe||[])){ upd.skTT=skMerge(pp.skTT,sucKhoe,d); pp.skTT=upd.skTT; }
    if(hieuQua!==(c.hieuQua||"")){ const hq=(pp.hq||[]).filter(x=>x.id!==lid); if(hieuQua) hq.push({id:lid,d,t:hieuQua,by:S.me,at:now}); hq.sort((a,b)=>(a.d<b.d?-1:a.d>b.d?1:(a.at||0)-(b.at||0))); upd.hq=hq.slice(-100); pp.hq=upd.hq; } }
  if(Object.keys(upd).length) quick(S.db.doc(`staff/${sid}/parents/${pid}`).update(upd));
  return {doNhe, sucKhoe, hieuQua}; }
function putDay(f,pid,patch){ const fail=e=>{ console.warn("sonote field",e); say("Chưa lưu được vào báo cáo, thử lại"); fillTemps(); };
  try{ Promise.resolve(writeDay(f.sid,pid,patch)).then(r=>{ const a=r&&r.ack; return a&&a.ack?a.ack:a; }).catch(fail); say("Đã lưu vào báo cáo"); refill(); }catch(e){ fail(e); } }
function pyMark(f,pid){ const pp=parentOf(f.sid,pid), d=today(); if(pp&&pp.pyphLast!==d){ pp.pyphLast=d; quick(S.db.doc(`staff/${f.sid}/parents/${pid}`).update({pyphLast:d})); } }
/* các khung PƯPH, Độ nhẹ, Kế hoạch ngày mai: tự lưu như ô thân nhiệt; xoá trắng thì giữ nội dung cũ (muốn gỡ thì bỏ tích) */
function saveExtra(input){ const tag=input.closest(".sn-tag"), pid=tag&&tag.dataset.pid, f=tag&&findParent(tag.dataset.sid,pid); if(!canWrite(f)) return;
  const x=input.dataset.x, v=input.value.trim(), l=dayLogOf(f.sid,pid,today()), c=l||{};
  const keep=old=>{ input.value=old; };
  if(x==="pyn"){ if(!v) return keep(c.pyphNote||""); if(c.pyph&&v===c.pyphNote) return; pyMark(f,pid); return putDay(f,pid,{pyph:true, pyphNote:v}); }
  if(/^dn/.test(x)){ const k=x.slice(-1)==="1"?"truoc":"sau", doNhe=JSON.parse(JSON.stringify(dnOf(l)||dnEmpty())), isNum=x[2]==="m", was=doNhe[k][isNum?"m":"tt"];
    if(!v) return keep(was==null?"":was);
    if(isNum&&!/^(10|\d)$/.test(v)){ say("Độ nhẹ chỉ từ 0 đến 10"); return keep(was==null?"":was); }
    const next=isNum?Number(v):v; if(next===was) return; doNhe[k][isNum?"m":"tt"]=next; return putDay(f,pid,dnPatch(f.sid,pid,l,doNhe)); }
  if(!v) return keep(c.khMai||""); if(v===(c.khMai||"")) return;
  addTomorrowPlans(f.sid,pid,today(),v,c.khMai||""); putDay(f,pid,{khMai:v}); }
/* tích: mở khung (PƯPH thì đánh dấu có phản ứng luôn). Bỏ tích: đóng khung; đã có nội dung thì hỏi lại rồi mới gỡ */
function toggleSec(btn){ const tag=btn.closest(".sn-tag"), pid=tag.dataset.pid, f=findParent(tag.dataset.sid,pid), k=btn.dataset.sec; if(!canWrite(f)) return;
  if(isBox(document.activeElement)) document.activeElement.blur();
  const key=pid+"|"+k, l=dayLogOf(f.sid,pid,today()), c=l||{}, on=btn.getAttribute("aria-checked")==="true";
  const redo=()=>{ ed.querySelectorAll(".sn-tag").forEach(t=>{ if(t.dataset.pid===pid) delete t.dataset.kh; }); fillTemps(); };
  if(!on){ secOpen.add(key); if(k==="py"){ pyMark(f,pid); putDay(f,pid,{pyph:true, pyphNote:c.pyphNote||""}); } redo();
    if(!pen.on()) setTimeout(()=>{ const t=tag.querySelector(`.sn-kh.x${k} textarea, .sn-kh.x${k} input`); if(t) t.focus({preventScroll:false}); },90);
    return; }
  const filled=k==="py"?!!c.pyphNote:k==="dn"?dnHas(dnOf(l)):!!c.khMai;
  const drop=()=>{ secOpen.delete(key);
    if(k==="py"&&c.pyph) putDay(f,pid,{pyph:false, pyphNote:""});
    if(k==="dn"&&filled) putDay(f,pid,dnPatch(f.sid,pid,l,null));
    if(k==="mai"&&filled){ addTomorrowPlans(f.sid,pid,today(),"",c.khMai); putDay(f,pid,{khMai:""}); }
    setTimeout(redo,80); };
  if(!filled) return drop();
  const name={py:"PƯPH",dn:"Độ nhẹ",mai:"Kế hoạch ngày mai"}[k];
  askConfirm(`Gỡ <b>${name}</b> của <b>${esc((f.p.tenBaMe)||"ba mẹ")}</b> khỏi báo cáo hôm nay?`, drop, "Đúng, gỡ đi", "Không, giữ lại"); }
function savePlan(input){ const tag=input.closest(".sn-tag"), id=input.dataset.khid, text=input.value.trim(); if(!tag||input.readOnly) return;
  if(input.dataset.x) return saveExtra(input);
  const f=findParent(tag.dataset.sid,tag.dataset.pid), x=f&&planAll(f,tag.dataset.pid).find(p=>p.id===id); if(!x||!canPlan(f)) return;
  if(!text){ input.value=x.noiDung; return; }                      // xoá trắng: giữ việc cũ
  if(text===x.noiDung) return;
  quick(S.db.doc(`staff/${f.sid}/plans/${id}`).update({noiDung:text, updatedAt:Date.now()})); say("Đã sửa kế hoạch"); refill(); }
function tickPlan(btn){ if(btn.dataset.sec) return toggleSec(btn); const tag=btn.closest(".sn-tag"), f=findParent(tag.dataset.sid,tag.dataset.pid); if(!canPlan(f)) return;
  const done=btn.getAttribute("aria-pressed")!=="true";
  quick(S.db.doc(`staff/${f.sid}/plans/${btn.dataset.khk}`).update({done, doneAt:done?Date.now():null, updatedAt:Date.now()})); refill(); }
/* bút bắt đầu viết ngay trên khung đã tích: chữ vào khung đó */
function boxTarget(bb){ const base=$("snPaper").getBoundingClientRect();
  const hit=[...ed.querySelectorAll(".sn-kh.wide")].find(el=>{ const r=el.getBoundingClientRect(), x0=r.left-base.left, x1=r.right-base.left, y0=r.top-base.top, y1=r.bottom-base.top, cy=(bb.y0+bb.y1)/2;
    return bb.x0>=x0-12&&bb.x0<=x1&&cy>=y0-5&&cy<=y1+5; });
  return hit||null; }
const fillTemps=()=>ed.querySelectorAll(".sn-tag").forEach(t=>fillTemp(t));
/* ghi một phần báo cáo hôm nay, giữ nguyên mọi mục còn lại */
function writeDay(sid,pid,patch){ const d=today(), c=dayLogOf(sid,pid,d)||{};
  const tn={}; ["truocTren","truocDuoi","sauTren","sauDuoi"].forEach(k=>{ tn[k]=c.tn&&c.tn[k]!=null&&c.tn[k]!==""?c.tn[k]:null; });
  const f={talks:(c.talks||[]).slice(), pyph:!!c.pyph, pyphNote:c.pyphNote||"", sucKhoe:c.sucKhoe||[], hieuQua:c.hieuQua||"", doNhe:c.doNhe||null, khMai:c.khMai||"", keHoach:plansOf(sid,pid,d).map(x=>x.noiDung), ...patch};
  f.tn=Object.assign(tn,patch.tn||{}); return saveDay(sid,pid,d,f); }
/* ghi thân trên/dưới vào báo cáo hôm nay; vals = {up?,down?} */
async function commitTemp(sid,pid,k,vals){ const f=findParent(sid,pid); if(!canWrite(f)) return false;
  const old=tnOn(f,pid,today()), tn={};
  if(vals.up!=null && !(hasV(old[k+"Tren"])&&Number(old[k+"Tren"])===vals.up)) tn[k+"Tren"]=vals.up;
  if(vals.down!=null && !(hasV(old[k+"Duoi"])&&Number(old[k+"Duoi"])===vals.down)) tn[k+"Duoi"]=vals.down;
  if(!Object.keys(tn).length) return true;
  const text=(k==="truoc"?"Trước":"Sau")+" tập "+showPair(vals.up,vals.down);
  const fail=e=>{ console.warn("sonote temp",e); delete savedAt[pid+k]; say("Chưa lưu được thân nhiệt, thử lại"); fillTemps(); };
  try{ const r=await writeDay(f.sid,pid,{tn}), a=r&&r.ack;
    if(repDrafts[pid]) Object.keys(tn).forEach(x=>delete repDrafts[pid][x]);
    fillTemps();
    if(navigator.onLine===false) say("Đã lưu trong máy: "+text+", chờ mạng");
    Promise.resolve(a&&a.ack?a.ack:a).then(()=>{ savedAt[pid+k]=Date.now()+2500; fillTemps(); say("Đã lưu vào báo cáo: "+text); setTimeout(fillTemps,2600); }, fail);
    return true; }catch(e){ fail(e); return false; } }
function saveTemp(input){ const tag=input.closest(".sn-tag"); if(!tag||input.readOnly) return;
  const vals=parseTemp(input.value);
  if(!vals){ input.parentElement.className="sn-temp bad"; say("Ghi dạng trên/dưới, từ 25 đến 45 °C. Ví dụ 36.3/36"); return; }
  if(vals.up==null&&vals.down==null){ fillTemp(tag,true); return; }                    // xoá trắng: giữ số cũ
  commitTemp(tag.dataset.sid,tag.dataset.pid,input.dataset.tnk,vals); }
/* gõ đủ cặp số là lưu ngay; còn lại ngừng 2 giây thì lưu (gõ dở chưa thành số đo thì chờ, không báo lỗi) */
const boxT=new WeakMap();
function typedBox(input){ clearTimeout(boxT.get(input));
  const temp=!!input.closest(".sn-temp");
  if(temp&&/^\s*\d{2}[.,]\d\s*\/\s*\d{2}[.,]\d\s*$/.test(input.value)){ saveTemp(input); return; }
  boxT.set(input,setTimeout(()=>{ if(!input.isConnected||!input.value.trim()) return;      // đang xoá để gõ lại: chưa làm gì
    if(!temp) savePlan(input); else if(parseTemp(input.value)) saveTemp(input); },WAIT_SAVE)); }
const isTemp=el=>!!(el&&el.closest&&el.closest(".sn-temp"));
const isPlan=el=>!!(el&&el.closest&&el.closest(".sn-kh"));
const isBox=el=>isTemp(el)||isPlan(el);
function renderText(text){ ed.textContent="";
  if(!text) return;
  String(text).split("\n").forEach(line=>{ const div=document.createElement("div"), part=new RegExp(TOK.source+"|[⟪⟫]","g"); let box=div, last=0, m;
    while((m=part.exec(line))){ if(m.index>last) box.append(line.slice(last,m.index)); last=part.lastIndex;
      if(m[0]==="⟪"){ box=document.createElement("mark"); box.className="sn-hl"; div.append(box); }
      else if(m[0]==="⟫") box=div;
      else box.append(chip(m[1],m[2],m[3])); }
    if(last<line.length) box.append(line.slice(last));
    if(!div.childNodes.length) div.append(document.createElement("br"));
    ed.append(div); }); }
function serialize(){ let out="";
  const walk=node=>{ node.childNodes.forEach(c=>{
      if(c.nodeType===3){ out+=c.nodeValue.replace(/ /g," ").replace(/[⟦⟧⟪⟫]/g,""); return; }
      if(c.nodeType!==1) return;
      if(c.classList.contains("sn-tag")){ out+=`⟦${c.dataset.sid}|${c.dataset.pid}|${String(c.dataset.name).replace(/[|⟦⟧⟪⟫]/g," ")}⟧`; return; }
      if(c.tagName==="BR"){ if(c.nextSibling) out+="\n"; return; }
      if(/^(DIV|P|LI)$/.test(c.tagName) && c.previousSibling) out+="\n";
      if(c.classList.contains("sn-hl")){ out+="⟪"; walk(c); out+="⟫"; return; }
      walk(c); }); };
  walk(ed); return out.replace(/⟫( *)⟪/g,"$1").replace(/⟪( *)⟫/g,"$1"); }
const markEmpty=()=>ed.classList.toggle("empty", !ed.textContent.trim() && !ed.querySelector(".sn-tag") && !pen.on());

/* ---------- lưu: máy trước, kho sau ---------- */
let curDate=today(), shownText="", remote={}, remoteReady=false, unsub=null, pushT=0;
const prefix=()=>`cskh_sonote_${(window.SDB&&window.SDB.branch&&window.SDB.branch.id)||"cn"}_${S.me}_`;
const lsGet=d=>{ try{ return JSON.parse(localStorage.getItem(prefix()+d)||"null"); }catch(e){ return null; } };
const lsSet=(d,r)=>{ try{ localStorage.setItem(prefix()+d, JSON.stringify(r)); return true; }catch(e){ return false; } };
const status=(t,bad)=>{ const el=$("snStatus"); el.textContent=t; el.classList.toggle("bad",!!bad); };
const dirtyDates=()=>{ const out=[]; try{ const p=prefix(); for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(p)){ const d=k.slice(p.length); if((lsGet(d)||{}).dirty) out.push(d); } } }catch(e){} return out; };
const SPLIT="\n\n— Bản nháp trên máy này —\n";
/* ghép bản trong máy với bản trên kho, không bao giờ bỏ chữ */
function reconcile(d){ const l=lsGet(d), r=remote[d]; if(!r) return l;
  const rec={text:r.text||"", base:r.updatedAt||0, updatedAt:r.updatedAt||0, dirty:false};
  if(!l) return rec;
  if(!l.dirty){ if((r.updatedAt||0)>=(l.base||0)){ lsSet(d,rec); return rec; } return l; }
  if((r.updatedAt||0)>(l.base||0)){
    if(rec.text===l.text){ lsSet(d,rec); return rec; }
    const m=!rec.text||l.text.includes(rec.text)?l.text:(rec.text.includes(l.text)?rec.text:rec.text+SPLIT+l.text);
    const out={text:m, base:r.updatedAt, updatedAt:Date.now(), dirty:true}; lsSet(d,out); return out; }
  return l; }
/* khung đang mở phải khớp bản đã ghép, nếu không phím gõ tiếp theo sẽ đè mất phần vừa nhận */
function sync(d){ const r=reconcile(d); if(r && d===curDate && !root.hidden && r.text!==shownText && serialize()===shownText) paint(r); return r; }
const sending={};
function later(d){ clearTimeout(pushT); pushT=setTimeout(()=>push(d),2000); }
function push(d){ if(!remoteReady||sending[d]) return;
  const l=sync(d); if(!l||!l.dirty) return;
  if(navigator.onLine===false){ if(d===curDate) status("Đã lưu trong máy, chờ mạng"); return; }
  if(!l.text && !remote[d]) return;
  sending[d]=true;
  lsSet(d,{...l, dirty:false, base:l.updatedAt});           // đánh dấu trước: lớp dữ liệu báo thay đổi ngay trong lúc ghi
  if(d===curDate) status("Đang đồng bộ…");
  const ok=()=>{ delete sending[d]; const n=lsGet(d)||{}; if(n.dirty) push(d); else if(d===curDate) status("Đã lưu ✓"); };
  const fail=()=>{ delete sending[d]; const n=lsGet(d); if(n) lsSet(d,{...n,dirty:true}); if(d===curDate) status("Đã lưu trong máy, chưa lên kho",true); };
  try{ const p=S.db.doc(`staff/${S.me}/sonote/${d}`).set({date:d, text:l.text||"", by:S.me, updatedAt:l.updatedAt});
    Promise.resolve((p&&p.ack)||p).then(ok, fail); }catch(e){ fail(); } }
function onEdit(){ const text=serialize(); markEmpty(); if(text===shownText) return; shownText=text;
  const old=lsGet(curDate)||{base:(remote[curDate]||{}).updatedAt||0};
  const ok=lsSet(curDate,{text, base:old.base||0, updatedAt:Date.now(), dirty:true});
  status(ok?"Đã lưu trong máy":"Máy đầy, chưa lưu được!",!ok);
  later(curDate); laterTalks(); }
function flush(){ if(isBox(document.activeElement)) document.activeElement.blur(); clearTimeout(pushT); if(!root.hidden && curDate===today()){ onEdit(); autoTalks(true); } clearTimeout(pushT); if(S.me) dirtyDates().forEach(push); }
/* bản ngày cũ đã nằm trên kho thì gỡ khỏi bộ nhớ nhỏ của trình duyệt cho đỡ đầy */
function prune(){ const old=addDays(today(),-3); try{ const p=prefix(); Object.keys(localStorage).filter(k=>k.startsWith(p)).forEach(k=>{ const d=k.slice(p.length), l=lsGet(d); if(d<old && d!==curDate && l && !l.dirty && remote[d]) localStorage.removeItem(k); }); }catch(e){} }
window.addEventListener("online",()=>{ if(S.me) dirtyDates().forEach(push); });
function subscribe(){ if(unsub||!S.me) return;
  unsub=S.db.doc("staff/"+S.me).collection("sonote").onSnapshot(snap=>{
    remote={}; snap.docs.forEach(x=>{ remote[x.id]=x.data(); }); remoteReady=true;
    sync(curDate);
    dirtyDates().forEach(push);
    prune();
  }, e=>{ console.warn("sonote",e); status("Chưa đồng bộ được, vẫn lưu trong máy",true); }); }

function paint(r){ const had=document.activeElement===ed; closeAsk(); renderText((r&&r.text)||""); shownText=serialize(); setEditable(); markEmpty(); lastRange=null; if(had&&!pen.on()) caretEnd(); }
function setEditable(){ const past=curDate!==today(), writing=pen.on();
  ed.contentEditable=past||writing?"false":"true"; $("snBar").hidden=past||writing; }
function load(d){ closeSug(); curDate=d; const past=d!==today();
  $("snDate").value=d; $("snDate").max=today(); $("snDateTxt").textContent=d===today()?"Hôm nay":d.slice(8)+"/"+d.slice(5,7);
  $("snNext").disabled=d>=today(); $("snDay").textContent=fmtDay(d);
  $("snPast").hidden=!past; ed.dataset.ph=past?"Ngày này không có ghi chú.":"Viết gì đó… Gõ @ để gắn tên Ba Mẹ";
  pen.show(d);
  const r=reconcile(d); paint(r); scroller.scrollTop=0;
  status(r&&r.dirty?"Đã lưu trong máy":r&&r.text?"Đã lưu ✓":""); if(r&&r.dirty) push(d); }
function goDate(d){ if(!d||d>today()) d=today(); flush(); ed.blur(); pen.off(); load(d); }

/* ---------- @Tên từ chữ viết tay → thẻ ---------- */
function lev(a,b){ let row=[...Array(b.length+1).keys()]; for(let i=1;i<=a.length;i++){ let prev=row[0]; row[0]=i; for(let j=1;j<=b.length;j++){ const t=row[j]; row[j]=Math.min(row[j]+1, row[j-1]+1, prev+(a[i-1]===b[j-1]?0:1)); prev=t; } } return row[b.length]; }
/* s là phần chữ ngay sau "@". Trả về {len: số ký tự thuộc tên, honor, exact, near[]} hoặc null */
function matchName(s){ const toks=[]; const re=/\s*([\p{L}\p{N}]+)/uy; let m; while(toks.length<6 && (m=re.exec(s))) toks.push({w:m[1].normalize("NFC").toLowerCase(), raw:m[1], end:re.lastIndex});
  if(!toks.length) return null;
  const skip=toks.length>1&&HON.has(toks[0].w)?1:0, q=toks.slice(skip), honor=skip?toks[0].raw:"";
  const people=everyone().map(x=>({...x, name:x.p.tenBaMe||"", w:noHon(words(x.p.tenBaMe)), came:came(x)})).filter(x=>x.w.length);
  const order=(a,b)=>(b.came-a.came)||a.name.localeCompare(b.name,"vi");
  /* đúng 100% (đủ dấu): trùng họ tên hoặc trùng các chữ cuối */
  for(let n=Math.min(5,q.length);n>0;n--){ const key=q.slice(0,n).map(t=>t.w).join(" ");
    const hit=people.filter(x=>x.w.slice(-n).join(" ")===key);
    if(hit.length) return {len:q[n-1].end, honor, exact:hit.length===1?hit[0]:null, near:hit.sort(order).slice(0,3)}; }
  /* gần giống: so không dấu */
  const scored=people.map(x=>{ let best={sim:0,n:1};
    for(let n=1;n<=Math.min(4,q.length,x.w.length);n++){ const a=norm(q.slice(0,n).map(t=>t.w).join(" ")), b=norm(x.w.slice(-n).join(" ")), sim=1-lev(a,b)/Math.max(a.length,b.length);
      if(sim>best.sim+0.001) best={sim,n}; }
    return {...x, ...best}; }).filter(x=>x.sim>=0.5).sort((a,b)=>(b.sim-a.sim)||order(a,b));
  if(!scored.length) return null;
  const top=scored.filter(x=>x.sim>=scored[0].sim-0.25).slice(0,3);
  return {len:q[top[0].n-1].end, honor, exact:null, near:top}; }
/* đổi một dòng chữ nhận dạng được thành các nút: chữ, thẻ, hoặc chỗ cần hỏi lại */
function toNodes(text){ const out=[]; let at=0, i;
  while((i=text.indexOf("@",at))>=0){ const m=matchName(text.slice(i+1));
    if(!m){ out.push(text.slice(at,i+1)); at=i+1; continue; }
    if(i>at) out.push(text.slice(at,i));
    const end=i+1+m.len;
    if(m.exact){ if(m.honor) out.push(m.honor+" "); out.push(chip(m.exact.sid,m.exact.id,m.exact.name)); }
    else { const u=document.createElement("span"); u.className="sn-unsure"; u.textContent=text.slice(i,end); u.setAttribute("role","button"); out.push(u); }
    at=end; }
  if(at<text.length) out.push(text.slice(at));
  return out; }
/* ---------- popup "ai đây?" ---------- */
let asking=null;
function openAsk(span){ const m=matchName(span.textContent.replace(/^@/,"")); if(!m) return closeAsk(); asking={span,m};
  $("snAsk").innerHTML=`<p>“<b>${esc(span.textContent)}</b>” là ai?</p>`+m.near.map((x,i)=>`<button type="button" data-snask="${i}"><b>${esc(x.name)}</b><small>${esc([x.came?"✓ Đã đến hôm nay":"", x.p.to||""].filter(Boolean).join(" · "))}</small></button>`).join("")+`<button type="button" class="keep" data-snask="no">Giữ nguyên chữ</button>`;
  $("snAsk").hidden=false; }
function closeAsk(){ $("snAsk").hidden=true; asking=null; }
function askConfirm(question,yes,label,no){ asking={yes};
  $("snAsk").innerHTML=`<p>${question}</p><button type="button" data-snask="yes"><b>${label||"Đúng, ghi vào báo cáo"}</b></button><button type="button" class="keep" data-snask="no">${no||"Không, giữ nguyên chữ"}</button>`; $("snAsk").hidden=false; }
$("snAsk").addEventListener("mousedown",e=>e.preventDefault());
$("snAsk").addEventListener("click",e=>{ const b=e.target.closest("[data-snask]"); if(!b||!asking) return; if(asking.yes){ const {yes}=asking; closeAsk(); if(b.dataset.snask==="yes") yes(); return; }
  const {span,m}=asking; closeAsk(); if(!span.isConnected) return;
  if(b.dataset.snask==="no") span.replaceWith(span.textContent);
  else { const x=m.near[Number(b.dataset.snask)]; span.replaceWith(...(m.honor?[m.honor+" "]:[]), chip(x.sid,x.id,x.name), ...(span.textContent.length-1>m.len?[span.textContent.slice(m.len+1)]:[])); }
  onEdit(); const next=ed.querySelector(".sn-unsure"); if(next) openAsk(next); });

/* ---------- chèn chữ vào đúng hàng kẻ ---------- */
const LINE=40;
const blank=el=>!el.textContent.trim()&&!el.querySelector(".sn-tag");
const rowsOf=el=>Math.max(1,Math.round(el.offsetHeight/LINE));
/* dịch vụ trả vài phương án: nếu có phương án chứa @Tên khớp đúng một ba mẹ thì lấy phương án đó */
function bestOf(list){ const sure=t=>{ const i=t.indexOf("@"); if(i<0) return false; const m=matchName(t.slice(i+1)); return !!(m&&m.exact); };
  return list.slice(0,list[0].includes("@")?list.length:3).find(sure)||list[0]; }
function placeText(row,text){
  renderText(serialize());                              // đưa về mỗi dòng một khối để đếm hàng
  let top=0, host=null; for(const el of ed.children){ const n=rowsOf(el); if(row<top+n){ host=el; break; } top+=n; }
  if(!host){ for(;top<row;top++){ const gap=document.createElement("div"); gap.append(document.createElement("br")); ed.append(gap); }
    host=document.createElement("div"); host.append(document.createElement("br")); ed.append(host); }
  const before=rowsOf(host);
  if(blank(host)) host.textContent=""; else { if(host.lastChild&&host.lastChild.nodeName==="BR") host.lastChild.remove(); host.append(" "); }
  const added=(Array.isArray(text)?text:toNodes(text)).map(n=>typeof n==="string"?document.createTextNode(n):n); host.append(...added);
  for(let extra=rowsOf(host)-before; extra>0 && host.nextElementSibling && blank(host.nextElementSibling); extra--) host.nextElementSibling.remove();   // chữ xuống dòng thì lấn vào dòng trống bên dưới
  lastRange=null; onEdit(); const u=host.querySelector(".sn-unsure"); if(u) openAsk(u);
  return added; }
/* viết đè lên ô nào thì vào ô đó; không thì lấy thẻ cuối trên hàng đang viết (hoặc hàng ngay trên) */
function tempTarget(row,bb){ const base=$("snPaper").getBoundingClientRect();
  const rel=el=>{ const r=el.getBoundingClientRect(); return {x0:r.left-base.left,x1:r.right-base.left,y0:r.top-base.top,y1:r.bottom-base.top}; };
  if(bb){ const cx=(bb.x0+bb.x1)/2, cy=(bb.y0+bb.y1)/2;
    const box=[...ed.querySelectorAll(".sn-temp")].find(el=>{ const r=rel(el); return cx>=r.x0&&cx<=r.x1&&cy>=r.y0-5&&cy<=r.y1+5; });
    if(box) return {tag:box.parentElement, k:box.dataset.tnk, onBox:true}; }
  const rowOf=el=>{ const r=rel(el); return Math.floor((r.y0+r.y1)/2/LINE); };
  for(const want of [row,row-1]){ const tags=[...ed.querySelectorAll(".sn-tag")].filter(t=>[...t.children].some(c=>rowOf(c)===want)); if(tags.length) return {tag:tags[tags.length-1]}; }
  return null; }
/* ghi cặp số vào thẻ: ô chỉ định, không thì ô Trước còn trống rồi tới ô Sau */
function sendTemp(target,vals){ const tag=target.tag, pid=tag.dataset.pid, f=findParent(tag.dataset.sid,pid); if(!canWrite(f)) return false;
  const tn=tnOn(f,pid,today()), free=k=>!hasV(tn[k+"Tren"])&&!hasV(tn[k+"Duoi"]), same=k=>Number(tn[k+"Tren"])===vals.up&&Number(tn[k+"Duoi"])===vals.down;
  const k=target.k||(same("truoc")?"truoc":free("truoc")?"truoc":free("sau")?"sau":null);
  if(!k){ say("Đã đủ số Trước và Sau. Viết đè lên ô cần sửa"); return false; }
  commitTemp(tag.dataset.sid,pid,k,vals); return true; }
const tidy=t=>t.replace(/\s+/g," ").replace(/^[\s,;:.\-]+|[\s,;:\-]+$/g,"").trim();
function insertAtRow(row,found,bb){ if(curDate!==today()||!found.length) return false;
  if(bb&&penIntoBox(boxTarget(bb),found[0])) return true;
  const target=tempTarget(row,bb), withPair=found.find(pairIn);
  /* viết đè lên ô một số duy nhất: hiểu là thân trên */
  if(!withPair&&target&&target.onBox){ const one=found.map(t=>parseTemp(t.trim())).find(v=>v&&v.up!=null); if(one&&sendTemp(target,one)) return true; }
  if(withPair){ const pr=pairIn(withPair), rest=tidy(withPair.slice(0,pr.start)+" "+withPair.slice(pr.end));
    if(!rest.includes("@")){ if(target&&sendTemp(target,pr)){ if(rest.length>1) placeText(row,rest); return true; }
      if(!target) say("Hàng này chưa có thẻ @Tên để ghi thân nhiệt"); }
    else { const added=placeText(row,rest), tag=added.filter(n=>n.classList&&n.classList.contains("sn-tag")).pop();
      if(!(tag&&sendTemp({tag},pr))) placeText(row,withPair.slice(pr.start,pr.end));   // chưa rõ là ai: giữ số lại thành chữ, không bỏ
      return true; } }
  const text=String(bestOf(found)||"").replace(/\s+/g," ").trim(); if(!text) return false;
  const guess=!withPair&&target&&found.map(guessPair).find(Boolean);
  const added=placeText(row,text);
  if(guess){ const name=target.tag.querySelector(".sn-name").textContent;
    askConfirm(`Có phải thân nhiệt <b>${showPair(guess.up,guess.down)}</b> của <b>${esc(name)}</b>?`, ()=>{ if(sendTemp(target,guess)){ added.forEach(n=>n.remove()); onEdit(); } }); }
  return true; }

/* ---------- dạ quang: kéo qua chữ nào thì tô trọn chữ đó; bắt đầu trên chữ đã tô thì là xoá ---------- */
function highlight(path){ if(curDate!==today()) return;
  renderText(serialize());                              // gộp chữ lại cho gọn trước khi đo
  const walk=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT), range=document.createRange(), list=[]; let node;
  while((node=walk.nextNode())){ if(node.parentElement.closest(".sn-tag")) continue;
    for(const m of node.nodeValue.matchAll(/\S+/g)){ range.setStart(node,m.index); range.setEnd(node,m.index+m[0].length);
      list.push({node, from:m.index, to:m.index+m[0].length, rects:[...range.getClientRects()]}); } }
  const hits=new Set();
  path.forEach(([x1,y1],i)=>{ const [x0,y0]=path[i-1]||[x1,y1], steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/4));
    for(let s=1;s<=steps;s++){ const x=x0+(x1-x0)*s/steps, y=y0+(y1-y0)*s/steps;
      list.forEach(w=>{ if(w.rects.some(r=>x>=r.left&&x<=r.right&&y>=r.top-8&&y<=r.bottom+8)) hits.add(w); }); } });
  if(!hits.size) return;
  const marked=w=>!!w.node.parentElement.closest(".sn-hl"), erase=marked([...hits][0]), spans=new Map();
  hits.forEach(w=>{ if(marked(w)!==erase) return; const s=spans.get(w.node)||[w.from,w.to]; spans.set(w.node,[Math.min(s[0],w.from),Math.max(s[1],w.to)]); });
  const wrap=t=>{ const m=document.createElement("mark"); m.className="sn-hl"; m.textContent=t; return m; };
  spans.forEach(([a,b],n)=>{ const t=n.nodeValue;
    if(erase) n.parentElement.replaceWith(...[a?wrap(t.slice(0,a)):null, t.slice(a,b), b<t.length?wrap(t.slice(b)):null].filter(x=>x!==null));
    else { const mid=n.splitText(a); mid.splitText(b-a); mid.replaceWith(wrap(mid.nodeValue)); } });
  renderText(serialize()); lastRange=null; onEdit(); }
/* số hàng đã dùng: chỗ trống đầu tiên ở cuối trang */
function endRow(){ renderText(serialize()); let top=0, last=0; for(const el of ed.children){ top+=rowsOf(el); if(!blank(el)) last=top; } return last; }
function pickPerson(row){ if(penPick) return closeSug(); if(curDate!==today()) return;
  closeAsk(); mention=null; sugList=suggest(""); if(!sugList.length){ say("Chưa có ba mẹ nào"); return; }
  penPick={row}; sug.innerHTML=optionsHtml(sugList,-1); sug.hidden=false; sug.scrollTop=0; }
function putPerson(x){ const row=penPick.row==null?endRow():penPick.row; closeSug();
  const [tag]=placeText(row,[chip(x.sid,x.id,x.name)," "]); tag.scrollIntoView({block:"nearest"}); }

/* Google Input Tools (chữ viết tay tiếng Việt): không cần khoá, chỉ gửi toạ độ nét, không gửi danh sách ba mẹ */
async function recognize({width,height,ink}){
  const stop=new AbortController(), timer=setTimeout(()=>stop.abort(),8000);
  try{ const r=await fetch("https://inputtools.google.com/request?itc=vi-t-i0-handwrit&app=demopage",{method:"POST", signal:stop.signal, credentials:"omit", referrerPolicy:"no-referrer",
      headers:{"Content-Type":"application/json"}, body:JSON.stringify({options:"enable_pre_space", requests:[{writing_guide:{writing_area_width:width, writing_area_height:height}, ink, max_num_results:8, max_completions:0, language:"vi"}]})});
    const j=await r.json(); if(j[0]!=="SUCCESS") throw new Error(String(j[0]));
    return ((j[1]&&j[1][0]&&j[1][0][1])||[]).filter(t=>typeof t==="string"&&t.trim());
  }finally{ clearTimeout(timer); } }
const pen=snPen({root, paper:$("snPaper"), scroller, before:sug, say, today, line:LINE,
  recognize,
  insert:insertAtRow,
  highlight, pickPerson,
  hitAt,
  tapAt:(x,y)=>{ const kind=hitAt(x,y); if(!kind) return false; const el=hitEl(x,y);
    if(kind==="temp") el.querySelector("input,textarea").focus({preventScroll:true});
    else if(kind==="tick") tickPlan(el);
    else setTimeout(()=>{ const t=el.parentElement; kind==="name"||kind==="old"?openSheet(t.dataset.sid,t.dataset.pid,t.dataset.name):openAsk(el); },30);   // sau khi click đi qua, kẻo đóng bảng ngay
    return true; },
  onMode:m=>{ closeSug(); closeAsk(); if(m!=="type") ed.blur(); setEditable(); markEmpty(); }});
/* dưới đầu bút / ngón tay là gì: ô số, thẻ tên, chỗ cần hỏi lại */
function hitEl(x,y){ const inside=el=>[...el.getClientRects()].some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom);
  return [...ed.querySelectorAll(".sn-khk,.sn-tg")].find(inside)||[...ed.querySelectorAll(".sn-temp,.sn-kh,.sn-name,.sn-unsure")].find(inside)||null; }
/* "temp" = ô gõ được (thân nhiệt, kế hoạch) */
function hitAt(x,y){ const el=hitEl(x,y), is=c=>el.classList.contains(c); return !el?null:is("sn-khk")||is("sn-tg")?"tick":is("old")?"old":is("sn-temp")||is("sn-kh")?"temp":is("sn-name")?"name":"unsure"; }

/* ---------- con trỏ ---------- */
let lastRange=null;
const inEd=n=>!!n && (n===ed || ed.contains(n));
function setRange(r){ const s=getSelection(); s.removeAllRanges(); s.addRange(r); lastRange=r.cloneRange(); }
function caretEnd(){ const r=document.createRange(); const last=ed.lastElementChild; const host=last&&last.tagName==="DIV"?last:ed; r.selectNodeContents(host);
  r.collapse(false); if(host.lastChild&&host.lastChild.nodeName==="BR"){ r.setStartBefore(host.lastChild); r.collapse(true); } setRange(r); }
function focusAt(){ ed.focus({preventScroll:true}); if(lastRange&&inEd(lastRange.startContainer)) setRange(lastRange); else caretEnd(); }
function keepCaretVisible(){ const s=getSelection(); if(!s.rangeCount||!inEd(s.anchorNode)) return;
  let r=s.getRangeAt(0).getBoundingClientRect(); if(!r.height){ const el=s.anchorNode.nodeType===1?s.anchorNode:s.anchorNode.parentElement; r=el.getBoundingClientRect(); if(r.height>80) return; }
  const box=scroller.getBoundingClientRect();
  if(r.bottom>box.bottom-12) scroller.scrollTop+=r.bottom-box.bottom+28; else if(r.top<box.top+4) scroller.scrollTop-=box.top-r.top+16; }

/* ---------- gợi ý @ ---------- */
let mention=null, sugList=[], hl=0, penPick=null;
function readMention(){ const s=getSelection(); if(!s.rangeCount||!s.isCollapsed) return null; const n=s.anchorNode, o=s.anchorOffset;
  if(!inEd(n)||n.nodeType!==3) return null; const before=n.nodeValue.slice(0,o), m=before.match(/(^|[\s (,.;:!?\-•])@([^@\n]{0,30})$/);
  if(!m||/^[\s ]/.test(m[2])) return null; return {node:n, start:o-m[2].length-1, end:o, q:m[2].replace(/ /g," ")}; }
function updateSug(){ if(penPick) return; if(ed.contentEditable!=="true") return closeSug(); mention=readMention(); if(!mention) return closeSug();
  sugList=suggest(mention.q);
  if(!sugList.length && /\s/.test(mention.q)) return closeSug();
  hl=0; drawSug(); keepCaretVisible(); }
function optionsHtml(list,on){ let h="", group=null;
  list.forEach((x,i)=>{ if(x.came!==group){ group=x.came; h+=`<div class="sn-grp">${group?"✓ Đã đến hôm nay":"Ba mẹ khác"}</div>`; }
    const meta=[x.came&&x.ca?"Ca "+x.ca:"", x.p.to||"", x.sid!==S.me?staffName(x.sid):""].filter(Boolean).join(" · ");
    h+=`<button type="button" role="option" class="sn-opt${i===on?" on":""}" data-sni="${i}" aria-selected="${i===on}"><span class="sn-av${x.came?" came":""}">${esc((x.name.trim().split(/\s+/).pop()||"?").charAt(0).toUpperCase())}</span><span><b>${esc(x.name)}</b>${meta?`<small>${esc(meta)}</small>`:""}</span></button>`; });
  return h; }
function drawSug(){
  sug.innerHTML=optionsHtml(sugList,hl)||`<div class="sn-none">Không thấy ba mẹ nào khớp “${esc(mention.q)}”</div>`;
  if(sug.hidden){ sug.hidden=false; sug.scrollTop=0; } }
function closeSug(){ sug.hidden=true; mention=null; sugList=[]; penPick=null; }
function pick(x){ if(!mention||!mention.node.isConnected) return closeSug();
  const r=document.createRange(); r.setStart(mention.node,mention.start); r.setEnd(mention.node,Math.min(mention.end,mention.node.length)); r.deleteContents();
  const tag=chip(x.sid,x.id,x.name), sp=document.createTextNode(" ");
  r.insertNode(sp); r.insertNode(tag); r.setStart(sp,1); r.collapse(true); ed.focus({preventScroll:true}); setRange(r);
  closeSug(); onEdit(); keepCaretVisible(); }
sug.addEventListener("mousedown",e=>e.preventDefault());       // giữ bàn phím mở khi bấm gợi ý
sug.addEventListener("click",e=>{ const b=e.target.closest("[data-sni]"); if(b) (penPick?putPerson:pick)(sugList[Number(b.dataset.sni)]); });

/* ---------- soạn thảo ---------- */
function insert(text){ focusAt(); if(!document.execCommand("insertText",false,text)){ const r=getSelection().getRangeAt(0); r.deleteContents(); const n=document.createTextNode(text); r.insertNode(n); r.setStart(n,n.length); r.collapse(true); setRange(r); onEdit(); updateSug(); } }
ed.addEventListener("input",e=>{ if(isPlan(e.target)){ typedBox(e.target); if(e.target.dataset.x==="mai") fitMai(e.target); else if(e.target.tagName==="INPUT") fitPlan(e.target); return; } if(isTemp(e.target)){ typedBox(e.target); return; } onEdit(); updateSug(); keepCaretVisible(); });
ed.addEventListener("change",e=>{ if(!isBox(e.target)) return; clearTimeout(boxT.get(e.target)); (isPlan(e.target)?savePlan:saveTemp)(e.target); });
ed.addEventListener("focusin",e=>{ if(isPlan(e.target)){ closeSug(); if(!e.target.readOnly) $("snBar").hidden=true; return; } if(isTemp(e.target)){ closeSug(); if(!e.target.readOnly){ tempBar(e.target); const el=e.target, was=el.value; setTimeout(()=>{ if(el.value===was) el.select(); },30); } } });
ed.addEventListener("focusout",e=>{ if(isPlan(e.target)) setTimeout(()=>{ if(!isBox(document.activeElement)) setEditable(); fillTemps(); },50); else if(isTemp(e.target)) setTimeout(()=>{ if(!isTemp(document.activeElement)) tempBar(null); fillTemps(); },50); });
/* bàn phím số của iPhone không có dấu / : thêm một thanh nhỏ ngay trên bàn phím */
let tempInput=null;
function tempBar(input){ tempInput=input; $("snTempBar").hidden=!input; if(input) $("snBar").hidden=true; else setEditable(); }
$("snTempBar").addEventListener("mousedown",e=>e.preventDefault());
$("snTempBar").addEventListener("click",e=>{ const b=e.target.closest("[data-tkey]"); if(!b||!tempInput) return; const k=b.dataset.tkey;
  if(k==="done"){ tempInput.blur(); return; }
  let from=tempInput.selectionStart, to=tempInput.selectionEnd; const len=tempInput.value.length;
  if(from===0&&to===len) from=to=len;                       // đang bôi cả số: nối vào cuối, đừng xoá mất
  tempInput.setRangeText(k, from, to, "end"); tempInput.dispatchEvent(new Event("input",{bubbles:true})); });
ed.addEventListener("paste",e=>{ if(isBox(e.target)) return; e.preventDefault(); insert((e.clipboardData.getData("text/plain")||"").replace(/\r/g,"")); });
ed.addEventListener("drop",e=>e.preventDefault());
ed.addEventListener("keydown",e=>{ if(isBox(e.target)){ if(e.key==="Enter"&&e.target.dataset.x!=="mai"){ e.preventDefault(); e.target.blur(); } return; }
  if(sug.hidden||!sugList.length) return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); hl=(hl+(e.key==="ArrowDown"?1:-1)+sugList.length)%sugList.length; drawSug(); const on=sug.querySelector(".on"); if(on) on.scrollIntoView({block:"nearest"}); }
  else if((e.key==="Enter"||e.key==="Tab")&&!e.isComposing){ e.preventDefault(); pick(sugList[hl]); } });
document.addEventListener("selectionchange",()=>{ if(root.hidden||!sheetEl.hidden||isBox(document.activeElement)) return; const s=getSelection(); if(!s.rangeCount||!inEd(s.anchorNode)) return;
  lastRange=s.getRangeAt(0).cloneRange(); if(!sug.hidden||document.activeElement===ed) updateSug(); });
ed.addEventListener("mousedown",e=>{ if(e.target.closest(".sn-name,.sn-khk,.sn-tg,.sn-kh.old")) e.preventDefault(); });
ed.addEventListener("click",e=>{ const u=e.target.closest(".sn-unsure"); if(u&&curDate===today()){ openAsk(u); return; }
  const k=e.target.closest(".sn-khk,.sn-tg"); if(k){ e.preventDefault(); tickPlan(k); return; }
  const n=e.target.closest(".sn-name,.sn-kh.old"), t=n&&n.parentElement; if(t){ e.preventDefault(); openSheet(t.dataset.sid,t.dataset.pid,t.dataset.name); } });
/* chạm vào khoảng trống bên dưới: đặt con trỏ ở cuối */
scroller.addEventListener("click",e=>{ if(!pen.on()&&(e.target===scroller||e.target.classList.contains("sn-page")||e.target===$("snPaper")))if(ed.contentEditable==="true"){ ed.focus({preventScroll:true}); caretEnd(); } });
$("snBar").addEventListener("mousedown",e=>e.preventDefault());
$("snBar").addEventListener("click",e=>{ const b=e.target.closest("[data-sntool]"); if(!b) return; const k=b.dataset.sntool;
  if(k==="done"){ closeSug(); ed.blur(); flush(); return; }
  focusAt(); const s=getSelection(), n=s.anchorNode, prev=n&&n.nodeType===3?n.nodeValue.charAt(s.anchorOffset-1):"";
  const gap=prev&&!/[\s ]/.test(prev)?" ":"";
  if(k==="at") insert(gap+"@");
  if(k==="dot") insert(gap+"• ");
  if(k==="time"){ const d=new Date(); insert(gap+pad(d.getHours())+":"+pad(d.getMinutes())+" "); } });

/* ---------- bảng trượt thông tin ba mẹ ---------- */
let cur=null, wasTyping=false, keepScroll=0, editing=null, rev=null, hideT=0;
function sheetData(){ const f=findParent(cur.sid,cur.pid); if(f) cur.sid=f.sid; return f&&f.p; }
const TNK=["truocTren","truocDuoi","sauTren","sauDuoi"];
const has=v=>v!=null&&v!=="";
const num=v=>has(v)?Number(v).toFixed(1)+"°":"–";
const tnTable=n=>`<div class="tn-table"><span></span><b>Thân trên</b><b>Thân dưới</b><span>Trước tập</span><span>${num(n.truocTren)}</span><span>${num(n.truocDuoi)}</span><span>Sau tập</span><span>${num(n.sauTren)}</span><span>${num(n.sauDuoi)}</span></div>`;
function drawSheet(){ const p=sheetData(), t=curDate, isToday=t===today(), {sid,pid}=cur, D=S.data[sid]||{};
  $("snName").textContent=(p&&p.tenBaMe)||cur.name; $("snMore").hidden=false;
  ["snTodayBox","snTnBox","snReport","snInfo"].forEach(i=>$(i).hidden=!p);
  if(!p){ $("snSub").textContent="Hồ sơ không còn trong danh sách"; $("snPrevPlan").innerHTML=`<p class="sn-mute">Ba mẹ này đã bị xoá hoặc bạn không còn được xem.</p>`; return; }
  const dayName=isToday?"hôm nay":"ngày "+fmtShort(t).slice(0,5);
  const a=attOn(sid,pid,t);
  $("snSub").innerHTML=[a&&a.status==="co"?`<span class="sn-ok">✓ Đã đến ${dayName}${a.ca?" · Ca "+a.ca:""}</span>`:a&&a.status==="vang"?"Vắng "+dayName:"Chưa điểm danh "+dayName, p.to?esc(p.to):""].filter(Boolean).join(" · ");
  const plans=(D.plans||[]).filter(x=>x.parentId===pid), y=addDays(t,-1);
  const items=k=>plans.filter(x=>x.date===k).sort((m,n)=>(m.createdAt||0)-(n.createdAt||0));
  /* kế hoạch của ngày đang xem: hôm nay thì sửa được */
  $("snTodayH").textContent="Kế hoạch "+dayName;
  $("snTnBox").hidden=!isToday; $("snPlanForm").hidden=false;
  $("snPlanTxt").placeholder="Thêm việc cần làm "+dayName+"…";
  const now=items(t);
  $("snTodayList").innerHTML=now.length?now.map(x=>`<div class="sn-plan${x.done?" done":""}"><label class="sn-chk"><input type="checkbox" data-sndone="${esc(x.id)}" ${x.done?"checked":""} aria-label="Đã làm xong"></label><span>${esc(x.noiDung)}</span><button type="button" data-snedit="${esc(x.id)}">Sửa</button></div>`).join(""):`<p class="sn-mute">Chưa có việc nào cho ${dayName}.</p>`;
  /* báo cáo của ngày trước đó; hôm trước không có thì lấy lần gần nhất */
  const logs=(D.logs||[]).filter(l=>l.parentId===pid).sort((m,n)=>String(n.date).localeCompare(String(m.date)));
  const rp=logs.find(l=>l.date<t);
  $("snReport").innerHTML=!rp?`<h4>Báo cáo lần trước</h4><p class="sn-mute">Chưa có báo cáo nào trước ${dayName}.</p>`
    :`<h4>${rp.date===y&&isToday?"Báo cáo hôm qua":rp.date===y?"Báo cáo hôm trước":"Báo cáo lần gần nhất"}</h4><p class="sn-when">${esc(fmtDay(rp.date))}</p>`
      +(rp.date!==y?`<p class="sn-mute">Hôm trước không có báo cáo, đang hiện lần gần nhất.</p>`:"")
      +talksHtml(rp)
      +(TNK.some(k=>has((rp.tn||{})[k]))?tnTable(rp.tn):has(rp.thanNhiet)?`<div>🌡️ ${num(rp.thanNhiet)}C</div>`:"")
      +(rp.pyph?`<div class="rep-extra"><b>PƯPH:</b> ${esc(rp.pyphNote||"Có")}</div>`:"")
      +(rp.ghiChu?`<div class="rep-extra"><b>📝 Ghi chú buổi tập:</b> ${esc(rp.ghiChu)}</div>`:"")
      +skBlock(rp)+hqBlock(rp)+khBlock(rp);
  /* kế hoạch lần trước (ngày ba mẹ có đi) */
  const dates=[...new Set(plans.filter(x=>x.date<t&&x.noiDung).map(x=>x.date))].sort().reverse();
  const d=dates.find(k=>(attOn(sid,pid,k)||{}).status!=="vang")||dates[0];
  const why=(attOn(sid,pid,y)||{}).status==="vang"?"Hôm trước ba mẹ vắng":"Hôm trước không có kế hoạch";
  $("snPrevPlan").innerHTML=!d?`<h4>Kế hoạch lần trước</h4><p class="sn-mute">Chưa có kế hoạch nào trước ${dayName}.</p>`
    :`<h4>${d!==y?"Kế hoạch lần gần nhất":isToday?"Kế hoạch hôm qua":"Kế hoạch hôm trước"}</h4><p class="sn-when">${esc(fmtDay(d))}</p>${d!==y?`<p class="sn-mute">${why}, đang hiện lần gần nhất.</p>`:""}<ul class="sn-ul">${items(d).map(x=>`<li class="${x.done?"done":""}"><span aria-hidden="true">${x.done?"✓":"○"}</span><span>${esc(x.noiDung)}</span></li>`).join("")}</ul>`;
  /* thông tin nhanh */
  const upto=logs.filter(l=>l.date<=t);
  const tl=upto.find(l=>TNK.some(k=>has((l.tn||{})[k]))||has(l.thanNhiet));
  let temp="";
  if(tl && (!rp||tl.date!==rp.date)){ temp=(TNK.some(k=>has((tl.tn||{})[k]))?tnTable(tl.tn):`<div><b>${num(tl.thanNhiet)}C</b></div>`)+`<small>Ghi ngày ${fmtShort(tl.date)}</small>`; }
  else if(!tl&&(has(p.tnBDTren)||has(p.tnBDDuoi))) temp=`<div>Trên <b>${esc(p.tnBDTren||"–")}°</b> · dưới <b>${esc(p.tnBDDuoi||"–")}°</b></div><small>Số đo ban đầu</small>`;
  const gd=(D.notes||[]).filter(n=>n.parentId===pid&&n.text&&n.date<=t).sort((m,n)=>n.date.localeCompare(m.date))[0];
  const benh=benhList(p).map(b=>b.ten).filter(Boolean).join(", ");
  const rows=[
    temp?["🌡️ Thân nhiệt gần nhất",temp]:null,
    gd?["📌 Ghi chú của quản lý",`${esc(gd.text)}<small>${fmtShort(gd.date)}</small>`]:null,
    benh?["💚 Tình trạng sức khoẻ",esc(benh)]:null,
    p.mongMuon?["⭐ Mong muốn",esc(p.mongMuon)]:null].filter(Boolean);
  $("snInfo").hidden=!rows.length;
  $("snInfo").innerHTML=`<h4>Thông tin nhanh</h4>`+rows.map(r=>`<div class="sn-kv"><span>${r[0]}</span><div>${r[1]}</div></div>`).join("");
}
/* ---------- Báo cáo hôm nay: cùng dữ liệu với báo cáo trong hồ sơ, chỉ khác chỗ nhập ---------- */
const repDrafts={};
const tnInputs=()=>[...sheetEl.querySelectorAll("[data-sntn]")];
const tnErr=m=>{ $("snTnErr").textContent=m; $("snTnErr").hidden=!m; };
const field=el=>el.dataset.sntn||el.dataset.snf;
/* ---------- chữ ghi chú = NỘI DUNG NÓI CHUYỆN ----------
 * Chữ cùng dòng với thẻ, và các dòng ngay dưới, thuộc về ba mẹ đó cho tới khi gặp thẻ khác hoặc một dòng trống.
 * Dòng nhắc nhiều ba mẹ thì mỗi người chỉ lấy đoạn đi sau thẻ của mình. */
const cleanTalk=t=>{ t=t.replace(/\s+/g," ").replace(/^[\s•,:;.\-]+/,"").trim(); return /[\p{L}\p{N}]/u.test(t)?t:""; };
function talkBlocks(){ const map={}; let owner=null;
  const add=(who,t)=>{ const e=map[who.pid]=map[who.pid]||{sid:who.sid,lines:[]}; t=cleanTalk(t); if(t) e.lines.push(t); };
  serialize().replace(/[⟪⟫]/g,"").split("\n").forEach(line=>{
    const parts=line.split(new RegExp(TOK.source)), tags=[];      // [chữ, sid, pid, tên, chữ, …]
    for(let i=1;i<parts.length;i+=4) tags.push({sid:parts[i], pid:parts[i+1], after:parts[i+3]||""});
    if(!tags.length){ if(!line.trim()) owner=null; else if(owner) add(owner,line); return; }
    if(new Set(tags.map(x=>x.pid)).size===1){ owner=tags[0]; add(owner, parts[0]+tags.map(x=>x.after).join(" ")); }
    else { owner=null; tags.forEach(x=>add(x,x.after)); } });
  return map; }
const fromNote=pid=>((talkBlocks()[pid]||{}).lines||[]).join("\n");
/* Chữ ghi chú tự vào báo cáo; trong ngày sửa ghi chú thì cập nhật đúng đoạn đó.
 * Ghi vào phần nói chuyện của MÌNH, chữ nhập chỗ khác giữ nguyên. sn = đoạn sổ ghi chú đã đưa vào;
 * máy cũng nhớ riêng để không đưa lại thứ người dùng đã tự sửa/bỏ trong hồ sơ. */
const sentKey=()=>prefix().replace("sonote","snrep");
function sentRec(){ let rec=null; try{ rec=JSON.parse(localStorage.getItem(sentKey())||"null"); }catch(e){} return rec&&rec.date===today()?rec:{date:today(), map:{}}; }
const keepRec=rec=>{ try{ localStorage.setItem(sentKey(),JSON.stringify(rec)); }catch(e){} };
/* ba mẹ nào có chữ khác với lần lưu trước */
function pendingTalks(){ if(curDate!==today()) return []; const rec=sentRec(), out=[];
  Object.entries(talkBlocks()).forEach(([pid,b])=>{ const f=findParent(b.sid,pid); if(!f) return;
    const text=b.lines.join("\n"), mine=((dayLogOf(f.sid,pid,today())||{}).talks||[]).find(x=>x.by===S.me), old=(mine&&mine.sn)||rec.map[pid]||"";
    if(text!==old) out.push({pid,f,text,old}); });
  return out; }
/* ---------- mọi thứ tự lưu: ngừng gõ / ngừng viết 2 giây là lưu ---------- */
const WAIT_SAVE=2000;
let talkT=0, talkDirty=false;
function laterTalks(){ talkDirty=true; clearTimeout(talkT); talkT=setTimeout(autoTalks,WAIT_SAVE); }
function autoTalks(now){ clearTimeout(talkT); if(!talkDirty||curDate!==today()) return;
  if(now!==true&&!sug.hidden){ talkT=setTimeout(autoTalks,WAIT_SAVE); return; }      // đang chọn tên thì chờ
  talkDirty=false; const list=pendingTalks(); if(!list.length) return;
  const rec=sentRec(), acks=[]; let waiting=0;
  const fail=(pid,e)=>{ console.warn("sonote talk",e); delete rec.map[pid]; keepRec(rec); say("Chưa lưu được báo cáo, đang thử lại"); laterTalks(); };
  list.forEach(({pid,f,text,old})=>{ if(!canWrite(f)){ waiting++; return; }
    const talks=((dayLogOf(f.sid,pid,today())||{}).talks||[]).map(x=>({...x})), at=talks.findIndex(x=>x.by===S.me), mine=talks[at];
    const was=mine?String(mine.t||""):"", pos=old?was.lastIndexOf(old):-1;
    let t=pos>=0 ? was.slice(0,pos)+text+was.slice(pos+old.length)
      : [was, text.split("\n").filter(l=>l&&!was.split("\n").includes(l)).join("\n")].filter(Boolean).join("\n");
    t=t.replace(/\n{2,}/g,"\n").trim(); rec.map[pid]=text;
    if(!t&&mine) talks.splice(at,1); else if(mine){ mine.t=t; mine.sn=text; } else if(t) talks.push({by:S.me, t, at:Date.now(), sn:text}); else return;
    if(repDrafts[pid]) delete repDrafts[pid].rep;
    try{ acks.push(Promise.resolve(writeDay(f.sid,pid,{talks})).then(r=>{ const a=r&&r.ack; return a&&a.ack?a.ack:a; }).catch(e=>fail(pid,e))); }catch(e){ fail(pid,e); } });
  keepRec(rec);
  if(acks.length) Promise.all(acks).then(()=>status("Đã lưu vào báo cáo ✓"));
  if(waiting){ talkDirty=true; talkT=setTimeout(autoTalks,WAIT_SAVE); } }
let dnShown="";
const dnRead=()=>$("snDnChk").checked?dnGet("sndn"):null;
function dnPut(on,v){ $("snDnChk").checked=on; $("snDnBox").hidden=!on; dnFill("sndn",v); }
function fillReport(){ const {sid,pid}=cur, l=dayLogOf(sid,pid,today()), d=repDrafts[pid]||{}; tnErr("");
  const mine=((l&&l.talks)||[]).find(x=>x.by===S.me), note=!mine&&curDate===today()?fromNote(pid):"";
  const base={rep:mine?mine.t:note, py:!!(l&&l.pyph), pyNote:(l&&l.pyphNote)||"", km:(l&&l.khMai)||""};
  tnInputs().forEach(i=>{ const k=i.dataset.sntn, v=l&&l.tn?l.tn[k]:null; i.value=k in d?d[k]:has(v)?String(v):""; });
  $("snRep").value="rep" in d?d.rep:base.rep; $("snPy").checked="py" in d?d.py:base.py; $("snPyNote").value="pyNote" in d?d.pyNote:base.pyNote; $("snKm").value="km" in d?d.km:base.km;
  const saved=dnOf(l), has_=dnHas(saved);
  dnPut(has_, has_?saved:null); dnShown=JSON.stringify(dnRead());
  if(d.dn) dnPut(d.dn.on, d.dn.v);                        // phần đang chọn dở, chưa bấm Lưu
  sheetSig=formSig();
  $("snPyNote").hidden=!$("snPy").checked; $("snRepHint").hidden=!(note&&!("rep" in d)); }
sheetEl.addEventListener("input",e=>{ const i=e.target.closest("[data-sntn],[data-snf]"); if(!i||!cur) return;
  (repDrafts[cur.pid]=repDrafts[cur.pid]||{})[field(i)]=i.type==="checkbox"?i.checked:i.value; tnErr("");
  if(i.id==="snPy") $("snPyNote").hidden=!i.checked; if(i.id==="snRep") $("snRepHint").hidden=true; });
let sheetT=0, sheetSig="";
const formSig=()=>JSON.stringify([tnInputs().map(i=>i.value), $("snRep").value, $("snPy").checked, $("snPyNote").value, $("snKm").value, dnRead()]);
function laterSheet(){ clearTimeout(sheetT); sheetT=setTimeout(()=>saveSheet(true),WAIT_SAVE); }
["input","change","pointerup","keyup"].forEach(t=>sheetEl.addEventListener(t,e=>{ if(e.target.closest("[data-sntn],[data-snf],#snDnBox,#snDnChk")) laterSheet(); }));
async function saveSheet(auto){
  clearTimeout(sheetT); if(!cur||curDate!==today()||(auto&&formSig()===sheetSig)) return;
  const {sid,pid}=cur, d=today(), now=Date.now(), l=dayLogOf(sid,pid,d), c=l||{}, typed={};
  for(const i of tnInputs()){ const raw=i.value.trim(); if(raw==="") continue; const n=Number(raw.replace(",","."));
    if(isNaN(n)||n<25||n>45){ if(!auto){ tnErr("Thân nhiệt cần trong khoảng 25 đến 45 °C."); i.focus(); } return; } typed[i.dataset.sntn]=n; }
  const rep=$("snRep").value.trim(), py=$("snPy").checked, pyNote=py?$("snPyNote").value.trim():"", km=$("snKm").value.trim();
  const doNhe=dnRead(); let dnNew=JSON.stringify(doNhe)!==dnShown;
  if(doNhe&&!dnHas(doNhe)){ if(auto) dnNew=false; else return tnErr("Đã tích Độ nhẹ: chọn mức độ hoặc ghi tình trạng sức khoẻ, hoặc bỏ tích."); }
  if(!l&&!Object.keys(typed).length&&!rep&&!py&&!km&&!(doNhe&&dnNew)){ if(!auto) tnErr("Chưa có nội dung để lưu."); return; }
  /* phần nói chuyện: chỉ thay phần của mình, giữ của nhân viên khác */
  let talks=(c.talks||[]).slice(); const mine=talks.find(x=>x.by===S.me);
  if(rep && (!mine||mine.t!==rep)){ talks=talks.filter(x=>x.by!==S.me); talks.push({by:S.me,t:rep,at:mine?mine.at:now,...(mine&&mine.sn?{sn:mine.sn}:{})}); talks.sort((a,b)=>(a.at||0)-(b.at||0)); }
  const khMai=km||c.khMai||"";
  const keep={...repDrafts[pid]};
  const fail=e=>{ console.warn("sonote report",e); repDrafts[pid]=keep; say("Chưa lưu được báo cáo, thử lại"); };
  try{
    if(khMai!==(c.khMai||"")) addTomorrowPlans(sid,pid,d,khMai,c.khMai||"");
    const pp=parentOf(sid,pid); if(py&&pp&&pp.pyphLast!==d){ pp.pyphLast=d; quick(S.db.doc(`staff/${sid}/parents/${pid}`).update({pyphLast:d})); }
    const extra=dnNew?dnPatch(sid,pid,l,doNhe):{};     // Độ nhẹ chỉ ghi khi có thay đổi
    const r=await writeDay(sid,pid,{tn:typed, talks, pyph:py, pyphNote:pyNote, khMai, ...extra}), a=r&&r.ack; Promise.resolve(a&&a.ack?a.ack:a).catch(fail);
    delete repDrafts[pid]; sheetSig=formSig(); if(dnNew) dnShown=JSON.stringify(doNhe); say(auto?"Đã tự lưu":"Đã lưu báo cáo hôm nay"); fillTemps();
    if(!auto) setTimeout(()=>{ if(cur){ fillReport(); drawSheet(); } },60); }catch(e){ fail(e); } }
$("snTnSave").onclick=()=>saveSheet(false);
function setEditing(x){ editing=x?x.id:null; $("snPlanTxt").value=x?x.noiDung:""; $("snPlanCancel").hidden=!x; $("snPlanSave").textContent=x?"Lưu thay đổi":"Thêm vào kế hoạch"; }
const drafts={};
function openSheet(sid,pid,name){ clearTimeout(hideT);
  wasTyping=document.activeElement===ed; keepScroll=scroller.scrollTop;
  if(wasTyping){ const s=getSelection(); if(s.rangeCount&&inEd(s.anchorNode)) lastRange=s.getRangeAt(0).cloneRange(); }
  closeSug(); cur={sid,pid,name}; ed.blur(); flush();
  setEditing(null); $("snPlanTxt").value=drafts[pid]||""; fillReport();
  rev=window.__sdbRev; drawSheet(); $("snBody").scrollTop=0;
  sheetEl.style.transform=""; sheetEl.hidden=false; veil.hidden=false; void sheetEl.offsetWidth; sheetEl.classList.add("in"); veil.classList.add("in");
  sheetEl.focus({preventScroll:true}); }
function closeSheet(){ if(sheetEl.hidden||!cur) return;
  saveSheet(true);                                        // còn đang chờ 2 giây thì lưu luôn
  if(!editing) drafts[cur.pid]=$("snPlanTxt").value;      // chữ gõ dở chưa bấm Thêm thì giữ lại
  if(curDate===today()&&JSON.stringify(dnRead())!==dnShown) (repDrafts[cur.pid]=repDrafts[cur.pid]||{}).dn={on:$("snDnChk").checked, v:dnGet("sndn")};
  document.activeElement&&document.activeElement.blur(); cur=null;
  sheetEl.classList.remove("in"); veil.classList.remove("in"); sheetEl.style.transform="";
  sheetEl.hidden=true; veil.hidden=true;
  /* trả về đúng chỗ đang viết (focus ngay trong thao tác chạm để iPhone mở lại bàn phím) */
  if(wasTyping&&ed.contentEditable==="true") focusAt(); else if(lastRange&&inEd(lastRange.startContainer)) setRange(lastRange);
  scroller.scrollTop=keepScroll; }
$("snClose").onclick=closeSheet; veil.onclick=closeSheet;
$("snPlanCancel").onclick=()=>setEditing(null);
$("snPlanSave").onclick=()=>{ const text=$("snPlanTxt").value.trim(); if(!text){ $("snPlanTxt").focus(); return; }
  const col=S.db.doc("staff/"+cur.sid).collection("plans"), now=Date.now();
  if(editing) quick(col.doc(editing).update({noiDung:text, updatedAt:now}));
  else quick(col.add({date:curDate, parentId:cur.pid, noiDung:text, done:false, by:S.me, createdAt:now, updatedAt:now}));
  delete drafts[cur.pid]; const was=!!editing; setEditing(null); say(was?"Đã sửa kế hoạch":"Đã thêm vào kế hoạch"); setTimeout(()=>cur&&drawSheet(),60); };
$("snTodayList").addEventListener("change",e=>{ const c=e.target.closest("[data-sndone]"); if(!c) return;
  quick(S.db.doc(`staff/${cur.sid}/plans/${c.dataset.sndone}`).update({done:c.checked, doneAt:c.checked?Date.now():null, updatedAt:Date.now()})); setTimeout(()=>cur&&drawSheet(),60); });
$("snTodayList").addEventListener("click",e=>{ const b=e.target.closest("[data-snedit]"); if(!b) return;
  const x=((S.data[cur.sid]||{}).plans||[]).find(k=>k.id===b.dataset.snedit); if(x){ setEditing(x); $("snPlanTxt").focus(); } });
function say(m){ root.querySelectorAll(".sn-toast").forEach(x=>x.remove()); const el=document.createElement("div"); el.className="sn-toast"; el.setAttribute("role","status"); el.textContent=m; root.appendChild(el); setTimeout(()=>el.remove(),1800); }

/* vuốt xuống (điện thoại) hoặc vuốt sang phải (iPad) để đóng */
const side=window.matchMedia("(min-width:700px) and (min-height:500px)");
let drag=null;
sheetEl.addEventListener("touchstart",e=>{ drag=null; if(e.touches.length!==1||e.target.closest("textarea,input,button,label,.dn-bar")) return;
  const t=e.touches[0]; drag={x:t.clientX,y:t.clientY,d:0,on:false,top:$("snBody").scrollTop<=0||!e.target.closest(".sn-sbody")}; },{passive:true});
sheetEl.addEventListener("touchmove",e=>{ if(!drag) return; const t=e.touches[0], dx=t.clientX-drag.x, dy=t.clientY-drag.y, h=side.matches;
  if(!drag.on){ if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
    if(h?(dx>0&&dx>Math.abs(dy)):(dy>0&&dy>Math.abs(dx)&&drag.top)) drag.on=true; else { drag=null; return; } }
  e.preventDefault(); drag.d=Math.max(0,h?dx:dy); sheetEl.style.transition="none"; sheetEl.style.transform=h?`translateX(${drag.d}px)`:`translateY(${drag.d}px)`; },{passive:false});
const dragEnd=()=>{ if(!drag) return; const d=drag; drag=null; sheetEl.style.transition=""; if(d.on&&d.d>90) closeSheet(); else sheetEl.style.transform=""; };
sheetEl.addEventListener("touchend",dragEnd); sheetEl.addEventListener("touchcancel",dragEnd);
let boxRev=null;
setInterval(()=>{ if(root.hidden||document.hidden) return; if(window.__sdbRev!==boxRev){ boxRev=window.__sdbRev; fillTemps(); }
  if(cur&&window.__sdbRev!==rev){ rev=window.__sdbRev; drawSheet(); } },800);

/* ---------- bàn phím ảo: khung ghi chú luôn vừa đúng phần màn hình còn nhìn thấy ---------- */
const vv=window.visualViewport;
function fit(){ if(root.hidden) return;
  if(vv){ root.style.top=vv.offsetTop+"px"; root.style.height=vv.height+"px"; root.classList.toggle("kb", window.innerHeight-vv.height>120); }
  keepCaretVisible(); }
if(vv){ vv.addEventListener("resize",fit); vv.addEventListener("scroll",fit); }

/* ---------- mở / đóng ---------- */
let prevOverflow="";
function open(){ if(!allowed()||!S.me||!root.hidden) return;
  subscribe(); root.hidden=false; window.__snOpen=true; prevOverflow=document.body.style.overflow; document.body.style.overflow="hidden";
  document.documentElement.classList.add("sn-lock"); load(today()); fit();
  try{ history.pushState({sn:1},""); }catch(e){} }
function close(){ if(root.hidden) return; flush(); closeSheet(); closeSug(); closeAsk(); pen.off(); ed.blur();
  root.hidden=true; window.__snOpen=false; document.body.style.overflow=prevOverflow; document.documentElement.classList.remove("sn-lock"); }
openBtn.onclick=open;
$("snBack").onclick=()=>{ if(history.state&&history.state.sn) history.back(); else close(); };
window.addEventListener("popstate",()=>{ if(root.hidden) return;
  if(!sheetEl.hidden){ closeSheet(); try{ history.pushState({sn:1},""); }catch(e){} return; } close(); });
document.addEventListener("keydown",e=>{ if(root.hidden||e.key!=="Escape") return; if(!sheetEl.hidden) closeSheet(); else if(!$("snAsk").hidden) closeAsk(); else if(!sug.hidden) closeSug(); else $("snBack").click(); });
$("snPrev").onclick=()=>goDate(addDays(curDate,-1));
$("snNext").onclick=()=>goDate(addDays(curDate,1));
$("snDate").onchange=e=>goDate(e.target.value);
$("snToday").onclick=()=>goDate(today());
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden"){ flush(); return; }
  if(!root.hidden && $("snDate").max!==today()) load(today()); });      // qua ngày mới
window.addEventListener("pagehide",flush);

/* hiện nút khi đã vào sổ và đúng loại thiết bị */
const tabsNav=$("tabs");
function gateBtn(){ const ready=!tabsNav.hidden&&!!S.me, ok=allowed(); openBtn.hidden=!(ready&&ok); if(!ok) close(); if(ready&&dirtyDates().length) subscribe(); }
new MutationObserver(gateBtn).observe(tabsNav,{attributes:true,attributeFilter:["hidden"]});
if(mq.addEventListener) mq.addEventListener("change",gateBtn); else mq.addListener(gateBtn);
gateBtn();
})({S,$,esc,pad,today,addDays,parentOf,staffName,fmtDay,fmtShort,norm,quick,benhList,plansOf,dayLogOf,saveDay,talksHtml,skBlock,hqBlock,khBlock,addTomorrowPlans,tempClass});
