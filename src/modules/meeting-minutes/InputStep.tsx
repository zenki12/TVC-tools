import mammoth from 'mammoth';
import { FileText, LoaderCircle, Sparkles, Upload } from 'lucide-react';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ParticipantGroupsEditor } from './ParticipantGroupsEditor.js';
import type { MinutesMetadata } from './types.js';

interface Props {
  metadata: MinutesMetadata;
  rawText: string;
  loading: boolean;
  error: string | null;
  canGenerate: boolean;
  geminiConfiguration: ReactNode;
  onMetadataChange: (metadata: MinutesMetadata) => void;
  onRawTextChange: (rawText: string) => void;
  onGenerate: () => void;
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#14C8FF]/70';

function RequiredMark() {
  return (
    <span data-required-marker="true" aria-hidden="true" className="ml-1 text-rose-400">
      *
    </span>
  );
}

export function InputStep({
  metadata,
  rawText,
  loading,
  error,
  canGenerate,
  geminiConfiguration,
  onMetadataChange,
  onRawTextChange,
  onGenerate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);

  const updateField = (field: keyof Omit<MinutesMetadata, 'thanhPhan'>, value: string) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    setReadingFile(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'txt') {
        onRawTextChange(await file.text());
      } else if (extension === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        onRawTextChange(result.value);
      } else {
        throw new Error('Chỉ hỗ trợ file .txt hoặc .docx.');
      }
    } catch (fileReadError) {
      setFileError(
        fileReadError instanceof Error ? fileReadError.message : 'Không thể đọc file đã chọn.',
      );
    } finally {
      setReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onGenerate();
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#03E7D3]">Bước 1 / 2</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Nhập thông tin cuộc họp</h1>
        <p className="mt-2 text-sm text-white/50">
          Cung cấp metadata và ghi chú thô. AI sẽ tạo bản nháp có cấu trúc để bạn kiểm tra.
        </p>
      </header>

      {geminiConfiguration}

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <FileText size={18} className="text-[#14C8FF]" /> Thông tin chung
          </div>
          <p className="text-xs text-white/45">
            <span className="text-rose-400">*</span> Bắt buộc
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-white/60">
            Khách hàng<RequiredMark />
            <input required placeholder="Ví dụ: Công ty ABC" className={inputClass} value={metadata.khachHang} onChange={(event) => updateField('khachHang', event.target.value)} />
          </label>
          <label className="text-xs font-medium text-white/60">
            Nội dung<RequiredMark />
            <input required placeholder="Ví dụ: Trao đổi kế hoạch triển khai dự án" className={inputClass} value={metadata.noiDung} onChange={(event) => updateField('noiDung', event.target.value)} />
          </label>
          <label className="text-xs font-medium text-white/60">
            Thời gian<RequiredMark />
            <input required type="time" title="Ví dụ: 09:00" aria-label="Thời gian, ví dụ 09:00" className={inputClass} value={metadata.thoiGian} onChange={(event) => updateField('thoiGian', event.target.value)} />
          </label>
          <label className="text-xs font-medium text-white/60">
            Ngày<RequiredMark />
            <input required type="date" title="Chọn ngày diễn ra cuộc họp" aria-label="Ngày diễn ra cuộc họp" className={inputClass} value={metadata.ngay} onChange={(event) => updateField('ngay', event.target.value)} />
          </label>
          <label className="text-xs font-medium text-white/60 sm:col-span-2">
            Địa điểm / Hình thức<RequiredMark />
            <input required placeholder="Ví dụ: Họp trực tuyến qua Microsoft Teams" className={inputClass} value={metadata.diaDiem} onChange={(event) => updateField('diaDiem', event.target.value)} />
          </label>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <ParticipantGroupsEditor
            groups={metadata.thanhPhan}
            onChange={(thanhPhan) => onMetadataChange({ ...metadata, thanhPhan })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Ghi chú / transcript thô<RequiredMark /></h2>
            <p className="mt-1 text-xs text-white/40">Dán nội dung hoặc tải file .txt, .docx. Đây là dữ liệu để AI soạn biên bản.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <button
            type="button"
            disabled={readingFile}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            {readingFile ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />}
            {readingFile ? 'Đang đọc file...' : 'Tải file .txt / .docx'}
          </button>
        </div>
        <textarea
          required
          rows={13}
          value={rawText}
          onChange={(event) => onRawTextChange(event.target.value)}
          placeholder="Ví dụ: Khách hàng thống nhất phạm vi dự án, TVC gửi kế hoạch trước ngày 25/06..."
          className={`${inputClass} mt-4 resize-y leading-relaxed`}
        />
        {fileError && <p className="mt-2 text-sm text-rose-300">{fileError}</p>}
      </section>

      {error && (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || readingFile || !canGenerate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B57F9] to-[#14C8FF] px-5 py-3 text-sm font-bold shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
          {loading ? 'AI đang tạo biên bản...' : 'Tạo biên bản bằng AI'}
        </button>
      </div>
    </form>
  );
}
