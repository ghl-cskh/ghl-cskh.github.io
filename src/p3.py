"""v2.2 – "Cực kỳ dễ dùng": đổi chữ đời thường, nút to có chữ, hướng dẫn tại chỗ.
Chạy sau p2.py:  python3 p3.py _app.html   (ghi đè chính file đó)
Chỉ đổi chữ hiển thị + thêm CSS/HTML; không đổi logic dữ liệu."""
import sys, re
f = sys.argv[1]
s = open(f).read()
miss = []
def rep(a, b, cnt=None):
    global s
    n = s.count(a)
    if n == 0 or (cnt is not None and n != cnt):
        miss.append((a[:70], n)); 
        if n == 0: return
    s = s.replace(a, b)
def rx(p, r, flags=0):
    global s
    s, n = re.subn(p, r, s, flags=flags)
    if n == 0: miss.append((p[:70], 0))

body0 = s.index('<body>')
head, s = s[:body0], s[body0:]

# ---------- 1. Thanh trên cùng: nút có chữ ----------
rep('<span class="lbl">Zalo</span>', '<span class="lbl">Nhóm Zalo</span>')
rep('<span class="lbl">Chụp</span>', '<span class="lbl">Chụp hình</span>')
rep('<span class="lbl">Thoát</span>', '<span class="lbl">Đăng xuất</span>')
rep('title="Thông điệp từ GĐ Chi nhánh">📣</button>', 'title="Thông báo từ Giám đốc chi nhánh">📣<span class="lbl">Thông báo</span></button>')
rep('<div class="top-acts">', '<div class="top-acts"><button type="button" class="zalo-grp help-btn" id="helpBtn" aria-label="Xem hướng dẫn sử dụng">❓<span class="lbl">Hướng dẫn</span></button>', 1)
rep('id="brBtn" hidden>Chi nhánh</button>', 'id="brBtn" hidden>🏢 Các chi nhánh</button>')
rep('id="staffBtn">Nhân sự</button>', 'id="staffBtn">👥 Quản lý nhân viên</button>')
rep('<label for="scopeSel" class="sr-only">Xem dữ liệu của</label>', '<label for="scopeSel" class="scope-lab">Đang xem sổ của:</label>')

# ---------- 2. Đăng nhập / mở đầu ----------
rep('<p class="notice">Đăng nhập bằng tài khoản Google (Gmail) của bạn. Mỗi nhân viên dùng tài khoản riêng.</p>',
    '<ol class="steps"><li>Bấm nút <b>“Đăng nhập bằng Google”</b> ở bên dưới.</li><li>Chọn <b>Gmail của bạn</b> trong danh sách hiện ra.</li><li>Xong! Sổ sẽ tự mở. Mỗi nhân viên dùng Gmail riêng của mình.</li></ol>')
rep('<button class="btn" id="gLogin">Đăng nhập bằng Google</button>', '<button class="btn" id="gLogin">🔑 Đăng nhập bằng Google</button>')
rep('<b>Bạn đang mở link trong Zalo/Facebook.</b> Google không cho đăng nhập ở đây.\n      Hãy bấm <b>⋯</b> (góc trên) → <b>Mở bằng trình duyệt</b> (Safari/Chrome), hoặc sao chép link rồi dán vào Safari/Chrome.',
    '<b>Bạn đang mở trong Zalo hoặc Facebook, nên chưa đăng nhập được.</b><br>Cách làm: bấm dấu <b>⋯</b> ở góc trên màn hình → chọn <b>“Mở bằng trình duyệt”</b> (Safari hoặc Chrome). Hoặc bấm nút bên dưới để chép địa chỉ rồi dán vào Safari/Chrome.')
rep('>Sao chép link app</button>', '>📋 Chép địa chỉ app</button>')
rep('<h2>Thiết lập lần đầu</h2>', '<h2>Mở sổ lần đầu tiên</h2>')
rep('<p class="notice">Sổ chưa có Giám đốc. Tài khoản đăng nhập đầu tiên sẽ là tài khoản Giám đốc, xem được dữ liệu của tất cả nhân viên.</p>',
    '<p class="notice">Sổ này chưa có Giám đốc. Nếu bạn là Giám đốc, bấm nút bên dưới. Bạn sẽ xem được thông tin của tất cả nhân viên. <b>Nếu bạn là nhân viên, đừng bấm — hãy nhờ Giám đốc mở sổ trước.</b></p>')
rep('<h2>Chào bạn</h2>', '<h2>Chào mừng bạn! Hãy cho biết tên bạn</h2>')
rep('<p class="notice">Nhập tên hiển thị của bạn. Giám đốc sẽ thấy dữ liệu của bạn dưới tên này.</p>', '<p class="notice">Gõ tên của bạn vào ô bên dưới. Giám đốc sẽ thấy công việc của bạn dưới tên này.</p>')
rep('<button class="btn" id="saveName">Bắt đầu dùng</button>', '<button class="btn" id="saveName">✅ Lưu tên và bắt đầu</button>')
rep('<button class="btn" id="claimBtn">Tôi là Giám đốc</button>', '<button class="btn" id="claimBtn">👤 Tôi là Giám đốc</button>')
rep('<h3>Nhân viên chờ duyệt</h3>', '<h3>Nhân viên đang xin vào sổ (cần bạn đồng ý)</h3>')
rep('<span>Chi nhánh bạn làm việc</span>', '<span>Bạn làm ở chi nhánh nào? (chọn trong danh sách)</span>')
rep('<span>Tên của bạn</span>', '<span>Tên của bạn</span>')
rep('placeholder="VD: Nguyễn Thu Hà"', 'placeholder="Gõ họ và tên, ví dụ: Nguyễn Thu Hà"')

# ---------- 3. Thanh tab dưới cùng ----------
rep('<span>Ca</span></button>', '<span>Ca tập</span></button>')
rep('<span>Danh sách</span></button>', '<span>Ba mẹ</span></button>')
rep('<span>Nhập BM</span></button>', '<span>Thêm mới</span></button>')

# ---------- 4. Tab Ba mẹ ----------
rep('data-lv="ph" aria-pressed="false">Phục hồi</button>', 'data-lv="ph" aria-pressed="false">Đã phục hồi</button>')
rep('<h2>Danh sách ba mẹ</h2>', '<h2>Tất cả ba mẹ</h2>')
rep('↕️ Sắp xếp</button>', '↕️ Đổi thứ tự</button>')
rep('Dustbin', 'Thùng rác')
rep('>Thùng rác<span id="binCount">', '>Thùng rác (ba mẹ đã xóa) <span id="binCount">')
rx(r'placeholder="(?:Gõ|Tìm) tên ba mẹ \(vd: Sĩ, Hằng\) hoặc SĐT…"', 'placeholder="🔍 Gõ tên hoặc số điện thoại để tìm ba mẹ…"')
rep('Đang chế độ sắp xếp: dùng nút ↑ ↓ để di chuyển ba mẹ.', 'Bạn đang đổi thứ tự: bấm nút “↑ Lên” hoặc “↓ Xuống” cạnh tên ba mẹ để di chuyển.')
rep('<p class="notice">Ba mẹ đã có PƯPH. Bấm vào ba mẹ để xem tất cả PƯPH từ trước đến nay.</p>', '<p class="notice">Đây là những ba mẹ đã có phản ứng phục hồi (PƯPH). Bấm vào tên ba mẹ để xem lại tất cả từ trước đến nay.</p>')
rep('>Điểm danh</button>', '>✔️ Điểm danh</button>')

# ---------- 5. Tab Báo cáo / Kế hoạch ----------
rep('id="xlsxBtn">Xuất file</button>', 'id="xlsxBtn">📥 Tải file về máy</button>')
rep('id="planXlsx">Xuất Excel</button>', 'id="planXlsx">📥 Tải file Excel</button>')
rep('data-rv="day" aria-pressed="true">Theo ngày</button>', 'data-rv="day" aria-pressed="true">📅 Xem từng ngày</button>')
rep('data-rv="staff" aria-pressed="false">Thống kê</button>', 'data-rv="staff" aria-pressed="false">📊 Tổng hợp</button>')
rep('<span>Khoảng thời gian</span>', '<span>Xem trong khoảng thời gian nào? (chọn trong danh sách)</span>')
rep('<span>Lọc theo tổ</span>', '<span>Chọn tổ cần xem (chọn trong danh sách)</span>')
rep('data-rl="bmtn" aria-pressed="false">BMTN</button>', 'data-rl="bmtn" aria-pressed="false">Chỉ ba mẹ tiềm năng</button>')
rep('data-rl="all" aria-pressed="true">Tất cả</button>', 'data-rl="all" aria-pressed="true">Tất cả ba mẹ</button>')
rep('data-pf="no" aria-pressed="false">Chưa lên kế hoạch</button>', 'data-pf="no" aria-pressed="false">Chưa có kế hoạch</button>')
rep('data-pf="yes" aria-pressed="false">Đã lên kế hoạch</button>', 'data-pf="yes" aria-pressed="false">Đã có kế hoạch</button>')
rep('<h2>Kế hoạch mỗi ngày</h2>', '<h2>Kế hoạch từng ngày</h2>')
rep('<button type="button" data-pq="0">Hôm nay</button><button type="button" data-pq="1">Ngày mai</button>', '<button type="button" data-pq="0">📅 Xem hôm nay</button><button type="button" data-pq="1">📅 Xem ngày mai</button>')
# mũi tên ngày → có chữ
for a, b in (('aPrev','Ngày trước'),('rPrev','Ngày trước'),('dPrev','Ngày trước')):
    rx(r'<button class="btn ghost" id="%s" aria-label="Ngày trước">‹</button>' % a, '<button class="btn ghost" id="%s" aria-label="Ngày trước">‹ Hôm trước</button>' % a)
for a in ('aNext','rNext','dNext'):
    rx(r'<button class="btn ghost" id="%s" aria-label="Ngày sau">›</button>' % a, '<button class="btn ghost" id="%s" aria-label="Ngày sau">Hôm sau ›</button>' % a)
rep('<input type="date" id="nkDate" aria-label="Chọn ngày">', '<input type="date" id="nkDate" aria-label="Chọn ngày khác" title="Bấm để chọn ngày khác">')
rep('<button type="button" class="btn" id="nkSave">💾 Lưu sổ nhật ký</button>', '<button type="button" class="btn" id="nkSave">💾 Lưu sổ nhật ký</button>')
rep('data-nkday="-1">Hôm qua</button>', 'data-nkday="-1">⏪ Hôm qua</button>')
rep('data-nkday="0">Hôm nay</button>', 'data-nkday="0">📅 Hôm nay</button>')
rep('data-nkday="1">Ngày mai</button>', 'data-nkday="1">Ngày mai ⏩</button>')
rep('SLKH', 'Số ba mẹ')
rep('>TN thân trên<', '>Thân trên<'); rep('>TN thân dưới<', '>Thân dưới<')

# ---------- 6. Form nhập ba mẹ: gợi ý ngay tại ô ----------
rep('<h2 id="formTitle">Nhập thông tin ba mẹ</h2>', '<h2 id="formTitle">Thêm ba mẹ mới</h2></div><p class="notice form-intro">Điền các ô bên dưới rồi bấm nút <b>“Lưu ba mẹ”</b> ở cuối trang. Ô nào có dấu <b class="req">*</b> là <b>bắt buộc</b>, các ô khác có thể bỏ trống và bổ sung sau.</p><div hidden>')
H = lambda t: '<em class="hint">%s</em>' % t
rx(r'(<input id="fTen"[^>]*>)', r'\1' + H('Gõ họ tên đầy đủ, ví dụ: Cô Trần Mai Anh'))
rx(r'(<input id="fSdt"[^>]*>)', r'\1' + H('Gõ liền các số, không cách. Ví dụ: 0901234567'))
rx(r'(<input id="fNs" type="date">)', r'\1' + H('Bấm vào ô rồi chọn ngày, tháng, năm'))
rx(r'(<input id="fSdtNt"[^>]*>)', r'\1' + H('Số của con/cháu để liên lạc khi cần'))
rx(r'(<input id="fTap" type="date">)', r'\1' + H('Bấm vào ô rồi chọn ngày'))
rep('<span>Người lấy thông tin</span>', '<span>Ai là người nhập thông tin này? (chọn trong danh sách)</span>')
rep('<span>Tổ</span><select id="fTo"><option value="">Chọn tổ</option></select>', '<span>Tổ (chọn trong danh sách)</span><select id="fTo"><option value="">— Bấm để chọn tổ —</option></select>')
rep('<span>Giới tính</span>', '<span>Giới tính (bấm chọn 1 ô)</span>')
rep('>Đặt tên các tổ</button>', '>⚙️ Thêm hoặc xóa tổ</button>')
rep('<span>BM hướng dẫn</span>', '<span>Ba mẹ nào hướng dẫn?</span>')
rep('placeholder="Tên ba mẹ hướng dẫn"', 'placeholder="Gõ tên người đã hướng dẫn (nếu có)"')
rep('<span>⭐ MONG MUỐN KHI ĐẾN VỚI PPTN</span>', '<span>⭐ Ba mẹ mong muốn điều gì khi đến tập?</span>')
rep('<span>SĐT người thân</span>', '<span>Số điện thoại người thân</span>')
rep('<span>Quan hệ</span>', '<span>Người thân là ai của ba mẹ?</span>')
rep('placeholder="VD: Con gái, Vợ, Chồng…"', 'placeholder="Ví dụ: Con gái, Vợ, Chồng…"')
rep('<span>Thiết bị ba mẹ đang có</span>', '<span>Ba mẹ đang có dụng cụ nào? (bấm “Thêm” sau khi gõ hoặc chọn)</span>')
rep('>+ Thêm</button>', '>➕ Thêm</button>')
rep('<span aria-hidden="true" style="font-size:20px;line-height:1;vertical-align:-2px">+</span> Thêm bệnh', '<span aria-hidden="true" style="font-size:20px;line-height:1;vertical-align:-2px">➕</span> Thêm một bệnh')
rep('id="formCancel" hidden>Hủy sửa</button>', 'id="formCancel" hidden>↩️ Không sửa nữa</button>')
rep('<button type="submit" class="btn" id="formSave">Lưu ba mẹ</button>', '<button type="submit" class="btn" id="formSave">💾 Lưu ba mẹ</button>')
rep('<span>Nhân viên chờ</span>', '<span>Nhân viên chờ</span>')
rep('<span>📸 Hình ba mẹ</span>', '<span>📸 Ảnh ba mẹ (bấm “Chụp ảnh” để chụp)</span>')
rep('<span>Nách (°C)</span>', '<span>Nách (°C)</span>')

# ---------- 7. Trang chi tiết ba mẹ ----------
rep('id="dEdit">Sửa thông tin</button>', 'id="dEdit">✏️ Sửa thông tin</button>')
rep('id="dReassign" hidden>Giao cho nhân viên khác</button>', 'id="dReassign" hidden>🔁 Giao cho nhân viên khác</button>')
rep('id="dDel">Xóa</button>', 'id="dDel">🗑 Xóa ba mẹ</button>')
rep('📋 QUÁ TRÌNH THỰC HÀNH PPTN</button>', '📋 Xem quá trình thực hành PPTN</button>')
rep('<h3>Báo cáo chăm sóc</h3>', '<h3>✍️ Viết báo cáo chăm sóc hôm nay</h3>')
rep('<span>Ngày</span><input type="date" id="logDate">', '<span>Báo cáo cho ngày nào?</span><input type="date" id="logDate">')
rep('<span>Nội dung nói chuyện của bạn</span>', '<span>Bạn đã nói chuyện gì với ba mẹ?</span>')
rep('placeholder="Ba mẹ phản ánh gì? Có biểu hiện gì? Đã xử lý ra sao?"', 'placeholder="Gõ ngắn gọn: ba mẹ nói gì, có gì khác lạ, bạn đã làm gì…"')
rep('<input type="checkbox" id="pyphChk"> PƯPH (nếu có)', '<input type="checkbox" id="pyphChk"> Có phản ứng phục hồi (PƯPH)? Bấm vào ô để ghi')
rep('<span>Nội dung PƯPH</span>', '<span>Ghi lại phản ứng phục hồi</span>')
rep('<input type="checkbox" id="skChk"> 💚 Độ nhẹ (nếu có)', '<input type="checkbox" id="skChk"> 💚 Có đo “độ nhẹ” không? Bấm vào ô để ghi')
rep('<input type="checkbox" id="khChk"> 📅 Kế hoạch ngày mai (nếu có)', '<input type="checkbox" id="khChk"> 📅 Có việc cần làm ngày mai không? Bấm vào ô để ghi')
rep('Mỗi dòng là một việc, tự thêm vào tab Kế hoạch ngày mai', 'Mỗi dòng là một việc. Sẽ tự hiện bên mục Kế hoạch')
rep('id="logCancelEdit" hidden>Hủy sửa</button>', 'id="logCancelEdit" hidden>↩️ Không sửa nữa</button>')
rep('<button class="btn" id="logSave">Lưu báo cáo</button>', '<button class="btn" id="logSave">💾 Lưu báo cáo</button>')
rep('<span>Thân nhiệt (°C)</span>', '<span>🌡 Đo thân nhiệt (°C) — gõ số, ví dụ 36.5</span>')
rep('<span>Kế hoạch đã soạn</span>', '<span>Việc đã lên kế hoạch cho ba mẹ này</span>')
rep('<h3>Diễn biến thân nhiệt</h3>', '<h3>📈 Thân nhiệt thay đổi thế nào?</h3>')
rep('<h3>Quá trình thực hành PPTN</h3>', '<h3>📖 Những lần chăm sóc trước đây</h3>')
rep('<span>Giao ba mẹ này cho nhân viên</span>', '<span>Giao ba mẹ này cho ai? (chọn trong danh sách)</span>')
rep('id="raCancel">Hủy</button>', 'id="raCancel">↩️ Không giao nữa</button>')
rep('id="raGo">Giao lại</button>', 'id="raGo">✅ Giao cho người này</button>')
# bảng tab chụp ảnh / thùng rác
rep('<h2>Thùng rác · Ba mẹ đã xóa</h2>', '<h2>🗑 Thùng rác · Ba mẹ đã xóa</h2>')
rep('Bấm <b>Thêm</b> để đưa ba mẹ trở lại Danh sách BM.', 'Bấm nút <b>“Đưa trở lại”</b> để ba mẹ quay về danh sách.')
rep('data-binadd="${esc(p._sid)}|${esc(p.id)}">Thêm</button>', 'data-binadd="${esc(p._sid)}|${esc(p.id)}">↩️ Đưa trở lại</button>')
rep('<h2>📸 App chụp hình của tôi</h2>', '<h2>📸 Chọn ứng dụng chụp hình</h2>')
rep('id="camClear">Bỏ app</button>', 'id="camClear">✖ Bỏ ứng dụng</button>')
rep('id="camSave">Lưu</button>', 'id="camSave">💾 Lưu lại</button>')
# xóa ba mẹ
rep('<div class="msg-head">🗑 Xóa ba mẹ · <span id="delName"></span></div>', '<div class="msg-head">🗑 Bạn muốn xóa: <span id="delName"></span></div>')
rep('Vì sao xóa? Chọn 1 lý do để các chi nhánh khác (nếu ba mẹ này cũng từng ở đó) biết.', 'Vì sao xóa? Bấm chọn 1 lý do bên dưới. (Ba mẹ chỉ chuyển vào Thùng rác, vẫn lấy lại được.)')
rep('id="delCancel">Hủy</button>', 'id="delCancel">↩️ Không xóa</button>')
rep('id="delGo" disabled>Xóa</button>', 'id="delGo" disabled>🗑 Xóa</button>')
rep('id="msgModalOk">Đã đọc</button>', 'id="msgModalOk">✅ Tôi đã đọc</button>')
rep('id="dupCancel">Để sau</button>', 'id="dupCancel">↩️ Để sau</button>')
rep('id="dupGo">Vẫn tạo</button>', 'id="dupGo">✅ Vẫn tạo mới</button>')
rep('id="pptnPrint">🖨️ In phiếu</button>', 'id="pptnPrint">🖨️ In phiếu ra giấy</button>')
rep('id="pptnImg">🖼️ Xuất ảnh</button>', 'id="pptnImg">🖼️ Lưu thành ảnh</button>')
rep('id="updGo">Cập nhật ngay</button>', 'id="updGo">🔄 Bấm để cập nhật</button>')
rep('<span>Đã có bản app mới</span>', '<span>Có bản app mới, bấm nút để dùng bản mới</span>')

# ---------- 8. Nút chỉ có biểu tượng trong phần JS vẽ ra ----------
rep('aria-label="Di chuyển lên">↑</button>', 'aria-label="Di chuyển lên">↑ Lên</button>')
rep('aria-label="Di chuyển xuống">↓</button>', 'aria-label="Di chuyển xuống">↓ Xuống</button>')
rep('aria-label="Bỏ ảnh">✕</button>', 'aria-label="Bỏ ảnh">✕ Bỏ ảnh</button>')
rx(r'(aria-label="Xóa \$\{esc\(t\)\}">)×(</button>)', r'\1× Xóa\2')
rx(r'(aria-label="Bỏ \$\{esc\(t\)\}">)×(</button>)', r'\1× Bỏ\2')
rep('aria-label="Gửi báo cáo"><svg', 'aria-label="Gửi báo cáo"><b class="ch-send-t">Gửi</b><svg')
rep('data-phdel="${kind}|${scope}" aria-label="Bỏ ảnh">', 'data-phdel="${kind}|${scope}" aria-label="Bỏ ảnh">')
# nút Quay lại: mũi tên + chữ
rx(r'(<button class="back" id="\w+" aria-label="Quay lại"><svg[^>]*>.*?</svg>)(</button>)', r'\1<span class="back-t">Quay lại</span>\2')
# thông điệp
rep('Thông điệp từ GĐ Chi nhánh', 'Thông báo từ Giám đốc chi nhánh')
rep('GĐ Chi nhánh', 'Giám đốc chi nhánh'); rep('GĐ chi nhánh', 'Giám đốc chi nhánh')
rep('Đã chuyển "+p.tenBaMe+" vào Thùng rác', 'Đã chuyển "+p.tenBaMe+" vào Thùng rác (có thể lấy lại)')

# ---------- 9. Khung hướng dẫn ----------
HELP = '''
<div id="helpModal" class="msg-modal" hidden role="dialog" aria-modal="true" aria-labelledby="helpTitle">
  <div class="msg-card help-card">
    <div class="msg-head" id="helpTitle">❓ Cách dùng Sổ CSKH (đọc 1 phút là biết)</div>
    <div class="help-body">
      <p class="help-lead">Hàng nút to ở <b>dưới cùng màn hình</b> là các mục chính. Bấm vào mục nào thì trang đó hiện ra.</p>
      <dl>
        <dt>⏰ Ca tập</dt><dd>Xem hôm nay ba mẹ nào đến tập ca nào, và bấm vào ô vuông để <b>điểm danh</b> ba mẹ đã đến.</dd>
        <dt>👥 Ba mẹ</dt><dd>Danh sách tất cả ba mẹ. Gõ tên vào ô tìm kiếm trên cùng. <b>Bấm vào tên một ba mẹ</b> để xem thông tin và <b>viết báo cáo chăm sóc</b> cho ba mẹ đó.</dd>
        <dt>📄 Báo cáo</dt><dd>Xem các báo cáo đã viết theo từng ngày, và bấm “Tải file về máy” nếu cần gửi đi.</dd>
        <dt>➕ Thêm mới</dt><dd>Khi có ba mẹ mới: điền thông tin rồi bấm <b>“Lưu ba mẹ”</b>.</dd>
        <dt>📅 Kế hoạch</dt><dd>Những việc cần làm với ba mẹ trong ngày. Làm xong việc nào thì bấm vào ô vuông để tích.</dd>
        <dt>💬 Nút tròn đỏ “Báo cáo nhanh”</dt><dd>Nút nổi trên màn hình. Bấm vào để gõ nhanh một báo cáo hoặc một vấn đề (gõ <b>@</b> để chọn ba mẹ). Có thể kéo nút đi chỗ khác.</dd>
        <dt>📖 Nhật ký</dt><dd>Ghi lại tình hình chung của cả ngày, rồi bấm <b>“Lưu sổ nhật ký”</b>.</dd>
      </dl>
      <p class="help-tip"><b>Mẹo nhỏ</b></p>
      <ul>
        <li>Gõ xong nhớ bấm nút <b>“💾 Lưu”</b>. Dòng chữ nhỏ ở đầu trang sẽ báo <b>“Đã lưu ✓”</b> là yên tâm.</li>
        <li>Lỡ tay xóa nhầm ba mẹ? Vào <b>Ba mẹ → Thùng rác</b> để lấy lại.</li>
        <li>Bấm <b>“‹ Quay lại”</b> ở góc trên bên trái để trở về trang trước.</li>
        <li>Ô nào có chữ “chọn trong danh sách” thì chỉ cần bấm vào và chọn, không cần gõ.</li>
      </ul>
    </div>
    <div class="msg-foot"><span></span><button type="button" class="btn" id="helpOk">✅ Tôi đã hiểu</button></div>
  </div>
</div>
<script>(function(){var m=document.getElementById("helpModal"),b=document.getElementById("helpBtn"),o=document.getElementById("helpOk");
if(!m||!b)return;function cl(){m.hidden=true;document.body.style.overflow=""}
b.onclick=function(){m.hidden=false;document.body.style.overflow="hidden";o.focus()};o.onclick=cl;
m.addEventListener("click",function(e){if(e.target===m)cl()});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!m.hidden)cl()});})();</script>
'''
i = s.rindex('</body>')
# chèn trước <script> chính để nút có sẵn; dùng cuối body (DOM đã đủ)
s = s[:i] + HELP + s[i:]

# ---------- 10. CSS: chữ to, nút to, tương phản cao ----------
CSS = '''<style id="easy-ui">
/* ===== v2.2 Cực kỳ dễ dùng ===== */
html{-webkit-text-size-adjust:100%}
body{font-size:17px;line-height:1.55}
h2{font-size:22px!important} h3{font-size:19px}
.sec-head h2{font-size:23px!important}
.field{gap:7px}
.field>span,.field span:first-child{font-size:16px!important;font-weight:700!important;color:var(--ink)!important}
.field>span small{font-size:14px;font-weight:500;color:var(--muted)}
input,select,textarea{font-size:18px!important;min-height:54px!important;border-width:2px!important;border-radius:14px!important}
textarea{min-height:96px!important}
input[type=checkbox],input[type=radio]{width:26px!important;height:26px!important;min-height:0!important;flex:none}
.pyph-chk{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:600;padding:12px 14px;background:var(--accent-soft);border-radius:14px;cursor:pointer}
.gt-pick label,.ca-pick label{font-size:17px;min-height:52px}
.hint{display:block;margin-top:5px;font-style:normal;font-size:14.5px;color:var(--muted);line-height:1.4}
.form-intro{background:var(--accent-soft);border-radius:14px;padding:12px 14px;color:var(--ink)!important;margin:0}
.notice{font-size:15.5px!important;line-height:1.55;color:var(--ink)}
.notice.err{color:var(--warm)!important;font-weight:700}
.count{font-size:15px!important}
.steps{margin:0;padding-left:26px;font-size:17px;line-height:1.7;display:flex;flex-direction:column;gap:6px}
.steps li::marker{font-weight:800;color:var(--accent)}
/* nút to, rõ */
.btn{min-height:56px!important;font-size:18px!important;font-weight:700!important;padding:12px 22px!important;letter-spacing:0}
.btn.sm{min-height:48px!important;font-size:16px!important;padding:9px 16px!important}
.btn.line{border-width:2px!important;color:var(--ink)}
.btn.danger{border:2px solid var(--warm)!important}
.btn:active{transform:scale(.98)}
.actions{gap:12px}
.actions .btn{flex:1}
.seg button{min-height:52px!important;font-size:16px!important;line-height:1.25}
.seg.sm button{min-height:46px!important;font-size:15px!important}
.seg-mini button{min-height:44px;font-size:15px!important;padding:8px 14px!important}
.seg[aria-label="Chế độ xem"] button{font-size:15.5px!important;white-space:normal!important}
.pl-quick button,.nk-day{min-height:48px;font-size:16px!important;font-weight:700}
.datebar{gap:8px}
.datebar .btn{width:auto!important;padding:0 14px!important;min-height:54px!important;font-size:16px!important;white-space:nowrap}
.datebar input{min-width:0}
/* thanh trên: nút có chữ, không bị ẩn */
.top{position:static!important}
.top-row{flex-wrap:wrap!important;gap:10px!important}
.brand-wrap{flex:1 1 100%!important}
.brand-t{font-size:22px}
#whoami{font-size:15px!important}
.top-acts{flex:1 1 100%!important;flex-wrap:wrap;gap:8px!important}
.top-acts .zalo-grp,.top-acts .out-btn,.top-acts .msg-btn{min-height:44px!important;font-size:14.5px!important;padding:0 12px!important;border-radius:99px;width:auto!important;display:inline-flex!important;align-items:center;gap:6px;font-weight:700}
.top-acts .lbl,.top-acts #camApp .lbl,.top-acts #zaloGrp .lbl,.top-acts .out-btn .lbl{display:inline!important}
.top-acts #zaloGrp svg{display:inline!important}
.top-acts [hidden],.scope [hidden],.sheet-head [hidden],.tabs [hidden]{display:none!important}
.msg-btn{background:#fff!important;color:#7a1020!important;border:0}
.msg-btn .lbl{font-size:15px}
.help-btn{background:#fff!important;color:#7a1020!important}
.scope{flex-wrap:wrap;gap:8px!important}
.scope .btn{min-height:48px!important;font-size:16px!important;flex:1 1 auto}
.scope-lab{display:block;font-size:15px;font-weight:700;color:var(--hdr-ink);flex:1 1 100%}
.scope select{flex:1 1 100%!important;width:100%!important;max-width:none!important}
.scope select[hidden]+*,.scope-lab[hidden]{display:none}
/* thanh tab dưới: chữ to + biểu tượng */
.tabs{grid-auto-flow:column;grid-template-columns:none!important;grid-auto-columns:1fr;left:8px!important;right:8px!important;padding:6px 2px!important}
.tab{font-size:13px!important;font-weight:700!important;padding:4px 1px!important;gap:2px!important;min-height:58px;justify-content:center}
.tab svg{width:30px!important;height:28px!important}
.tab span{white-space:nowrap}
body{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important}
/* nút quay lại có chữ */
.sheet-head .back,.back{width:auto!important;height:48px!important;padding:0 16px 0 10px!important;display:inline-flex!important;align-items:center;gap:4px;font-size:17px;font-weight:700;border-radius:99px!important}
.back-t{font-size:17px;font-weight:700}
.sheet-head h2{font-size:20px!important}
.sheet-head{flex-wrap:wrap}
/* nút gửi chat */
.ch-send{width:auto!important;padding:0 16px!important;display:inline-flex;align-items:center;gap:6px;border-radius:99px}
.ch-send-t{font-size:16px}
/* nút nhỏ trong danh sách */
.to-chip button{width:auto!important;min-width:44px;padding:0 10px;font-size:15px;font-weight:700}
.ph-del{width:auto!important;padding:0 12px!important;font-size:15px!important;font-weight:700}
[data-mv]{min-width:78px!important}
.row{min-height:64px}
.row-title{font-size:18px}
.chip,.chips>*{font-size:15px}
.toast{font-size:17px!important;padding:14px 18px!important}
.drv-chip{font-size:14px!important;padding:3px 10px!important}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #f5a000!important;outline-offset:2px}
.ch-fab::after{content:"Báo cáo nhanh";position:absolute;top:100%;right:0;margin-top:5px;white-space:nowrap;background:#fff;color:#7a1020;font:700 13.5px/1.2 system-ui,sans-serif;padding:4px 10px;border-radius:99px;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none}
@media (max-width:520px){.grid2,.grid2.keep2{grid-template-columns:1fr!important}}
/* khung hướng dẫn */
#helpModal{z-index:2147483600!important;background:rgba(10,0,0,.7)!important}
.help-card{max-width:560px;max-height:88vh;overflow:hidden;background:#fffdfd!important;color:#2a1215!important;border-radius:22px 22px 0 0!important}
.help-card .msg-head{font-size:20px!important;color:#9b001a!important}
.help-card .msg-foot{justify-content:center}
.help-card .msg-foot .btn{width:100%}
.help-card .help-body{color:#2a1215}
.help-card .help-lead{background:#fdeeee;color:#2a1215}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .help-card{background:#2a1c1f!important;color:#fbeaea!important}:root:not([data-theme="light"]) .help-card .help-body{color:#fbeaea}:root:not([data-theme="light"]) .help-card .help-lead{background:#3a2328;color:#fbeaea}:root:not([data-theme="light"]) .help-card .msg-head{color:#ff8a9a!important}}
:root[data-theme="dark"] .help-card{background:#2a1c1f!important;color:#fbeaea!important}:root[data-theme="dark"] .help-card .help-body{color:#fbeaea}:root[data-theme="dark"] .help-card .help-lead{background:#3a2328;color:#fbeaea}:root[data-theme="dark"] .help-card .msg-head{color:#ff8a9a!important}
.help-body{overflow:auto;font-size:17px;line-height:1.6;padding-right:4px}
.help-body dt{font-weight:800;font-size:18px;margin-top:12px;color:var(--accent)}
.help-body dd{margin:2px 0 0}
.help-body ul{padding-left:22px;display:flex;flex-direction:column;gap:6px;margin:6px 0 0}
.help-lead{background:var(--accent-soft);padding:12px 14px;border-radius:14px;margin:0 0 4px}
.help-tip{margin:16px 0 0;font-size:18px}
.msg-foot .btn{min-width:150px}
@media (min-width:700px){ .tab{flex-direction:row!important;font-size:15px!important} }
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
'''
s = s.replace('</head>', '</head>', 1)
# nạp CSS sau cùng để đè các lớp cũ: đặt ngay sau thẻ <body>
s = s.replace('<body>', '<body>\n' + CSS, 1)
s = head + s
open(f, 'w').write(s)
print('p3 ok', len(s), 'không khớp:', miss)
