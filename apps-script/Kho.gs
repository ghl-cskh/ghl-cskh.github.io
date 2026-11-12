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

/* ---------- thư mục & tệp ---------- */
function sub_(parent,name){ const it=parent.getFoldersByName(name); return it.hasNext()?it.next():parent.createFolder(name); }
function root_(){ const name="Sổ CSKH – "+BRANCH_NAME, it=DriveApp.getFoldersByName(name); return it.hasNext()?it.next():DriveApp.createFolder(name); }
function safe_(s){ return String(s||"").replace(/[\\\/:*?"<>|#\[\]]+/g," ").replace(/\s+/g," ").trim().slice(0,80)||"Ba mẹ"; }
function sheetIn_(folder, id, name){
  if(id){ try{ const f=DriveApp.getFileById(id); if(!f.isTrashed()){ if(f.getName()!==name) f.setName(name); return SpreadsheetApp.openById(id); } }catch(e){} }
  const ss=SpreadsheetApp.create(name); DriveApp.getFileById(ss.getId()).moveTo(folder); return ss;
}
function put_(ss, name, rows, widths){
  let sh=ss.getSheetByName(name)||ss.insertSheet(name); sh.clear();
  const w=Math.max.apply(null, rows.map(r=>r.length).concat([1]));
  if(rows.length) sh.getRange(1,1,rows.length,w).setValues(rows.map(r=>{ const x=r.slice(); while(x.length<w) x.push(""); return x.map(v=>v==null?"":(typeof v==="string"&&v.length>45000?v.slice(0,45000):v)); }));
  (widths||[]).forEach((px,i)=>sh.setColumnWidth(i+1,px)); sh.setWrap(true); sh.setVerticalAlignment("top");
  return sh;
}
function dropFirst_(ss){ const f=ss.getSheetByName("Sheet1")||ss.getSheetByName("Trang tính1"); if(f&&ss.getSheets().length>1) ss.deleteSheet(f); }

/* ---------- gộp báo cáo theo ngày (giống app) ---------- */
function ts_(l){ return Number(l.createdAt||l.updatedAt||0); }
function mergeLogs_(rows){
  const g={}; rows.filter(r=>!r.mergedInto).forEach(r=>{ const k=r.date||""; (g[k]=g[k]||[]).push(r); });
  return Object.keys(g).sort().map(d=>{ const list=g[d].sort((a,b)=>ts_(a)-ts_(b)), m={date:d,tn:{},talks:[],pyph:false,pyphNote:[],doNhe:null,khMai:[],ghiChu:[],bys:[]};
    ["truocTren","truocDuoi","sauTren","sauDuoi"].forEach(k=>{ list.forEach(r=>{ const v=r.tn&&r.tn[k]; if(v!=null&&v!=="") m.tn[k]=v; }); });
    list.forEach(r=>{ if(Array.isArray(r.talks)&&r.talks.length) r.talks.forEach(t=>t&&t.t&&m.talks.push(t.t)); else if(r.baoCao) m.talks.push(r.baoCao);
      if(r.pyph) m.pyph=true; if(r.pyphNote) m.pyphNote.push(r.pyphNote); if(r.doNhe) m.doNhe=r.doNhe; else if(!m.doNhe) m._old=r;
      if(r.khMai) m.khMai.push(r.khMai); if(r.ghiChu) m.ghiChu.push(r.ghiChu); if(r.by) m.bys.push(r.by); });
    if(!m.doNhe){ const r=m._old, sk=r&&Array.isArray(r.sucKhoe)&&r.sucKhoe[0];
      if(sk||(r&&r.hieuQua)) m.doNhe={truoc:{m:sk&&sk.truoc!=null?Number(sk.truoc):null,tt:sk&&sk.ten&&sk.ten!=="Độ nhẹ"?sk.ten:""},sau:{m:sk&&sk.sau!=null?Number(sk.sau):null,tt:(r&&r.hieuQua)||""}}; }
    return m; });
}
const THU_=["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
function dmy_(d){ const p=String(d||"").split("-"); return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:d||""; }
function thu_(d){ const p=String(d||"").split("-").map(Number); return p.length===3?THU_[new Date(p[0],p[1]-1,p[2]).getDay()]:""; }
const n1_=v=>v==null||v===""?"":Number(v);
function uniq_(a){ return a.filter((x,i)=>x&&a.indexOf(x)===i); }

/* ---------- nội dung từng ba mẹ ---------- */
function profile_(p, D, ownerName){
  const L=(a,b)=>[a,b==null?"":b];
  const benh=(p.benh||[]).map(b=>b&&b.ten?(b.ten+(b.baoLau?" ("+b.baoLau+")":"")):"").filter(Boolean).join("; ")||p.tenBenh||"";
  return [["THÔNG TIN BA MẸ",""],
    L("Họ tên",p.tenBaMe),L("Tổ",p.to),L("Loại",p.loai==="tiem_nang"?"Tiềm năng (BMTN)":"Chính thức"),L("Giới tính",p.gioiTinh==="nam"?"Nam":p.gioiTinh==="nu"?"Nữ":""),
    L("Số điện thoại",p.sdt),L("Ngày sinh",dmy_(p.ngaySinh)),L("Địa chỉ",p.diaChi),
    L("Người thân – SĐT",p.sdtNguoiThan),L("Người thân – quan hệ",p.quanHe),
    L("Ngày bắt đầu tập máy",dmy_(p.ngayTapMay)),L("Ca tập",(p.ca||[]).map(c=>"Ca "+c).join(", ")),L("Giờ tập",p.gioTap),
    L("BM hướng dẫn",p.bmHuongDan),L("Người phụ trách",ownerName),L("Thiết bị",(p.thietBi||[]).join(", ")),
    L("Bệnh / tình trạng",benh),L("Mong muốn",p.mongMuon),L("Hoàn cảnh",p.hoanCanh),
    L("Thân nhiệt ban đầu – Trên",n1_(p.tnBDTren)),L("Thân nhiệt ban đầu – Dưới",n1_(p.tnBDDuoi)),
    L("Nách ban đầu",p.nachBD),L("Eo ban đầu",p.eoBD),L("Cẳng chân ban đầu",p.canBD),
    L("Nách hiện tại",p.nachHT),L("Eo hiện tại",p.eoHT),L("Cẳng chân hiện tại",p.canHT),
    L("Cải thiện",p.caiThien),L("Ngày tạo hồ sơ",p.createdAt?Utilities.formatDate(new Date(Number(p.createdAt)),"Asia/Ho_Chi_Minh","dd/MM/yyyy"):"")];
}
function nameOf_(D,sid){ return ((D.staff[sid]||{}).info||{}).name||sid; }
function writeProfile_(ss, p, sid, D, ml, st){
  const owner=nameOf_(D,sid);
  put_(ss,"Thông tin",profile_(p,D,owner),[220,520]);
  const rep=[["Ngày","Thứ","Thân nhiệt trước – Trên","Trước – Dưới","Sau – Trên","Sau – Dưới","Nội dung nói chuyện","PƯPH","Kế hoạch ngày mai","Ghi chú","Người báo cáo"]];
  ml.slice().reverse().forEach(m=>rep.push([dmy_(m.date),thu_(m.date),n1_(m.tn.truocTren),n1_(m.tn.truocDuoi),n1_(m.tn.sauTren),n1_(m.tn.sauDuoi),m.talks.join("\n"),m.pyph?("Có"+(m.pyphNote.length?": "+uniq_(m.pyphNote).join("; "):"")):"",uniq_(m.khMai).join("\n"),uniq_(m.ghiChu).join("\n"),uniq_(m.bys).map(x=>nameOf_(D,x)).join(", ")]));
  put_(ss,"Báo cáo",rep,[90,80,90,80,80,80,420,160,260,200,140]);
  const att=[["Ngày","Thứ","Ca","Trạng thái","Lý do vắng","Ghi chú","Người điểm danh"]];
  (st.att||[]).filter(a=>a.parentId===p.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(a=>att.push([dmy_(a.date),thu_(a.date),Array.isArray(a.ca)?a.ca.join(", "):(a.ca||""),a.status==="co"?"Có mặt":a.status==="vang"?"Vắng":(a.status||""),a.lyDo||"",a.ghiChu||"",nameOf_(D,a.by||sid)]));
  put_(ss,"Điểm danh",att,[90,80,80,100,200,260,140]);
  const pl=[["Ngày","Việc cần làm","Trạng thái"]];
  (st.plans||[]).filter(x=>x.parentId===p.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(x=>pl.push([dmy_(x.date),x.noiDung||"",x.done?"Xong":"Chưa"]));
  put_(ss,"Kế hoạch",pl,[90,520,100]);
  const nt=[["Ngày","Ghi chú","Người ghi"]];
  (st.notes||[]).filter(x=>x.parentId===p.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(x=>nt.push([dmy_(x.date),x.text||"",nameOf_(D,x.by||sid)]));
  put_(ss,"Ghi chú",nt,[90,620,140]);
  dropFirst_(ss);
}
function writePptn_(ss, p, ml, D){
  const rows=[["TÊN CN: "+BRANCH_NAME,"","TỔ: "+(p.to||""),"","TÊN BA MẸ: "+(p.tenBaMe||""),"","","",""],
    ["QUÁ TRÌNH THỰC HÀNH PHƯƠNG PHÁP THÂN NHIỆT","","","","","","","",""],
    ["Thứ","Ngày","Thân nhiệt TRƯỚC (Trên / Dưới)","Tình trạng sức khoẻ TRƯỚC","Độ nhẹ TRƯỚC (0 nhẹ – 10 nặng)","Thân nhiệt SAU (Trên / Dưới)","Tình trạng sức khoẻ SAU","Độ nhẹ SAU (0 nhẹ – 10 nặng)","Ghi chú"]];
  const has=x=>x&&((x.m!=null&&x.m!=="")||String(x.tt||"").trim());
  let n=0;
  ml.slice().reverse().forEach(m=>{ const dn=m.doNhe||{truoc:{},sau:{}}; if(!(has(dn.truoc)||has(dn.sau))) return; n++;
    const tn=(a,b)=>(a==null||a===""?"……":Number(a).toFixed(1))+" / "+(b==null||b===""?"……":Number(b).toFixed(1));
    const gc=[m.pyph?("PƯPH"+(m.pyphNote.length?": "+uniq_(m.pyphNote).join("; "):"")):"",uniq_(m.ghiChu).join("\n")].filter(Boolean).join("\n");
    rows.push([thu_(m.date),dmy_(m.date),tn(m.tn.truocTren,m.tn.truocDuoi),(dn.truoc||{}).tt||"",n1_((dn.truoc||{}).m),tn(m.tn.sauTren,m.tn.sauDuoi),(dn.sau||{}).tt||"",n1_((dn.sau||{}).m),gc]); });
  if(!n) rows.push(["Chưa có buổi nào có Độ nhẹ / Tình trạng sức khoẻ.","","","","","","","",""]);
  rows.push(["Green & Happy Life  |  Thân nhiệt quyết định Sinh – Lão – Bệnh – Tử","","","","","","","",""]);
  const sh=put_(ss,"PPTN",rows,[90,90,170,260,120,170,260,120,260]);
  sh.getRange(1,1,2,9).setFontWeight("bold"); sh.getRange(3,1,1,9).setFontWeight("bold").setBackground("#fce3e5");
  sh.getRange(2,1).setFontSize(14); sh.setFrozenRows(3);
  dropFirst_(ss);
}

/* ---------- chạy sao lưu (chia nhiều lượt nếu chi nhánh lớn, mỗi lượt tối đa ~4,5 phút) ---------- */
const BUDGET_MS = 270000;
function hash_(o){ return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(o))); }
function readJson_(folder, name){ const it=folder.getFilesByName(name); if(!it.hasNext()) return null; try{ return JSON.parse(it.next().getBlob().getDataAsString()); }catch(e){ return null; } }
function writeJson_(folder, name, obj){ const it=folder.getFilesByName(name); const txt=JSON.stringify(obj); if(it.hasNext()) it.next().setContent(txt); else folder.createFile(name, txt, MimeType.PLAIN_TEXT); }
function clearCont_(){ ScriptApp.getProjectTriggers().forEach(t=>{ if(t.getHandlerFunction()==="tiepTuc") ScriptApp.deleteTrigger(t); }); }
function tiepTuc(){ clearCont_(); saoLuuDem(); }
function saoLuuDem(){
  const t0=Date.now(); clearCont_();
  const D=collect_(), root=root_(), baMe=sub_(root,"Ba mẹ");
  const idx=readJson_(root,"_chi_muc.json")||{}, used={}; let done=0, skipped=0, todo=0, nBm=0;
  const items=[];
  Object.keys(D.staff).forEach(sid=>{ const st=D.staff[sid]; (st.parents||[]).forEach(p=>{ if(p.deleted) return; items.push({sid:sid,st:st,p:p}); }); });
  nBm=items.length;
  const cm_=p=>{ const a=(p.ca||[]).map(Number).filter(n=>n>=1&&n<=13).sort((x,y)=>x-y); return a.length?a[0]:99; };
  items.sort((a,b)=>(cm_(a.p)-cm_(b.p))||String(a.p.tenBaMe||"").localeCompare(String(b.p.tenBaMe||""),"vi"));
  const dup={}; items.forEach(it=>{ const k=safe_(it.p.tenBaMe).toLowerCase(); dup[k]=(dup[k]||0)+1; });
  for(let i=0;i<items.length;i++){
    const it=items[i], p=it.p, st=it.st, key=it.sid+"|"+p.id, rec=idx[key]||{};
    const logs=(st.logs||[]).filter(l=>l.parentId===p.id), att=(st.att||[]).filter(a=>a.parentId===p.id), plans=(st.plans||[]).filter(x=>x.parentId===p.id), notes=(st.notes||[]).filter(x=>x.parentId===p.id);
    const h=hash_([p,logs,att,plans,notes,nameOf_(D,it.sid)]);
    if(rec.h===h && rec.f && rec.a && rec.b){ skipped++; continue; }
    if(Date.now()-t0>BUDGET_MS){ todo++; continue; }
    const fname=safe_(p.tenBaMe)+(dup[safe_(p.tenBaMe).toLowerCase()]>1?" ("+String(p.id).slice(0,4)+")":"");
    let folder=null; if(rec.f){ try{ folder=DriveApp.getFolderById(rec.f); if(folder.isTrashed()) folder=null; }catch(e){ folder=null; } }
    if(!folder){ folder=baMe.createFolder(fname); rec.a=rec.b=null; } else if(folder.getName()!==fname) folder.setName(fname);
    const ml=mergeLogs_(logs);
    const s1=sheetIn_(folder, rec.a, fname+" – Hồ sơ & quá trình"); writeProfile_(s1,p,it.sid,D,ml,st);
    const s2=sheetIn_(folder, rec.b, fname+" – Quá trình thực hành PPTN"); writePptn_(s2,p,ml,D);
    idx[key]={h:h,f:folder.getId(),a:s1.getId(),b:s2.getId()}; done++; if(done%10===0) writeJson_(root,"_chi_muc.json",idx);
  }
  writeJson_(root,"_chi_muc.json",idx);
  if(todo>0){ ScriptApp.newTrigger("tiepTuc").timeBased().after(60*1000).create(); return {ba_me:nBm, da_ghi:done, bo_qua:skipped, con_lai:todo, ghi_chu:"Còn "+todo+" ba mẹ, tự chạy tiếp sau 1 phút"}; }
  // dọn thư mục của ba mẹ đã bị xoá khỏi sổ
  const live={}; items.forEach(it=>{ live[it.sid+"|"+it.p.id]=1; }); Object.keys(idx).forEach(k=>{ if(!live[k]){ try{ DriveApp.getFolderById(idx[k].f).setTrashed(true); }catch(e){} delete idx[k]; } });
  writeJson_(root,"_chi_muc.json",idx);
  // bản đầy đủ để khôi phục
  const d=Utilities.formatDate(new Date(),"Asia/Ho_Chi_Minh","yyyy-MM-dd"), jn="SoCSKH_"+BRANCH_ID+"_"+d+".json", bk=sub_(root,"Khôi phục (json)");
  const old=bk.getFilesByName(jn); while(old.hasNext()) old.next().setTrashed(true);
  bk.createFile(jn, JSON.stringify(D), MimeType.PLAIN_TEXT);
  const js=[], itf=bk.getFiles(); while(itf.hasNext()){ const f=itf.next(); if(/^SoCSKH_.*\.json$/.test(f.getName())) js.push(f); }
  js.sort((a,b)=>b.getName().localeCompare(a.getName())); js.slice(KEEP_JSON).forEach(f=>f.setTrashed(true));
  reportStatus_(nBm);
  return {ba_me:nBm, da_ghi:done, bo_qua:skipped, thu_muc:root.getUrl()};
}


/* ================= LÕI KHO DỮ LIỆU GOOGLE SHEET (dùng chung) =================
 * Mỗi tài liệu = 1 dòng trong trang "docs": [đường dẫn, thời điểm sửa, đã xoá, json...]
 * (1 ô Google Sheet tối đa 50.000 ký tự nên json dài được chia nhiều ô) */
const SHEET_NAME = "docs";
const CHUNK = 45000;

function props_(){ return PropertiesService.getScriptProperties(); }
function sheet_(){ const id = props_().getProperty("SHEET_ID"); if(!id) throw new Error("Chưa chạy caiDat"); return SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME); }
function newSheet_(title, folder){
  const ss = SpreadsheetApp.create(title); const sh = ss.getSheets()[0]; sh.setName(SHEET_NAME);
  sh.getRange(1,1,1,4).setValues([["path","updatedAt","deleted","json"]]); sh.setFrozenRows(1);
  sh.getRange("A:A").setNumberFormat("@"); sh.getRange("D:Z").setNumberFormat("@");
  if(folder) DriveApp.getFileById(ss.getId()).moveTo(folder);
  props_().setProperty("SHEET_ID", ss.getId()); return ss; }

/* đọc nhanh: chỉ 3 cột đầu, json đọc riêng những dòng cần */
function meta_(sh){ const n = sh.getLastRow()-1; if(n<=0) return [];
  return sh.getRange(2,1,n,3).getValues().map((r,i)=>({row:i+2, path:String(r[0]), at:Number(r[1])||0, del:!!r[2]})); }
function parse_(cells){ const s = cells.map(x=>String(x).replace(/^~/,"")).join(""); return s ? JSON.parse(s) : {}; }
function jsonOf_(sh, rows){ if(!rows.length) return [];
  const w = Math.max(4, sh.getLastColumn());
  if(rows.length > 40){ const all = sh.getRange(2,4,sh.getLastRow()-1,w-3).getValues(); return rows.map(r=>parse_(all[r.row-2])); }
  return rows.map(r=>parse_(sh.getRange(r.row,4,1,w-3).getValues()[0])); }
function toRow_(path, at, del, json){ const r = [path, at, del?1:""]; if(del) return r;
  for(let i=0;i<json.length;i+=CHUNK) r.push("~"+json.slice(i,i+CHUNK)); if(r.length<4) r.push("~{}"); return r; }
function pad_(r, w){ while(r.length<w) r.push(""); return r; }

/* ghép dữ liệu giống Firestore: update = thay từng trường; set merge = trộn sâu các object */
const isObj_ = v => v && typeof v==="object" && !Array.isArray(v);
function merge_(old, d, deep){ const o = Object.assign({}, old||{});
  for(const k in d){ const v = d[k];
    if(isObj_(v) && v.__inc__!==undefined) o[k] = (Number(o[k])||0) + Number(v.__inc__);
    else if(isObj_(v) && v.__del__) delete o[k];
    else if(deep && isObj_(v) && isObj_(o[k])) o[k] = merge_(o[k], v, true);
    else if(isObj_(v)) o[k] = merge_({}, v, true);
    else o[k] = v; }
  return o; }

/* ghi nhiều thay đổi một lượt; allow(op, old) ném lỗi nếu không có quyền */
function applyOps_(sh, ops, now, allow){
  const M = meta_(sh), ix = {}; M.forEach(m=>{ ix[m.path] = m; });
  const need = []; const seen = {};
  ops.forEach(o=>{ const m = ix[o.path]; if(m && !m.del && !seen[o.path]){ seen[o.path]=1; need.push(m); } });
  const cur = {}; jsonOf_(sh, need).forEach((d,i)=>{ cur[need[i].path] = d; });
  const recs = {}, out = [];
  ops.forEach(op=>{
    const old = (op.path in cur) ? cur[op.path] : null;
    if(allow) allow(op, old);
    if(op.ifNewer && old && Number(old.updatedAt||0) >= Number((op.data||{}).updatedAt||0)) return;
    let data = null, del = false;
    if(op.op==="set") data = op.merge ? merge_(old, op.data, true) : merge_({}, op.data, true);
    else if(op.op==="update"){ if(!old) throw new Error("Không có tài liệu: "+op.path); data = merge_(old, op.data, false); }
    else if(op.op==="del") del = true;
    else throw new Error("Lệnh ghi không hợp lệ");
    cur[op.path] = del ? null : data;
    recs[op.path] = {path:op.path, at:now, del:del, json: del ? "" : JSON.stringify(data)};
    out.push({op:del?"del":"set", path:op.path, data:data}); });
  let w = Math.max(4, sh.getLastColumn()); const adds = [];
  Object.keys(recs).forEach(p=>{ const r = recs[p], row = toRow_(r.path, r.at, r.del, r.json), m = ix[p];
    if(m){ const ww = Math.max(w, row.length); sh.getRange(m.row,1,1,ww).setValues([pad_(row,ww)]); }
    else adds.push(row); });
  if(adds.length){ const ww = Math.max(w, ...adds.map(r=>r.length)); sh.getRange(sh.getLastRow()+1,1,adds.length,ww).setValues(adds.map(r=>pad_(r,ww))); }
  if(out.length) bump_(now);
  return out; }

/* tải các bộ sưu tập; since>0 thì chỉ lấy phần thay đổi */
function sync_(sh, colls, canRead){
  const M = meta_(sh), res = {}, want = [], seen = {};
  colls.forEach(q=>{ const c = String(q.c), since = Number(q.since)||0, n = c.split("/").length+1, pre = c+"/";
    if(canRead && !canRead(c)){ res[c] = {denied:true}; return; }
    const rows = M.filter(r=>r.path.indexOf(pre)===0 && r.path.split("/").length===n && r.at>since && (since>0 || !r.del));
    res[c] = rows; rows.forEach(r=>{ if(!r.del && !seen[r.path]){ seen[r.path]=1; want.push(r); } }); });
  const js = {}; jsonOf_(sh, want).forEach((d,i)=>{ js[want[i].path] = d; });
  const out = {};
  Object.keys(res).forEach(c=>{ const v = res[c]; if(v.denied){ out[c] = {denied:true}; return; }
    out[c] = v.map(r=>[r.path.slice(c.length+1), r.del ? null : js[r.path], r.at]); });
  return out; }

/* số phiên bản: tăng mỗi lần có thay đổi, máy khác hỏi số này mỗi vài giây (rất nhẹ, không đọc Sheet) */
function bump_(now){ const v = String(now||Date.now()); CacheService.getScriptCache().put("VER", v, 21600); props_().setProperty("VER", v); }
function ver_(){ const c = CacheService.getScriptCache(); let v = c.get("VER"); if(!v){ v = props_().getProperty("VER")||"0"; c.put("VER", v, 21600); } return Number(v); }

function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function b64u_(bytes){ return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,""); }
function hmac_(text, secret){ return b64u_(Utilities.computeHmacSha256Signature(text, secret)); }
function rnd_(n){ let s=""; const a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for(let i=0;i<(n||32);i++) s+=a[Math.floor(Math.random()*62)]; return s; }
function withLock_(fn){ const l = LockService.getScriptLock(); l.waitLock(25000); try{ return fn(); } finally { l.releaseLock(); } }
