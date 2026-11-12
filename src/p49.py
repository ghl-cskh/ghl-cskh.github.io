"""p49: thay đổi dùng chung cho app cũ (Firebase) và app mới (v2). Chạy trên app_goc_v48.html.
python3 p3.py vào ra"""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)

# 1. Phiếu PPTN: "In phiếu" -> "Xuất file"
rep('id="pptnPrint">🖨️ In phiếu</button>', 'id="pptnPrint">📄 Xuất file</button>')
rep('Dùng In phiếu → Lưu PDF thay thế.', 'Dùng Xuất file → Lưu PDF thay thế.')

# 2. Nút Xuất hình ở Báo cáo và Kế hoạch
rep('<button class="btn ghost sm" id="xlsxBtn">Xuất file</button></div>',
    '<span style="display:flex;gap:6px"><button class="btn ghost sm" id="imgRep">🖼️ Xuất hình</button><button class="btn ghost sm" id="xlsxBtn">Xuất file</button></span></div>')
rep('<button class="btn ghost sm" id="planXlsx">Xuất Excel</button></div>',
    '<span style="display:flex;gap:6px"><button class="btn ghost sm" id="imgPlan">🖼️ Xuất hình</button><button class="btn ghost sm" id="planXlsx">Xuất Excel</button></span></div>')

# 3. Báo cáo: chỉ ba mẹ CÓ báo cáo trong ngày, xếp Ca 1 -> 13 (rồi theo tên)
rep('const keys=[...new Set([...logs,...plans].map(x=>x._sid+"|"+x.parentId))];',
    'const keys=[...new Set(logs.map(x=>x._sid+"|"+x.parentId))];')
rep('return {ten:p.tenBaMe||"",to:p.to||"",tn,talk}; }).sort((a,b)=>a.ten.localeCompare(b.ten,"vi"));',
    'return {ten:p.tenBaMe||"",to:p.to||"",tn,talk,ca:caMin(p)}; }).sort(cmpCaTen);')
rep('`${i}. Tên ba mẹ: ${r.ten||"………………………"}`', '`${i}. Tên ba mẹ: ${r.ten||"………………………"}${r.ca<99?" (Ca "+r.ca+")":""}`')

# 4. Kế hoạch: thêm cột Ca, xếp Ca 1 -> 13
a = s.index('$("planXlsx").onclick=()=>{'); b = s.index('};', a) + 2
s = s[:a] + '''function planRows(){
  const d=S.planDate, NONE="Chưa có tổ", cur=S.toF.planListTo||"";
  const plans=all("plans").filter(x=>x.date===d);
  let rows=all("parents").filter(p=>!cur||(p.to||NONE)===cur).map(p=>({ten:p.tenBaMe||"",ca:caMin(p),kh:plans.filter(x=>x._sid===p._sid&&x.parentId===p.id).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).map(x=>"• "+(x.noiDung||"")).join("\\n")}));
  if(S.planF==="no") rows=rows.filter(r=>!r.kh); if(S.planF==="yes") rows=rows.filter(r=>r.kh);
  rows.sort(cmpCaTen);
  return {d,cur,rows}; }
$("planXlsx").onclick=()=>{ const {d,cur,rows}=planRows();
  exportXlsx($("planXlsx"),`KeHoach_${fileSafe(cur||"Tat ca to")}_${d}.xlsx`,"Kế hoạch",`Kế hoạch ngày ${fmtShort(d)} – ${cur||"Tất cả tổ"}`,["Ca","Tên ba mẹ","Kế hoạch"],rows.map(r=>[r.ca<99?"Ca "+r.ca:"",r.ten,r.kh])); };
$("imgPlan").onclick=()=>{ const {d,cur,rows}=planRows();
  shotTable($("imgPlan"),`KeHoach_${fileSafe(cur||"Tat ca to")}_${d}`,`Kế hoạch ngày ${fmtShort(d)} – ${cur||"Tất cả tổ"}`,["Ca","Tên ba mẹ","Kế hoạch"],rows.map(r=>[r.ca<99?"Ca "+r.ca:"",r.ten,r.kh]),[70,220,520]); };
$("imgRep").onclick=()=>{ const d=S.repDate, toF=$("repTo").value;
  const ok=(sid,pid)=>{ const p=parentOf(sid,pid); return p && (!toF || p.to===toF) && (S.repLoai!=="bmtn" || p.loai==="tiem_nang") ? p : null; };
  const logs=all("logs").filter(l=>l.date===d && ok(l._sid,l.parentId));
  const rows=[...new Set(logs.map(x=>x._sid+"|"+x.parentId))].map(k=>{ const [sid,pid]=k.split("|"), p=parentOf(sid,pid);
    const ls=sortLogs(logs.filter(l=>l._sid===sid&&l.parentId===pid)), tn={};
    ["truocTren","truocDuoi","sauTren","sauDuoi"].forEach(f=>{ ls.forEach(l=>{ const t=tnOf(l); if(t[f]!=null&&t[f]!=="") tn[f]=t[f]; }); });
    const talk=[...new Set(ls.flatMap(l=>(l.talks&&l.talks.length?l.talks.map(t=>t.t):[l.baoCao])).flatMap(t=>String(t||"").split("\\n")).map(t=>t.trim()).filter(Boolean))];
    const f=v=>v==null||v===""||isNaN(Number(v))?"–":Number(v).toFixed(1);
    return {ten:p.tenBaMe||"",ca:caMin(p),to:p.to||"",tn:`Trước: ${f(tn.truocTren)} / ${f(tn.truocDuoi)}\\nSau: ${f(tn.sauTren)} / ${f(tn.sauDuoi)}`,talk:talk.join("\\n")}; }).sort(cmpCaTen);
  shotTable($("imgRep"),`BaoCao_${fileSafe(toF||"Tat ca to")}_${d}`,`Báo cáo ngày ${fmtShort(d)} – ${toF||"Tất cả tổ"}`,["Ca","Tên ba mẹ","Tổ","Thân nhiệt (Trên / Dưới)","Nội dung nói chuyện"],rows.map(r=>[r.ca<99?"Ca "+r.ca:"",r.ten,r.to,r.tn,r.talk]),[60,170,80,170,420]); };
''' + s[b:]

# 5. Hàm dùng chung: ca nhỏ nhất, so sánh, chụp bảng thành ảnh
helpers = r'''
/* ===== v49: xếp theo Ca 1 → 13, xuất hình bảng ===== */
const caMin=p=>{ const a=caSort(p.ca); return a.length?a[0]:99; };
const cmpCaTen=(a,b)=>(a.ca-b.ca)||String(a.ten).localeCompare(String(b.ten),"vi");
async function shotTable(btn,file,title,head,rows,widths){
  if(btn.disabled) return; const lbl=btn.textContent; btn.disabled=true; btn.textContent="Đang tạo…";
  const esc2=t=>String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
  const W=widths.reduce((a,b)=>a+b,0)+32, box=document.createElement("div");
  box.style.cssText=`position:fixed;left:-10000px;top:0;width:${W}px;background:#fff;padding:16px;font:14px/1.45 system-ui,sans-serif;color:#222`;
  box.innerHTML=`<div style="font-size:18px;font-weight:700;color:#C81E28;margin-bottom:10px">${esc2(title)}</div>`
    +`<table style="border-collapse:collapse;width:100%;table-layout:fixed"><colgroup>${widths.map(w=>`<col style="width:${w}px">`).join("")}</colgroup>`
    +`<thead><tr>${head.map(h=>`<th style="background:#C81E28;color:#fff;text-align:left;padding:6px 8px;border:1px solid #D9B8B5">${esc2(h)}</th>`).join("")}</tr></thead>`
    +`<tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td style="padding:6px 8px;border:1px solid #D9B8B5;vertical-align:top;word-wrap:break-word">${esc2(c)}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${head.length}" style="padding:10px;border:1px solid #D9B8B5;color:#777">Chưa có dữ liệu</td></tr>`}</tbody></table>`;
  document.body.appendChild(box);
  try{ const h2c=await ppLoadH2C(); const cv=await h2c(box,{scale:2,backgroundColor:"#ffffff",useCORS:true,logging:false,windowWidth:W});
    const blob=await new Promise(r=>cv.toBlob(r,"image/png")), name=file+".png", f=new File([blob],name,{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title}); }catch(e){ if(e&&e.name!=="AbortError") throw e; } }
    else { const u=URL.createObjectURL(blob), a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); toast(`Đã tải ảnh · ${rows.length} ba mẹ`); } }
  catch(e){ console.warn(e); toast("Chưa tạo được ảnh (cần mạng)"); }
  box.remove(); btn.disabled=false; btn.textContent=lbl; }
'''
k = s.index('/* ---------- Đánh dấu xử lý ---------- */')
s = s[:k] + helpers + '\n' + s[k:]

# 6. Sao lưu 23h trong Drive: xếp ba mẹ theo Ca 1 → 13 (bản nhúng trong app cũ)
old = 'items.sort((a,b)=>String(a.p.tenBaMe||\\"\\").localeCompare(String(b.p.tenBaMe||\\"\\"),\\"vi\\"));'
new = 'const cm_=p=>{ const a=(p.ca||[]).map(Number).filter(n=>n>=1&&n<=13).sort((x,y)=>x-y); return a.length?a[0]:99; }; items.sort((a,b)=>(cm_(a.p)-cm_(b.p))||String(a.p.tenBaMe||\\"\\").localeCompare(String(b.p.tenBaMe||\\"\\"),\\"vi\\"));'
print('sao luu nhung:', s.count(old))
if s.count(old)==1: s = s.replace(old, new)
open(dst, 'w').write(s)
print('p49 ok', len(s))
