import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardState, Background, TextStyle } from './types';
import { 
  getAllBackgrounds, 
  saveBackground, 
  deleteBackground, 
  resetDatabaseToDefault 
} from './utils/db';

import SidebarEditor from './components/SidebarEditor';
import CardPreview from './components/CardPreview';
import BackgroundLibrary from './components/BackgroundLibrary';
import AdminPanel from './components/AdminPanel';

import { 
  Cake, 
  Settings, 
  Layers, 
  Sparkles, 
  Briefcase,
  TrendingUp,
  FileText
} from 'lucide-react';

// Cài đặt vị trí và style chữ mặc định tối ưu
const DEFAULT_NAME_STYLE: TextStyle = { 
  fontSize: 44, 
  fontWeight: 'bold', 
  color: '#51FFB1', // Neon green gradient style vẽ trong canvas
  align: 'center', 
  x: 450, 
  y: 800, 
  lineHeight: 1.2 
};

const DEFAULT_ROLE_STYLE: TextStyle = { 
  fontSize: 21, 
  fontWeight: 'bold', 
  color: '#FFFFFF', 
  align: 'center', 
  x: 450, 
  y: 848, 
  lineHeight: 1.3 
};

const DEFAULT_COMPANY_STYLE: TextStyle = { 
  fontSize: 18, 
  fontWeight: 'bold', 
  color: '#FFFFFF', 
  align: 'center', 
  x: 450, 
  y: 874, 
  lineHeight: 1.3 
};

const DEFAULT_WISHES_STYLE: TextStyle = { 
  fontSize: 23, 
  fontWeight: 'normal', 
  color: '#FFFFFF', 
  align: 'center', 
  x: 450, 
  y: 934, 
  lineHeight: 1.5 
};

export default function BirthdayCardPage() {
  const [viewMode, setViewMode] = useState<'editor' | 'admin'>('editor');
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  
  // Trạng thái cấu hình thiệp hiện tại, khởi tạo mặc định bằng dữ liệu mẫu y hệt như bức "Ảnh hoàn chỉnh"
  const [cardState, setCardState] = useState<CardState>({
    customerType: 'male',
    selectedBackgroundId: 'default_male',
    customerInfo: {
      fullName: 'ANH LÊ PHƯƠNG',
      role: 'PHÓ TRƯỞNG BAN QUẢN TRỊ NGUỒN NHÂN LỰC',
      company: 'TẬP ĐOÀN CÔNG NGHIỆP - NĂNG LƯỢNG QUỐC GIA VIỆT NAM',
      wishes: 'Nhân dịp sinh nhật Anh, Tinhvân Consulting trân trọng gửi tới Anh những lời chúc tốt đẹp nhất.\n\nKính chúc Anh luôn dồi dào sức khỏe, hạnh phúc và thành công; tiếp tục phát huy vai trò lãnh đạo, dẫn dắt đội ngũ nhân sự phát triển vững mạnh và tạo nên nhiều giá trị bền vững của Tập đoàn Công nghiệp - Năng lượng Quốc gia Việt Nam.'
    },
    avatarUrl: null, // Sẽ được upload nhúng trực quan
    avatarCrop: { x: 0, y: 0, scale: 1 },
    nameStyle: { ...DEFAULT_NAME_STYLE },
    roleStyle: { ...DEFAULT_ROLE_STYLE },
    companyStyle: { ...DEFAULT_COMPANY_STYLE },
    wishesStyle: { ...DEFAULT_WISHES_STYLE }
  });

  // Tải danh sách background từ IndexedDB khi mở app
  const loadBackgrounds = async () => {
    try {
      const data = await getAllBackgrounds();
      setBackgrounds(data);
    } catch (err) {
      console.error('Không thể load danh sách background từ DB:', err);
    }
  };

  useEffect(() => {
    loadBackgrounds();
  }, []);

  // Sync background mặc định khi giới tính khách hàng thay đổi
  useEffect(() => {
    if (backgrounds.length > 0) {
      const defaultBg = backgrounds.find(
        (bg) => bg.gender === cardState.customerType && bg.isDefault && bg.isActive
      );
      
      if (defaultBg) {
        setCardState((prev) => ({
          ...prev,
          selectedBackgroundId: defaultBg.id,
        }));
      } else {
        // Dự phòng lấy background đầu tiên hợp lệ của giới tính đó
        const alternativeBg = backgrounds.find(
          (bg) => bg.gender === cardState.customerType && bg.isActive
        );
        if (alternativeBg) {
          setCardState((prev) => ({
            ...prev,
            selectedBackgroundId: alternativeBg.id,
          }));
        }
      }
    }
  }, [cardState.customerType, backgrounds]);

  // Tìm background đang active hiện tại
  const activeBackground = backgrounds.find((bg) => bg.id === cardState.selectedBackgroundId) || null;

  // Reset Style của một phần text về mặc định chuẩn
  const handleResetStyle = (field: 'name' | 'role' | 'company' | 'wishes') => {
    const styleKey = `${field}Style` as const;
    let targetDefault: TextStyle;
    
    switch (field) {
      case 'name':
        targetDefault = DEFAULT_NAME_STYLE;
        break;
      case 'role':
        targetDefault = DEFAULT_ROLE_STYLE;
        break;
      case 'company':
        targetDefault = DEFAULT_COMPANY_STYLE;
        break;
      case 'wishes':
        targetDefault = DEFAULT_WISHES_STYLE;
        break;
    }

    setCardState((prev) => ({
      ...prev,
      [styleKey]: { ...targetDefault },
    }));
  };

  // --- ADMIN ACTIONS ---
  const handleAddBackground = async (newBg: Omit<Background, 'id' | 'uploadedAt'>) => {
    const payload: Background = {
      ...newBg,
      id: `bg_${Date.now()}`,
      uploadedAt: Date.now(),
    };
    await saveBackground(payload);
    await loadBackgrounds();
  };

  const handleDeleteBg = async (id: string) => {
    await deleteBackground(id);
    await loadBackgrounds();
    
    if (cardState.selectedBackgroundId === id) {
      setCardState((prev) => ({
        ...prev,
        selectedBackgroundId: prev.customerType === 'male' ? 'default_male' : 'default_female'
      }));
    }
  };

  const handleUpdateBgStatus = async (bg: Background) => {
    await saveBackground(bg);
    await loadBackgrounds();
  };

  const handleResetDatabase = async () => {
    await resetDatabaseToDefault();
    await loadBackgrounds();
  };

  // --- EXPORT IMAGE ---
  const handleExportPNG = () => {
    const canvasElement = document.querySelector('#card-preview-container canvas') as HTMLCanvasElement;
    if (!canvasElement) {
      alert('Không tìm thấy khung vẽ thiệp để xuất!');
      return;
    }

    // Tải ảnh chuẩn PNG 900x1233 px
    const rawName = cardState.customerInfo.fullName || 'khach-hang';
    const cleanName = rawName.trim()
      .toLowerCase()
      .normalize('NFD') // Khử dấu tiếng Việt
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const fileName = `sinh-nhat-${cleanName}.png`;
    const dataUrl = canvasElement.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-full lg:h-full bg-[#050A1F] text-white font-sans flex flex-col overflow-x-hidden select-none lg:overflow-hidden">
      <AnimatePresence mode="wait">
        {viewMode === 'editor' ? (
          <motion.div
            key="editor-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col lg:h-full lg:overflow-hidden"
          >
            {/* Header */}
            <header className="border-b border-white/10 bg-[#050A1F]/80 backdrop-blur-sm sticky top-0 z-30 py-4 px-6 flex items-center justify-between shadow-md">
              {/* Logo & Slogan */}
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#2B57F9] to-[#03E7D3] p-2.5 rounded shadow-lg flex items-center justify-center">
                  <Cake className="text-white animate-pulse" size={18} />
                </div>
                <div className="text-left">
                  <h1 className="text-white text-sm font-bold tracking-widest uppercase flex items-center gap-2 leading-none">
                    Tinhvân Consulting 
                    <span className="text-[#03E7D3] text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10">HiStaff</span>
                  </h1>
                  <p className="text-white/40 text-[9px] mt-1.5 uppercase font-semibold tracking-widest leading-none">
                    Birthday Card Engine
                  </p>
                </div>
              </div>

              {/* Settings / Admin Switch */}
              <button
                type="button"
                id="btn-switch-admin"
                onClick={() => setViewMode('admin')}
                className="bg-white/5 hover:bg-white/10 text-[#14C8FF] hover:text-white border border-white/10 py-1.5 px-4 rounded text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 uppercase tracking-wider"
              >
                <Settings size={13} className="animate-spin-slow text-[#14C8FF]" />
                <span>QUẢN TRỊ MẪU NỀN</span>
              </button>
            </header>

            {/* Khu vực trung tâm gồm 3 cột bento-grid hiện đại */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch lg:h-[calc(100vh-142px)] lg:overflow-hidden">
              {/* CỘT TRÁI: Nhập liệu & Chỉnh font */}
              <section className="lg:col-span-1 flex flex-col justify-between lg:h-full lg:overflow-hidden" id="editor-sidebar-column">
                <SidebarEditor
                  cardState={cardState}
                  onChange={setCardState}
                  onResetStyle={handleResetStyle}
                />
              </section>

              {/* CỘT GIỮA: Real-time Preview Thiệp */}
              <section className="lg:col-span-1 flex flex-col justify-center bg-black/20 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm lg:h-full lg:overflow-hidden" id="preview-stage-column">
                <CardPreview
                  cardState={cardState}
                  activeBackground={activeBackground}
                  onChange={setCardState}
                  onExport={handleExportPNG}
                />
              </section>

              {/* CỘT PHẢI: Khám phá Background Library */}
              <section className="lg:col-span-1 flex flex-col justify-between lg:h-full lg:overflow-hidden" id="background-library-column">
                <BackgroundLibrary
                  backgrounds={backgrounds}
                  cardState={cardState}
                  onSelectBackground={(id) => setCardState((prev) => ({ ...prev, selectedBackgroundId: id }))}
                  onOpenAdmin={() => setViewMode('admin')}
                />
              </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black/40 py-4 text-center text-[9px] text-white/30 font-semibold uppercase tracking-widest">
              © 2026 Tinhvan Consulting. All Rights Reserved. HiStaff Professional HRM Solution.
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="admin-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <AdminPanel
              backgrounds={backgrounds}
              onAddBackground={handleAddBackground}
              onDeleteBackground={handleDeleteBg}
              onUpdateBackgroundStatus={handleUpdateBgStatus}
              onResetToDefault={handleResetDatabase}
              onClose={() => setViewMode('editor')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
