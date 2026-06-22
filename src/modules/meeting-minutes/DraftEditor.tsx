import { ArrowLeft, FileDown, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { ParticipantGroupsEditor } from './ParticipantGroupsEditor';
import type { MeetingMinutes, MinutesBlock, TableBlockData } from './types';

interface Props {
  content: MeetingMinutes;
  onChange: (content: MeetingMinutes) => void;
  onBack: () => void;
  onExport: () => void;
  exporting: boolean;
  exportError: string | null;
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#14C8FF]/70';

function StringListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        <button type="button" onClick={() => onChange([...items, ''])} className="flex items-center gap-1 text-xs text-[#14C8FF]">
          <Plus size={13} /> Thêm dòng
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="pt-2 text-xs text-white/30">{index + 1}.</span>
          <textarea
            rows={2}
            className={`${inputClass} resize-y`}
            value={item}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button type="button" title="Xóa dòng" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="p-2 text-rose-300 hover:bg-rose-400/10">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

function TableEditor({ table, onChange }: { table: TableBlockData; onChange: (table: TableBlockData) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-white/[0.06]">
          <tr>
            {table.columns.map((column, columnIndex) => (
              <th key={columnIndex} className="min-w-36 border-b border-r border-white/10 p-2 last:border-r-0">
                <input
                  className={`${inputClass} font-semibold`}
                  value={column}
                  onChange={(event) => {
                    const next = structuredClone(table);
                    next.columns[columnIndex] = event.target.value;
                    onChange(next);
                  }}
                />
              </th>
            ))}
            <th className="w-10 border-b border-white/10" />
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/5 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-r border-white/10 p-2 last:border-r-0">
                  <textarea
                    rows={2}
                    className={`${inputClass} min-w-36 resize-y`}
                    value={cell}
                    onChange={(event) => {
                      const next = structuredClone(table);
                      next.rows[rowIndex][cellIndex] = event.target.value;
                      onChange(next);
                    }}
                  />
                </td>
              ))}
              <td className="p-2 text-center">
                <button type="button" title="Xóa hàng" onClick={() => onChange({ ...table, rows: table.rows.filter((_, index) => index !== rowIndex) })} className="text-rose-300">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => onChange({ ...table, rows: [...table.rows, Array(table.columns.length).fill('')] })}
        className="flex w-full items-center justify-center gap-1 border-t border-white/10 py-2 text-xs text-[#14C8FF] hover:bg-white/[0.03]"
      >
        <Plus size={13} /> Thêm hàng
      </button>
    </div>
  );
}

function BlocksEditor({ blocks, onChange }: { blocks: MinutesBlock[]; onChange: (blocks: MinutesBlock[]) => void }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, blockIndex) => (
        <div key={blockIndex} className="rounded-xl border border-white/10 bg-black/10 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">{block.type}</p>
          {block.type === 'paragraph' && (
            <textarea
              rows={4}
              className={`${inputClass} resize-y leading-relaxed`}
              value={block.text}
              onChange={(event) => {
                const next = structuredClone(blocks);
                const target = next[blockIndex];
                if (target.type === 'paragraph') target.text = event.target.value;
                onChange(next);
              }}
            />
          )}
          {block.type === 'bullets' && (
            <StringListEditor
              title="Danh sách ý"
              items={block.items}
              onChange={(items) => {
                const next = structuredClone(blocks);
                const target = next[blockIndex];
                if (target.type === 'bullets') target.items = items;
                onChange(next);
              }}
            />
          )}
          {block.type === 'table' && (
            <TableEditor
              table={block}
              onChange={(table) => {
                const next = structuredClone(blocks);
                next[blockIndex] = { type: 'table', ...table };
                onChange(next);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function DraftEditor({
  content,
  onChange,
  onBack,
  onExport,
  exporting,
  exportError,
}: Props) {
  const update = (mutate: (next: MeetingMinutes) => void) => {
    const next = structuredClone(content);
    mutate(next);
    onChange(next);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#03E7D3]">Bước 2 / 2</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Xem và chỉnh sửa bản nháp</h1>
          <p className="mt-2 text-sm text-white/50">Kiểm tra kỹ toàn bộ nội dung trước bước xuất file.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            <ArrowLeft size={15} /> Quay lại
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2B57F9] to-[#14C8FF] px-3 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
          >
            {exporting ? <LoaderCircle size={15} className="animate-spin" /> : <FileDown size={15} />}
            {exporting ? 'Đang xuất file...' : 'Xuất file .docx'}
          </button>
        </div>
      </header>

      {exportError && (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {exportError}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-white/45">Tiêu đề biên bản</label>
        <textarea className={`${inputClass} mt-2 resize-y text-lg font-bold`} rows={2} value={content.title} onChange={(event) => update((next) => { next.title = event.target.value; })} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([
            ['khachHang', 'Khách hàng'],
            ['noiDung', 'Nội dung'],
            ['thoiGian', 'Thời gian'],
            ['ngay', 'Ngày'],
            ['diaDiem', 'Địa điểm / Hình thức'],
          ] as const).map(([field, label]) => (
            <label key={field} className={`text-xs text-white/50 ${field === 'diaDiem' ? 'sm:col-span-2' : ''}`}>
              {label}
              <input className={`${inputClass} mt-1.5`} value={content.metadata[field]} onChange={(event) => update((next) => { next.metadata[field] = event.target.value; })} />
            </label>
          ))}
        </div>
        <div className="mt-6 border-t border-white/10 pt-5">
          <ParticipantGroupsEditor groups={content.metadata.thanhPhan} onChange={(groups) => update((next) => { next.metadata.thanhPhan = groups; })} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <StringListEditor title="Mục tiêu" items={content.mucTieu} onChange={(items) => update((next) => { next.mucTieu = items; })} />
      </section>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <h2 className="text-lg font-bold">Nội dung chính</h2>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Tổng quan cuộc họp</h3>
          <BlocksEditor blocks={content.noiDungChinh.tongQuan} onChange={(blocks) => update((next) => { next.noiDungChinh.tongQuan = blocks; })} />
        </div>
        {content.noiDungChinh.tieuMuc.map((section, sectionIndex) => (
          <div key={sectionIndex} className="border-t border-white/10 pt-5">
            <input className={`${inputClass} mb-3 font-semibold`} value={section.heading} onChange={(event) => update((next) => { next.noiDungChinh.tieuMuc[sectionIndex].heading = event.target.value; })} />
            <BlocksEditor blocks={section.blocks} onChange={(blocks) => update((next) => { next.noiDungChinh.tieuMuc[sectionIndex].blocks = blocks; })} />
          </div>
        ))}
        <div className="border-t border-white/10 pt-5">
          <StringListEditor title="Ý kiến và góp ý nổi bật" items={content.noiDungChinh.gopY} onChange={(items) => update((next) => { next.noiDungChinh.gopY = items; })} />
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <h2 className="text-lg font-bold">Tổng kết và kế hoạch tiếp theo</h2>
        <StringListEditor title="Tổng kết cuộc họp" items={content.tongKet.tongKet} onChange={(items) => update((next) => { next.tongKet.tongKet = items; })} />
        <StringListEditor title="Mục tiêu sau cuộc họp" items={content.tongKet.mucTieuSau} onChange={(items) => update((next) => { next.tongKet.mucTieuSau = items; })} />
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Kế hoạch hành động tiếp theo</h3>
          <TableEditor table={content.tongKet.keHoachHanhDong} onChange={(table) => update((next) => { next.tongKet.keHoachHanhDong = table; })} />
        </div>
      </section>
    </div>
  );
}
