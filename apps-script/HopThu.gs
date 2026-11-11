/**
 * Sổ CSKH – HỘP THƯ QUẢN TRỊ (chạy bằng Gmail ADMIN, 1 bản duy nhất)
 * ----------------------------------------------------------------
 * Chỉ nhận 2 loại tin, ghi vào Google Sheet "Sổ CSKH – Hộp thư quản trị" trong Drive admin:
 *   • Lỗi app: thời gian, mã chi nhánh, phiên bản app, loại máy, câu báo lỗi (không có dữ liệu ba mẹ).
 *   • GĐ chi nhánh gửi link kho sau khi cài, để admin duyệt đưa vào danh sách chi nhánh.
 * Không nằm trên đường làm việc của nhân viên: app chi nhánh chạy bình thường dù hộp thư tắt.
 *
 * CÀI ĐẶT: dán mã → Lưu → chạy "caiDat" → Cho phép → Triển khai → Ứng dụng web ·
 * Thực thi với tư cách: Tôi · Ai có quyền truy cập: Bất kỳ ai → sao chép URL /exec gửi cho Claude để đưa vào config.js.
 */
const GOOGLE_CLIENT_ID = "__CLIENT__";

function caiDat(){
  const p = PropertiesService.getScriptProperties();
  if(!p.getProperty("SHEET_ID")){ const ss = SpreadsheetApp.create("Sổ CSKH – Hộp thư quản trị");
    const e = ss.getSheets()[0]; e.setName("Lỗi app"); e.appendRow(["Thời gian","Mã chi nhánh","Phiên bản app","Loại máy","Trang","Câu báo lỗi"]); e.setFrozenRows(1);
    const r = ss.insertSheet("Đăng ký kho"); r.appendRow(["Thời gian","Mã chi nhánh","Tên chi nhánh","Link kho","Kho trả lời","Trạng thái"]); r.setFrozenRows(1);
    p.setProperty("SHEET_ID", ss.getId()); }
  Logger.log("Sheet hộp thư: https://docs.google.com/spreadsheets/d/"+p.getProperty("SHEET_ID"));
}
function ss_(){ return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID")); }
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const cut_ = (s,n) => String(s==null?"":s).slice(0,n);
function isAdmin_(idToken){
  const r = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(idToken||""), {muteHttpExceptions:true});
  if(r.getResponseCode()!==200) return false; const t = JSON.parse(r.getContentText());
  return t.aud===GOOGLE_CLIENT_ID && String(t.email_verified)==="true" && String(t.email).toLowerCase()===String(Session.getEffectiveUser().getEmail()).toLowerCase(); }
function doGet(){ return out_({ok:true, app:"So CSKH", role:"hopthu"}); }
function doPost(e){
  try{
    const q = JSON.parse((e.postData&&e.postData.contents)||"{}"), now = new Date();
    if(q.op==="err"){ const c = CacheService.getScriptCache(), k = "n"+Math.floor(Date.now()/60000);          // chống spam: tối đa 200 lỗi/phút
      const n = Number(c.get(k)||0); if(n>200) return out_({ok:true}); c.put(k, String(n+1), 120);
      ss_().getSheetByName("Lỗi app").appendRow([now, cut_(q.b,60), cut_(q.v,20), cut_(q.d,200), cut_(q.p,200), cut_(q.m,1500)]); return out_({ok:true}); }
    if(q.op==="reg"){ const url = String(q.url||"");
      if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) throw new Error("Link kho không hợp lệ");
      let ans = ""; try{ const r = UrlFetchApp.fetch(url, {muteHttpExceptions:true, followRedirects:true}); const j = JSON.parse(r.getContentText()); ans = j.role==="kho" ? ("kho "+j.branch+" v"+j.v+(j.ready?"":" · chưa caiDat")) : "không phải kho"; }catch(err){ ans = "không mở được"; }
      ss_().getSheetByName("Đăng ký kho").appendRow([now, cut_(q.b,60), cut_(q.n,120), url, ans, "chờ duyệt"]); return out_({ok:true, check:ans}); }
    if(q.op==="list"){ if(!isAdmin_(q.idToken)) throw new Error("Chỉ admin");
      const ss = ss_(), rd = name => { const sh = ss.getSheetByName(name), n = sh.getLastRow()-1; return n>0 ? sh.getRange(2,1,n,6).getValues().map((r,i)=>({row:i+2, at:new Date(r[0]).getTime(), c:r.slice(1)})) : []; };
      return out_({ok:true, sheet:ss.getUrl(), regs:rd("Đăng ký kho").filter(x=>x.c[4]==="chờ duyệt"), errs:rd("Lỗi app").slice(-50).reverse()}); }
    if(q.op==="done"){ if(!isAdmin_(q.idToken)) throw new Error("Chỉ admin");
      const sh = ss_().getSheetByName("Đăng ký kho"); (q.rows||[]).forEach(r=>sh.getRange(Number(r),6).setValue(q.status||"đã duyệt")); return out_({ok:true}); }
    return out_({ok:false, error:"Lệnh không hợp lệ"});
  }catch(err){ return out_({ok:false, error:String(err && err.message || err)}); } }
