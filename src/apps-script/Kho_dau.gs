/**
 * Sổ CSKH – KHO CHI NHÁNH: __BNAME__   (mã: __BID__)
 * ------------------------------------------------
 * Chạy bằng Gmail của GĐ chi nhánh. Gmail chạy kho này chính là GĐ chi nhánh.
 * Kho giữ TOÀN BỘ dữ liệu chi nhánh trong 1 Google Sheet ở Drive của GĐ: nhân viên, duyệt, ba mẹ,
 * báo cáo, điểm danh, kế hoạch, ghi chú, nhật ký, tin nhắn. Không gửi dữ liệu đi đâu khác.
 * Mỗi đêm 23h tự lưu thêm: mỗi ba mẹ 1 thư mục (Hồ sơ & quá trình + Quá trình thực hành PPTN) và 1 bản json để khôi phục.
 *
 * CÀI ĐẶT (1 lần): dán mã này vào script.google.com → Lưu → chạy hàm "caiDat" → Cho phép →
 * Triển khai → Tùy chọn triển khai mới → Ứng dụng web · Thực thi với tư cách: Tôi · Ai có quyền truy cập: Bất kỳ ai
 * → sao chép URL /exec dán vào app.
 */
const BRANCH_ID = "__BID__";
const BRANCH_NAME = "__BNAME__";
const GOOGLE_CLIENT_ID = "__CLIENT__";
const KHO_VERSION = 1;
const SESSION_DAYS = 30;
const KEEP_JSON = 14;

function caiDat(){
  const p = props_();
  if(!p.getProperty("SECRET")) p.setProperty("SECRET", Utilities.getUuid().replace(/-/g,"")+Utilities.getUuid().replace(/-/g,""));
  if(!p.getProperty("SHEET_ID")) newSheet_("Sổ CSKH – Dữ liệu "+BRANCH_NAME, root_());
  ScriptApp.getProjectTriggers().forEach(t=>{ if(t.getHandlerFunction()==="saoLuuDem") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("saoLuuDem").timeBased().everyDays(1).atHour(23).nearMinute(0).inTimezone("Asia/Ho_Chi_Minh").create();
  Logger.log("Đã tạo kho: https://docs.google.com/spreadsheets/d/"+p.getProperty("SHEET_ID")+" · GĐ chi nhánh: "+owner_()+" · Sao lưu tự động 23h đã bật.");
}
function owner_(){ return String(Session.getEffectiveUser().getEmail()||"").toLowerCase(); }
const SECRET_ = () => { const s = props_().getProperty("SECRET"); if(!s) throw new Error("Kho chưa chạy caiDat"); return s; };

/* ---------------- đăng nhập Google → phiên 30 ngày ---------------- */
function login_(idToken){
  const r = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(idToken||""), {muteHttpExceptions:true});
  if(r.getResponseCode()!==200) throw new Error("Đăng nhập Google không hợp lệ");
  const t = JSON.parse(r.getContentText());
  if(t.aud!==GOOGLE_CLIENT_ID || String(t.email_verified)!=="true" || !t.email) throw new Error("Đăng nhập Google không hợp lệ");
  const pl = {e:String(t.email).toLowerCase(), s:t.sub, n:t.name||"", x:Date.now()+SESSION_DAYS*864e5};
  const body = b64u_(Utilities.newBlob(JSON.stringify(pl)).getBytes());
  return body+"."+hmac_(body, SECRET_()); }
function session_(sess){
  const p = String(sess||"").split("."); if(p.length!==2 || hmac_(p[0], SECRET_())!==p[1]) throw new Error("AUTH: Chưa đăng nhập");
  const pl = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(p[0])).getDataAsString());
  if(!(pl.x>Date.now())) throw new Error("AUTH: Phiên đăng nhập đã hết hạn"); return pl; }

/* ---------------- ai đang dùng ---------------- */
function getDoc_(sh, path, M){ const m = (M||meta_(sh)).find(r=>r.path===path && !r.del); return m ? jsonOf_(sh,[m])[0] : null; }
function sidOfEmail_(sh, email, M){
  const p = props_(), k = "em_"+email, hit = p.getProperty(k); if(hit) return hit;
  const rows = (M||meta_(sh)).filter(r=>/^staff\/[^/]+$/.test(r.path) && !r.del), js = jsonOf_(sh, rows); let best = null;
  rows.forEach((r,i)=>{ const d = js[i]||{}; if(String(d.email||"").toLowerCase()!==email) return; const id = r.path.split("/")[1];
    if(!best || (d.approved && !best.ap)) best = {id:id, ap:!!d.approved}; });
  if(best) p.setProperty(k, best.id); return best ? best.id : null; }
function who_(sess){
  const pl = session_(sess), c = CacheService.getScriptCache(), ck = "w_"+pl.e, hit = c.get(ck); if(hit) return JSON.parse(hit);
  const sh = sheet_(), M = meta_(sh), uid = sidOfEmail_(sh, pl.e, M) || ("g"+pl.s), st = getDoc_(sh, "staff/"+uid, M) || {};
  const owner = pl.e===owner_(), role = owner ? "cn" : (st.chucVu||"nv");
  const w = {uid:uid, email:pl.e, name:st.name||pl.n||"", owner:owner, branch:BRANCH_ID, role:role,
    approved: owner || (st.approved===true && st.disabled!==true), qg: role==="tl" && st.quyenGd===true, exists:!!st.name};
  w.cnLike = w.approved && (role==="cn" || w.qg); w.mgr = w.approved && (role==="cn" || role==="tl");
  c.put(ck, JSON.stringify(w), 30); return w; }
function forget_(email){ if(email) CacheService.getScriptCache().remove("w_"+String(email).toLowerCase()); }

/* ---------------- quyền ---------------- */
const PROT = ["approved","chucVu","chiNhanh","quyenGd","disabled","role"];
function canRead_(who){ return c=>{ if(who.approved) return true; return c==="staff" || c==="config" || c==="branches"; }; }
function fixOps_(who, ops){ return (ops||[]).map(o=>{ const p = String(o.path).split("/");
  if(p[0]==="staff" && p.length===2 && p[1]===who.uid && o.op==="set" && !o.merge){
    const d = Object.assign({}, o.data, {chiNhanh:BRANCH_ID, email:who.email});
    if(who.owner) Object.assign(d, {approved:true, disabled:false, chucVu:"cn", role:"giam_doc"}); else Object.assign(d, {approved:false, chucVu:"nv", role:"nhan_vien"});
    return Object.assign({}, o, {data:d}); }
  return o; }); }
function canWrite_(who){ const deny = p=>{ throw new Error("Không có quyền sửa: "+p); };
  return (op, old)=>{ const p = op.path.split("/"), d = op.data||{};
    const changes = k => (k in d) && JSON.stringify(d[k])!==JSON.stringify(old ? old[k] : undefined);
    if(p[0]==="staff" && p.length===2){
      if(p[1]===who.uid){ if(!old) return; if(op.op!=="del" && (who.owner || !PROT.some(changes))) return; }
      if(who.cnLike && old){ if(String(old.email||"").toLowerCase()===owner_()) deny(op.path);       // không ai sửa được GĐ chủ kho
        if(d.chucVu==="cn" || (("chiNhanh" in d) && d.chiNhanh!==BRANCH_ID)) deny(op.path); return; }
      deny(op.path); }
    if(!who.approved) deny(op.path);
    if(p[0]==="config" || (p[0]==="branches" && p.length===2)){ if(who.cnLike) return; deny(op.path); }
    return; }; }

/* ---------------- cổng web ---------------- */
function doGet(){ return out_({ok:true, app:"So CSKH", role:"kho", branch:BRANCH_ID, v:KHO_VERSION, ready:!!props_().getProperty("SHEET_ID"), now:Date.now()}); }
function doPost(e){
  try{
    const q = JSON.parse((e.postData&&e.postData.contents)||"{}"), now = Date.now();
    if(q.op==="ping") return doGet();
    if(q.op==="login"){ const sess = login_(q.idToken); return out_({ok:true, sess:sess, who:who_(sess)}); }
    const who = who_(q.sess);
    if(q.op==="who") return out_({ok:true, who:who, ver:ver_(), v:KHO_VERSION, sheet: who.cnLike ? "https://docs.google.com/spreadsheets/d/"+props_().getProperty("SHEET_ID") : ""});
    if(q.op==="ver") return out_({ok:true, ver:ver_()});
    if(q.op==="sync"){ const r = sync_(sheet_(), q.colls||[], canRead_(who));
      if(!who.approved && r.staff && !r.staff.denied) r.staff = r.staff.filter(x=>x[0]===who.uid);
      return out_({ok:true, now:now, ver:ver_(), colls:r}); }
    if(q.op==="write") return out_(withLock_(()=>{ const docs = applyOps_(sheet_(), fixOps_(who, q.ops), now, canWrite_(who)); afterWrite_(docs); return {ok:true, now:now, docs:docs}; }));
    if(q.op==="import"){ if(!who.cnLike) throw new Error("Chỉ GĐ chi nhánh được nhập dữ liệu");
      return out_(withLock_(()=>{ const ops = (q.ops||[]).map(o=>({op:"set", path:String(o.path), data:o.data, ifNewer:true}))
          .filter(o=>/^staff\/[^/]+(\/[^/]+\/[^/]+)?$/.test(o.path) || new RegExp("^branches/"+BRANCH_ID+"/[^/]+/[^/]+$").test(o.path));
        const docs = applyOps_(sheet_(), ops, now, null); afterWrite_(docs);
        /* GĐ vừa tạo tài khoản mới trước khi nhập: gộp về tài khoản cũ cùng Gmail */
        const mine = ops.find(o=>/^staff\/[^/]+$/.test(o.path) && String((o.data||{}).email||"").toLowerCase()===who.email);
        if(mine && mine.path!=="staff/"+who.uid && /^g/.test(who.uid)){ const sid = mine.path.split("/")[1];
          applyOps_(sheet_(), [{op:"del", path:"staff/"+who.uid}, {op:"set", merge:true, path:mine.path, data: who.owner ? {approved:true, disabled:false, chucVu:"cn", chiNhanh:BRANCH_ID} : {}}], Date.now(), null);
          props_().setProperty("em_"+who.email, sid); forget_(who.email); }
        return {ok:true, n:docs.length}; })); }
    return out_({ok:false, error:"Lệnh không hợp lệ"});
  }catch(err){ return out_({ok:false, error:String(err && err.message || err)}); } }
function afterWrite_(docs){ const p = props_();
  docs.forEach(d=>{ const s = d.path.split("/"); if(s[0]!=="staff" || s.length!==2) return;
    const em = d.data && d.data.email ? String(d.data.email).toLowerCase() : "";
    if(em){ const k = "em_"+em, cur = p.getProperty(k); if(!cur || d.data.approved || cur===s[1]) p.setProperty(k, s[1]); forget_(em); }
    else if(d.op==="del"){ p.getKeys().filter(k=>k.indexOf("em_")===0 && p.getProperty(k)===s[1]).forEach(k=>{ p.deleteProperty(k); forget_(k.slice(3)); }); } }); }

/* ================= SAO LƯU 23H ================= */
function collect_(){
  const sh = sheet_(), M = meta_(sh).filter(r=>!r.del), js = jsonOf_(sh, M);
  const D = {app:"So CSKH", branch:{id:BRANCH_ID, name:BRANCH_NAME}, exportedAt:new Date().toISOString(), staff:{}, nhatky:[]};
  const st = sid => D.staff[sid] || (D.staff[sid] = {info:{id:sid}, parents:[], plans:[], logs:[], att:[], notes:[]});
  M.forEach((r,i)=>{ const p = r.path.split("/"), d = Object.assign({id:p[p.length-1]}, js[i]||{});
    if(p[0]==="branches" && p[2]==="nhatky"){ D.nhatky.push(d); return; }
    if(p[0]==="staff" && p.length===2){ st(p[1]).info = d; return; }
    if(p[0]==="staff" && p.length===4){ const s = st(p[1]); if(s[p[2]]) s[p[2]].push(d); } });
  return D; }
function reportStatus_(nBm){ const now = Date.now();
  withLock_(()=>applyOps_(sheet_(), [{op:"set", merge:true, path:"branches/"+BRANCH_ID+"/meta/backup", data:{lastAt:now, lastDate:Utilities.formatDate(new Date(),"Asia/Ho_Chi_Minh","yyyy-MM-dd"), byName:"Tự động 23h", nBm:nBm, auto:true, ok:true}}], now, null)); }
