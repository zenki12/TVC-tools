import Docxtemplater from 'docxtemplater';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import {
  validateMeetingMinutes,
  type MeetingMinutes,
  type MinutesBlock,
  type TableBlockData,
} from '../src/modules/meeting-minutes/types.js';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(serverDirectory, 'templates/bien-ban-template.docx');
const TABLE_WIDTH_DXA = 10_200;

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function textNodes(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => `<w:t xml:space="preserve">${escapeXml(line)}</w:t>`)
    .join('<w:br/>');
}

function runXml(text: string, bold = false) {
  return `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/>${bold ? '<w:b/><w:bCs/>' : ''}</w:rPr>${textNodes(text)}</w:r>`;
}

function paragraphXml(text: string, options: { bold?: boolean; style?: string; numId?: number } = {}) {
  const style = options.style ?? 'oancuaDanhsach';
  const numbering = options.numId
    ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${options.numId}"/></w:numPr>`
    : '';
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${numbering}<w:jc w:val="both"/></w:pPr>${runXml(text, options.bold)}</w:p>`;
}

function paragraphsXml(text: string) {
  return text.split(/\r?\n/).map((line) => paragraphXml(line)).join('');
}

function bulletsXml(items: string[], numId = 5) {
  return items.map((item) => paragraphXml(item, { numId })).join('');
}

function cellXml(text: string, width: number, bold: boolean) {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="center"/><w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:jc w:val="left"/></w:pPr>${runXml(text, bold)}</w:p></w:tc>`;
}

function rowXml(cells: string[], widths: number[], header = false) {
  const rowProperties = header ? '<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>';
  return `<w:tr>${rowProperties}${cells.map((cell, index) => cellXml(cell, widths[index], header)).join('')}</w:tr>`;
}

function tableXml(table: TableBlockData) {
  if (table.columns.length === 0) return '';

  const widths = columnWidths(table);
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('');
  const rows = [
    rowXml(table.columns, widths, true),
    ...table.rows.map((row) => rowXml(row, widths)),
  ].join('');

  return `<w:tbl><w:tblPr><w:tblStyle w:val="LiBang"/><w:tblW w:w="${TABLE_WIDTH_DXA}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows}</w:tbl>`;
}

function columnWidths(table: TableBlockData) {
  const columnCount = table.columns.length;
  const minimumWidth = Math.min(800, Math.floor(TABLE_WIDTH_DXA / columnCount));
  const remainingWidth = TABLE_WIDTH_DXA - minimumWidth * columnCount;
  const weights = table.columns.map((column, columnIndex) => {
    const values = [column, ...table.rows.map((row) => row[columnIndex] ?? '')];
    const longest = Math.max(...values.map((value) => Array.from(value).length));
    return Math.max(4, Math.min(40, longest));
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  const widths = weights.map(
    (weight) => minimumWidth + Math.floor((remainingWidth * weight) / totalWeight),
  );
  widths[widths.length - 1] +=
    TABLE_WIDTH_DXA - widths.reduce((total, width) => total + width, 0);
  return widths;
}

function blocksXml(blocks: MinutesBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'paragraph') return paragraphsXml(block.text);
      if (block.type === 'bullets') return bulletsXml(block.items);
      return tableXml(block);
    })
    .join('');
}

function subsectionsXml(minutes: MeetingMinutes) {
  return minutes.noiDungChinh.tieuMuc
    .map(
      (section) =>
        `${paragraphXml(section.heading, { bold: true, style: 'u2' })}${blocksXml(section.blocks)}`,
    )
    .join('');
}

export function renderMinutesDocx(input: MeetingMinutes): Buffer {
  const minutes = validateMeetingMinutes(input);
  const zip = new PizZip(readFileSync(templatePath));
  const document = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  document.render({
    title: minutes.title,
    ...minutes.metadata,
    thanhPhan: minutes.metadata.thanhPhan,
    mucTieuXml: bulletsXml(minutes.mucTieu, 4),
    tongQuanXml: blocksXml(minutes.noiDungChinh.tongQuan),
    tieuMucXml: subsectionsXml(minutes),
    gopYXml: bulletsXml(minutes.noiDungChinh.gopY),
    tongKetXml: bulletsXml(minutes.tongKet.tongKet),
    mucTieuSauXml: bulletsXml(minutes.tongKet.mucTieuSau),
    keHoachXml: tableXml(minutes.tongKet.keHoachHanhDong),
  });

  return document.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}
