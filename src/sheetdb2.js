/* ===================== Sổ CSKH v2 – LỚP DỮ LIỆU KHO CHI NHÁNH (Google Sheet, không Firebase, không máy chủ chung) =====================
 * - Link chi nhánh (/hpl-quan-7) → tra branches.json (trên GitHub) → link kho Apps Script của chi nhánh.
 * - Đăng nhập Google → kho chi nhánh kiểm tra và cấp phiên 30 ngày. Kho giữ nhân viên, duyệt, toàn bộ dữ liệu.
 * - Ghi: hiện ngay trên máy mình, lưu ngầm vào Sheet. Máy khác cùng chi nhánh hỏi kho mỗi ~1,5 giây.
 * - Lỗi app gửi về hộp thư quản trị (không kèm dữ liệu ba mẹ).
 * Giữ nguyên cách gọi kiểu Firebase (firebase.auth(), firebase.firestore()) để phần còn lại của app không phải đổi. */
(function(){
"use strict";
const CFG = new Proxy({}, {get:(_,k)=>(window.SHEETDB||{})[k]});
const KHO_GS = __KHO_GS__;
const APP_V = "2.0";
const POLL_MS = 1500;
const INC = "__inc__", DEL = "__del__";
const LS = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } }, del(k){ try{ localStorage.removeItem(k); }catch(e){} } };
const clone = o => o==null ? o : JSON.parse(JSON.stringify(o));
const isObj = v => v && typeof v==="object" && !Array.isArray(v);
const parentOf = p => p.split("/").slice(0,-1).join("/");
const idOf = p => p.split("/").pop();
const escH = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const autoId = () => { const a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; let s=""; crypto.getRandomValues(new Uint8Array(20)).forEach(x=>{ s+=a[x%62]; }); return s; };
function merge(old, d, deep){ const o = Object.assign({}, old||{});
  for(const k in d){ const v = d[k];
    if(isObj(v) && v[INC]!==undefined) o[k] = (Number(o[k])||0) + Number(v[INC]);
    else if(isObj(v) && v[DEL]) delete o[k];
    else if(deep && isObj(v) && isObj(o[k])) o[k] = merge(o[k], v, true);
    else if(isObj(v)) o[k] = merge({}, v, true);
    else o[k] = clone(v); }
  return o; }
const clean = d => { const o = {}; for(const k in d){ if(d[k]!==undefined) o[k] = isObj(d[k]) && d[k][INC]===undefined && !d[k][DEL] ? clean(d[k]) : d[k]; } return o; };
const say = m => { try{ let el = document.getElementById("sdbToast");
  if(!el){ el = document.createElement("div"); el.id = "sdbToast"; el.setAttribute("role","status"); el.setAttribute("style","position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:250;max-width:min(92vw,420px);background:#2a1215;color:#fff;padding:10px 16px;border-radius:12px;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)"); document.body.appendChild(el); }
  el.textContent = m; el.hidden = false; clearTimeout(say._t); say._t = setTimeout(()=>{ el.hidden = true; }, 4000); }catch(e){ console.warn(m); } };

/* ---------- báo lỗi app về hộp thư quản trị ---------- */
const ERR = {n:0, seen:{}};
function report(m, page){ try{ if(!CFG.mailbox || ERR.n>=5) return; m = String(m||"").slice(0,1500); if(!m || ERR.seen[m]) return; ERR.seen[m] = 1; ERR.n++;
  const body = {op:"err", b:(B.info&&B.info.id)||B.slug||"", v:APP_V, d:navigator.userAgent.slice(0,200), p:location.pathname, m};
  if(window.__sdbMock) window.__sdbMock(CFG.mailbox, body).catch(()=>{});
  else fetch(CFG.mailbox, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(body)}).catch(()=>{}); }catch(e){} }
window.addEventListener("error", e=>report((e.message||"Lỗi")+(e.filename?" @"+String(e.filename).split("/").pop()+":"+e.lineno:"")+(e.error&&e.error.stack?"\n"+String(e.error.stack).slice(0,600):"")));
window.addEventListener("unhandledrejection", e=>{ const r = e.reason; if(r && (r.srv || r.offline)) return; report("Promise: "+(r&&r.message||String(r))+(r&&r.stack?"\n"+String(r.stack).slice(0,600):"")); });

/* ---------- bộ nhớ máy (IndexedDB, dự phòng localStorage) ---------- */
const IDB = (()=>{ let dbp = null;
  const open = () => dbp || (dbp = new Promise(res=>{ try{ const r = indexedDB.open("so-cskh-v2",1); r.onupgradeneeded = ()=>r.result.createObjectStore("kv"); r.onsuccess = ()=>res(r.result); r.onerror = ()=>res(null); }catch(e){ res(null); } }));
  return {
    get: async k => { const db = await open(); if(!db) return JSON.parse(LS.get("sdbc_"+k)||"null"); return new Promise(res=>{ try{ const t = db.transaction("kv").objectStore("kv").get(k); t.onsuccess = ()=>res(t.result||null); t.onerror = ()=>res(null); }catch(e){ res(null); } }); },
    set: async (k,v) => { const db = await open(); if(!db){ LS.set("sdbc_"+k, JSON.stringify(v)); return; } try{ db.transaction("kv","readwrite").objectStore("kv").put(v,k); }catch(e){} } }; })();

/* ---------- gọi kho ---------- */
async function post(url, body){
  let j;
  if(window.__sdbMock) j = await window.__sdbMock(url, JSON.parse(JSON.stringify(body)));
  else { const r = await fetch(url, {method:"POST", redirect:"follow", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(body)});
    try{ j = await r.json(); }catch(e){ throw Object.assign(new Error("Kho trả lời không hợp lệ"), {srv:true}); } }
  if(!j.ok){ const e = Object.assign(new Error(String(j.error||"Lỗi kho").replace(/^AUTH: /,"")), {srv:true}); if(/^AUTH:/.test(j.error||"")) e.auth = true; throw e; }
  return j; }

/* ---------- chi nhánh theo link ---------- */
const B = {slug:"", info:null};
(()=>{ const m = (window.__pvPath||location.pathname).match(/^\/([a-z0-9][a-z0-9-]{1,60})\/?$/i); let v = m ? m[1].toLowerCase() : "";
  const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone===true;
  if(!v && standalone) v = LS.get("cskh_cn")||"";
  if(v) LS.set("cskh_cn", v);
  B.slug = v; })();
async function loadBranch(){
  let list = null;
  try{ list = window.__pvBranches ? await window.__pvBranches() : await (await fetch((CFG.branchesUrl||"/branches.json")+"?t="+Date.now(), {cache:"no-store"})).json(); LS.set("sdb2_branches", JSON.stringify(list)); }
  catch(e){ try{ list = JSON.parse(LS.get("sdb2_branches")||"null"); }catch(_){ list = null; } }
  const arr = Array.isArray(list) ? list : (list && list.branches) || [];
  B.info = arr.find(b=>b.slug===B.slug && !b.off) || null;
  B.list = arr.filter(b=>!b.off && b.slug);
  return !!list; }

/* ---------- màn hình khi chưa vào được sổ ---------- */
function gate(html){ let el = document.getElementById("sdbGate");
  if(!el){ el = document.createElement("div"); el.id = "sdbGate"; el.setAttribute("style","position:fixed;inset:0;z-index:150;overflow:auto;background:var(--bg,#fff7f6);padding:calc(24px + var(--pvbar,0px)) 16px 24px"); document.body.appendChild(el); }
  el.innerHTML = '<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #f3dcda;border-radius:18px;padding:20px;font:15px/1.55 system-ui,sans-serif;color:#2a1215;display:flex;flex-direction:column;gap:12px">'+html+'</div>'; return el; }
const BTN = 'style="border:0;border-radius:999px;padding:10px 16px;font:600 14px system-ui,sans-serif;background:#9b111e;color:#fff;cursor:pointer"';
const BTN2 = 'style="border:1px solid #e8c9c6;border-radius:999px;padding:9px 14px;font:600 14px system-ui,sans-serif;background:#fff;color:#9b111e;cursor:pointer"';
function khoCode(b){ return KHO_GS.split("__BID__").join(b.id).split("__BNAME__").join((b.sys?b.sys+" · ":"")+b.name).split("__CLIENT__").join(CFG.clientId||""); }
function noBranchGate(){
  if(B.slug){ gate('<b style="font-size:18px">Sổ CSKH</b><p style="margin:0">Không tìm thấy chi nhánh <b>'+escH(B.slug)+'</b>. Kiểm tra lại link do Giám đốc chi nhánh gửi.</p>'); return; }
  /* mở từ biểu tượng màn hình chính (hoặc trang gốc): chọn chi nhánh 1 lần, máy nhớ cho lần sau */
  const list = (B.list||[]).slice().sort((a,b)=>((a.sys||"")+" "+a.name).localeCompare((b.sys||"")+" "+b.name, "vi"));
  const el = gate('<b style="font-size:18px">Sổ CSKH · Chọn chi nhánh của bạn</b><p style="margin:0;color:#7a5a5d">Chọn 1 lần, lần sau mở app sẽ vào thẳng chi nhánh này.</p>'+
    '<input id="sdbFind" placeholder="Tìm chi nhánh…" style="padding:10px;border:1px solid #e8c9c6;border-radius:10px;font:15px system-ui">'+
    '<div id="sdbList" style="display:flex;flex-direction:column;gap:8px"></div>');
  const paint = q => { q = String(q||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
    el.querySelector("#sdbList").innerHTML = list.filter(b=>!q || (b.slug+" "+(b.sys||"")+" "+b.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").includes(q))
      .map(b=>'<button type="button" data-slug="'+escH(b.slug)+'" style="text-align:left;border:1px solid #f3dcda;background:#fff7f6;border-radius:12px;padding:12px 14px;font:600 15px system-ui;color:#2a1215;cursor:pointer">'+escH((b.sys?b.sys+" · ":"")+b.name)+'</button>').join("") || '<p style="margin:0;color:#7a5a5d">Không tìm thấy.</p>'; };
  paint("");
  el.querySelector("#sdbFind").oninput = e=>paint(e.target.value);
  el.addEventListener("click", e=>{ const t = e.target.closest("[data-slug]"); if(!t) return; LS.set("cskh_cn", t.dataset.slug); location.replace("/"+t.dataset.slug); }); }
function noKhoGate(){ const b = B.info, label = (b.sys?b.sys+" · ":"")+b.name;
  const el = gate('<b style="font-size:18px">'+escH(label)+'</b><p style="margin:0">Chi nhánh <b>chưa cài kho dữ liệu</b>. Giám đốc chi nhánh cài 1 lần (khoảng 5 phút) là cả chi nhánh dùng được.</p>'+
    '<details><summary style="cursor:pointer;font-weight:700;color:#9b111e">Tôi là Giám đốc chi nhánh: cài kho</summary><ol style="padding-left:20px;margin:10px 0;display:flex;flex-direction:column;gap:6px">'+
    '<li>Đăng nhập <b>Gmail của bạn</b> trên máy tính, mở <b>script.google.com</b> → <b>Dự án mới</b>. Gmail này sẽ là GĐ chi nhánh.</li>'+
    '<li>Xoá chữ có sẵn, bấm <b>Sao chép mã</b> rồi dán vào, bấm 💾 Lưu.</li>'+
    '<li>Chọn hàm <b>caiDat</b> → <b>▶ Chạy</b> → <b>Xem xét quyền</b> → chọn Gmail → <b>Cho phép</b>.</li>'+
    '<li><b>Triển khai → Tùy chọn triển khai mới</b> → Ứng dụng web. Thực thi với tư cách: <b>Tôi</b>. Ai có quyền truy cập: <b>Bất kỳ ai</b> → Triển khai.</li>'+
    '<li>Sao chép <b>URL ứng dụng web</b> (đuôi /exec) dán vào ô dưới, bấm <b>Gửi cho quản trị</b>. Quản trị duyệt xong là link chi nhánh mở được.</li></ol>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="sdbCopy" '+BTN2+'>Sao chép mã</button><a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener" '+BTN2.replace('style="','style="text-decoration:none;')+'>Mở script.google.com</a></div>'+
    '<textarea readonly id="sdbCode" style="width:100%;height:90px;margin-top:8px;font:12px monospace;border:1px solid #eee;border-radius:10px;padding:8px">'+escH(khoCode(b))+'</textarea>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><input id="sdbUrl" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" style="flex:1 1 220px;min-width:0;padding:10px;border:1px solid #e8c9c6;border-radius:10px;font:14px system-ui"><button type="button" id="sdbSend" '+BTN+'>Gửi cho quản trị</button></div>'+
    '<p id="sdbMsg" style="margin:8px 0 0;font-weight:600"></p></details>');
  el.querySelector("#sdbCopy").onclick = async()=>{ try{ await navigator.clipboard.writeText(khoCode(b)); say("Đã sao chép mã kho"); }catch(e){ const t = el.querySelector("#sdbCode"); t.select(); document.execCommand("copy"); say("Đã sao chép mã kho"); } };
  el.querySelector("#sdbSend").onclick = async()=>{ const url = el.querySelector("#sdbUrl").value.trim(), msg = el.querySelector("#sdbMsg");
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)){ msg.textContent = "⚠️ Link phải có dạng https://script.google.com/macros/s/…/exec"; return; }
    msg.textContent = "Đang kiểm tra kho…";
    try{ const j = await post(url, {op:"ping"}); if(j.role!=="kho" || j.branch!==b.id) throw Object.assign(new Error(j.role!=="kho"?"Link này không phải kho Sổ CSKH":"Kho này là của chi nhánh khác ("+j.branch+")"), {srv:true});
      if(!j.ready) throw Object.assign(new Error("Kho chưa chạy hàm caiDat"), {srv:true});
      if(!CFG.mailbox){ msg.innerHTML = "✅ Kho chạy tốt. Hãy gửi link kho này cho quản trị (qua Zalo) để quản trị nhập vào danh sách chi nhánh:<br><code style=\"word-break:break-all\">"+escH(url)+"</code>"; try{ await navigator.clipboard.writeText(url); say("Đã sao chép link kho"); }catch(_){} return; }
      await post(CFG.mailbox, {op:"reg", b:b.id, n:label, url}); msg.textContent = "✅ Đã gửi cho quản trị. Khi quản trị duyệt, mở lại link này là dùng được."; }
    catch(e){ msg.textContent = "❌ "+(e.srv ? e.message : "Không mở được kho. Kiểm tra đã chọn \"Bất kỳ ai\" khi triển khai."); } }; }

/* ---------- đăng nhập ---------- */
const SS = window.__sdbSess || LS;
const sessKey = () => "sdb2_sess_"+(B.info?B.info.id:"");
const A = {sess:"", who:null, user:null, ls:new Set(), ready:false};
function setUser(w){ A.who = w; A.user = w ? {uid:w.uid, email:w.email, displayName:w.name||"", refreshToken:"", getIdToken:async()=>A.sess} : null; A.ready = true;
  A.ls.forEach(f=>{ try{ f(A.user); }catch(e){ console.warn(e); } }); }
function loadScript(src){ return new Promise((res,rej)=>{ const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = ()=>rej(new Error("Không tải được "+src)); document.head.appendChild(s); }); }
let overlay = null;
function closeOverlay(){ if(overlay){ overlay.remove(); overlay = null; } }
async function signIn(){
  if(!B.info || !B.info.kho) return;
  if(window.__sdbMockLogin){ const tok = await window.__sdbMockLogin(); return onCred(tok); }
  if(!(window.google && google.accounts && google.accounts.id)) await loadScript("https://accounts.google.com/gsi/client");
  return new Promise((res,rej)=>{
    google.accounts.id.initialize({client_id:CFG.clientId, ux_mode:"popup", use_fedcm_for_button:true, callback:r=>{ onCred(r.credential).then(res, e=>{ say("Chưa đăng nhập được: "+e.message); rej(e); }); }});
    closeOverlay(); overlay = document.createElement("div");
    overlay.setAttribute("style","position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px");
    overlay.innerHTML = '<div style="background:#fff;color:#2a1215;border-radius:16px;padding:20px;max-width:360px;width:100%;display:flex;flex-direction:column;gap:14px;align-items:center;font:15px/1.5 system-ui,sans-serif"><b style="font-size:17px">Đăng nhập bằng Google</b><div id="sdbGis"></div><button type="button" id="sdbX" style="border:0;background:none;color:#7a5a5d;font:inherit;padding:8px">Để sau</button></div>';
    document.body.appendChild(overlay);
    google.accounts.id.renderButton(overlay.querySelector("#sdbGis"), {theme:"filled_blue", size:"large", text:"signin_with", shape:"pill", locale:"vi"});
    overlay.querySelector("#sdbX").onclick = ()=>{ closeOverlay(); res(); }; }); }
async function onCred(idToken){ const j = await post(B.info.kho, {op:"login", idToken}); A.sess = j.sess; SS.set(sessKey(), j.sess); closeOverlay(); await start(); }

/* ---------- kho của chi nhánh (1 kho duy nhất) ---------- */
const subs = new Set();
const K = {url:"", C:{}, loaded:{}, since:{}, pend:{}, q:[], busy:false, ver:0, denied:{}, err:"", net:true, kq:new Set(), sheet:"", khoV:0};
const coll = c => K.C[c] || (K.C[c] = new Map());
/* "branches": thông tin chi nhánh từ branches.json + phần GĐ sửa trong kho (zalo…) · "config/roles": không còn GĐ Vùng */
function view(c){ const m = coll(c);
  if(c==="branches"){ const v = new Map(), b = B.info; if(b) v.set(b.id, Object.assign({sys:b.sys||"", name:b.name, slug:b.slug}, m.get(b.id)||{}, {slug:b.slug})); return v; }
  if(c==="config" && !m.has("roles")){ const v = new Map(m); v.set("roles", {boss:"-", bosses:[]}); return v; }
  return m; }
const isLoaded = c => c==="branches" || K.loaded[c];
const cacheKey = () => (A.who?A.who.uid:"x")+"|"+(B.info?B.info.id:"");
async function restore(){ const o = await IDB.get(cacheKey()); if(o){ for(const c in o.C){ K.C[c] = new Map(o.C[c]); K.loaded[c] = true; } K.since = o.since||{}; }
  try{ K.q = JSON.parse(LS.get("sdbq2_"+cacheKey())||"[]"); }catch(e){ K.q = []; } }
function save(){ clearTimeout(K._sv); K._sv = setTimeout(()=>{ const o = {since:K.since, C:{}};
  for(const c in K.C){ if(K.loaded[c] && !/\/photos$/.test(c)) o.C[c] = [...K.C[c]]; } IDB.set(cacheKey(), o); }, 1200); }
const saveQ = () => { if(!LS.set("sdbq2_"+cacheKey(), JSON.stringify(K.q))) console.warn("hàng chờ quá lớn"); };
const call = q => post(K.url, Object.assign({}, q, {sess:A.sess}));
function emit(c){ subs.forEach(s=>{ if(s.c===c && (isLoaded(c)||K.denied[c])){ try{ s.fire(); }catch(e){ console.warn("sdb", e); report("render "+c+": "+(e&&e.message)); } } }); }
function kick(c){ K.kq.add(c); clearTimeout(K._kt); K._kt = setTimeout(()=>{ const l = [...K.kq]; K.kq.clear(); sync(l).catch(()=>{}); }, 50); }
const watched = () => [...new Set([...subs].map(s=>s.c))];
async function sync(only){ const list = (only||watched()).filter(Boolean); if(!list.length) return;
  try{ const j = await call({op:"sync", colls:list.map(c=>({c, since:K.loaded[c]?(K.since[c]||0):0}))});
    for(const c in j.colls){ const rows = j.colls[c];
      if(rows && rows.denied){ K.denied[c] = true; K.loaded[c] = true; coll(c).clear(); emit(c); continue; }
      const m = coll(c), full = !K.loaded[c]; let ch = full;
      if(full){ const keep = new Map(); m.forEach((v,k)=>{ if(K.pend[c+"/"+k]) keep.set(k,v); }); m.clear(); keep.forEach((v,k)=>m.set(k,v)); }
      rows.forEach(([id,d])=>{ if(K.pend[c+"/"+id]) return; if(d===null){ if(m.delete(id)) ch = true; } else { m.set(id,d); ch = true; } });
      K.since[c] = j.now-8000; K.loaded[c] = true; if(ch) emit(c); }
    if(j.ver) K.ver = Math.max(K.ver, j.ver);
    K.err = ""; K.net = true; save();
  }catch(e){ K.err = e.message||String(e); K.net = !!e.srv; if(e.auth) authLost(); }
  status(); }
function applyLocal(ops){ const touched = new Set();
  ops.forEach(o=>{ const c = parentOf(o.path), id = idOf(o.path), m = coll(c), cur = m.get(id);
    if(o.op==="del") m.delete(id); else if(o.op==="update") m.set(id, merge(cur, o.data, false)); else m.set(id, o.merge ? merge(cur, o.data, true) : merge({}, o.data, true));
    K.pend[o.path] = (K.pend[o.path]||0)+1; touched.add(c); });
  touched.forEach(c=>emit(c)); save(); }
function write(ops){
  ops = ops.map(o=>Object.assign({}, o, {data:o.data ? clean(o.data) : undefined}));
  applyLocal(ops); K.q.push({id:autoId(), ops}); saveQ(); flush(); status();
  return Promise.resolve(); }
const done = job => job.ops.forEach(o=>{ if(K.pend[o.path]>1) K.pend[o.path]--; else delete K.pend[o.path]; });
async function flush(){ if(K.busy || !K.q.length || !K.url) return; K.busy = true;
  while(K.q.length){ const job = K.q[0];
    try{ const j = await call({op:"write", ops:job.ops}); K.q.shift(); saveQ(); done(job); K.net = true; K.err = "";
      const tc = new Set(); (j.docs||[]).forEach(d=>{ const c = parentOf(d.path); if(K.loaded[c] && !K.pend[d.path]){ const m = coll(c), id = idOf(d.path), old = JSON.stringify(m.get(id));
        if(d.op==="del") m.delete(id); else m.set(id, d.data); if(JSON.stringify(m.get(id))!==old) tc.add(c); } }); tc.forEach(emit); if(tc.size) save();
      if(j.now) K.ver = Math.max(K.ver, j.now); }
    catch(e){ if(e.srv){ K.q.shift(); saveQ(); done(job); if(e.auth) authLost();
        const cs = [...new Set(job.ops.map(o=>parentOf(o.path)))]; cs.forEach(c=>{ K.loaded[c] = false; }); sync(cs); say("Chưa lưu được: "+e.message); }
      else { K.net = false; K.err = "Đang chờ mạng"; clearTimeout(K._rt); K._rt = setTimeout(flush, 8000); break; } }
    status(); }
  K.busy = false; status(); }
let polling = false;
async function poll(){ if(polling || !K.url || !A.sess || document.visibilityState==="hidden") return; polling = true;
  try{ const j = await call({op:"ver"}); if(j.ver && j.ver>K.ver){ K.ver = j.ver; await sync(); } K.net = true; if(K.err==="Đang chờ mạng") K.err = ""; }
  catch(e){ K.net = !!e.srv; if(e.auth) authLost(); }
  polling = false; status(); }
function authLost(){ if(!A.sess) return; A.sess = ""; SS.del(sessKey()); say("Phiên đăng nhập đã hết, mời đăng nhập lại"); setTimeout(()=>location.reload(), 1500); }

/* ---------- trạng thái trên đầu trang ---------- */
function status(){ const el = document.getElementById("drvChip"); if(!el || !A.who) return; el.hidden = false; const n = K.q.length;
  el.className = "drv-chip"+(K.err && K.net && K.err!=="Đang chờ mạng" ? " bad" : !K.net ? " wait" : "");
  el.textContent = K.err && K.net && K.err!=="Đang chờ mạng" ? "Lỗi lưu" : !K.net ? "Chờ mạng"+(n?" ("+n+")":"") : n ? "Đang lưu "+n+"…" : "Đã lưu ✓";
  el.title = !K.net ? "Mất mạng: thay đổi giữ trong máy, có mạng sẽ tự gửi" : "Dữ liệu lưu trong Google Sheet của chi nhánh"; }

/* ---------- khởi động ---------- */
let timer = null;
async function start(){
  let w = null;
  try{ const j = await call({op:"who"}); w = j.who; K.sheet = j.sheet||""; K.khoV = j.v||0; SS.set("sdb2_who_"+B.info.id, JSON.stringify(w)); }
  catch(e){ if(e.auth){ A.sess = ""; SS.del(sessKey()); setUser(null); return; } try{ w = JSON.parse(SS.get("sdb2_who_"+B.info.id)||"null"); }catch(_){ w = null; } if(!w){ setUser(null); return; } }
  A.who = w; await restore();
  const first = sync(["staff","config"]); if(!K.loaded.staff) await first;
  if(K.q.length) flush();
  setUser(w);
  clearInterval(timer); timer = setInterval(poll, POLL_MS);
  status(); }
async function boot(){
  const ok = await loadBranch();
  if(!B.info){ if(ok || !B.slug) noBranchGate(); else gate('<b>Chưa tải được danh sách chi nhánh</b><p style="margin:0">Kiểm tra mạng rồi tải lại trang.</p>'); return; }
  if(!B.info.kho){ noKhoGate(); return; }
  K.url = B.info.kho; A.sess = SS.get(sessKey())||"";
  document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible") poll(); });
  window.addEventListener("online", ()=>{ flush(); poll(); });
  if(!A.sess){ setUser(null); return; }
  await start(); }

/* ---------- đối tượng giống Firestore ---------- */
const cmp = (a,op,b)=>op==="=="?a===b:op==="!="?a!==b:op===">="?a>=b:op==="<="?a<=b:op===">"?a>b:op==="<"?a<b:op==="in"?(b||[]).includes(a):op==="array-contains"?Array.isArray(a)&&a.includes(b):false;
function snapDoc(path, d){ return {id:idOf(path), exists:d!=null, ref:docRef(path), data:()=>d==null?undefined:clone(d), get:f=>d==null?undefined:clone(d[f]), metadata:{fromCache:false, hasPendingWrites:false}}; }
function runQ(c, q){ let rows = [...view(c)].map(([id,d])=>({id,d})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  (q.wh||[]).forEach(([f,op,v])=>{ rows = rows.filter(r=>r.d[f]!==undefined && cmp(r.d[f],op,v)); });
  if(q.ob){ const [f,dir] = q.ob; rows.sort((a,b)=>{ const x = a.d[f], y = b.d[f]; const r = x===y?0:(x===undefined?-1:y===undefined?1:x<y?-1:1); return dir==="desc"?-r:r; }); }
  if(q.lim) rows = rows.slice(0, q.lim);
  const docs = rows.map(r=>snapDoc(c+"/"+r.id, r.d));
  return {docs, size:docs.length, empty:!docs.length, forEach:f=>docs.forEach(f), metadata:{fromCache:false, hasPendingWrites:false}}; }
function listen(c, fire, err){ const s = {c, fire, err}; subs.add(s);
  if(isLoaded(c) || K.denied[c]) setTimeout(()=>{ if(subs.has(s)) fire(); }, 0); else kick(c);
  return ()=>subs.delete(s); }
const ensure = async c => { if(!isLoaded(c)) await sync([c]); };
const fv = (path, d, mg) => ({path, data:d, merge:!!mg});
function docRef(path){ const c = parentOf(path), id = idOf(path);
  return {id, path, get parent(){ return colRef(c); },
    collection:n=>colRef(path+"/"+n),
    get:async o=>{ if(o && o.source==="cache" && !isLoaded(c)) throw new Error("not cached"); await ensure(c); return snapDoc(path, view(c).get(id)); },
    set:(d,o)=>write([Object.assign({op:"set"}, fv(path, d, o&&o.merge))]),
    update:d=>write([{op:"update", path, data:d}]),
    delete:()=>write([{op:"del", path}]),
    onSnapshot:(cb,err)=>listen(c, ()=>cb(snapDoc(path, view(c).get(id))), err)}; }
function colRef(c, q){ q = q || {wh:[], ob:null, lim:0};
  return {id:idOf(c), path:c,
    doc:id=>docRef(c+"/"+(id||autoId())),
    add:async d=>{ const r = docRef(c+"/"+autoId()); await r.set(d); return r; },
    where:(f,op,v)=>colRef(c, Object.assign({}, q, {wh:q.wh.concat([[f,op,v]])})),
    orderBy:(f,dir)=>colRef(c, Object.assign({}, q, {ob:[f, dir||"asc"]})),
    limit:n=>colRef(c, Object.assign({}, q, {lim:n})),
    get:async()=>{ await ensure(c); return runQ(c, q); },
    onSnapshot:(cb,err)=>listen(c, ()=>cb(runQ(c, q)), err)}; }
const DB = {doc:docRef, collection:colRef, settings(){}, enablePersistence:()=>Promise.resolve(), enableNetwork:()=>Promise.resolve(), disableNetwork:()=>Promise.resolve(),
  batch(){ const ops = []; const b = {
      set:(r,d,o)=>{ ops.push(Object.assign({op:"set"}, fv(r.path, d, o&&o.merge))); return b; },
      update:(r,d)=>{ ops.push({op:"update", path:r.path, data:d}); return b; },
      delete:r=>{ ops.push({op:"del", path:r.path}); return b; },
      commit:()=>write(ops) }; return b; }};
const FS = () => DB; FS.FieldValue = {increment:n=>({[INC]:n}), delete:()=>({[DEL]:1})};
const AUTH = {get currentUser(){ return A.user; },
  onAuthStateChanged(f){ A.ls.add(f); if(A.ready) setTimeout(()=>f(A.user), 0); return ()=>A.ls.delete(f); },
  signInWithPopup:()=>signIn(), signInWithRedirect:()=>signIn(), getRedirectResult:()=>Promise.resolve(null),
  signOut:async()=>{ A.sess = ""; SS.del(sessKey()); }};
function GAP(){} GAP.prototype.setCustomParameters = function(){};
window.firebase = {initializeApp(){}, firestore:FS, auth:Object.assign(()=>AUTH, {GoogleAuthProvider:GAP})};
window.FB_CONFIG = window.FB_CONFIG || {};

/* ---------- dành cho mục "Kho dữ liệu chi nhánh" trong app ---------- */
window.SDB = { get who(){ return A.who; }, get branch(){ return B.info; }, get sheet(){ return K.sheet; }, get khoV(){ return K.khoV; },
  khoCode:()=>B.info?khoCode(B.info):"", kho:q=>call(q), report, appV:APP_V };

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ()=>boot()); else boot();
})();
