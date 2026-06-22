# Hướng dẫn cấu hình đăng nhập Microsoft cho app "TVC Tool" (gửi IT)

> Tài liệu này dành cho **quản trị viên Microsoft 365 / Entra ID** của công ty.
> Mục tiêu: tạo "App Registration" để nhân viên đăng nhập app nội bộ bằng tài khoản công ty.
> Thời gian: ~15 phút. Làm 1 lần duy nhất.
>
> **Kết quả cần gửi lại cho người phụ trách app:** 3 giá trị ở [Bước 7](#bước-7-gửi-lại-thông-tin).

---

## Bối cảnh ngắn
"TVC Tool" là webapp nội bộ (React + Express) cho nhân viên. App cần đăng nhập bằng tài khoản
Microsoft công ty (Entra ID), và **chỉ nhân viên trong tổ chức** mới được vào. App tự kiểm tra
token nên **không cần client secret** (đây là Single-Page App).

---

## Bước 1 — Tạo App Registration
1. Vào https://portal.azure.com → tìm **Microsoft Entra ID** (tên cũ: Azure Active Directory).
2. Menu trái → **App registrations** → **New registration**.
3. Điền:
   - **Name:** `TVC Tool`
   - **Supported account types:** chọn **"Accounts in this organizational directory only (Single tenant)"**
     (chỉ nội bộ công ty).
   - **Redirect URI:** chọn nền tảng **Single-page application (SPA)** và nhập URL app:
     - Khi chạy thử (dev): `http://localhost:3000`
     - Khi deploy thật: URL nội bộ của app (ví dụ `https://tvc-tool.noibo.congty.vn`)
     - *Có thể thêm nhiều URL — xem Bước 5.*
4. Bấm **Register**.

---

## Bước 2 — Lấy 2 mã định danh
Ở trang **Overview** của app vừa tạo, copy 2 giá trị (gửi lại ở Bước 7):
- **Application (client) ID**  → đây là `CLIENT_ID`
- **Directory (tenant) ID**    → đây là `TENANT_ID`

---

## Bước 3 — Expose an API (tạo quyền truy cập)
1. Menu trái của app → **Expose an API**.
2. Mục **Application ID URI**: bấm **Add**, giữ giá trị mặc định `api://<client-id>` → **Save**.
3. Bấm **Add a scope**, điền:
   - **Scope name:** `access_as_user`   ⬅️ *phải đúng tên này*
   - **Who can consent:** **Admins and users**
   - **Admin consent display name:** `Truy cập TVC Tool với tư cách người dùng`
   - **Admin consent description:** `Cho phép app gọi API thay mặt người dùng đã đăng nhập`
   - **State:** Enabled
4. Bấm **Add scope**.

---

## Bước 4 — Đặt phiên bản token = 2 (QUAN TRỌNG NHẤT)
Nếu bỏ bước này, đăng nhập sẽ **lỗi 401** dù mọi thứ khác đúng.
1. Menu trái của app → **Manifest**.
2. Tìm dòng `"requestedAccessTokenVersion"` (nằm trong mục `api`).
3. Đặt giá trị **`2`**:
   ```json
   "requestedAccessTokenVersion": 2
   ```
   *(Nếu đang là `null` thì sửa thành `2`.)*
4. Bấm **Save**.

---

## Bước 5 — (Tùy chọn) Thêm Redirect URI khác
Nếu sau này app chạy ở URL khác (dev + thật), thêm tại:
- Menu trái → **Authentication** → mục **Single-page application** → **Add URI**.
- Đảm bảo có đủ các URL nơi app sẽ chạy. Lưu lại.

---

## Bước 6 — (Có thể cần) Cấp quyền admin consent
1. Menu trái → **API permissions**.
2. Mặc định đã có **Microsoft Graph: openid, profile, email** (delegated) — đủ dùng.
3. Nếu tổ chức yêu cầu admin duyệt: bấm **Grant admin consent for <Công ty>** → **Yes**.

---

## Bước 7 — Gửi lại thông tin
Gửi cho người phụ trách app **3 dòng** sau (điền giá trị thật):

```
TENANT_ID = <Directory (tenant) ID ở Bước 2>
CLIENT_ID = <Application (client) ID ở Bước 2>
SCOPE     = api://<CLIENT_ID>/access_as_user
```

Xong. App sẽ tự hoạt động sau khi dán 3 giá trị này vào cấu hình.

---

## Phụ lục — Xử lý sự cố nhanh
| Triệu chứng | Nguyên nhân thường gặp | Cách sửa |
|---|---|---|
| Đăng nhập xong vẫn báo 401 | Chưa đặt `requestedAccessTokenVersion: 2` | Làm lại **Bước 4** |
| Lỗi "redirect URI mismatch" | URL app chưa khai báo | Thêm URL ở **Bước 5** (đúng kiểu SPA) |
| Lỗi "need admin approval" | Tổ chức bắt buộc admin consent | Làm **Bước 6** |
| Lỗi scope/`access_as_user` | Sai tên scope | Kiểm tra **Bước 3**, đúng `access_as_user` |
