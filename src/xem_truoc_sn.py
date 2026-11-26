"""Dựng bản XEM TRƯỚC Sổ ghi chú nhanh (dữ liệu giả, kho giả trong trình duyệt). Không đụng index.html đang chạy.
Chạy:  python3 xem_truoc_sn.py   → ../../preview/so-ghi-chu/{app.html, index.html}"""
import os, shutil, subprocess, tempfile
D = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = os.path.normpath(D + '../../preview/so-ghi-chu') + '/'
os.makedirs(OUT, exist_ok=True)
t = tempfile.mkdtemp() + '/a.html'
subprocess.run(['python3', D+'p2.py', D+'app_goc_v48.html', t], check=True)
for p in ['p3.py']: subprocess.run(['python3', D+p, t], check=True)
for p in ['p49.py', 'p50.py', 'p51.py', 'p52.py', 'p53.py', 'p54.py']: subprocess.run(['python3', D+p, t, t], check=True)
s = open(t).read()

MOCK = r'''<script>
(function(){
const pad=n=>String(n).padStart(2,"0"), ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const day=n=>{ const d=new Date(); d.setDate(d.getDate()+n); return ymd(d); }, now=Date.now();
const docs=new Map(); const put=(p,d)=>docs.set(p,d);
const me="demo";
put("staff/"+me,{name:"Nhân viên Thử",email:"thu@example.test",approved:true,chucVu:"nv",chiNhanh:"demo2"});
const P=(id,ten,to,extra)=>put(`staff/${me}/parents/${id}`,Object.assign({tenBaMe:ten,to,loai:"chinh_thuc",createdAt:now-30*864e5},extra));
P("p1","Nguyễn Văn An","Tổ 1",{ca:[2],benh:[{ten:"Đau khớp gối"},{ten:"Mất ngủ"}],mongMuon:"Đi cầu thang không đau",tnBDTren:34.2,tnBDDuoi:30.5});
P("p2","Trần Thị Bích","Tổ 1",{ca:[3],benh:[{ten:"Đau lưng"}]});
P("p3","Lê Hoàng Ân","Tổ 2",{ca:[1]});
P("p4","Phạm Thu Hằng","Tổ 2",{ca:[5],mongMuon:"Ngủ ngon hơn"});
P("p5","Đỗ Minh Sĩ","Tổ 1",{ca:[2],tnBDTren:33.8,tnBDDuoi:29.9});
P("p6","Võ Thị Lan","Tổ 3",{ca:[4]});
const att=(pid,d,status,ca)=>put(`staff/${me}/att/${pid}_${d}`,{parentId:pid,date:d,status,ca:ca||0,by:me,updatedAt:now});
att("p1",day(0),"co",2); att("p5",day(0),"co",2); att("p2",day(-1),"vang"); att("p1",day(-1),"co",2);
const plan=(id,pid,d,noiDung,done)=>put(`staff/${me}/plans/${id}`,{parentId:pid,date:d,noiDung,done:!!done,by:me,createdAt:now-1e5,updatedAt:now});
plan("k1","p1",day(-1),"Hỏi thăm giấc ngủ sau buổi tập",true); plan("k2","p1",day(-1),"Hướng dẫn ngâm chân buổi tối");
plan("k3","p2",day(-3),"Gọi hỏi tình trạng đau lưng"); plan("k4","p5",day(-5),"Nhắc uống nước ấm trước khi tập",true);
plan("k5","p1",day(0),"Đo lại thân nhiệt sau tập");
put(`staff/${me}/logs/l1`,{parentId:"p1",date:day(-1),tn:{truocTren:34.8,truocDuoi:31.2,sauTren:36.1,sauDuoi:33.4},ghiChu:"Không để quạt thổi thẳng vào chân",by:me,createdAt:now-864e5});
put(`staff/${me}/notes/p1_${day(-1)}`,{parentId:"p1",date:day(-1),text:"Ưu tiên máy gần cửa sổ",by:me,updatedAt:now});
put(`staff/${me}/sonote/${day(-1)}`,{date:day(-1),text:`Ca 2 đông, chuẩn bị thêm khăn.\n⟦${me}|p1|Nguyễn Văn An⟧ ngủ ngon hơn.`,by:me,updatedAt:now-864e5});
/* dữ liệu mẫu: báo cáo hôm trước và kế hoạch cho nhiều ba mẹ */
plan("k6","p5",day(0),"Kiểm tra giấc ngủ, đo thân nhiệt trước và sau tập"); plan("k7","p5",day(-1),"Hướng dẫn thở trước khi tập",true);
put(`staff/${me}/logs/l5`,{parentId:"p5",date:day(-1),tn:{truocTren:35.9,truocDuoi:31.4,sauTren:36.6,sauDuoi:33.1},talks:[{by:me,t:"Ba ngủ được hơn, còn tê chân lúc sáng sớm",at:now-864e5}],by:me,createdAt:now-864e5});
plan("k8","p2",day(0),"Hỏi lại tình trạng đau lưng sau buổi tập");
put(`staff/${me}/logs/l2`,{parentId:"p2",date:day(-3),tn:{truocTren:36.1,sauTren:36.7},talks:[{by:me,t:"Đau lưng giảm, ngồi lâu vẫn mỏi",at:now-3*864e5}],by:me,createdAt:now-3*864e5});
put("config/teams",{list:["Tổ 1","Tổ 2","Tổ 3"]});
const SAVE="pv_docs_"+day(0);
try{ JSON.parse(localStorage.getItem(SAVE)||"[]").forEach(([p,d])=>d===null?docs.delete(p):docs.set(p,d)); }catch(e){}
const changed=new Map(); try{ JSON.parse(localStorage.getItem(SAVE)||"[]").forEach(([p,d])=>changed.set(p,d)); }catch(e){}
window.__pvPath="/xem-truoc";
window.SHEETDB={clientId:"xem-truoc",mailbox:""};
window.__pvBranches=async()=>[{id:"demo2",slug:"xem-truoc",sys:"HPL",name:"Bản xem trước",kho:"mock:kho"}];
const mem={sdb2_sess_demo2:"mock-session"}; window.__sdbSess={get:k=>mem[k]||null,set:(k,v)=>{mem[k]=v;},del:k=>{delete mem[k];}};
const who={uid:me,email:"thu@example.test",name:"Nhân viên Thử",owner:false,branch:"demo2",role:"nv",approved:true,exists:true};
let ver=1;
const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
window.__sdbMock=async(url,q)=>{
  if(q.op==="who") return {ok:true,who,ver,v:2};
  if(q.op==="ver") return {ok:true,ver:ver+1};   // lần hỏi đầu báo "có mới" để bản xem trước tải lại dữ liệu mẫu
  if(q.op==="sync"){ const colls={}; q.colls.forEach(({c})=>{ colls[c]=[...docs].filter(([p])=>p.startsWith(c+"/")&&p.split("/").length===c.split("/").length+1).map(([p,d])=>[p.slice(c.length+1),d,now]); });
    return {ok:true,now:Date.now()-60000,ver,colls}; }
  if(q.op==="write"){ const out=q.ops.map(o=>{ if(o.op==="del"){ docs.delete(o.path); return {op:"del",path:o.path}; }
      const d=o.op==="update"||o.merge?Object.assign({},docs.get(o.path),o.data):o.data; docs.set(o.path,d); return {op:"set",path:o.path,data:d}; });
    q.ops.forEach(o=>changed.set(o.path, docs.has(o.path)?docs.get(o.path):null)); try{ localStorage.setItem(SAVE,JSON.stringify([...changed])); }catch(e){}
    return {ok:true,now:ver,docs:out}; }
  return {ok:false,error:"mock"};
};
})();
</script>'''

def rep(a, b):
    global s
    assert s.count(a) == 1, (a, s.count(a)); s = s.replace(a, b)
rep('<script src="/config.js"></script>', MOCK)
rep('<base href="/">\n', '')
s = s.replace('navigator.serviceWorker.register("/sw.js")', 'Promise.resolve()').replace('src="/icon-192.png"', 'src="icon-192.png"').replace('href="/icon-192.png"', 'href="icon-192.png"')
s = s.replace('<link rel="manifest" href="/manifest.json" id="pwaManifest">', '')
open(OUT+'app.html', 'w').write(s)
shutil.copy(D+'../icon-192.png', OUT+'icon-192.png')

open(OUT+'index.html', 'w').write('''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Xem trước Sổ Ghi Chú Nhanh</title>
<style>
body{margin:0;background:#f3eeee;color:#2a1215;font:14.5px/1.55 system-ui,-apple-system,sans-serif;padding:20px 16px 40px}
h1{font-size:21px;margin:0 0 6px}p{margin:0 0 4px;max-width:820px}
.row{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start;margin-top:18px}
figure{margin:0}figcaption{font-weight:700;margin-bottom:8px}figcaption a{font-weight:500;margin-left:8px;color:#9b001a}
.dev{border:10px solid #1c1416;border-radius:38px;overflow:hidden;background:#fff;box-shadow:0 14px 34px rgba(0,0,0,.18)}
iframe{display:block;border:0}.phone iframe{width:375px;height:760px}.pad iframe{width:820px;height:760px}.pad{border-radius:28px}
table{border-collapse:collapse;margin-top:12px;background:#fff;max-width:820px;width:100%}td,th{border:1px solid #e5d5d5;padding:7px 10px;text-align:left;vertical-align:top}
</style></head><body>
<h1>Xem trước: Sổ Ghi Chú Nhanh (dữ liệu giả)</h1>
<p>Bấm nút <b>Ghi chú</b> ở góc trên của app. Tên ba mẹ, số đo đều là dữ liệu mẫu, không gửi đi đâu.</p>
<p style="background:#fff3cd;padding:8px 12px;border-radius:8px">Chế độ Bút ở đây <b>nhận dạng thật</b>: nét bạn viết được gửi tới Google. Chỉ viết nội dung thử. Dùng chuột thay bút được.</p>
<table><tr><th>Thử</th><th>Kết quả mong đợi</th></tr>
<tr><td>Gõ <b>@an</b></td><td>Ra Nguyễn Văn An (đã đến hôm nay, đứng đầu) và Lê Hoàng Ân</td></tr>
<tr><td>Bấm thẻ <b>@tên</b></td><td>Điện thoại: bảng trượt từ dưới. iPad: ngăn bên phải</td></tr>
<tr><td>Gắn <b>@bich</b> rồi bấm thẻ</td><td>Hôm qua vắng nên lấy kế hoạch lần gần nhất</td></tr>
<tr><td>Nút <b>‹</b> cạnh ngày</td><td>Xem ghi chú hôm qua (chỉ đọc)</td></tr>
<tr><td>Bấm <b>Bút</b>, bấm <b>Đồng ý</b>, viết trên một hàng rồi ngừng khoảng 1,3 giây</td><td>Nét biến mất, chữ in hiện đúng hàng đó</td></tr>
<tr><td>Viết <b>@Lan</b></td><td>Đọc đúng thì thành thẻ; bấm thẻ mở bảng thông tin</td></tr>
<tr><td>Viết <b>@</b> kèm tên viết sai một chút</td><td>Hiện popup gợi ý để chạm chọn</td></tr></table>
<div class="row">
<figure class="phone"><figcaption>Điện thoại 375px <a href="app.html" target="_blank">mở riêng ↗</a></figcaption><div class="dev phone"><iframe src="app.html" title="Điện thoại"></iframe></div></figure>
<figure class="pad"><figcaption>iPad 820px</figcaption><div class="dev pad"><iframe src="app.html" title="iPad"></iframe></div></figure>
</div></body></html>''')
print('Xem trước:', OUT + 'index.html')
