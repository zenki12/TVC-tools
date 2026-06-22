import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export type GeminiKeyStatus = 'idle' | 'checking' | 'valid' | 'error';

interface Props {
  savedKey: string;
  status: GeminiKeyStatus;
  statusMessage: string | null;
  onSave: (apiKey: string) => void;
  onClear: () => void;
  onCheck: (apiKey: string) => void;
}

export function GeminiApiKeyPanel({
  savedKey,
  status,
  statusMessage,
  onSave,
  onClear,
  onCheck,
}: Props) {
  const [draftKey, setDraftKey] = useState(savedKey);
  const [showKey, setShowKey] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setDraftKey(savedKey), [savedKey]);

  const normalizedKey = draftKey.trim();

  return (
    <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 sm:p-5">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#14C8FF]/70"
      >
        <div className="rounded-lg bg-amber-300/10 p-2 text-amber-200">
          <KeyRound size={20} />
        </div>
        <h2 className="flex-1 font-semibold text-white">Cấu hình Gemini API</h2>
        <ChevronDown
          size={18}
          className={`text-white/45 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <>
          <p className="mt-4 text-sm text-white/55">
            Dùng API key Gemini của bạn để tạo bản nháp. Key chỉ được lưu trong phiên
            trình duyệt hiện tại và được gửi qua backend cho từng yêu cầu Gemini.
          </p>

      <div className="mt-5 rounded-xl border border-amber-300/20 bg-black/20 p-4 text-sm text-amber-50/90">
        <div className="flex gap-2 font-semibold text-amber-200">
          <ShieldAlert size={17} className="mt-0.5 shrink-0" /> Cảnh báo bảo mật và chi phí
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-white/60">
          <li>Việc sử dụng Gemini chịu hạn mức và có thể phát sinh chi phí từ Google.</li>
          <li>Không gửi key qua email hoặc chat. Thu hồi key ngay khi nghi ngờ bị lộ.</li>
          <li>Không nhập key trên máy dùng chung; hãy xóa key hoặc đăng xuất khi hoàn tất.</li>
        </ul>
      </div>

      <details className="mt-4 rounded-xl border border-white/10 bg-black/15 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#14C8FF]">
          Hướng dẫn lấy Gemini API key
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-white/60">
          <li>
            Mở{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#14C8FF] hover:underline"
            >
              Google AI Studio <ExternalLink size={12} />
            </a>{' '}
            và đăng nhập tài khoản Google của bạn.
          </li>
          <li>Chọn tạo API key và chọn đúng Google Cloud project sẽ quản lý quota.</li>
          <li>Thiết lập giới hạn quota, billing và các hạn chế key phù hợp nếu có.</li>
          <li>Dán key vào ô bên dưới, lưu trong phiên rồi kiểm tra kết nối.</li>
          <li>Nếu key bị lộ, quay lại Google AI Studio để thu hồi và tạo key mới.</li>
        </ol>
      </details>

      <label className="mt-4 block text-xs font-medium text-white/65">
        Gemini API key
        <span className="relative mt-1.5 block">
          <input
            type={showKey ? 'text' : 'password'}
            value={draftKey}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="Nhập API key từ Google AI Studio"
            className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 pr-11 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#14C8FF]/70"
          />
          <button
            type="button"
            onClick={() => setShowKey((visible) => !visible)}
            aria-label={showKey ? 'Ẩn API key' : 'Hiện API key'}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/45 hover:text-white"
          >
            {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!normalizedKey || status === 'checking'}
          onClick={() => onSave(normalizedKey)}
          className="rounded-lg bg-[#2B57F9] px-3 py-2 text-xs font-semibold hover:bg-[#2147d4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Lưu trong phiên
        </button>
        <button
          type="button"
          disabled={!normalizedKey || status === 'checking'}
          onClick={() => onCheck(normalizedKey)}
          className="flex items-center gap-1.5 rounded-lg border border-[#14C8FF]/35 px-3 py-2 text-xs font-semibold text-[#8DE8FF] hover:bg-[#14C8FF]/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'checking' && <LoaderCircle size={14} className="animate-spin" />}
          Kiểm tra kết nối
        </button>
        <button
          type="button"
          disabled={!savedKey && !draftKey}
          onClick={() => {
            setDraftKey('');
            onClear();
          }}
          className="flex items-center gap-1.5 rounded-lg border border-rose-300/25 px-3 py-2 text-xs text-rose-200 hover:bg-rose-300/10 disabled:opacity-40"
        >
          <Trash2 size={14} /> Xóa key
        </button>
      </div>

      <div className="mt-3 min-h-5 text-xs">
        {status === 'valid' && (
          <p className="flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 size={14} /> {statusMessage ?? 'Kết nối Gemini thành công.'}
          </p>
        )}
        {status === 'error' && (
          <p className="flex items-start gap-1.5 text-rose-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {statusMessage}
          </p>
        )}
        {status === 'idle' && savedKey && (
          <p className="text-white/45">Đã lưu key cho phiên trình duyệt hiện tại.</p>
        )}
      </div>
        </>
      )}
    </section>
  );
}
