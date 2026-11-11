# Sổ CSKH v2

App chăm sóc ba mẹ cho các chi nhánh GHL. Chạy trên GitHub Pages, **không có máy chủ chung, không Firebase**.

- **App chi nhánh:** `https://ghl-cskh.github.io/<mã-chi-nhánh>` (ví dụ `/hpl-quan-7`)
- **App quản trị:** `https://ghl-cskh.github.io/quan-tri` (chỉ Gmail quản trị đăng nhập được)

## Dữ liệu nằm ở đâu
- `branches.json`: danh sách chi nhánh (mã, tên, link kho). Không có Gmail, không có dữ liệu ba mẹ.
- Mỗi chi nhánh có **kho riêng**: Apps Script + Google Sheet trong Gmail của GĐ chi nhánh (`apps-script/Kho.gs`). Kho tự lo đăng nhập, nhân viên, duyệt, dữ liệu và sao lưu 23h.
- **Hộp thư quản trị** (`apps-script/HopThu.gs`) trong Gmail quản trị: nhận link kho do GĐ gửi và lỗi app (không có dữ liệu ba mẹ).

## Cập nhật app
Sửa `index.html` / `quan-tri/index.html` rồi đẩy lên nhánh `main`: tất cả chi nhánh nhận bản mới sau 1–2 phút. `404.html` là bản sao của `index.html` để link `/<mã-chi-nhánh>` mở được.
