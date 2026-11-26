/* ===================== v54: Sổ ghi chú — CHẾ ĐỘ BÚT (viết tay đổi thành chữ in) =====================
 * Bút viết trên lớp trong suốt phủ các dòng kẻ; ngón tay chỉ cuộn. Ngừng 1,5 giây (hoặc bấm ✓) thì mỗi hàng đã viết
 * được gửi (toạ độ x, y, thời gian) tới Google Input Tools để nhận dạng — miễn phí, không khoá — rồi chèn chữ vào đúng hàng.
 * Không lưu nét mực. Dịch vụ này Google không công bố tài liệu nên có thể đổi hoặc ngừng; khi lỗi thì dùng bàn phím viết tay của máy. */
function snPen(H){
const {root,paper,scroller,before,line}=H;
const NS="http://www.w3.org/2000/svg", WAIT=1300;
const FALLBACK="Chọn “Gõ” để dùng bàn phím viết tay của máy (iPad: viết thẳng bằng Apple Pencil).";
const consented=()=>{ try{ return localStorage.getItem("cskh_snpen_google")==="1"; }catch(e){ return false; } };

let mode="type", lastRow=null, date="", owner="", strokes=[], busy=false, timer=0, problem="", agreed=consented();

const svg=document.createElementNS(NS,"svg"); svg.setAttribute("class","sn-pen"); svg.setAttribute("aria-label","Vùng viết bằng bút"); svg.style.display="none"; paper.append(svg);
const tools=document.createElement("div"); tools.className="sn-tools";
const ic=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
tools.innerHTML=`<div class="sn-modes" role="group" aria-label="Chế độ nhập">
<button type="button" data-snmode="type" aria-pressed="true">${ic('<path d="M3 7h18v10H3z"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>')}<span>Gõ</span></button>
<button type="button" data-snmode="pen" aria-pressed="false" aria-label="Chế độ bút">${ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>')}<span>Bút</span></button>
<button type="button" data-snmode="hl" aria-pressed="false" aria-label="Bút dạ quang">${ic('<path d="M9 14l-3 3v3h4l2-2"/><path d="M9 14l7-10 5 4-8 10z"/><path d="M4 22h16"/>')}<span>Dạ quang</span></button></div>`;
const bar=document.createElement("div"); bar.className="sn-pbar"; bar.hidden=true;
bar.innerHTML=`<span class="msg" role="status"></span>
<button type="button" class="agree" data-snpen="agree">Đồng ý</button>
<button type="button" class="at" data-snpen="at" aria-label="Gắn tên ba mẹ">@</button>
<button type="button" data-snpen="undo" aria-label="Bỏ nét vừa viết">↶</button>
<button type="button" data-snpen="clear" aria-label="Xoá hết nét chưa đổi">✕</button>
<button type="button" class="ok" data-snpen="go" aria-label="Đổi thành chữ ngay">✓</button>`;
root.insertBefore(tools,before); root.insertBefore(bar,before.nextSibling);
const msg=bar.querySelector(".msg");

function paintUI(){
  const writing=mode==="pen", marking=mode==="hl";
  tools.querySelectorAll("[data-snmode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.snmode===mode)));
  bar.hidden=mode==="type"; svg.style.display=mode==="type"?"none":""; root.classList.toggle("writing",mode!=="type");
  strokes.forEach(k=>{ k.el.style.display=writing&&date===H.today()?"":"none"; });
  bar.querySelector('[data-snpen="agree"]').hidden=!writing||agreed;
  bar.querySelector('[data-snpen="at"]').hidden=!writing;
  ["undo","clear","go"].forEach(k=>{ const b=bar.querySelector(`[data-snpen="${k}"]`); b.hidden=!writing||!agreed; b.disabled=busy||!strokes.length; });
  msg.classList.toggle("bad",writing&&!!problem);
  msg.textContent=marking?"Kéo ngang qua chữ để tô vàng. Kéo lại trên chữ đã tô để xoá."
    :!agreed?"Nét bạn viết sẽ gửi tới Google để đổi thành chữ. Cân nhắc trước khi viết SĐT, bệnh hay thông tin riêng của ba mẹ."
    :problem||(busy?"Đang đổi thành chữ…":strokes.length?"Ngừng viết một chút hoặc bấm ✓":"Viết bằng bút. Bấm @ để gắn tên. Ngón tay để cuộn.");
}
function setMode(m){ if(m===mode) return; cancel(); mode=m; clearTimeout(timer); problem=""; paintUI(); H.onMode(m); schedule(); }

/* ---------- nét tạm ---------- */
const dOf=p=>{ let s=`M${p[0]} ${p[1]}`; if(p.length<4) return s+"l.1 0"; for(let i=2;i<p.length-2;i+=2) s+=`Q${p[i]} ${p[i+1]} ${(p[i]+p[i+2])/2} ${(p[i+1]+p[i+3])/2}`; return s+`L${p[p.length-2]} ${p[p.length-1]}`; };
function drop(list){ list.forEach(s=>s.el.remove()); strokes=strokes.filter(s=>!list.includes(s)); }
function schedule(){ clearTimeout(timer); if(mode==="pen"&&agreed&&strokes.length&&!busy&&!problem&&!pen) timer=setTimeout(convert,WAIT); }

/* chia các nét theo hàng: nét thân chữ gom theo độ cao, dấu và chấm nhỏ đi theo nét thân gần nhất */
function rows(list){
  const box=list.map(s=>{ let a=1e9,b=1e9,c=-1e9,d=-1e9; for(let i=0;i<s.p.length;i+=2){ a=Math.min(a,s.p[i]); c=Math.max(c,s.p[i]); b=Math.min(b,s.p[i+1]); d=Math.max(d,s.p[i+1]); } return {s,x0:a,y0:b,x1:c,y1:d,cx:(a+c)/2,cy:(b+d)/2}; });
  let main=box.filter(k=>k.y1-k.y0>=12||k.x1-k.x0>=18); if(!main.length) main=box;
  const groups=[];
  [...main].sort((a,b)=>a.cy-b.cy).forEach(k=>{ const g=groups[groups.length-1];
    if(g && k.cy-g.sum/g.items.length<=line*0.65){ g.items.push(k); g.sum+=k.cy; } else groups.push({items:[k],sum:k.cy,core:[]}); });
  groups.forEach(g=>{ g.core=g.items.slice(); });
  box.filter(k=>!main.includes(k)).forEach(k=>{ let best=null, bd=1e9; groups.forEach(g=>g.core.forEach(m=>{ const d=Math.hypot(Math.max(m.x0-k.cx,0,k.cx-m.x1), Math.max(m.y0-k.cy,0,k.cy-m.y1)); if(d<bd){ bd=d; best=g; } })); best.items.push(k); });
  return groups.map(g=>{ const ys=g.core.map(k=>k.cy).sort((a,b)=>a-b); return {row:Math.max(0,Math.floor(ys[ys.length>>1]/line)), items:g.items}; });
}
/* nét của một hàng → [[x…],[y…],[t…]] cho mỗi nét, theo đúng thứ tự viết */
function inkOf(items){ const list=items.map(k=>k.s).sort((a,b)=>a.t[0]-b.t[0]);
  const x0=Math.min(...items.map(k=>k.x0))-8, y0=Math.min(...items.map(k=>k.y0))-4, t0=list[0].t[0];
  return {width:Math.ceil(Math.max(...items.map(k=>k.x1))-x0+8), height:line,
    ink:list.map(s=>{ const x=[],y=[]; for(let i=0;i<s.p.length;i+=2){ x.push(Math.round(s.p[i]-x0)); y.push(Math.round(s.p[i+1]-y0)); } return [x,y,s.t.map(v=>Math.round(v-t0))]; })}; }

async function convert(){
  clearTimeout(timer); if(busy||!agreed||!strokes.length||pen) return;
  busy=true; problem=""; const day=date, batch=strokes.slice(); batch.forEach(s=>s.el.classList.add("busy")); paintUI();
  try{
    for(const g of rows(batch)){
      const found=await H.recognize(inkOf(g.items));
      const mine=g.items.map(k=>k.s);
      if(day!==date||!mine.every(s=>strokes.includes(s))) continue;          // đã đổi ngày hoặc người viết xoá nét
      if(!found.length){ problem="Chưa đọc được chữ. Bấm ✕ rồi viết lại, to và rõ hơn."; continue; }
      const bb={x0:Math.min(...g.items.map(k=>k.x0)), x1:Math.max(...g.items.map(k=>k.x1)), y0:Math.min(...g.items.map(k=>k.y0)), y1:Math.max(...g.items.map(k=>k.y1))};
      if(H.insert(g.row,found,bb)){ drop(mine); lastRow=g.row; }
    }
  }catch(e){ console.warn("handwriting",e);
    problem=navigator.onLine===false?"Mất mạng. Nét còn giữ, có mạng thì bấm ✓.":"Chưa đổi được chữ, bấm ✓ để thử lại. "+FALLBACK; }
  busy=false; batch.forEach(s=>s.el.classList.remove("busy")); paintUI(); schedule();
}

/* ---------- bút viết, ngón tay cuộn ---------- */
let pen=null, finger=null, lastUp=0, glide=0;
const pos=e=>{ const r=svg.getBoundingClientRect(); return [Math.round((e.clientX-r.left)*2)/2, Math.round((e.clientY-r.top)*2)/2]; };
const stopGlide=()=>cancelAnimationFrame(glide);
function cancel(){ if(pen){ if(pen.mark) pen.mark.el.remove(); else drop([pen.s]); pen=null; } if(finger&&finger.mark) finger.mark.el.remove(); finger=null; stopGlide(); }
/* ---------- nét dạ quang: chỉ để nhìn trong lúc kéo, thả ra thì chữ được tô ---------- */
function newMark(){ const el=document.createElementNS(NS,"path"); el.setAttribute("class","sn-hlink"); svg.append(el); return {el,p:[],c:[]}; }
function addMark(m,e){ const [x,y]=pos(e); m.p.push(x,y); m.c.push([e.clientX,e.clientY]); m.el.setAttribute("d",dOf(m.p)); }
function endMark(m,cancelled){ m.el.remove(); if(cancelled) return; const [ax,ay]=m.c[0];
  if(m.c.every(([x,y])=>Math.hypot(x-ax,y-ay)<6)) H.tapAt(ax,ay); else H.highlight(m.c); }
svg.addEventListener("pointerdown",e=>{ e.preventDefault(); stopGlide();
  if(e.pointerType==="touch"){                                  // ngón tay và lòng bàn tay không bao giờ để lại nét
    if(pen||finger||Date.now()-lastUp<400) return;
    finger={id:e.pointerId,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),v:0,moved:false,start:{clientX:e.clientX,clientY:e.clientY}}; }
  else { if(pen||(e.pointerType==="mouse"&&e.button!==0)) return;
    if(mode==="pen"&&!agreed){ H.tapAt(e.clientX,e.clientY); return; }
    finger=null; clearTimeout(timer); problem="";
    if(mode==="hl"){ pen={id:e.pointerId, mark:newMark()}; addMark(pen.mark,e); }
    else { pen={id:e.pointerId, x:e.clientX, y:e.clientY, s:{p:pos(e), t:[performance.now()], el:document.createElementNS(NS,"path")}}; pen.s.el.setAttribute("d",dOf(pen.s.p)); svg.append(pen.s.el); strokes.push(pen.s); } }
  try{ svg.setPointerCapture(e.pointerId); }catch(_){} });
svg.addEventListener("pointermove",e=>{
  if(pen&&e.pointerId===pen.id){ if(pen.mark){ addMark(pen.mark,e); return; } const list=(e.getCoalescedEvents&&e.getCoalescedEvents())||[], p=pen.s.p;
    (list.length?list:[e]).forEach(ev=>{ const [x,y]=pos(ev); if(Math.hypot(x-p[p.length-2],y-p[p.length-1])>=1){ p.push(x,y); pen.s.t.push(performance.now()); } }); pen.s.el.setAttribute("d",dOf(p)); return; }
  if(finger&&e.pointerId===finger.id){ if(!finger.moved&&Math.hypot(e.clientX-finger.sx,e.clientY-finger.sy)<8) return;
    /* chế độ dạ quang: ngón tay vuốt NGANG để tô, vuốt dọc vẫn là cuộn */
    if(!finger.moved&&mode==="hl"&&Math.abs(e.clientX-finger.sx)>Math.abs(e.clientY-finger.sy)*1.5){ finger.mark=newMark(); addMark(finger.mark,finger.start); }
    finger.moved=true; if(finger.mark){ addMark(finger.mark,e); return; }
    const now=performance.now(), dy=finger.y-e.clientY; scroller.scrollTop+=dy; finger.v=dy/Math.max(8,now-finger.t); finger.y=e.clientY; finger.t=now; } });
function up(e,cancelled){
  if(pen&&e.pointerId===pen.id){ const g=pen; pen=null; lastUp=Date.now();
    if(g.mark){ endMark(g.mark,cancelled); return; }
    /* bút chạm nhẹ (không phải viết) lên thẻ @Tên hoặc ô số: mở như bấm tay */
    const p=g.s.p, still=!cancelled&&performance.now()-g.s.t[0]<400&&p.every((v,i)=>Math.abs(v-p[i%2])<5), hit=still&&H.hitAt(g.x,g.y);
    if(hit&&(hit!=="temp"||strokes.length===1)){ drop([g.s]); H.tapAt(g.x,g.y); }
    paintUI(); schedule(); return; }
  if(finger&&e.pointerId===finger.id){ const g=finger; finger=null;
    if(g.mark){ endMark(g.mark,cancelled); return; }
    if(!g.moved){ if(!cancelled&&!H.tapAt(e.clientX,e.clientY)) lastRow=Math.max(0,Math.floor(pos(e)[1]/line)); return; }
    let v=performance.now()-g.t<80?g.v*16:0; const run=()=>{ if(Math.abs(v)<0.4) return; scroller.scrollTop+=v; v*=0.94; glide=requestAnimationFrame(run); }; run(); } }
svg.addEventListener("pointerup",e=>up(e,false));
svg.addEventListener("pointercancel",e=>up(e,true));
/* chặn Safari tự cuộn, Scribble và menu giữ tay khi đang ở chế độ bút */
["touchstart","touchmove"].forEach(t=>svg.addEventListener(t,e=>{ if(e.cancelable) e.preventDefault(); },{passive:false}));
svg.addEventListener("contextmenu",e=>e.preventDefault());

[tools,bar].forEach(el=>el.addEventListener("mousedown",e=>e.preventDefault()));
tools.addEventListener("click",e=>{ const b=e.target.closest("[data-snmode]"); if(b) setMode(b.dataset.snmode); });
bar.addEventListener("click",e=>{ const b=e.target.closest("[data-snpen]"); if(!b) return; const k=b.dataset.snpen;
  if(k==="agree"){ agreed=true; try{ localStorage.setItem("cskh_snpen_google","1"); }catch(_){} }
  if(k==="undo"&&strokes.length) drop([strokes[strokes.length-1]]);
  if(k==="clear") drop(strokes.slice());
  if(k==="undo"||k==="clear") problem="";
  if(k==="go"){ problem=""; convert(); return; }
  if(k==="at"){ (async()=>{ if(strokes.length&&agreed&&!busy) await convert(); if(mode==="pen") H.pickPerson(lastRow); })(); return; }
  paintUI(); schedule(); });

return {
  on:()=>mode!=="type",
  off:()=>setMode("type"),
  settle:async()=>{ if(mode==="pen"&&strokes.length&&agreed&&!busy) await convert(); },
  /* đổi ngày: nét chưa đổi chỉ thuộc về hôm nay; sang ngày mới thì bỏ */
  show(d){ const today=d===H.today(); if(date!==d) lastRow=null; date=d;
    if(today){ if(owner&&owner!==d) drop(strokes.slice()); owner=d; }
    tools.hidden=!today; paintUI(); }
};
}
