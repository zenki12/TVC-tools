// Hàm vẽ logo Tinhcan Consulting và HiStaff làm vector mượt mà lên canvas
function drawLogos(ctx: CanvasRenderingContext2D) {
  // --- LOGO TINH VAN CONSULTING ---
  ctx.save();
  ctx.translate(60, 60);

  // Vẽ chữ Tinhvân
  ctx.font = 'italic bold 32px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('Tinhvân', 0, 30);

  // Vẽ phụ đề CONSULTING
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#A0AEC0';
  ctx.letterSpacing = '2px';
  ctx.fillText('CONSULTING', 2, 48);
  ctx.restore();

  // --- LOGO HISTAFF ---
  ctx.save();
  ctx.translate(900 - 60, 60);
  ctx.textAlign = 'right';

  // Vẽ chữ HiStaff
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('HiStaff', -15, 30);

  // Vẽ dấu tick cam đỏ đặc trưng của HiStaff
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(-4, 25);
  ctx.lineTo(8, -2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#F97316'; // Orange-red color
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Vẽ phụ đề PROFESSIONAL HRM SOLUTION
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = '#A0AEC0';
  ctx.letterSpacing = '1px';
  ctx.fillText('PROFESSIONAL HRM SOLUTION', 0, 48);
  ctx.restore();
}

// Hàm vẽ chữ HAPPY BIRTHDAY rực rỡ
function drawHappyBirthday(ctx: CanvasRenderingContext2D) {
  ctx.save();

  // Chữ HAPPY (outline mỏng nghệ thuật)
  ctx.font = 'semibold 130px sans-serif';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '18px';
  ctx.strokeText('HAPPY', 450, 200);

  // Chữ BIRTHDAY (đậm đặc sảo, đổ bóng hoặc ánh bạc)
  ctx.font = 'black bold 90px sans-serif';
  ctx.letterSpacing = '6px';
  ctx.textAlign = 'center';

  // Hiệu ứng đổ bóng cho BIRTHDAY
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // Tạo gradient ánh bạc từ trắng sang xám nhạt
  const textGrad = ctx.createLinearGradient(450, 230, 450, 310);
  textGrad.addColorStop(0, '#FFFFFF');
  textGrad.addColorStop(0.5, '#E2E8F0');
  textGrad.addColorStop(1, '#94A3B8');

  ctx.fillStyle = textGrad;
  ctx.fillText('BIRTHDAY', 450, 290);

  ctx.restore();
}

// Hàm vẽ pháo hoa hạt kim tuyến vàng lấp lánh (vệt xéo lấp lánh vàng)
function drawGoldenConfetti(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const confettiList = [
    { x: 100, y: 150, r: 8, color: '#FFD700', angle: 0.3 },
    { x: 130, y: 350, r: 12, color: '#F59E0B', angle: -0.2 },
    { x: 300, y: 180, r: 6, color: '#FFE066', angle: 0.5 },
    { x: 750, y: 200, r: 10, color: '#FFD700', angle: -0.4 },
    { x: 820, y: 380, r: 7, color: '#FFE066', angle: 0.1 },
    { x: 80, y: 550, r: 9, color: '#FFD700', angle: 0.6 },
    { x: 820, y: 600, r: 11, color: '#F59E0B', angle: -0.3 },
    { x: 720, y: 490, r: 8, color: '#FFE066', angle: 0.2 },
    { x: 370, y: 620, r: 6, color: '#FFD700', angle: 0.4 },
    { x: 310, y: 160, r: 10, color: '#F59E0B', angle: -0.1 },
  ];

  confettiList.forEach((c) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.color;
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 8;

    // Vẽ hình chữ nhật chéo lấp lánh
    ctx.fillRect(-c.r, -c.r / 2, c.r * 2, c.r);
    ctx.restore();
  });
  ctx.restore();
}

export function generateDefaultBackground(gender: 'male' | 'female'): string {
  // Tạo canvas chuẩn 900x1233 px
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1233;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Vẽ hình nền gradient sang trọng nền tối
  if (gender === 'male') {
    // --- TEMPLATE NAM (MẠNH MẼ, SANG TRỌNG VEST TUXEDO) ---
    // Nền tối chuyển dần từ xanh đen huyền bí sang xanh HiStaff và một góc neon green
    const grad = ctx.createRadialGradient(450, 400, 100, 450, 600, 800);
    grad.addColorStop(0, '#0E173C'); // Xanh dương rất đậm sâu thẳm
    grad.addColorStop(0.5, '#050A1F'); // Đốm nền tối tối ưu
    grad.addColorStop(1, '#02040A');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 1233);

    // Vẽ góc bừng sáng Neon Green / Cyan ở góc dưới cùng bên phải
    const neonGrad = ctx.createRadialGradient(800, 1100, 50, 800, 1100, 400);
    neonGrad.addColorStop(0, 'rgba(3, 231, 211, 0.25)'); // Accent cyan #03E7D3
    neonGrad.addColorStop(0.5, 'rgba(81, 255, 177, 0.1)'); // Neon green #51FFB1
    neonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neonGrad;
    ctx.fillRect(0, 0, 900, 1233);

    // Vẽ vẽ Tuxedo mờ nghệ thuật phía sau
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 3;
    
    // Ve áo trái
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(380, 300);
    ctx.lineTo(380, 450);
    ctx.lineTo(450, 500);
    ctx.stroke();

    // Ve áo phải
    ctx.beginPath();
    ctx.moveTo(750, 0);
    ctx.lineTo(520, 300);
    ctx.lineTo(520, 450);
    ctx.lineTo(450, 500);
    ctx.stroke();

    // Ve áo trong (Cổ sơ mi chữ V)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(350, 0);
    ctx.lineTo(450, 220);
    ctx.lineTo(550, 0);
    ctx.stroke();

    // Chiếc nơ Tuxedo đen bóng ở trung tâm cổ
    ctx.fillStyle = '#0F172A';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    
    // Nút thắt nơ giữa Y = 80
    ctx.fillRect(438, 70, 24, 20);
    
    // Cánh nơ trái
    ctx.beginPath();
    ctx.moveTo(438, 80);
    ctx.lineTo(390, 55);
    ctx.lineTo(390, 105);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cánh nơ phải
    ctx.beginPath();
    ctx.moveTo(462, 80);
    ctx.lineTo(510, 55);
    ctx.lineTo(510, 105);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

  } else {
    // --- TEMPLATE NỮ (MỀM MẠI, QUYẾN RŨ, BƯỚM HOA HỒNG XANH) ---
    const grad = ctx.createRadialGradient(450, 500, 200, 450, 600, 900);
    grad.addColorStop(0, '#0F1332'); // Nền xanh tím thẫm
    grad.addColorStop(0.6, '#060B24');
    grad.addColorStop(1, '#02030B');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 1233);

    // Vẽ góc bừng sáng Neon Cyan / Blue ở góc dưới cùng bên phải
    const neonGrad = ctx.createRadialGradient(850, 1100, 50, 850, 1100, 500);
    neonGrad.addColorStop(0, 'rgba(20, 200, 255, 0.3)'); // Cyan #14C8FF
    neonGrad.addColorStop(0.6, 'rgba(103, 96, 227, 0.12)'); // Indigo #6760E3
    neonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neonGrad;
    ctx.fillRect(0, 0, 900, 1233);

    // Vẽ cánh bướm đêm xanh ngọc (Neon blue/cyan) mộc mạc nghệ thuật ở biên trái, phải
    ctx.save();
    ctx.shadowColor = '#03E7D3';
    ctx.shadowBlur = 20;

    // Bướm 1 (Bên trái Y = 450)
    ctx.save();
    ctx.translate(100, 450);
    ctx.rotate(-0.4);
    ctx.fillStyle = 'rgba(3, 231, 211, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 25, Math.PI/4, 0, Math.PI * 2);
    ctx.ellipse(-15, 20, 30, 20, Math.PI/12, 0, Math.PI * 2);
    ctx.ellipse(15, -15, 20, 12, Math.PI/3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bướm 2 (Bên phải Y = 130)
    ctx.save();
    ctx.translate(720, 130);
    ctx.rotate(0.3);
    ctx.fillStyle = 'rgba(20, 200, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 30, -Math.PI/6, 0, Math.PI * 2);
    ctx.ellipse(10, 25, 35, 22, -Math.PI/12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Vẽ hoa hồng sương mù (vệt tròn chồng lấp) ở góc trái dưới
    const roseGrad = ctx.createRadialGradient(100, 950, 50, 100, 950, 250);
    roseGrad.addColorStop(0, 'rgba(103, 96, 227, 0.2)');
    roseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = roseGrad;
    ctx.beginPath();
    ctx.arc(100, 950, 250, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  // 2. Vẽ bụi vàng kim trang trí
  drawGoldenConfetti(ctx);

  // 3. Vẽ chữ chủ đề Happy Birthday
  drawHappyBirthday(ctx);

  // 4. Vẽ logo chính xác của Tinhvan & HiStaff
  drawLogos(ctx);

  return canvas.toDataURL('image/png');
}
