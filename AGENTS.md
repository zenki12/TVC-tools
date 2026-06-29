# TVC Tool

Ung dung Node noi bo gom React/Vite frontend va Express API. App cung cap module Thiep sinh nhat va luong AI tao ban nhap Bien ban cuoc hop. Ung dung khong co co che dang nhap; moi nguoi truy cap duoc may chu deu co the goi API.

## Cau truc

- `src/shell/`: layout/sidebar dung chung.
- `src/modules/birthday-card/`: editor canvas, thu vien background dung chung qua `/api/birthday/backgrounds` va export PNG.
- `src/modules/meeting-minutes/`: schema dung chung, form nhap lieu, editor va tai DOCX bien ban.
- `server/`: Express app, Gemini adapter, Vercel Blob background storage, DOCX renderer va API cong khai trong pham vi mang trien khai.
- `server/templates/`: template dan xuat tu file Word cong ty; khong dung lai header/footer/logo bang code.
- `tools/create_minutes_template.py`: tai tao template, chi thay `word/document.xml` va kiem tra moi part khac giu nguyen byte.
- `docs/`: spec, plan, task registry va devlog.

## Lenh

- `npm run dev`: chay Vite o cong 3000 va Express o cong 3001.
- `npm run build`: build frontend vao `dist/`.
- `npm start`: chay Express va serve `dist/`.
- `npm run check`: kiem tra TypeScript frontend/backend.
- `npm test`: chay test backend bang Node test runner.

## Quy uoc

- Khong commit `.env`, token hoac secret. Sao chep `.env.example` thanh `.env` khi cau hinh may local.
- Moi user nhap Gemini API key trong module Bien ban. Chi luu key trong `sessionStorage`, gui qua backend theo tung request va khong log hoac luu o server.
- Module Thiep sinh nhat khong yeu cau login cho user thuong. Rieng quan tri background dung chung can `BACKGROUND_ADMIN_PIN`.
- Production tren Vercel can `BLOB_READ_WRITE_TOKEN` de luu anh nen dung chung bang Vercel Blob. Local dev khong co token se dung `.data/birthday-backgrounds.json`.
- API moi nam duoi `/api`. Khong gia dinh co user identity hoac middleware auth; kiem soat quyen truy cap tong the phai duoc thuc hien o ha tang mang neu can.
- Module Bien ban da ho tro xuat `.docx`; chua luu lich su. Khi cap nhat file mau goc, chay lai `tools/create_minutes_template.py` va test DOCX truoc khi dung.
