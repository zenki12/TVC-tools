# Development Log

## 2026-06-20 - T-0004: Xuất biên bản DOCX theo template công ty

- Thêm `server/templates/bien-ban-template.docx`, dẫn xuất từ `TVC_Biên bản mẫu.docx` bằng `tools/create_minutes_template.py`. Script sao chép toàn bộ archive, chỉ thay `word/document.xml`, rồi byte-compare mọi ZIP entry còn lại; header, footer, media/logo, relationships, styles, numbering, theme và settings không được dựng lại hay sửa bằng code.
- Phần thân template giữ bảng metadata/thành phần và heading thật. Metadata dùng tag đơn; thành phần dùng loop nhóm/người; nội dung động dùng bảy raw tag: `mucTieuXml`, `tongQuanXml`, `tieuMucXml`, `gopYXml`, `tongKetXml`, `mucTieuSauXml`, `keHoachXml`.
- `server/docx.ts` dùng `docxtemplater` + `pizzip`, tái dùng style `oancuaDanhsach`, `u2`, numbering bullet `4/5`, table style `LiBang`, Times New Roman 13pt. Bảng có số cột tùy JSON, tổng rộng 10200 DXA và phân bổ độ rộng theo nội dung; header in đậm/lặp lại và cell có padding.
- Mọi text chèn qua raw OOXML được escape đủ `& < > " '`. Test dùng dữ liệu mẫu có paragraph, bullets, bảng 3/5 cột và ký tự đặc biệt; đồng thời kiểm tra header/footer/media output byte-identical với template và template byte-identical với file gốc ở mọi part ngoài `document.xml`.
- Thêm API có xác thực `POST /api/minutes/export`, trả MIME DOCX và tên `bien-ban-hop-<slug-title>-<ngay>.docx`. Frontend có trạng thái đang xuất/lỗi, nhận blob và tải file mà không làm mất bản nháp.
- Không thêm lịch sử (T-0005) và không thay schema/generation của T-0003. Runtime API đã xuất file DOCX hợp lệ về cấu trúc; visual render/Word QA chưa thực hiện được vì môi trường không có LibreOffice và browser tích hợp bị Windows sandbox chặn.

## 2026-06-20 - T-0003: AI tạo và chỉnh sửa bản nháp biên bản

- Thay placeholder Module Biên bản bằng luồng 2 bước: nhập metadata/thành phần/ghi chú hoặc upload `.txt`/`.docx`, sau đó xem và sửa bản nháp có cấu trúc trên màn hình. File `.docx` đầu vào được trích text trong browser bằng `mammoth`; file không được upload nguyên bản lên server.
- Thêm contract dùng chung `MeetingMinutes`: `title`, metadata và thành phần theo tổ chức, `mucTieu`, `noiDungChinh` với block `paragraph | bullets | table`, cùng `tongKet` và bảng kế hoạch hành động. Runtime validator kiểm tra sâu JSON và số cell mỗi hàng phải khớp số cột.
- Backend dùng `@google/genai` với model `gemini-2.5-flash`, `responseMimeType: application/json` và `responseSchema`. JSON sai hoặc không khớp schema được yêu cầu sửa và retry đúng 1 lần; vẫn sai thì API trả lỗi 502 thân thiện.
- Thêm route có xác thực `POST /api/minutes/generate`. Input rỗng trả 400, thiếu `GEMINI_API_KEY` trả 503, lỗi Gemini trả 502. API key chỉ được đọc ở backend và không được inject vào Vite.
- Lấy Gemini API key miễn phí tại `https://aistudio.google.com/apikey`, sau đó đặt `GEMINI_API_KEY` trong `.env`. Không commit key.
- Editor cho phép sửa metadata, thành phần, title, paragraph; thêm/xóa dòng trong các list/bullets và thêm/xóa hàng/chỉnh cell trong mọi bảng. Nút xuất `.docx` đang disable.
- Giới hạn chủ đích: chưa xuất `.docx` (T-0004), chưa lưu/lịch sử (T-0005). Workspace không có Gemini key thật nên chỉ xác minh generator bằng dependency injection và route thiếu key; browser tích hợp bị Windows sandbox chặn nên chưa chạy UAT tương tác trực quan.

## 2026-06-20 - T-0002: Chế độ Dev bỏ qua đăng nhập

- Thêm `AUTH_MODE`, mặc định là `microsoft`. Khi đặt `AUTH_MODE=dev` trên máy local, frontend bỏ login gate, dùng user giả `Người dùng Dev (local)`, không lấy access token và không gắn header `Authorization` vào API request.
- Shell hiển thị banner vàng “Chế độ DEV — đang bỏ qua đăng nhập” để trạng thái bypass luôn dễ nhận biết.
- Express chỉ bypass middleware khi đồng thời có `AUTH_MODE=dev` và `NODE_ENV` khác `production`; `/api/me` khi đó trả user giả `dev-user`/`dev@local.test`.
- Lớp bảo vệ production được khóa bằng test integration: `AUTH_MODE=dev` kết hợp `NODE_ENV=production` vẫn trả 401 nếu thiếu bearer token. Nhánh JWKS, tenant, audience và issuer của Microsoft không thay đổi.
- Không thêm dependency hoặc secret. Bật local bằng cách đặt `AUTH_MODE=dev` trong `.env`; không dùng cấu hình này khi triển khai production.

## 2026-06-20 - T-0001: Khởi tạo TVC Tool

### Đã triển khai

- Dựng một project Node duy nhất: React 19/Vite/TypeScript/Tailwind v4 ở `src/`, Express/TypeScript ở `server/`.
- Thêm shell chung với sidebar, hai route `birthday-card` và `meeting-minutes`, thông tin tài khoản và đăng xuất.
- Toàn bộ router nằm sau Microsoft login gate. MSAL lấy access token cho scope `api://<CLIENT_ID>/access_as_user`; helper `apiFetch` gắn `Authorization: Bearer <token>` cho API.
- Backend xác minh chữ ký bằng JWKS v2 của Microsoft qua `jose`, đồng thời kiểm tra issuer, `tid` bằng `TENANT_ID`, và `aud` bằng `CLIENT_ID`. Route thử nghiệm `GET /api/me` trả danh tính chuẩn hóa.
- Port Module Thiệp sinh nhật vào `src/modules/birthday-card/`: giữ nguyên editor, chỉnh font/vị trí, canvas `CardPreview`, `BackgroundLibrary`, `AdminPanel`, IndexedDB và export PNG.
- Module Biên bản chỉ có placeholder “Tính năng đang phát triển (Phase 2)”; không đọc template `.docx` và không thêm logic Phase 2.

### Cấu hình Microsoft Entra ID

1. Trong Microsoft Entra admin center, tạo một App Registration single-tenant.
2. Thêm nền tảng **Single-page application** và redirect URI cho môi trường chạy, ví dụ `http://localhost:3000` khi phát triển.
3. Ở **Expose an API**, giữ Application ID URI `api://<CLIENT_ID>` và tạo delegated scope `access_as_user`.
4. Sao chép `.env.example` thành `.env`, đặt `TENANT_ID` và `CLIENT_ID` từ App Registration. Không cần và không được đặt client secret cho SPA trong project này.
5. Chạy lại `npm run dev`. Frontend yêu cầu scope trên; backend chỉ chấp nhận access token do đúng tenant cấp với audience đúng client ID.

Luồng kiểm thử tenant thật: mở `http://localhost:3000`, chọn **Đăng nhập bằng Microsoft**, đăng nhập tài khoản công ty, vào **Thiệp sinh nhật**, nhập thông tin/upload ảnh/chọn background, rồi chọn export PNG. `GET /api/me` qua `apiFetch` nhận bearer token; gọi không có token trả 401.

### Thay đổi khi port Module 1

- Loại bỏ hoàn toàn dependency `@google/genai`; module không có lời gọi Gemini hay API AI.
- Không mang metadata/config Google AI Studio vào app mới.
- Giữ nguyên byte nội dung của component, IndexedDB, template canvas và type từ source; chỉ đổi tên entry thành `BirthdayCardPage` và đổi container `h-screen` thành `h-full` để nằm trong shell.
- Giữ `lucide-react` và `motion` vì đây là dependency trực tiếp của giao diện/animation gốc cần bảo toàn.

### Xác minh môi trường hiện tại

- Cài dependency thành công, không có peer-dependency error và `npm audit` báo 0 lỗ hổng.
- Unit/API test bao phủ claims tenant và phản hồi 401 không token.
- Không có tenant/company credentials thật trong workspace, nên không thực hiện đăng nhập Microsoft thực tế. Browser tích hợp cũng bị Windows sandbox chặn lúc khởi tạo; dev endpoint và proxy API được kiểm tra trực tiếp qua HTTP.
