# TVC Tools

Ứng dụng nội bộ gồm React/Vite frontend và Express API, cung cấp:

- Trình tạo Thiệp sinh nhật và xuất PNG.
- Luồng AI tạo, chỉnh sửa và xuất DOCX Biên bản cuộc họp.
- Gemini API key do từng người dùng nhập và chỉ lưu trong `sessionStorage`.

## Chạy local

```bash
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`, Express API chạy tại
`http://localhost:3001`.

## Kiểm tra

```bash
npm run check
npm test
npm run build
```

## Cấu hình

Sao chép `.env.example` thành `.env` nếu cần đổi cổng Express. Không commit
`.env`, API key hoặc secret.

Ứng dụng hiện không có cơ chế đăng nhập. Mọi người truy cập được máy chủ đều có
thể gọi API; nếu cần giới hạn truy cập, hãy cấu hình ở reverse proxy hoặc hạ tầng
mạng triển khai.
