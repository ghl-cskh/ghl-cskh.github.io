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
