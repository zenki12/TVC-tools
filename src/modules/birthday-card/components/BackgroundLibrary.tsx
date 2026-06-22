import React from 'react';
import { Background, CardState } from '../types';
import { Image as ImageIcon, Check, Sparkles } from 'lucide-react';

interface BackgroundLibraryProps {
  backgrounds: Background[];
  cardState: CardState;
  onSelectBackground: (id: string) => void;
  onOpenAdmin: () => void;
}

export default function BackgroundLibrary({
  backgrounds,
  cardState,
  onSelectBackground,
  onOpenAdmin,
}: BackgroundLibraryProps) {
  const filteredBackgrounds = backgrounds.filter(
    (bg) => bg.gender === cardState.customerType && bg.isActive
  );

  return (
    <div className="flex flex-col gap-4 text-left h-full" id="background-library-panel">
      {/* Header */}
      <div className="bg-[#000000]/40 border border-white/10 rounded-xl p-4 shadow-lg flex items-center justify-between backdrop-blur-sm">
        <div>
          <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#14C8FF] rounded-full inline-block animate-pulse"></span>
            Thư viện Background
          </h3>
          <p className="text-white/40 text-[10px] mt-1.5 uppercase font-medium tracking-wider">
            KHÁCH HÀNG {cardState.customerType === 'male' ? 'NAM' : 'NỮ'}
          </p>
        </div>
        <button
          type="button"
          id="btn-goto-admin"
          onClick={onOpenAdmin}
          className="bg-white/5 hover:bg-[#2B57F9] text-white hover:text-white border border-white/10 hover:border-transparent py-1 px-3 rounded text-[11px] font-semibold cursor-pointer transition-all duration-200 uppercase tracking-widest"
        >
          QUẢN TRỊ
        </button>
      </div>

      {/* Lưới các mẫu nền */}
      <div className="flex-1 h-0 bg-[#000000]/40 border border-white/10 rounded-xl p-3 overflow-y-auto custom-scrollbar backdrop-blur-sm">
        {filteredBackgrounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-white/30 border border-dashed border-white/10 rounded-xl min-h-[200px]">
            <ImageIcon size={32} className="stroke-1 mb-2" />
            <p className="text-xs">Chưa có background nào được cấu hình</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" id="template-grid">
            {filteredBackgrounds.map((bg) => {
              const isSelected = cardState.selectedBackgroundId === bg.id;
              
              return (
                <div
                  key={bg.id}
                  id={`bg-card-${bg.id}`}
                  onClick={() => onSelectBackground(bg.id)}
                  className={`group relative aspect-[900/1233] bg-black rounded overflow-hidden border cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-[#14C8FF] ring-1 ring-[#14C8FF]/50 scale-[1.01] shadow-lg shadow-blue-500/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Ảnh bối cảnh */}
                  <img
                    src={bg.url}
                    alt={bg.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Lớp phủ dệt bóng mờ */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 text-left flex flex-col justify-end h-1/2">
                    <p className="text-[10px] font-medium text-white truncate max-w-full" title={bg.name}>
                      {bg.name}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {bg.isDefault && (
                        <span className="bg-[#2B57F9] border border-white/10 text-white text-[8px] px-1 rounded flex items-center gap-0.5">
                          <Sparkles size={7} /> MẶC ĐỊNH
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Biểu tượng Check khi đang chọn */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#14C8FF] border border-black text-black flex items-center justify-center shadow-md">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thông tin mẹo xuất ảnh */}
      <div className="bg-[#03E7D3]/10 border border-[#03E7D3]/20 rounded-xl p-3 text-[10px] text-white/70 space-y-1 backdrop-blur-sm">
        <p className="font-bold text-[#03E7D3] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} /> QUY TẮC THIẾT KẾ CHUẨN
        </p>
        <p className="opacity-80">1. Template nền được thiết kế tối sẫm, tương phản cao để làm nổi bật chân dung khách hàng.</p>
        <p className="opacity-80">2. Khi tạo mẫu cho nam/nữ, hệ thống sẽ ưu tiên áp dụng background mặc định tương ứng.</p>
      </div>
    </div>
  );
}
