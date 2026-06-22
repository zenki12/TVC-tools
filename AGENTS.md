# TVC Tool

Ứng dụng Node nội bộ gồm React/Vite frontend và Express API. App cung cấp module Thiệp sinh nhật và luồng AI tạo bản nháp Biên bản cuộc họp. Ứng dụng không có cơ chế đăng nhập; mọi người truy cập được máy chủ đều có thể gọi API.

## Cấu trúc

- `src/shell/`: layout/sidebar dùng chung.
- `src/modules/birthday-card/`: editor canvas, IndexedDB background và export PNG.
- `src/modules/meeting-minutes/`: schema dùng chung, form nhập liệu, editor và tải DOCX biên bản.
- `server/`: Express app, Gemini adapter, DOCX renderer và API công khai trong phạm vi mạng triển khai.
- `server/templates/`: template dẫn xuất từ file Word công ty; không dựng lại header/footer/logo bằng code.
- `tools/create_minutes_template.py`: tái tạo template, chỉ thay `word/document.xml` và kiểm tra mọi part khác giữ nguyên byte.
- `docs/`: spec, plan, task registry và devlog.

## Lệnh

- `npm run dev`: chạy Vite ở cổng 3000 và Express ở cổng 3001.
- `npm run build`: build frontend vào `dist/`.
- `npm start`: chạy Express và serve `dist/`.
- `npm run check`: kiểm tra TypeScript frontend/backend.
- `npm test`: chạy test backend bằng Node test runner.

## Quy ước

- Không commit `.env`, token hoặc secret. Sao chép `.env.example` thành `.env` khi cấu hình máy local.
- Mỗi user nhập Gemini API key trong module Biên bản. Chỉ lưu key trong `sessionStorage`, gửi qua backend theo từng request và không log hoặc lưu ở server.
- API mới nằm dưới `/api`. Không giả định có user identity hoặc middleware auth; kiểm soát quyền truy cập phải được thực hiện ở hạ tầng mạng nếu cần.
- Giữ module tách biệt; Module Thiệp sinh nhật không phụ thuộc backend.
- Module Biên bản đã hỗ trợ xuất `.docx`; chưa lưu lịch sử. Khi cập nhật file mẫu gốc, chạy lại `tools/create_minutes_template.py` và test DOCX trước khi dùng.
