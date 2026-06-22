import { Plus, Trash2, Users } from 'lucide-react';
import type { ParticipantGroup } from './types.js';

interface Props {
  groups: ParticipantGroup[];
  onChange: (groups: ParticipantGroup[]) => void;
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#14C8FF]/70';

export function ParticipantGroupsEditor({ groups, onChange }: Props) {
  const updateGroup = (groupIndex: number, updater: (group: ParticipantGroup) => void) => {
    const next = structuredClone(groups);
    updater(next[groupIndex]);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Users size={16} className="text-[#14C8FF]" /> Thành phần tham gia
          <span className="text-xs font-normal text-white/40">(Không bắt buộc)</span>
        </div>
        <button
          type="button"
          onClick={() => onChange([...groups, { toChuc: '', nguoi: [] }])}
          className="flex items-center gap-1 rounded-lg border border-[#14C8FF]/30 px-2.5 py-1.5 text-xs text-[#14C8FF] hover:bg-[#14C8FF]/10"
        >
          <Plus size={13} /> Thêm tổ chức
        </button>
      </div>

      {groups.map((group, groupIndex) => (
        <section key={groupIndex} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center gap-2">
            <input
              className={inputClass}
              value={group.toChuc}
              placeholder="Ví dụ: Công ty ABC"
              onChange={(event) =>
                updateGroup(groupIndex, (item) => {
                  item.toChuc = event.target.value;
                })
              }
            />
            <button
              type="button"
              title="Xóa tổ chức"
              onClick={() => onChange(groups.filter((_, index) => index !== groupIndex))}
              className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {group.nguoi.map((person, personIndex) => (
              <div key={personIndex} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  className={inputClass}
                  value={person.hoTen}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  onChange={(event) =>
                    updateGroup(groupIndex, (item) => {
                      item.nguoi[personIndex].hoTen = event.target.value;
                    })
                  }
                />
                <input
                  className={inputClass}
                  value={person.chucDanh}
                  placeholder="Ví dụ: Giám đốc"
                  onChange={(event) =>
                    updateGroup(groupIndex, (item) => {
                      item.nguoi[personIndex].chucDanh = event.target.value;
                    })
                  }
                />
                <button
                  type="button"
                  title="Xóa người"
                  onClick={() =>
                    updateGroup(groupIndex, (item) => {
                      item.nguoi.splice(personIndex, 1);
                    })
                  }
                  className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              updateGroup(groupIndex, (item) => {
                item.nguoi.push({ hoTen: '', chucDanh: '' });
              })
            }
            className="mt-3 flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white"
          >
            <Plus size={13} /> Thêm người
          </button>
        </section>
      ))}
    </div>
  );
}
