import React, { useRef, useEffect, useState } from 'react';
import { CardState, Background } from '../types';
import { Download, Sparkles, AlertCircle } from 'lucide-react';

interface CardPreviewProps {
  cardState: CardState;
  activeBackground: Background | null;
  onChange: (updater: (prev: CardState) => CardState) => void;
  onExport: () => void;
}

export default function CardPreview({ cardState, activeBackground, onChange, onExport }: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Preload các nguồn ảnh (background, avatar) để vẽ lên Canvas mượt mà không nhấp nháy
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);

  // Load Background Image
  useEffect(() => {
    if (activeBackground?.url) {
      setIsPreloading(true);
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Tránh lỗi CORS khi xuất canvas
      img.src = activeBackground.url;
      img.onload = () => {
        bgImageRef.current = img;
        setIsPreloading(false);
        triggerRender();
      };
      img.onerror = () => {
        setIsPreloading(false);
      };
    }
  }, [activeBackground?.url]);

  // Load Avatar Image
  useEffect(() => {
    if (cardState.avatarUrl) {
      const img = new Image();
      img.src = cardState.avatarUrl;
      img.onload = () => {
        avatarImageRef.current = img;
        triggerRender();
      };
    } else {
      avatarImageRef.current = null;
      triggerRender();
    }
  }, [cardState.avatarUrl]);

  // Trigger render khi state thay đổi
  useEffect(() => {
    triggerRender();
  }, [
    cardState.customerInfo,
    cardState.avatarCrop,
    cardState.nameStyle,
    cardState.roleStyle,
    cardState.companyStyle,
    cardState.wishesStyle,
  ]);

  const triggerRender = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, 900, 1233);

    // 2. Vẽ Background
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, 900, 1233);
    } else {
      // Nền đen dự phòng nếu chưa có ảnh
      ctx.fillStyle = '#050A1F';
      ctx.fillRect(0, 0, 900, 1233);
    }

    // 3. Vẽ Avatar Khách Hàng (Tâm 450, 510, bán kính R=190)
    const centerX = 450;
    const centerY = 510;
    const radius = 190;

    ctx.save();
    
    // Tạo clip tròn
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (avatarImageRef.current) {
      const img = avatarImageRef.current;
      const crop = cardState.avatarCrop;

      // Tính kích thước ảnh theo scale
      // Vẽ ảnh giữ nguyên tỉ lệ aspect ratio, phủ kín đường tròn (object-cover)
      const aspect = img.width / img.height;
      let drawW = radius * 2 * crop.scale;
      let drawH = radius * 2 * crop.scale;

      if (aspect > 1) {
        drawW = drawH * aspect;
      } else {
        drawH = drawW / aspect;
      }

      // Đặt trọng tâm ảnh vào tâm vòng tròn
      const drawX = centerX - drawW / 2 + crop.x;
      const drawY = centerY - drawH / 2 + crop.y;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Nếu chưa có ảnh, vẽ placeholder màu xước nhẹ hoặc biểu tượng bóng người
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      
      // Biểu tượng user placeholder
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 20, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX, centerY + 110, 90, Math.PI, 0);
      ctx.fill();

      // Text hướng dẫnupload
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có ảnh chân dung', centerX, centerY + 140);
    }

    ctx.restore();

    // 4. Vẽ Họ và Tên (Gradient Neon Green sang White)
    if (cardState.customerInfo.fullName) {
      const style = cardState.nameStyle;
      ctx.save();
      ctx.font = `${style.fontWeight === 'normal' ? 'normal' : style.fontWeight} ${style.fontSize}px sans-serif`;
      ctx.textAlign = style.align;
      ctx.textBaseline = 'middle';

      const text = cardState.customerInfo.fullName.toUpperCase();
      
      // Tạo gradient màu Neon Green #51FFB1 sang White #FFFFFF dọc theo chữ
      const fontGrad = ctx.createLinearGradient(style.x, style.y - style.fontSize / 2, style.x, style.y + style.fontSize / 2);
      fontGrad.addColorStop(0, '#51FFB1');
      fontGrad.addColorStop(1, '#FFFFFF');
      
      ctx.fillStyle = fontGrad;
      ctx.fillText(text, style.x, style.y);
      ctx.restore();
    }

    // 5. Vẽ Chức Vụ (Chữ in hoa, màu trắng, font đậm)
    if (cardState.customerInfo.role) {
      const style = cardState.roleStyle;
      ctx.save();
      ctx.font = `${style.fontWeight === 'normal' ? 'normal' : style.fontWeight} ${style.fontSize}px sans-serif`;
      ctx.fillStyle = style.color;
      ctx.textAlign = style.align;
      ctx.textBaseline = 'middle';

      const text = cardState.customerInfo.role.toUpperCase();
      // Vẽ xuống dòng nếu chức vụ quá dài
      wrapText(ctx, text, style.x, style.y, 750, style.fontSize * style.lineHeight, style.align);
      ctx.restore();
    }

    // 6. Vẽ Đơn Vị / Công Ty (Chữ in hoa, màu trắng, font đậm)
    if (cardState.customerInfo.company) {
      const style = cardState.companyStyle;
      ctx.save();
      ctx.font = `${style.fontWeight === 'normal' ? 'normal' : style.fontWeight} ${style.fontSize}px sans-serif`;
      ctx.fillStyle = style.color;
      ctx.textAlign = style.align;
      ctx.textBaseline = 'middle';

      const text = cardState.customerInfo.company.toUpperCase();
      wrapText(ctx, text, style.x, style.y, 750, style.fontSize * style.lineHeight, style.align);
      ctx.restore();
    }

    // 7. Vẽ Lời chúc sinh nhật (Màu trắng, font mượt mà, căn lề thoáng bốc)
    if (cardState.customerInfo.wishes) {
      const style = cardState.wishesStyle;
      ctx.save();
      ctx.font = `${style.fontWeight === 'normal' ? 'normal' : style.fontWeight} ${style.fontSize}px sans-serif`;
      ctx.fillStyle = style.color;
      ctx.textAlign = style.align;
      ctx.textBaseline = 'top';

      wrapText(ctx, cardState.customerInfo.wishes, style.x, style.y, 700, style.fontSize * style.lineHeight, style.align);
      ctx.restore();
    }
  };

  // Hàm tự động xuống dòng và căn lề đúng chuẩn cho canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    align: 'left' | 'center' | 'right'
  ) => {
    // Tách dòng thủ công trước bằng phím xuống dòng \n của người dùng
    const paragraphs = text.split('\n');
    let currentY = y;

    paragraphs.forEach((pText) => {
      const words = pText.split(' ');
      let line = '';
      const lines: string[] = [];

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Vẽ từng dòng
      lines.forEach((lineText) => {
        ctx.fillText(lineText.trim(), x, currentY);
        currentY += lineHeight;
      });
    });
  };

  // --- LOGIC KÉO THẢ ẢNH CHÂN DUNG TRỰC QUAN TRÊN CANVAS ---
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 1233 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cardState.avatarUrl) return;
    const coords = getCanvasCoords(e);
    
    // Khoảng cách từ điểm click đến tâm vòng tròn (450, 510)
    const dist = Math.sqrt((coords.x - 450) ** 2 + (coords.y - 510) ** 2);
    if (dist <= 190) {
      setIsDragging(true);
      setDragStart({
        x: coords.x - cardState.avatarCrop.x,
        y: coords.y - cardState.avatarCrop.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getCanvasCoords(e);
    const newX = Math.round(coords.x - dragStart.x);
    const newY = Math.round(coords.y - dragStart.y);

    onChange((prev) => ({
      ...prev,
      avatarCrop: {
        ...prev.avatarCrop,
        x: newX,
        y: newY,
      },
    }));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 h-full w-full" id="card-preview-container">
      {/* Design Theme Header */}
      <div className="w-full flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Canvas Preview</span>
          <div className="h-[1px] w-20 sm:w-32 bg-white/10"></div>
        </div>
        <span className="text-[11px] font-semibold text-[#03E7D3] tracking-wider">900 × 1233 PX</span>
      </div>

      {/* Khung chứa Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full max-h-[calc(100vh-270px)] aspect-[900/1233] bg-[#050A1F] rounded-lg border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center group"
      >
        {isPreloading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-20">
            <div className="w-8 h-8 border-4 border-[#2B57F9] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#14C8FF] text-[11px] uppercase tracking-wider font-semibold">Đang tải...</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={900}
          height={1233}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`w-full h-full object-contain ${
            cardState.avatarUrl ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          style={{ display: 'block' }}
        />

        {/* Hover Hint */}
        {cardState.avatarUrl && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#050A1F]/90 border border-white/10 text-white text-[10px] py-1.5 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center gap-1">
            <Sparkles size={11} className="text-[#14C8FF]" />
            Kéo trực tiếp để căn chỉnh khuôn mặt khách hàng
          </div>
        )}
      </div>

      {/* Hành động Xuất PNG */}
      <div className="w-full">
        <button
          type="button"
          id="btn-export-png"
          onClick={onExport}
          disabled={isPreloading}
          className="w-full bg-gradient-to-r from-[#2B57F9] to-[#14C8FF] hover:brightness-110 disabled:brightness-50 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          Xuất ảnh PNG (900 × 1233)
        </button>
        <p className="text-white/40 text-[10px] mt-2 text-center flex items-center justify-center gap-1 uppercase tracking-wider font-medium">
          <AlertCircle size={11} className="text-[#14C8FF]" />
          Tải thiệp chúc mừng sinh nhật chuẩn kích thước in ấn
        </p>
      </div>
    </div>
  );
}
