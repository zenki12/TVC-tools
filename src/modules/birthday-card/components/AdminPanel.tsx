import React, { useState, useRef } from 'react';
import { Background } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle,
  FileImage,
  Star
} from 'lucide-react';

interface AdminPanelProps {
  backgrounds: Background[];
  onAddBackground: (newBg: Omit<Background, 'id' | 'uploadedAt'>) => Promise<void>;
  onDeleteBackground: (id: string) => Promise<void>;
  onUpdateBackgroundStatus: (bg: Background) => Promise<void>;
  onResetToDefault: () => Promise<void>;
  onClose: () => void;
}

export default function AdminPanel({
  backgrounds,
  onAddBackground,
  onDeleteBackground,
  onUpdateBackgroundStatus,
  onResetToDefault,
  onClose,
}: AdminPanelProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom states to avoid iframe alert/confirm issues
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          const resultUrl = event.target.result as string;
          
          // Kiểm tra size ảnh
          const img = new Image();
          img.src = resultUrl;
          img.onload = () => {
            if (img.width !== 900 || img.height !== 1233) {
              setSizeWarning(
                `Cảnh báo tỷ lệ: Ảnh bạn chọn có kích cỡ ${img.width}x${img.height} px. Mẫu chuẩn bắt buộc phải là 900 x 1233 px để tránh bị co giãn hoặc biến dạng.`
              );
            } else {
              setSizeWarning(null);
            }
            setImgUrl(resultUrl);
          };
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên cho mẫu nền !', 'error');
      return;
    }
    if (!imgUrl) {
      showToast('Vui lòng chọn ảnh làm hình nền 900x1233 px !', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddBackground({
        name,
        gender,
        url: imgUrl,
        isActive,
        isDefault,
      });

      // Clear Form sau khi thêm thành công
      setName('');
      setImgUrl(null);
      setSizeWarning(null);
      setIsDefault(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Đã thêm mẫu nền mới thành công vào thư viện!', 'success');
    } catch (err) {
      showToast('Có lỗi xảy ra khi thêm background.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (bg: Background) => {
    await onUpdateBackgroundStatus({
      ...bg,
      isActive: !bg.isActive,
    });
    showToast(`Đã thay đổi trạng thái của "${bg.name}"!`);
  };

  const handleSetDefault = async (bg: Background) => {
    if (!bg.isActive) {
      showToast('Mẫu nền đang ẩn, vui lòng chuyển sang chế độ "Sử dụng" trước.', 'error');
      return;
    }
    await onUpdateBackgroundStatus({
      ...bg,
      isDefault: true,
    });
    showToast(`Đã đặt "${bg.name}" làm mặc định!`, 'success');
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleResetFactory = () => {
    setShowResetConfirm(true);
  };

  return (
    <div className="bg-[#050A1F] min-h-screen text-white flex flex-col" id="admin-panel-screen">
      {/* Admin Header */}
      <header className="border-b border-white/10 bg-[#050A1F]/80 backdrop-blur-sm py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-admin-back"
            onClick={onClose}
            className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[#14C8FF] transition-colors cursor-pointer"
            title="Quay lại trình thiết kế thiệp"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-[#14C8FF] font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              Quản trị Background
            </h2>
            <p className="text-white/40 text-[10px] uppercase font-medium tracking-wider">Tinhvan Consulting • HiStaff</p>
          </div>
        </div>
        <button
          type="button"
          id="btn-reset-db"
          onClick={handleResetFactory}
          className="bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 text-rose-300 py-1.5 px-4 rounded text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
          title="Xóa hết mẫu tùy chỉnh, phục hồi cài đặt gốc ban đầu"
        >
          <RefreshCw size={12} /> Cài đặt gốc
        </button>
      </header>

      {/* Grid Layout chính */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
        {/* Form thêm background mới (2/5) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-[#000000]/40 border border-white/10 rounded-xl p-5 shadow-lg backdrop-blur-sm">
            <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus size={14} /> Thêm mẫu nền mới
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên mẫu */}
              <div>
                <label className="block text-[10px] opacity-50 uppercase tracking-widest mb-1.5 font-bold">Tên mẫu nền*</label>
                <input
                  type="text"
                  id="admin-bg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nền xanh Tuxedo Đêm Đông"
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/10 focus:border-[#14C8FF] rounded text-white text-xs outline-none"
                  required
                />
              </div>

              {/* Phân loại và Mặc định */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] opacity-50 uppercase tracking-widest mb-1.5 font-bold">Phân loại Nam / Nữ</label>
                  <select
                    id="admin-bg-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-1.5 bg-[#050A1F] border border-white/10 rounded text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="male">Khách Nam</option>
                    <option value="female">Khách Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] opacity-50 uppercase tracking-widest mb-1.5 font-bold">Trạng thái phát hành</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-1.5 px-3 rounded border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                  >
                    {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span className="uppercase tracking-wider">{isActive ? 'Hoạt động' : 'Ẩn'}</span>
                  </button>
                </div>
              </div>

              {/* Thiết lập làm mẫu mặc định */}
              <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded border border-white/10">
                <input
                  type="checkbox"
                  id="admin-bg-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-[#2B57F9] border-white/10 bg-white/5 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="admin-bg-default" className="text-white/70 text-[10px] uppercase font-bold cursor-pointer tracking-wider">
                  Đặt làm Mẫu mặc định
                  <span className="block text-[9px] opacity-50 font-normal mt-1 leading-normal normal-case">
                    *Hệ thống sẽ ưu tiên áp dụng mẫu này khi chuyển đổi giới tính khách hàng.
                  </span>
                </label>
              </div>

              {/* Upload File ảnh */}
              <div>
                <label className="block text-[10px] opacity-50 uppercase tracking-widest mb-1.5 font-bold">Ảnh nền chuẩn 900x1233 px*</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed bg-white/5 rounded p-5 text-center cursor-pointer transition-colors ${
                    imgUrl ? 'border-[#14C8FF] hover:bg-white/10' : 'border-white/10 hover:border-[#14C8FF]/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!imgUrl ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FileImage size={24} className="text-[#14C8FF] mb-1 opacity-60" />
                      <p className="text-white text-xs font-semibold uppercase tracking-wider">Nhấp để tải lên ảnh nền</p>
                      <p className="text-white/40 text-[9px] uppercase mt-1 tracking-wider">Tỷ lệ chuẩn 900x1233 pixel</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-[#51FFB1] text-xs font-semibold flex items-center gap-1 uppercase tracking-wider">
                        <Check size={14} /> Tải ảnh gốc thành công
                      </p>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Nhấn để thay đổi</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cảnh báo kích thước hình ảnh */}
              {sizeWarning && (
                <div id="admin-size-warning" className="bg-amber-950/40 border border-amber-500/35 p-3 rounded text-[10px] text-amber-200 flex gap-2 leading-relaxed">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{sizeWarning}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-admin-submit"
                disabled={isSubmitting || !imgUrl}
                className="w-full bg-gradient-to-r from-[#2B57F9] to-[#14C8FF] hover:brightness-110 disabled:brightness-50 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-widest shadow shadow-blue-600/10 cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmitting ? 'ĐANG TẢI LÊN...' : 'QUYẾT ĐỊNH THÊM NỀN'}
              </button>
            </form>
          </div>

          {/* Quy định Background */}
          <div className="bg-[#03E7D3]/10 border border-[#03E7D3]/20 p-4 rounded-xl text-[10px] text-white/70 space-y-2 backdrop-blur-sm">
            <h4 className="font-bold text-[#03E7D3] uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={14} /> QUY TẮC THIẾT KẾ NỀN GỐC
            </h4>
            <p className="opacity-80">1. Kích thước tỷ lệ vàng là **900 px (Rộng) x 1233 px (Cao)** để khớp tọa độ tâm chân dung (450, 490).</p>
            <p className="opacity-80">2. Hãy đảm bảo ảnh nền của bạn đã được đóng gói sẫm màu để text hiển thị rõ nhất.</p>
          </div>
        </section>

        {/* Danh sách các background (3/5) */}
        <section className="lg:col-span-3 bg-[#000000]/40 border border-white/10 rounded-xl p-5 shadow-lg flex flex-col h-[70vh] lg:h-auto overflow-hidden backdrop-blur-sm">
          <h3 className="text-[#14C8FF] font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Star size={14} className="text-[#14C8FF]" /> Thư viện mẫu nền tuyển chọn ({backgrounds.length})
          </h3>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-3" id="admin-bg-list">
              {backgrounds.map((bg) => (
                <div
                  key={bg.id}
                  id={`admin-bg-item-${bg.id}`}
                  className="bg-white/5 border border-white/10 hover:border-[#14C8FF]/30 p-2.5 rounded flex items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Thumbnail */}
                    <div className="w-10 h-14 rounded overflow-hidden bg-black shrink-0 border border-white/10">
                      <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Chi tiết */}
                    <div className="text-left overflow-hidden">
                      <h4 className="text-white text-xs font-bold truncate max-w-full" title={bg.name}>{bg.name}</h4>
                      <p className="text-[10px] tracking-wider uppercase font-medium text-white/40 mt-0.5">
                        DÀNH CHO: <span className="text-[#14C8FF] font-bold">{bg.gender === 'male' ? 'NAM' : 'NỮ'}</span>
                      </p>
                      
                      {/* Badge Tags */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {bg.isDefault && (
                          <span className="bg-[#2B57F9] border border-white/10 text-white text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                            MẶC ĐỊNH
                          </span>
                        )}
                        {!bg.isActive && (
                          <span className="bg-white/5 text-white/40 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider border border-white/10">
                            ẨN
                          </span>
                        )}
                        {bg.isActive && (
                          <span className="bg-emerald-950/50 text-emerald-400 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider border border-emerald-500/20">
                            HOẠT ĐỘNG
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Bật/Tắt Sử dụng */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(bg)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        bg.isActive
                          ? 'text-[#14C8FF] hover:bg-white/10'
                          : 'text-white/30 hover:bg-white/10'
                      }`}
                      title={bg.isActive ? 'Đổi sang Ẩn' : 'Đổi sang Sử dụng'}
                    >
                      {bg.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* Đặt làm Mặc định */}
                    {!bg.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(bg)}
                        className="p-1.5 rounded text-white/40 hover:text-[#14C8FF] hover:bg-white/10 transition-colors cursor-pointer"
                        title="Đặt mẫu này làm mặc định"
                      >
                        <Star size={14} />
                      </button>
                    )}

                    {/* Nút Xóa */}
                    <button
                      type="button"
                      onClick={() => handleDelete(bg.id, bg.name)}
                      className="p-1.5 rounded transition-colors cursor-pointer text-rose-400/60 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20"
                      title="Xóa mẫu nền"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm bg-[#050A1F]/90 border border-white/10 rounded p-4 shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${toast.type === 'success' ? 'bg-[#51FFB1]' : toast.type === 'error' ? 'bg-rose-500' : 'bg-[#14C8FF]'}`}></div>
          <p className="text-white text-xs font-semibold uppercase tracking-wider leading-relaxed">{toast.message}</p>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#050A1F] border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl text-left space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle size={20} />
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">Xóa mẫu nền tuyển chọn?</h4>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              Bạn có chắc chắn muốn xóa mẫu nền <strong className="text-[#14C8FF]">"{deleteName}"</strong>? 
              Hành động này sẽ xóa vĩnh viễn dữ liệu hình ảnh khỏi cơ sở dữ liệu trình duyệt và không thể khôi phục lại.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setDeleteId(null); setDeleteName(''); }}
                className="px-4 py-2 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deleteId) return;
                  try {
                    await onDeleteBackground(deleteId);
                    showToast(`Đã xóa mẫu nền "${deleteName}" thành công!`, 'success');
                  } catch (err) {
                    showToast('Có lỗi xảy ra khi xóa background!', 'error');
                  } finally {
                    setDeleteId(null);
                    setDeleteName('');
                  }
                }}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET FACTORY MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#050A1F] border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl text-left space-y-4">
            <div className="flex items-center gap-2.5 text-[#14C8FF]">
              <RefreshCw size={20} className="animate-spin-slow" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">Khôi phục cài đặt gốc?</h4>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              Hành động này sẽ xóa toàn bộ các mẫu nền tùy chỉnh do bạn đăng tải lên thiết bị này, 
              và thiết lập lại danh sách mẫu nền ban đầu mặc định chuẩn của Ban nhân sự HiStaff.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onResetToDefault();
                    showToast('Đã khôi phục thành công thư viện mặc định chuẩn của HiStaff !', 'success');
                  } catch (err) {
                    showToast('Có lỗi xảy ra trong quá trình khôi phục gốc!', 'error');
                  } finally {
                    setShowResetConfirm(false);
                  }
                }}
                className="px-4 py-2 rounded bg-gradient-to-r from-[#2B57F9] to-[#14C8FF] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Xác nhận Phục hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
