/* ---------- v2: KHO DỮ LIỆU CHI NHÁNH (Google Sheet trong Drive của GĐ chi nhánh) ---------- */
S.kb={msg:"", busy:false};
function backupBlock(b){ bkLoadMeta(b.id); const m=S.bk.meta[b.id], can=!!S.cnLike&&b.id===S.myBranch;
  const last=m&&m.lastAt?new Date(m.lastAt):null, fresh=last&&Date.now()-m.lastAt<30*3600e3;
  const bk=m===null?"Đang kiểm tra…":last?`${fresh?"✅":"⚠️"} ${last.toTimeString().slice(0,5)} ${fmtShort(ymd(last))}${m.nBm!=null?` · ${m.nBm} ba mẹ`:""}${fresh?"":" · quá 1 ngày chưa sao lưu"}`:"⏳ Chưa có bản sao lưu 23h nào";
  const link=`<div class="bk2-link"><span>🔗 Link riêng</span><code>${esc(brLink(b).replace(/^https?:\/\//,""))}</code><button type="button" class="btn ghost sm" data-brcopy="${esc(b.id)}">Sao chép</button></div>`;
  const acts=can?`<div class="bk2-act">${SDB.sheet?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(SDB.sheet)}" data-kbsheet>Mở Sheet dữ liệu</a>`:""}<button type="button" class="btn ghost sm" data-kbcode>Lấy lại mã kho</button><button type="button" class="btn ghost sm" data-kbimp ${S.kb.busy?"disabled":""}>${S.kb.busy?"Đang nhập…":"Nhập dữ liệu từ app cũ"}</button><input type="file" id="kbImpFile" accept=".json,application/json" hidden></div>`:"";
  const note=can?`<p class="notice">Toàn bộ dữ liệu chi nhánh nằm trong Google Sheet "Sổ CSKH – Dữ liệu ${esc(brLabel(b))}" ở Drive của <b>bạn</b>. Mỗi đêm 23h kho tự lưu thêm: mỗi ba mẹ 1 thư mục (Hồ sơ &amp; quá trình + Quá trình thực hành PPTN) và 1 bản json để khôi phục. Không ai ngoài bạn mở được các file này.</p>`:"";
  return `<div class="bk2">${link}<div class="bk2-st"><span>🗂️ Kho dữ liệu</span><b class="ok">✅ Google Sheet trong Drive GĐ chi nhánh</b></div><div class="bk2-st"><span>💾 Sao lưu tự động 23h</span><b class="${fresh?"ok":last?"warn":"off"}">${bk}</b></div>${acts}${S.kb.msg?`<p class="drv-msg">${S.kb.msg}</p>`:""}${note}</div>`; }
function kbCodeModal(){ const code=SDB.khoCode(), el=document.createElement("div"); el.className="drv-guide";
  el.innerHTML=`<div class="drv-card"><div class="drv-h"><b>Mã kho chi nhánh</b><button type="button" class="btn ghost sm" data-drvx>Đóng</button></div>
    <p class="notice">Dùng khi cần cài lại kho (ví dụ có bản kho mới). Dán đè mã vào dự án Apps Script cũ, bấm Lưu, rồi <b>Triển khai → Quản lý triển khai → ✏️ → Phiên bản mới</b>. Link kho giữ nguyên, dữ liệu không mất.</p>
    <div class="drv-act"><button type="button" class="btn sm" data-drvcode>Sao chép mã</button></div><textarea readonly class="drv-code">${esc(code)}</textarea></div>`;
  document.body.appendChild(el);
  el.addEventListener("click",async e=>{ if(e.target===el||e.target.closest("[data-drvx]")){ el.remove(); return; }
    if(e.target.closest("[data-drvcode]")){ try{ await navigator.clipboard.writeText(code); toast("Đã sao chép mã kho"); }catch(_){ const t=el.querySelector("textarea"); t.select(); document.execCommand("copy"); toast("Đã sao chép mã"); } } }); }
/* file xuất từ app cũ: {app:"So CSKH", kind:"old-export", branch:"<mã cũ>", docs:{"đường dẫn":{…}}} */
async function kbImport(file){ const txt=await file.text(); let j; try{ j=JSON.parse(txt); }catch(e){ throw new Error("File không đúng định dạng"); }
  if(!j||j.kind!=="old-export"||!j.docs) throw new Error("Đây không phải file dữ liệu từ app cũ");
  const nb=S.myBranch, ob=String(j.branch||""), ops=[];
  Object.keys(j.docs).forEach(p0=>{ let p=p0, d=Object.assign({},j.docs[p0]); const s=p.split("/");
    if(s[0]==="branches"){ if(s[1]!==ob||s.length<4) return; s[1]=nb; p=s.join("/"); }
    else if(s[0]!=="staff") return;
    if(s[0]==="staff"&&s.length===2){ if((d.chiNhanh||"")!==ob) return; d.chiNhanh=nb; }
    ops.push({path:p,data:d}); });
  if(!ops.length) throw new Error("File không có dữ liệu của chi nhánh");
  /* tổ và cài đặt của chi nhánh (app cũ để chung trong config) */
  const cf=[], t=j.docs["config/teams"]||{}, list=(t.br&&t.br[ob])||t.list;
  if(list&&list.length) cf.push({op:"set",merge:true,path:"config/teams",data:{list:list,br:{[nb]:list},updatedAt:Date.now()}});
  const st=j.docs["config/settings"]; if(st) cf.push({op:"set",merge:true,path:"config/settings",data:st});
  const bd=j.docs["branches/"+ob]; if(bd&&bd.zalo) cf.push({op:"set",merge:true,path:"branches/"+nb,data:{zalo:bd.zalo}});
  if(cf.length) await SDB.kho({op:"write",ops:cf});
  let n=0; for(let i=0;i<ops.length;i+=150){ const part=ops.slice(i,i+150); await SDB.kho({op:"import",ops:part}); n+=part.length; S.kb.msg=`Đang nhập ${n}/${ops.length} mục…`; const m=document.querySelector(".drv-msg"); if(m) m.textContent=S.kb.msg; else renderBrSheet(); }
  return ops.length; }
document.addEventListener("click",e=>{
  if(e.target.closest("[data-kbcode]")){ kbCodeModal(); return; }
  if(e.target.closest("[data-kbimp]")){ const f=$("kbImpFile"); if(f){ f.value=""; f.click(); } return; } });
document.addEventListener("change",async e=>{ if(e.target.id!=="kbImpFile"||!e.target.files[0]) return;
  if(!confirm("Nhập dữ liệu từ file của app cũ vào kho chi nhánh?\n\nDữ liệu đang có trong kho không bị xoá. Mục nào trong kho mới hơn file thì giữ bản trong kho.")) return;
  S.kb.busy=true; S.kb.msg="Đang đọc file…"; renderBrSheet();
  try{ const n=await kbImport(e.target.files[0]); S.kb.msg=`✅ Đã nhập ${n} mục. App sẽ tự mở lại.`; toast("Đã nhập xong"); setTimeout(()=>location.reload(),1500); }
  catch(err){ S.kb.msg="❌ "+esc(err.message||String(err)); }
  S.kb.busy=false; renderBrSheet(); });
