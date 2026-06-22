import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import test from 'node:test';
import { createApp } from './app.js';
import type { MeetingMinutes } from '../src/modules/meeting-minutes/types.js';

const content: MeetingMinutes = {
  title: 'Báo cáo tiến độ',
  metadata: {
    khachHang: 'Công ty ABC',
    noiDung: 'Họp tiến độ',
    thoiGian: '09:00',
    ngay: '20/06/2026',
    diaDiem: 'Hà Nội',
    thanhPhan: [],
  },
  mucTieu: [],
  noiDungChinh: { tongQuan: [], tieuMuc: [], gopY: [] },
  tongKet: {
    tongKet: [],
    mucTieuSau: [],
    keHoachHanhDong: { columns: ['STT'], rows: [] },
  },
};

async function withServer(
  options: Parameters<typeof createApp>[0],
  run: (baseUrl: string) => Promise<void>,
) {
  const server: Server = createApp({ ...options, serveFrontend: false }).listen(0);
  try {
    const address = server.address();
    assert(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postExport(baseUrl: string, body: unknown) {
  return fetch(`${baseUrl}/api/minutes/export`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('POST /api/minutes/export returns 400 for invalid content', async () => {
  await withServer(
    {
      renderMinutesDocx: () => Buffer.from('not-called'),
    },
    async (baseUrl) => {
      const response = await postExport(baseUrl, { content: { title: 'Thiếu dữ liệu' } });
      assert.equal(response.status, 400);
    },
  );
});

test('POST /api/minutes/export returns a named DOCX attachment', async () => {
  const expected = Buffer.from('PK-test-docx');
  await withServer(
    {
      renderMinutesDocx: () => expected,
    },
    async (baseUrl) => {
      const response = await postExport(baseUrl, { content });
      assert.equal(response.status, 200);
      assert.equal(
        response.headers.get('content-type'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      assert.equal(
        response.headers.get('content-disposition'),
        'attachment; filename="bien-ban-hop-bao-cao-tien-do-20-06-2026.docx"',
      );
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected);
    },
  );
});
