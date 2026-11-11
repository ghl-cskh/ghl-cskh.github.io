"""v2.3 – chỉ thêm phần Hướng dẫn: bấm chữ chức vụ (Nhân viên / GĐ...) ở đầu trang -> Hướng dẫn -> bảng cách dùng.
Chạy sau p2.py:  python3 p3.py _app.html"""
import sys
f=sys.argv[1]; s=open(f).read()
HELP='''
<div id="helpModal" class="msg-modal" hidden role="dialog" aria-modal="true" aria-labelledby="helpTitle">
  <div class="msg-card help-card">
    <div class="msg-head" id="helpTitle">❓ Cách dùng Sổ CSKH (đọc 1 phút là biết)</div>
    <div class="help-body">
      <p class="help-lead">Hàng nút ở <b>dưới cùng màn hình</b> là các mục chính. Bấm vào mục nào thì trang đó hiện ra.</p>
      <dl>
        <dt>⏰ Ca tập</dt><dd>Xem hôm nay ba mẹ nào đến tập ca nào, và bấm vào ô vuông để <b>điểm danh</b> ba mẹ đã đến.</dd>
        <dt>👥 Danh sách</dt><dd>Danh sách tất cả ba mẹ. Gõ tên vào ô tìm kiếm trên cùng. <b>Bấm vào tên một ba mẹ</b> để xem thông tin và <b>viết báo cáo chăm sóc</b> cho ba mẹ đó.</dd>
        <dt>📄 Báo cáo</dt><dd>Xem các báo cáo đã viết theo từng ngày, và bấm “Xuất file” nếu cần gửi đi.</dd>
        <dt>➕ Nhập BM</dt><dd>Khi có ba mẹ mới: điền thông tin rồi bấm <b>“Lưu ba mẹ”</b>.</dd>
        <dt>📅 Kế hoạch</dt><dd>Những việc cần làm với ba mẹ trong ngày. Làm xong việc nào thì bấm vào ô vuông để tích.</dd>
        <dt>💬 Nút tròn đỏ nổi trên màn hình</dt><dd>Nút nổi trên màn hình. Bấm vào để gõ nhanh một báo cáo hoặc một vấn đề (gõ <b>@</b> để chọn ba mẹ). Có thể kéo nút đi chỗ khác.</dd>
        <dt>📖 Nhật ký</dt><dd>Ghi lại tình hình chung của cả ngày, rồi bấm <b>“Lưu sổ nhật ký”</b>.</dd>
      </dl>
      <p class="help-tip"><b>Mẹo nhỏ</b></p>
      <ul>
        <li>Gõ xong nhớ bấm nút <b>“💾 Lưu”</b>. Dòng chữ nhỏ ở đầu trang sẽ báo <b>“Đã lưu ✓”</b> là yên tâm.</li>
        <li>Lỡ tay xóa nhầm ba mẹ? Vào <b>Danh sách → Dustbin</b> để lấy lại.</li>
        <li>Bấm <b>“‹ Quay lại”</b> ở góc trên bên trái để trở về trang trước.</li>
        <li>Ô nào có chữ “chọn trong danh sách” thì chỉ cần bấm vào và chọn, không cần gõ.</li>
      </ul>
    </div>
    <div class="msg-foot"><span></span><button type="button" class="btn" id="helpOk">✅ Tôi đã hiểu</button></div>
  </div>
</div>
<div id="roleMenu" hidden style="position:fixed;z-index:2147483500;background:#fff;color:#2a1215;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.3);padding:6px"><button type="button" id="roleHelp" style="display:block;border:0;background:transparent;font:700 17px system-ui,sans-serif;padding:12px 18px;cursor:pointer;color:#9b001a;white-space:nowrap">❓ Hướng dẫn</button></div>
<script>(function(){var m=document.getElementById("helpModal"),o=document.getElementById("helpOk"),menu=document.getElementById("roleMenu"),chip=document.getElementById("roleChip");
if(!m||!chip)return;function cl(){m.hidden=true;document.body.style.overflow=""}
function hm(){menu.hidden=true;chip.setAttribute("aria-expanded","false")}
chip.setAttribute("role","button");chip.setAttribute("tabindex","0");chip.setAttribute("aria-haspopup","true");chip.setAttribute("aria-expanded","false");
function tog(e){e.stopPropagation();var r=chip.getBoundingClientRect();menu.style.top=(r.bottom+6)+"px";menu.style.left=Math.max(8,Math.min(r.left,window.innerWidth-menu.offsetWidth-8))+"px";menu.hidden=!menu.hidden;chip.setAttribute("aria-expanded",String(!menu.hidden))}
chip.addEventListener("click",tog);chip.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();tog(e)}});
document.getElementById("roleHelp").onclick=function(){hm();m.hidden=false;document.body.style.overflow="hidden";o.focus()};
document.addEventListener("click",hm);o.onclick=cl;m.addEventListener("click",function(e){if(e.target===m)cl()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){cl();hm()}});})();</script>
'''
CSS='''<style id="help-ui">
#roleChip{cursor:pointer;-webkit-tap-highlight-color:transparent}
#roleChip::after{content:" ▾"}
#helpModal{z-index:2147483600!important;background:rgba(10,0,0,.7)!important}
.help-card{max-width:560px;max-height:88vh;overflow:hidden;background:#fffdfd!important;color:#2a1215!important}
.help-card .msg-head{font-size:20px!important;color:#9b001a!important}
.help-card .msg-foot{justify-content:center}.help-card .msg-foot .btn{width:100%}
.help-body{overflow:auto;font-size:17px;line-height:1.6;color:#2a1215}
.help-body dt{font-weight:800;font-size:18px;margin-top:12px;color:#9b001a}.help-body dd{margin:2px 0 0}
.help-body ul{padding-left:22px;display:flex;flex-direction:column;gap:6px;margin:6px 0 0}
.help-lead{background:#fdeeee;padding:12px 14px;border-radius:14px;margin:0 0 4px}.help-tip{margin:16px 0 0;font-size:18px}
</style>
'''
i=s.rindex('</body>'); s=s[:i]+HELP+s[i:]
s=s.replace('<body>','<body>\n'+CSS,1)
open(f,'w').write(s); print('p3 ok')
