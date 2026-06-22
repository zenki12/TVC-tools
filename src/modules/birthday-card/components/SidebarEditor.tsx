import React, { useState, useRef } from 'react';
import { CardState, TextStyle, AvatarCrop } from '../types';
import { 
  User, 
  Briefcase, 
  Building2, 
  Heart, 
  Upload, 
  RefreshCcw, 
  Move, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Plus, 
  Minus,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface SidebarEditorProps {
  cardState: CardState;
  onChange: (updater: (prev: CardState) => CardState) => void;
  onResetStyle: (field: 'name' | 'role' | 'company' | 'wishes') => void;
}

type ActiveTextTab = 'name' | 'role' | 'company' | 'wishes';

export default function SidebarEditor({ cardState, onChange, onResetStyle }: SidebarEditorProps) {
  const [activeTab, setActiveTab] = useState<ActiveTextTab>('name');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleGenderChange = (gender: 'male' | 'female') => {
    onChange((prev) => ({
      ...prev,
      customerType: gender,
      // Tự động load background mặc định tương ứng ở mức App.tsx sẽ bắt event này để đổi
    }));
  };

  const handleTextChange = (field: 'fullName' | 'role' | 'company' | 'wishes', val: string) => {
    onChange((prev) => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: val,
      },
    }));
  };

  const handleStyleChange = (field: ActiveTextTab, key: keyof TextStyle, value: any) => {
    const styleKey = `${field}Style` as const;
    onChange((prev) => ({
      ...prev,
      [styleKey]: {
        ...prev[styleKey],
        [key]: value,
      },
    }));
  };

  const handleCropChange = (key: keyof AvatarCrop, val: number) => {
    onChange((prev) => ({
      ...prev,
      avatarCrop: {
        ...prev.avatarCrop,
        [key]: val,
      },
    }));
  };

  // Xử lý upload ảnh
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onChange((prev) => ({
            ...prev,
            avatarUrl: e.target!.result as string,
            avatarCrop: { x: 0, y: 0, scale: 1 }, // Reset crop khi đổi ảnh
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeAvatar = () => {
    onChange((prev) => ({
      ...prev,
      avatarUrl: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Chọn style đang cấu hình để render các slider điều khiển
  const activeStyleKey = `${activeTab}Style` as const;
  const currentTextStyle = cardState[activeStyleKey];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1 custom-scrollbar" id="sidebar-editor-panel">
      {/* 1. CHỌN LOẠI KHÁCH HÀNG */}
      <div className="bg-[#000000]/40 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#14C8FF] rounded-full inline-block animate-pulse"></span>
          Loại khách hàng
        </h3>
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            type="button"
            id="btn-select-male"
            onClick={() => handleGenderChange('male')}
            className={`flex items-center justify-center gap-2 py-1.5 rounded text-[11px] font-semibold transition-all duration-200 ${
              cardState.customerType === 'male'
                ? 'bg-[#2B57F9] text-white shadow-md'
                : 'bg-transparent text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={14} />
            NAM
          </button>
          <button
            type="button"
            id="btn-select-female"
            onClick={() => handleGenderChange('female')}
            className={`flex items-center justify-center gap-2 py-1.5 rounded text-[11px] font-semibold transition-all duration-200 ${
              cardState.customerType === 'female'
                ? 'bg-[#14C8FF] text-slate-900 shadow-md'
                : 'bg-transparent text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="scale-x-[-1]" size={14} />
            NỮ
          </button>
        </div>
      </div>

      {/* 2. UPLOAD ẢNH CHÂN DUNG KHÁCH HÀNG */}
      <div className="bg-[#000000]/40 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#14C8FF] rounded-full inline-block animate-pulse"></span>
          Ảnh chân dung khách hàng
        </h3>
        
        {/* Dropzone */}
        {!cardState.avatarUrl ? (
          <div
            id="avatar-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-[#14C8FF] bg-white/10'
                : 'border-white/10 hover:border-[#14C8FF]/50 hover:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-2 border border-white/10">
              <Upload size={16} />
            </div>
            <p className="text-white text-xs font-semibold mb-1">Click hoặc kéo thả ảnh chân dung</p>
            <p className="text-white/40 text-[10px]">Định dạng JPG, PNG kích tốp</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-black flex items-center justify-center">
                  <img src={cardState.avatarUrl} alt="Avatar Thumb" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-white text-[11px] font-semibold">Ảnh đã tải lên</p>
                  <p className="text-[#51FFB1] text-[9.5px] flex items-center gap-1">
                    <CheckCircle size={10} /> Đã cắt vào khung tròn
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-remove-avatar"
                onClick={removeAvatar}
                className="text-rose-400 hover:text-rose-300 text-[11px] py-1 px-2 hover:bg-rose-950/30 rounded transition-colors"
              >
                Gỡ ảnh
              </button>
            </div>

            {/* Trình căn chỉnh ảnh trong khung tròn */}
            <div className="bg-[#000000]/60 p-3 rounded-lg border border-white/10 space-y-3">
              <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wider font-bold">
                <Move size={12} className="text-[#14C8FF]" />
                <span>Căn chỉnh ảnh trong khung:</span>
              </div>
              
              {/* Slider Scale */}
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>PHÓNG TO/THU NHỎ ({cardState.avatarCrop.scale.toFixed(1)}x)</span>
                  <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={() => handleCropChange('scale', Math.max(0.2, cardState.avatarCrop.scale - 0.1))}
                      className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Minus size={9} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleCropChange('scale', Math.min(5, cardState.avatarCrop.scale + 0.1))}
                      className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  id="avatar-scale-slider"
                  min="0.2"
                  max="5"
                  step="0.05"
                  value={cardState.avatarCrop.scale}
                  onChange={(e) => handleCropChange('scale', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#14C8FF]"
                />
              </div>

              {/* Slider X Offset */}
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>DỊCH CHUYỂN NGANG (X: {cardState.avatarCrop.x}px)</span>
                  <button 
                    type="button"
                    onClick={() => handleCropChange('x', 0)}
                    className="text-[9px] hover:text-white text-[#14C8FF]"
                  >
                    RESET X
                  </button>
                </div>
                <input
                  type="range"
                  id="avatar-x-slider"
                  min="-300"
                  max="300"
                  value={cardState.avatarCrop.x}
                  onChange={(e) => handleCropChange('x', parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#14C8FF]"
                />
              </div>

              {/* Slider Y Offset */}
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>DỊCH CHUYỂN DỌC (Y: {cardState.avatarCrop.y}px)</span>
                  <button 
                    type="button"
                    onClick={() => handleCropChange('y', 0)}
                    className="text-[9px] hover:text-white text-[#14C8FF]"
                  >
                    RESET Y
                  </button>
                </div>
                <input
                  type="range"
                  id="avatar-y-slider"
                  min="-300"
                  max="300"
                  value={cardState.avatarCrop.y}
                  onChange={(e) => handleCropChange('y', parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#14C8FF]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. NHẬP THÔNG TIN TEXT */}
      <div className="bg-[#000000]/40 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-3.5">
        <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#14C8FF] rounded-full inline-block animate-pulse"></span>
          Thông tin khách hàng
        </h3>

        {/* Họ tên */}
        <div className="text-left">
          <label className="text-[10px] opacity-50 block mb-1 uppercase tracking-wider">
            Họ và tên
          </label>
          <input
            type="text"
            id="input-fullname"
            value={cardState.customerInfo.fullName}
            onChange={(e) => handleTextChange('fullName', e.target.value)}
            placeholder="Ví dụ: ANH LÊ PHƯƠNG"
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 focus:border-[#14C8FF] rounded text-white text-xs outline-none transition-colors"
          />
        </div>

        {/* Chức vụ */}
        <div className="text-left">
          <label className="text-[10px] opacity-50 block mb-1 uppercase tracking-wider">
            Chức vụ
          </label>
          <input
            type="text"
            id="input-role"
            value={cardState.customerInfo.role}
            onChange={(e) => handleTextChange('role', e.target.value)}
            placeholder="Ví dụ: PHÓ TRƯỞNG BAN QUẢN TRỊ"
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 focus:border-[#14C8FF] rounded text-white text-xs outline-none transition-colors"
          />
        </div>

        {/* Đơn vị */}
        <div className="text-left">
          <label className="text-[10px] opacity-50 block mb-1 uppercase tracking-wider">
            Đơn vị / Công ty
          </label>
          <input
            type="text"
            id="input-company"
            value={cardState.customerInfo.company}
            onChange={(e) => handleTextChange('company', e.target.value)}
            placeholder="Ví dụ: TẬP ĐOÀN CÔNG NGHIỆP - NĂNG LƯỢNG"
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 focus:border-[#14C8FF] rounded text-white text-xs outline-none transition-colors"
          />
        </div>

        {/* Lời chúc */}
        <div className="text-left">
          <label className="text-[10px] opacity-50 block mb-1 uppercase tracking-wider">
            Lời chúc sinh nhật
          </label>
          <textarea
            id="input-wishes"
            value={cardState.customerInfo.wishes}
            onChange={(e) => handleTextChange('wishes', e.target.value)}
            rows={4}
            placeholder="Nhập lời chúc tốt đẹp nhất..."
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 focus:border-[#14C8FF] rounded text-white text-xs outline-none transition-colors resize-none leading-relaxed custom-scrollbar"
          ></textarea>
        </div>
      </div>

      {/* 4. CHỈNH SỬA ĐỊNH DẠNG TEXT */}
      <div className="bg-[#000000]/40 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm text-left">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Type size={12} />
            Định dạng chữ
          </h3>
          <button
            type="button"
            id="btn-reset-style"
            onClick={() => onResetStyle(activeTab)}
            className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            <RefreshCcw size={10} /> Reset
          </button>
        </div>

        {/* Tab chọn phần text */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-lg border border-white/10 mb-3 text-center">
          {(['name', 'role', 'company', 'wishes'] as ActiveTextTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              id={`tab-style-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`py-1 text-[10px] font-semibold rounded uppercase transition-all ${
                activeTab === tab
                  ? 'bg-[#2B57F9] text-white font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab === 'name' ? 'Họ tên' : tab === 'role' ? 'C.Vụ' : tab === 'company' ? 'Công ty' : 'Chúc'}
            </button>
          ))}
        </div>

        {/* Nội dung tinh chỉnh style cho tab được chọn */}
        <div className="space-y-4">
          {/* Cỡ chữ */}
          <div>
            <div className="flex justify-between text-[10px] opacity-60 mb-1 uppercase">
              <span>Cỡ chữ ({currentTextStyle.fontSize}px)</span>
            </div>
            <input
              type="range"
              id="slider-font-size"
              min="10"
              max="80"
              value={currentTextStyle.fontSize}
              onChange={(e) => handleStyleChange(activeTab, 'fontSize', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2B57F9]"
            />
          </div>

          {/* Vị trí Y */}
          <div>
            <div className="flex justify-between text-[10px] opacity-60 mb-1 uppercase">
              <span>Vị trí Dọc (Y: {currentTextStyle.y}px)</span>
            </div>
            <input
              type="range"
              id="slider-text-y"
              min="0"
              max="1233"
              value={currentTextStyle.y}
              onChange={(e) => handleStyleChange(activeTab, 'y', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2B57F9]"
            />
          </div>

          {/* Vị trí X */}
          <div>
            <div className="flex justify-between text-[10px] opacity-60 mb-1 uppercase">
              <span>Vị trí Ngang (X: {currentTextStyle.x}px)</span>
            </div>
            <input
              type="range"
              id="slider-text-x"
              min="0"
              max="900"
              value={currentTextStyle.x}
              onChange={(e) => handleStyleChange(activeTab, 'x', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2B57F9]"
            />
          </div>

          {/* Giới hạn Căn lề & Độ đậm */}
          <div className="grid grid-cols-2 gap-3">
            {/* Căn lề */}
            <div>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">Căn lề</span>
              <div className="flex bg-white/5 rounded border border-white/10 p-0.5">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => handleStyleChange(activeTab, 'align', align)}
                    className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                      currentTextStyle.align === align
                        ? 'bg-[#2B57F9] text-white'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {align === 'left' && <AlignLeft size={12} />}
                    {align === 'center' && <AlignCenter size={12} />}
                    {align === 'right' && <AlignRight size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Độ đậm */}
            <div>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">Độ đậm</span>
              <select
                id="select-font-weight"
                value={currentTextStyle.fontWeight}
                onChange={(e) => handleStyleChange(activeTab, 'fontWeight', e.target.value)}
                className="w-full py-1 px-2 text-xs bg-[#050A1F] border border-white/10 focus:border-[#14C8FF] rounded text-white outline-none cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
                <option value="extrabold">Ultra Bold</option>
              </select>
            </div>
          </div>

          {/* Khoảng cách dòng */}
          <div>
            <div className="flex justify-between text-[10px] opacity-60 mb-1 uppercase">
              <span>Dãn dòng ({currentTextStyle.lineHeight})</span>
            </div>
            <input
              type="range"
              id="slider-line-height"
              min="1"
              max="3"
              step="0.1"
              value={currentTextStyle.lineHeight}
              onChange={(e) => handleStyleChange(activeTab, 'lineHeight', parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2B57F9]"
            />
          </div>

          {/* Chọn nhanh màu */}
          {activeTab !== 'name' && (
            <div>
              <span className="text-[10px] opacity-60 block mb-1 uppercase">Màu sắc</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentTextStyle.color.startsWith('#') ? currentTextStyle.color : '#FFFFFF'}
                  onChange={(e) => handleStyleChange(activeTab, 'color', e.target.value)}
                  className="w-8 h-7 p-0 border-0 bg-transparent cursor-pointer rounded"
                />
                <input
                  type="text"
                  value={currentTextStyle.color}
                  onChange={(e) => handleStyleChange(activeTab, 'color', e.target.value)}
                  className="bg-white/5 border border-white/10 text-white rounded text-xs px-2 py-1 w-full uppercase opacity-70 focus:opacity-100"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
