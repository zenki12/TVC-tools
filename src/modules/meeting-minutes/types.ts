export interface Participant {
  hoTen: string;
  chucDanh: string;
}

export interface ParticipantGroup {
  toChuc: string;
  nguoi: Participant[];
}

export interface MinutesMetadata {
  khachHang: string;
  noiDung: string;
  thoiGian: string;
  ngay: string;
  diaDiem: string;
  thanhPhan: ParticipantGroup[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface BulletsBlock {
  type: 'bullets';
  items: string[];
}

export interface TableBlock {
  type: 'table';
  columns: string[];
  rows: string[][];
}

export type MinutesBlock = ParagraphBlock | BulletsBlock | TableBlock;

export interface MinutesSubsection {
  heading: string;
  blocks: MinutesBlock[];
}

export interface MeetingMinutes {
  title: string;
  metadata: MinutesMetadata;
  mucTieu: string[];
  noiDungChinh: {
    tongQuan: MinutesBlock[];
    tieuMuc: MinutesSubsection[];
    gopY: string[];
  };
  tongKet: {
    tongKet: string[];
    mucTieuSau: string[];
    keHoachHanhDong: TableBlockData;
  };
}

export interface TableBlockData {
  columns: string[];
  rows: string[][];
}

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} phải là object`);
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`${path} phải là chuỗi`);
  return value;
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} phải là mảng`);
  return value;
}

function expectStringArray(value: unknown, path: string): string[] {
  return expectArray(value, path).map((item, index) =>
    expectString(item, `${path}[${index}]`),
  );
}

function validateTable(value: unknown, path: string): TableBlockData {
  const table = expectRecord(value, path);
  const columns = expectStringArray(table.columns, `${path}.columns`);
  const rows = expectArray(table.rows, `${path}.rows`).map((row, rowIndex) => {
    const cells = expectStringArray(row, `${path}.rows[${rowIndex}]`);
    if (cells.length !== columns.length) {
      throw new Error(`${path}.rows[${rowIndex}] phải có ${columns.length} ô`);
    }
    return cells;
  });
  return { columns, rows };
}

function validateBlock(value: unknown, path: string): MinutesBlock {
  const block = expectRecord(value, path);
  const type = expectString(block.type, `${path}.type`);
  if (type === 'paragraph') {
    return { type, text: expectString(block.text, `${path}.text`) };
  }
  if (type === 'bullets') {
    return { type, items: expectStringArray(block.items, `${path}.items`) };
  }
  if (type === 'table') {
    return { type, ...validateTable(block, path) };
  }
  throw new Error(`Khối nội dung ${path} có type không hợp lệ: ${type}`);
}

function validateBlocks(value: unknown, path: string): MinutesBlock[] {
  return expectArray(value, path).map((block, index) =>
    validateBlock(block, `${path}[${index}]`),
  );
}

export function validateMinutesMetadata(value: unknown): MinutesMetadata {
  const metadata = expectRecord(value, 'metadata');
  const thanhPhan = expectArray(metadata.thanhPhan, 'metadata.thanhPhan').map(
    (groupValue, groupIndex) => {
      const group = expectRecord(groupValue, `metadata.thanhPhan[${groupIndex}]`);
      return {
        toChuc: expectString(group.toChuc, `metadata.thanhPhan[${groupIndex}].toChuc`),
        nguoi: expectArray(group.nguoi, `metadata.thanhPhan[${groupIndex}].nguoi`).map(
          (personValue, personIndex) => {
            const person = expectRecord(
              personValue,
              `metadata.thanhPhan[${groupIndex}].nguoi[${personIndex}]`,
            );
            return {
              hoTen: expectString(person.hoTen, 'person.hoTen'),
              chucDanh: expectString(person.chucDanh, 'person.chucDanh'),
            };
          },
        ),
      };
    },
  );

  return {
    khachHang: expectString(metadata.khachHang, 'metadata.khachHang'),
    noiDung: expectString(metadata.noiDung, 'metadata.noiDung'),
    thoiGian: expectString(metadata.thoiGian, 'metadata.thoiGian'),
    ngay: expectString(metadata.ngay, 'metadata.ngay'),
    diaDiem: expectString(metadata.diaDiem, 'metadata.diaDiem'),
    thanhPhan,
  };
}

export function validateMeetingMinutes(value: unknown): MeetingMinutes {
  const minutes = expectRecord(value, 'content');
  const noiDungChinh = expectRecord(minutes.noiDungChinh, 'content.noiDungChinh');
  const tongKet = expectRecord(minutes.tongKet, 'content.tongKet');

  return {
    title: expectString(minutes.title, 'content.title'),
    metadata: validateMinutesMetadata(minutes.metadata),
    mucTieu: expectStringArray(minutes.mucTieu, 'content.mucTieu'),
    noiDungChinh: {
      tongQuan: validateBlocks(noiDungChinh.tongQuan, 'content.noiDungChinh.tongQuan'),
      tieuMuc: expectArray(noiDungChinh.tieuMuc, 'content.noiDungChinh.tieuMuc').map(
        (sectionValue, sectionIndex) => {
          const section = expectRecord(
            sectionValue,
            `content.noiDungChinh.tieuMuc[${sectionIndex}]`,
          );
          return {
            heading: expectString(section.heading, 'section.heading'),
            blocks: validateBlocks(section.blocks, 'section.blocks'),
          };
        },
      ),
      gopY: expectStringArray(noiDungChinh.gopY, 'content.noiDungChinh.gopY'),
    },
    tongKet: {
      tongKet: expectStringArray(tongKet.tongKet, 'content.tongKet.tongKet'),
      mucTieuSau: expectStringArray(tongKet.mucTieuSau, 'content.tongKet.mucTieuSau'),
      keHoachHanhDong: validateTable(
        tongKet.keHoachHanhDong,
        'content.tongKet.keHoachHanhDong',
      ),
    },
  };
}
