/* ===== khung phủ màn hình (chat, sổ ghi chú) trên điện thoại ===== */
/* bàn phím đang mở thì trả {t,h} của vùng còn nhìn thấy; không thì null = phủ kín màn hình.
 * Không dùng số đo khi bàn phím đóng: iPhone trả số lệch / âm lúc trang bị kéo nảy. */
window.__kbBox=vv=>{ const a=document.activeElement, typing=!!a&&(a.isContentEditable||a.tagName==="TEXTAREA"||(a.tagName==="INPUT"&&!/^(checkbox|radio|button|submit|date|range|file)$/.test(a.type)));
  if(!vv||!typing||window.innerHeight-vv.height<120) return null;
  return {t:Math.max(0,Math.round(vv.offsetTop)), h:Math.round(vv.height)}; };
(function(){ const held=new Set(); let y=0;
  window.__lockPage=(key,on)=>{ const was=held.size; if(on&&window.matchMedia("(hover:none), (max-width:1024px)").matches) held.add(key); else if(!on) held.delete(key);
    const b=document.body.style;
    if(!was&&held.size){ y=window.scrollY; b.position="fixed"; b.top=-y+"px"; b.left="0"; b.right="0"; b.width="100%"; }
    else if(was&&!held.size){ b.position=b.top=b.left=b.right=b.width=""; window.scrollTo(0,y); } };
  document.addEventListener("focusout",()=>setTimeout(()=>{ if(held.size) window.scrollTo(0,0); },120));
})();
