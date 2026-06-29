# TVC Tools

Ung dung noi bo gom React/Vite frontend va Express API, cung cap:

- Trinh tao thiep sinh nhat va xuat PNG.
- Luong AI tao, chinh sua va xuat DOCX Bien ban cuoc hop.
- Gemini API key do tung user nhap trong module Bien ban va chi luu trong `sessionStorage`.

## Chay local

```bash
npm install
npm run dev
```

Frontend chay tai `http://localhost:3000`, Express API chay tai `http://localhost:3001`.

## Kiem tra

```bash
npm run check
npm test
npm run build
```

## Cau hinh

Sao chep `.env.example` thanh `.env` khi can cau hinh local. Khong commit `.env`, token hoac secret.

- `PORT`: cong Express API local.
- `BACKGROUND_ADMIN_PIN`: ma quan tri phan Background cua module Thiep sinh nhat.
- `BLOB_READ_WRITE_TOKEN`: token Vercel Blob de luu anh nen dung chung tren production.

Nguoi dung thuong khong can login. Rieng man hinh quan tri background yeu cau ma `BACKGROUND_ADMIN_PIN`; ma nay chi luu trong session trinh duyet sau khi nhap dung.

Tren Vercel, can tao Vercel Blob store va cau hinh `BLOB_READ_WRITE_TOKEN` trong Project Settings. Neu chay local khong co token, app dung file `.data/birthday-backgrounds.json` de dev/test.
