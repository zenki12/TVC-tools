# TVC Tool — Webapp nội bộ (Thiết kế)

- **Ngày:** 2026-06-20
- **Trạng thái:** Đã duyệt thiết kế (chờ review spec)
- **Phạm vi:** Webapp nội bộ cho nhân viên công ty, gồm 2 module: (1) Thiết kế thiệp sinh nhật khách hàng, (2) Tạo biên bản cuộc họp bằng AI theo template có sẵn.

---

## 1. Mục tiêu & bối cảnh

Xây dựng một webapp nội bộ ("TVC Tool") chạy trên hạ tầng công ty, đăng nhập bằng tài khoản
Microsoft của công ty, gom 2 công cụ vào một giao diện thống nhất:

1. **Module Thiệp sinh nhật** — đã có source code (`histaff-birthday-card.zip`): React 19 + Vite +
   Tailwind v4, vẽ thiệp bằng `<canvas>`, lưu background trong IndexedDB, export PNG.
   *Lưu ý:* mã hiện tại **không thực sự gọi Gemini** — phần `@google/genai` chỉ là scaffolding
   thừa của Google AI Studio và sẽ được loại bỏ. → Module này **không tốn phí API**.
2. **Module Biên bản cuộc họp** — xây mới. Nhân viên cung cấp ghi chú/transcript thô (dán text
   hoặc upload file Word/text), AI (Gemini) sắp xếp nội dung vào khung biên bản chuẩn của công ty
   (`TVC_Biên bản mẫu.docx`), nhân viên review/sửa, rồi xuất ra file `.docx` giữ nguyên
   logo/định dạng doanh nghiệp.

### Ràng buộc & quyết định nền tảng
- **Bảo mật API key:** Gemini key tuyệt đối không để lộ ở client → bắt buộc có backend.
- **Đăng nhập:** SSO qua Microsoft Entra ID (Azure AD), giới hạn trong tenant công ty.
- **Triển khai:** Một app Node duy nhất deploy lên server nội bộ công ty.
- **Sinh .docx:** Dùng chính file mẫu làm template + điền placeholder (docxtemplater) để giữ
  100% logo/font/header/footer.

---

## 2. Kiến trúc tổng thể

Một ứng dụng Node duy nhất vừa phục vụ frontend tĩnh vừa cung cấp API.

```
TVC Tool
├── Frontend (React 19 + Vite + Tailwind v4 + React Router)
│   ├── Shell chung: sidebar điều hướng + trạng thái đăng nhập MS
│   ├── Module 1: Thiệp sinh nhật   (port code sẵn có)
│   └── Module 2: Biên bản cuộc họp (xây mới)
│       ├── Tạo mới (form + nhập liệu → AI → review → xuất)
│       └── Lịch sử (xem lại / sửa / tải lại)
└── Backend (Express)
    ├── Middleware: verify MS access token + kiểm tra tenant
    ├── POST /api/minutes/generate  → gọi Gemini, trả JSON cấu trúc
    ├── POST /api/minutes/export    → sinh .docx từ template
    ├── GET/POST/PUT/DELETE /api/minutes  → CRUD lịch sử (SQLite)
    └── (phase 3) POST /api/minutes/transcribe → đọc audio/video
```

### Ranh giới module (để dễ test & bảo trì)
- **`auth/`** — MSAL config (FE) + token verification middleware (BE). Đầu vào: access token.
  Đầu ra: danh tính người dùng (email, tên, oid) hoặc 401.
- **`modules/birthday-card/`** — toàn bộ code thiệp sinh nhật, tự chứa, chỉ phụ thuộc shell để
  điều hướng. Không phụ thuộc backend.
- **`modules/meeting-minutes/`** (FE) — UI 3 bước + trang lịch sử. Phụ thuộc API qua client wrapper.
- **`server/gemini.ts`** — bọc gọi Gemini, nhận (metadata + nội dung thô) → trả JSON cấu trúc đã
  validate. Không biết gì về docx hay HTTP.
- **`server/docx.ts`** — nhận JSON cấu trúc → trả buffer `.docx`. Không gọi mạng, dễ test offline.
- **`server/store.ts`** — CRUD SQLite cho biên bản, scope theo user.

---

## 3. Đăng nhập (Microsoft Entra ID)

- **Frontend:** `@azure/msal-react` + `@azure/msal-browser`. Nút "Đăng nhập bằng Microsoft" →
  lấy access token. Mọi request API gắn `Authorization: Bearer <token>`.
- **Backend:** verify chữ ký token bằng JWKS của Microsoft, kiểm tra `tid` (tenant id) khớp tenant
  công ty và `aud` khớp app. Sai → 401.
- **Cần chuẩn bị (IT/Azure):** một **App Registration** để lấy `TENANT_ID`, `CLIENT_ID`, và cấu
  hình redirect URI. Spec triển khai sẽ liệt kê từng bước.
- **Định danh người dùng** lấy từ token (email/oid) dùng để gắn quyền sở hữu bản ghi lịch sử.

---

## 4. Module 1 — Thiệp sinh nhật

Port nguyên trạng vào app, giữ nguyên logic:
- Editor (nhập liệu + chỉnh font/vị trí) · CardPreview (canvas) · BackgroundLibrary · AdminPanel.
- Background tiếp tục lưu **IndexedDB trên máy từng người** (giữ nguyên hành vi hiện tại).
- Export PNG giữ nguyên.

Thay đổi duy nhất ở phase 1:
- Gắn vào shell/router chung; áp gate đăng nhập.
- Gỡ dependency `@google/genai` (không dùng).

*Ghi chú tương lai (ngoài phase 1):* nếu muốn admin upload background dùng chung toàn công ty,
sẽ chuyển lưu trữ background lên server. Chưa làm bây giờ.

---

## 5. Module 2 — Biên bản cuộc họp

### 5.1 Cấu trúc biên bản (rút từ `TVC_Biên bản mẫu.docx`)

**Khung cố định (heading, logo, layout giữ nguyên):**
- Tiêu đề: "BIÊN BẢN HỌP" + dòng tiêu đề phụ.
- Bảng metadata: Khách hàng · Nội dung · Thời gian · Ngày · Địa điểm/Hình thức · Thành phần tham gia.
- Các heading lớn: **MỤC TIÊU** · **NỘI DUNG CHÍNH** (gồm "Tổng quan cuộc họp", các tiểu mục,
  "Ý kiến & góp ý nổi bật") · **TỔNG KẾT CUỘC HỌP VÀ KẾ HOẠCH TIẾP THEO** (Tổng kết · Mục tiêu sau
  cuộc họp · **Kế hoạch hành động tiếp theo** dạng bảng).

**Phần thay đổi theo từng cuộc họp (AI sinh):** toàn bộ nội dung & các bảng động bên dưới mỗi heading.

### 5.2 Luồng 3 bước

**Bước 1 — Nhập liệu**
- Form metadata (các trường ở trên). "Thành phần tham gia" nhập theo nhóm tổ chức (tên tổ chức +
  danh sách người: họ tên · chức danh).
- Nguồn nội dung: (a) dán text thô; hoặc (b) upload file `.docx`/`.txt` (đọc bằng `mammoth` cho docx).

**Bước 2 — AI sinh & review**
- Backend gửi (metadata + nội dung thô) cho Gemini kèm prompt yêu cầu trả **JSON đúng schema**
  (xem 5.3). Dùng response schema / JSON mode để ép định dạng.
- FE render bản nháp ra **form có thể chỉnh sửa** từng phần (sửa câu chữ, thêm/xóa bullet, thêm/xóa
  dòng bảng) trước khi xuất. Không bao giờ xuất mù.

**Bước 3 — Xuất .docx**
- Gửi JSON (đã chỉnh) tới `/api/minutes/export`. Backend dùng **docxtemplater + pizzip** với file
  template đã gắn placeholder → trả `.docx`. FE tải về.
- Đặt tên file: `bien-ban-hop-<slug-tiêu-đề>-<ngày>.docx`.

### 5.3 Schema JSON nội dung (bản nháp, sẽ chốt chi tiết ở plan)

```jsonc
{
  "title": "BÁO CÁO TIẾN ĐỘ ... GIAI ĐOẠN 1",     // tiêu đề phụ dưới "BIÊN BẢN HỌP"
  "metadata": {
    "khachHang": "...",
    "noiDung": "...",
    "thoiGian": "14:00",
    "ngay": "02/06/2026",
    "diaDiem": "...",
    "thanhPhan": [
      { "toChuc": "PVPGB", "nguoi": [ { "hoTen": "...", "chucDanh": "..." } ] }
    ]
  },
  "mucTieu": ["...", "..."],                        // danh sách gạch đầu dòng
  "noiDungChinh": {
    "tongQuan": [ { "type": "paragraph", "text": "..." }, { "type": "bullets", "items": ["..."] } ],
    "tieuMuc": [                                    // số lượng tiểu mục thay đổi
      {
        "heading": "Mục tiêu, phạm vi & kết quả Giai đoạn 1",
        "blocks": [                                 // mỗi block là 1 loại khối nội dung
          { "type": "paragraph", "text": "..." },
          { "type": "bullets", "items": ["...", "..."] },
          { "type": "table",
            "columns": ["STT","Module","Trạng thái","Ghi chú"],
            "rows": [ ["1","Tổ chức – Cây phân cấp","Hoàn thành",""] ] }
        ]
      }
    ],
    "gopY": ["...", "..."]
  },
  "tongKet": {
    "tongKet": ["...", "..."],
    "mucTieuSau": ["...", "..."],
    "keHoachHanhDong": {
      "columns": ["STT","Hành động","Đơn vị phụ trách","Kết quả mong đợi","Thời hạn"],
      "rows": [ ["1","...","...","...",""] ]
    }
  }
}
```

### 5.4 Sinh .docx — chiến lược "lặp khối nội dung"

Thách thức: phần NỘI DUNG CHÍNH có cấu trúc lồng nhau linh hoạt (số tiểu mục thay đổi; mỗi tiểu mục
có thể chứa đoạn văn / bullet / bảng theo thứ tự bất kỳ). Giải pháp:

- Các trường cố định (metadata, tiêu đề) → placeholder đơn `{khachHang}`, `{title}`...
- Danh sách & bảng động → **vòng lặp docxtemplater** (`{#rows}...{/rows}`).
- Khối nội dung hỗn hợp → vòng lặp `{#blocks}` kết hợp **điều kiện theo `type`**
  (`{#isParagraph}`, `{#isBullets}`, `{#isTable}`) để render đúng kiểu mỗi khối. Trước khi nạp vào
  template, `server/docx.ts` sẽ "làm phẳng" JSON thành cấu trúc cờ boolean cho docxtemplater.
- File template gắn placeholder được tạo từ chính `TVC_Biên bản mẫu.docx` (sao chép, thay nội dung
  ví dụ bằng placeholder, giữ nguyên style/section/header/footer/logo).

*Rủi ro & giảm thiểu:* docxtemplater lặp đoạn/bảng tốt, nhưng khối lồng nhiều tầng cần template
được dựng cẩn thận. Sẽ có test sinh docx với dữ liệu mẫu (lấy từ chính nội dung file gốc) để so
khớp trước khi coi là xong.

### 5.5 Lịch sử biên bản
- Lưu **JSON cấu trúc** (không lưu file docx) trong **SQLite**, mỗi bản ghi gắn `userEmail/oid`.
- Bảng `meeting_minutes(id, owner, title, metadata_json, content_json, created_at, updated_at)`.
- Tải lại = sinh docx mới từ JSON → luôn đúng định dạng kể cả khi template cập nhật.
- Trang "Lịch sử": liệt kê biên bản của chính người dùng → xem / sửa (quay lại bước 2) / tải lại / xóa.

---

## 6. Chi phí vận hành (Gemini)

Chỉ Module 2 tốn phí. Giá Gemini 2.5 Flash (06/2026): $0.30/1M input · $2.50/1M output
(tỷ giá ~26.000đ/USD). Output chi phối chi phí.

| Tình huống | Chi phí/lần |
|---|---|
| Dán ghi chú gọn → biên bản | ~370đ |
| Dán transcript họp 1 tiếng → biên bản | ~620đ |
| (Phase 3) Đọc audio họp 1 tiếng | ~3.400đ |

Khởi đầu dùng **Flash** (đủ tốt cho biên bản có cấu trúc rõ); nâng **Pro** (~2.500đ/lần) nếu cần
chất lượng cao hơn. Có free tier để test gần như 0đ. Chi phí token không phải rào cản — ưu tiên
đầu tư vào hạ tầng & bảo mật API key.

---

## 7. Tech stack

React 19 · Vite · Tailwind v4 · React Router · Express · `@azure/msal-react` / `@azure/msal-browser`
· token verify (jose/jwks) · `@google/genai` (server-side) · `docxtemplater` + `pizzip` (xuất docx)
· `mammoth` (đọc file Word upload) · `better-sqlite3` (lịch sử).

---

## 8. Xử lý lỗi (nguyên tắc)
- Gemini trả JSON sai schema → backend validate, retry 1 lần với prompt sửa lỗi; vẫn sai → báo lỗi
  thân thiện, giữ nguyên input để người dùng thử lại.
- Upload file: giới hạn dung lượng & loại file; docx hỏng → thông báo rõ.
- Export docx lỗi (placeholder thiếu/thừa) → log chi tiết phía server, FE báo "không xuất được, thử lại".
- 401 (token hết hạn) → FE tự động yêu cầu đăng nhập lại, không mất dữ liệu đang nhập.

---

## 9. Phân kỳ
- **Phase 1:** Shell + đăng nhập MS Entra ID + port Module 1 (thiệp sinh nhật).
- **Phase 2:** Module 2 — input text/Word → AI sinh JSON → review/sửa → xuất docx → lịch sử (SQLite).
- **Phase 3:** Upload media (mp3/mp4) → Gemini đọc audio → biên bản.

---

## 10. Câu hỏi mở (chốt ở giai đoạn plan)
- Chi tiết schema JSON & cách dựng template placeholder cho khối lồng nhau (5.4).
- Tên tenant/Client ID Azure (cần IT cung cấp).
- Có cần phân quyền admin (vd quản lý template biên bản) không, hay mọi nhân viên quyền như nhau.
