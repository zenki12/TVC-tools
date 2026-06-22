import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import { renderMinutesDocx } from './docx.js';
import type { MeetingMinutes } from '../src/modules/meeting-minutes/types.js';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const originalPath = path.join(rootDirectory, 'TVC_Biên bản mẫu.docx');
const templatePath = path.join(rootDirectory, 'server/templates/bien-ban-template.docx');

const sample: MeetingMinutes = {
  title: 'BÁO CÁO TIẾN ĐỘ & KẾ HOẠCH <GIAI ĐOẠN 2>',
  metadata: {
    khachHang: 'Tập đoàn Công nghiệp – Năng lượng Quốc gia Việt Nam',
    noiDung: 'Đánh giá kết quả triển khai hệ thống HiStaff',
    thoiGian: '14:00',
    ngay: '02/06/2026',
    diaDiem: 'Phòng Lan Tây, Hà Nội',
    thanhPhan: [
      {
        toChuc: 'PVPGB',
        nguoi: [
          { hoTen: 'Nguyễn Nam Tiến', chucDanh: 'Giám đốc' },
          { hoTen: 'Phạm Minh Hiền', chucDanh: 'Phó Tổng Giám đốc' },
        ],
      },
    ],
  },
  mucTieu: ['Báo cáo tiến độ triển khai', 'Demo hệ thống'],
  noiDungChinh: {
    tongQuan: [
      { type: 'paragraph', text: 'Nội dung có ký tự A&B <C> "D" \'E\' phải an toàn.' },
      { type: 'bullets', items: ['Kết quả triển khai', 'Mức độ sẵn sàng Go-live'] },
    ],
    tieuMuc: [
      {
        heading: 'Đánh giá mức độ sẵn sàng Go-live',
        blocks: [
          { type: 'paragraph', text: 'Các điều kiện cần hoàn thiện.' },
          {
            type: 'table',
            columns: ['STT', 'Điều kiện', 'Trạng thái'],
            rows: [
              ['1', 'Làm sạch dữ liệu', 'Đang thực hiện'],
              ['2', 'Kiểm thử hiệu năng', 'Chưa hoàn thành'],
            ],
          },
        ],
      },
    ],
    gopY: ['Cần cải thiện Dashboard nhân sự'],
  },
  tongKet: {
    tongKet: ['Thống nhất tiếp tục triển khai'],
    mucTieuSau: ['Hoàn thiện điều kiện Go-live'],
    keHoachHanhDong: {
      columns: ['STT', 'Hành động', 'Đơn vị phụ trách', 'Kết quả mong đợi', 'Thời hạn'],
      rows: [
        ['1', 'Làm sạch dữ liệu', 'TVC', 'Dữ liệu đạt chuẩn', '30/06/2026'],
        ['2', 'Kiểm thử hiệu năng', 'TVC', 'Đủ điều kiện vận hành', '05/07/2026'],
      ],
    },
  },
};

function files(zip: PizZip) {
  return Object.keys(zip.files).filter((name) => !zip.files[name].dir).sort();
}

function bytes(zip: PizZip, name: string) {
  const entry = zip.file(name);
  assert(entry, `Missing DOCX part: ${name}`);
  return entry.asNodeBuffer();
}

function tableContaining(xml: string, text: string) {
  const tables = xml.match(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g) ?? [];
  const table = tables.find((candidate) => candidate.includes(text));
  assert(table, `Missing table containing ${text}`);
  return table;
}

test('renderMinutesDocx creates structured Word XML and preserves branded parts', () => {
  const originalZip = new PizZip(readFileSync(originalPath));
  const templateZip = new PizZip(readFileSync(templatePath));

  for (const name of files(originalZip)) {
    if (name === 'word/document.xml') continue;
    assert.deepEqual(bytes(templateZip, name), bytes(originalZip, name), `${name} changed`);
  }

  const output = renderMinutesDocx(sample);
  assert(Buffer.isBuffer(output));
  assert.equal(output.subarray(0, 2).toString(), 'PK');

  const outputZip = new PizZip(output);
  const documentXml = bytes(outputZip, 'word/document.xml').toString('utf8');
  assert(documentXml.includes('BÁO CÁO TIẾN ĐỘ'));
  assert(documentXml.includes('Đánh giá mức độ sẵn sàng Go-live'));
  assert(documentXml.includes('PVPGB'));
  assert(documentXml.includes('Nguyễn Nam Tiến'));
  assert(documentXml.includes('Phạm Minh Hiền'));
  assert(documentXml.includes('A&amp;B &lt;C&gt; &quot;D&quot; &apos;E&apos;'));
  assert(documentXml.includes('<w:tblStyle w:val="LiBang"/>'));
  assert(documentXml.includes('<w:pStyle w:val="u2"/>'));
  assert(documentXml.includes('w:ascii="Times New Roman"'));
  assert(!documentXml.includes('{@'));
  assert(!documentXml.includes('{#'));

  const threeColumnTable = tableContaining(documentXml, 'Điều kiện');
  assert.equal((threeColumnTable.match(/<w:gridCol\b/g) ?? []).length, 3);
  const threeColumnWidths = [...threeColumnTable.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map(
    (match) => Number(match[1]),
  );
  assert.equal(threeColumnWidths.reduce((total, width) => total + width, 0), 10_200);
  assert(threeColumnWidths.some((width) => width !== threeColumnWidths[0]));
  const fiveColumnTable = tableContaining(documentXml, 'Đơn vị phụ trách');
  assert.equal((fiveColumnTable.match(/<w:gridCol\b/g) ?? []).length, 5);

  const brandedParts = files(templateZip).filter((name) =>
    /^word\/(?:header|footer).*\.xml$|^word\/media\//.test(name),
  );
  assert(brandedParts.some((name) => name.startsWith('word/media/')));
  for (const name of brandedParts) {
    assert.deepEqual(bytes(outputZip, name), bytes(templateZip, name), `${name} changed`);
  }
});
