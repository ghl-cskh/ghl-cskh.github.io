"""p51: dùng chung app cũ và mới: (1) báo lỗi rõ khi lưu báo cáo bị từ chối và giữ lại nội dung đã nhập, (2) khung chat hết giật.
python3 p51.py vào ra"""
import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:90], s.count(a)); s = s.replace(a, b)

# ---- 1. Lưu báo cáo: trước đây "await quick()" trả về null ngay, nên nếu kho/máy chủ từ chối thì ô nhập bị làm trống mà không ai biết ----
a = s.index('async function saveDay(sid,pid,d,f){'); b = s.index('function renderTalks(l){')
s = s[:a] + '''async function saveDay(sid,pid,d,f){
  const D=S.data[sid]=S.data[sid]||{parents:[],plans:[],logs:[],att:[],trash:[]}; D.logs=D.logs||[];
  const cur=dayLogOf(sid,pid,d), now=Date.now(), id=cur?cur.id:`${pid}_${d}`; let ackP=null;
  const doc={...f,baoCao:talksPlain(f.talks),updatedAt:now,lastBy:S.me};
  if(cur){ Object.assign(cur,doc,{bys:[...new Set([...(cur.bys||[]),S.me])]});
    const extra=(cur._ids||[]).filter(x=>x!==id);
    ackP=S.db.doc(`staff/${sid}/logs/${id}`).set(doc,{merge:true});
    extra.forEach(x=>quick(S.db.doc(`staff/${sid}/logs/${x}`).update({mergedInto:id}))); cur._ids=[id]; }
  else { const full={parentId:pid,date:d,by:S.me,createdAt:now,...doc}; D.logs.push({id,...full,bys:[S.me],_ids:[id]}); ackP=S.db.doc(`staff/${sid}/logs/${id}`).set(full); }
  return {ack:ackP};          // bọc lại: hàm async mà trả thẳng một Promise sẽ nuốt mất p.ack
}
/* kho/máy chủ từ chối hoặc lưu hỏng: báo rõ và trả lại đúng những gì người dùng đã nhập (không để ô trống) */
function watchSave(ackP,d){
  const inner=ackP&&ackP.ack; Promise.resolve(inner&&inner.ack?inner.ack:inner).catch(e=>{
    const msg=`⚠ Báo cáo ngày ${fmtShort(d.day)} CHƯA lưu được${e&&e.message?" ("+e.message+")":""}. Nội dung đã giữ lại trong ô nhập, bấm Lưu để thử lại.`;
    console.warn("saveDay",e); toast(msg);
    if(S.open&&S.open.sid===d.sid&&S.open.id===d.id&&S.logDate===d.day){
      TN.forEach(([k,fid])=>{ const v=d.tn[k]; $(fid).value=v==null?"":String(v); }); $("logRep").value=d.baoCao||"";
      if(d.khMai){ $("khChk").checked=true; $("khBox").hidden=false; $("khTxt").value=d.khMai; }
      logDirty=true; $("logState").textContent=msg; $("logState").classList.add("err"); }
    S._saveErr={k:d.sid+"|"+d.id+"|"+d.day,m:msg}; });
}
''' + s[b:]
rep('''    await saveDay(sid,id,day,{tn,pyph,pyphNote,sucKhoe,hieuQua,doNhe:doNhe&&dnHas(doNhe)?doNhe:null,khMai,talks,keHoach:plansOf(sid,id,day).map(x=>x.noiDung)});
    fillLog();''','''    const ackP=await saveDay(sid,id,day,{tn,pyph,pyphNote,sucKhoe,hieuQua,doNhe:doNhe&&dnHas(doNhe)?doNhe:null,khMai,talks,keHoach:plansOf(sid,id,day).map(x=>x.noiDung)});
    watchSave(ackP,{sid,id,day,tn,baoCao,khMai});
    fillLog();''')

# thông báo lỗi lưu không bị các lần vẽ lại xoá mất; xoá khi bấm Lưu lần mới
rep('  $("logSave").textContent = "Lưu báo cáo"; $("logCancelEdit").hidden=true;',
    '  if(S._saveErr&&S._saveErr.k===S.open.sid+"|"+S.open.id+"|"+S.logDate){ $("logState").textContent=S._saveErr.m; $("logState").classList.add("err"); }\n  $("logSave").textContent = "Lưu báo cáo"; $("logCancelEdit").hidden=true;')
rep('  $("logSave").disabled=true;\n  const day=S.logDate, cur=dayLogOf(sid,id,day)','  $("logSave").disabled=true; S._saveErr=null;\n  const day=S.logDate, cur=dayLogOf(sid,id,day)')

# ---- 2. Chat hết giật ----
# 2a. ô nhập: trước đây MỖI phím gõ đều ép chiều cao về 40px rồi đo lại → khung tin nhắn co giãn liên tục. Nay chỉ đổi khi thật sự cần.
rep('function growTxt(){ const t=$("chTxt"); t.style.height="40px"; t.style.height=Math.min(t.scrollHeight,120)+"px"; }',
    '''function growTxt(){ const t=$("chTxt"), th=$("chThread"), near=th.scrollHeight-th.scrollTop-th.clientHeight<100, len=t.value.length, was=t._len||0; t._len=len; let h=t.clientHeight;
  if(t.scrollHeight>h+1) h=Math.min(t.scrollHeight,120);                                   // chữ tràn → cao thêm
  else if(len<was){ t.style.height="40px"; h=Math.min(t.scrollHeight,120); }               // xoá bớt → đo lại 1 lần
  const px=Math.max(40,h)+"px"; if(t.style.height!==px){ t.style.height=px; if(near) th.scrollTop=th.scrollHeight; } }''')
# 2b. khung chat theo bàn phím: trước đây chạy mỗi lần bàn phím/trang trượt (hàng chục lần/giây) và luôn ghi lại style → nay gộp theo khung hình, chỉ ghi khi số đo đổi
rep('function fit(){ if(sheet.hidden) return; if(deskMQ.matches||!vv){ sheet.style.top=""; sheet.style.height=""; sheet.style.bottom=""; return; } sheet.style.top=vv.offsetTop+"px"; sheet.style.height=vv.height+"px"; sheet.style.bottom="auto"; }',
    '''let _fitQ=0, _fitK="";
function fit(){ if(sheet.hidden||_fitQ) return; _fitQ=requestAnimationFrame(()=>{ _fitQ=0; if(sheet.hidden) return;
  const th=$("chThread"), near=th.scrollHeight-th.scrollTop-th.clientHeight<100;
  if(deskMQ.matches||!vv){ if(_fitK!=="d"){ _fitK="d"; sheet.style.top=""; sheet.style.height=""; sheet.style.bottom=""; } return; }
  const t=Math.round(vv.offsetTop), h=Math.round(vv.height), k=t+"|"+h; if(k===_fitK) return; _fitK=k;
  sheet.style.top=t+"px"; sheet.style.height=h+"px"; sheet.style.bottom="auto"; if(near) th.scrollTop=th.scrollHeight; }); }''')
rep('function openChat(){ ch.show=40;','function openChat(){ _fitK=""; ch.show=40;')
# 2c. vẽ lại luồng tin: giữ nguyên vị trí đang đọc khi không ở cuối (trước đây nhảy lên/xuống mỗi lần có tin mới)
rep('''  const el=$("chThread"), near=el.scrollHeight-el.scrollTop-el.clientHeight<100;
  el.innerHTML=threadHtml(); if(scroll||near) el.scrollTop=el.scrollHeight;''','''  const el=$("chThread"), fromBottom=el.scrollHeight-el.scrollTop, near=el.scrollHeight-el.scrollTop-el.clientHeight<100, html=threadHtml();
  if(!scroll && el._html===html) return;                       // không đổi gì thì khỏi dựng lại
  el._html=html; el.innerHTML=html; if(scroll||near) el.scrollTop=el.scrollHeight; else el.scrollTop=el.scrollHeight-fromBottom;''')
# 2d. nhận tin: bỏ qua lượt báo trùng (không có tin mới)
rep('ch.chat[sid]=snap.docs.map(d=>({id:d.id,...d.data()})); if(!sheet.hidden){ renderThread(false); ch.sig=sigOf(); }',
    'const nl=snap.docs.map(d=>({id:d.id,...d.data()})), key=nl.map(x=>x.id).join(","); if(ch.chat[sid]&&(ch._ck=ch._ck||{})[sid]===key) return; (ch._ck=ch._ck||{})[sid]=key; ch.chat[sid]=nl; if(!sheet.hidden){ renderThread(false); ch.sig=sigOf(); }')
# 2e. app cũ (Firebase) không có bộ đếm thay đổi: mỗi lần vẽ lại màn hình thì tăng số, khung chat chỉ tính lại khi số này đổi
rep('function renderAll(){ if(renderQ) return;','function renderAll(){ window.__sdbRev=(window.__sdbRev||0)+1; if(renderQ) return;')
open(dst, 'w').write(s); print('p51 ok')
