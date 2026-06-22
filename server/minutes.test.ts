import assert from 'node:assert/strict';
import test from 'node:test';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import {
  validateMeetingMinutes,
  type MeetingMinutes,
  type MinutesMetadata,
} from '../src/modules/meeting-minutes/types.js';

const metadata: MinutesMetadata = {
  khachHang: 'Công ty ABC',
  noiDung: 'Họp triển khai dự án',
  thoiGian: '09:00',
  ngay: '20/06/2026',
  diaDiem: 'Trực tuyến',
  thanhPhan: [
    {
      toChuc: 'Công ty ABC',
      nguoi: [{ hoTen: 'Nguyễn Văn A', chucDanh: 'Giám đốc' }],
    },
  ],
};

const minutes: MeetingMinutes = {
  title: 'BIÊN BẢN HỌP TRIỂN KHAI DỰ ÁN',
  metadata,
  mucTieu: ['Thống nhất phạm vi'],
  noiDungChinh: {
    tongQuan: [{ type: 'paragraph', text: 'Các bên đã trao đổi.' }],
    tieuMuc: [
      {
        heading: 'Phạm vi công việc',
        blocks: [
          { type: 'bullets', items: ['Hạng mục A'] },
          {
            type: 'table',
            columns: ['STT', 'Hạng mục'],
            rows: [['1', 'Hạng mục A']],
          },
        ],
      },
    ],
    gopY: ['Bổ sung tiến độ'],
  },
  tongKet: {
    tongKet: ['Đã thống nhất phạm vi'],
    mucTieuSau: ['Hoàn thiện kế hoạch'],
    keHoachHanhDong: {
      columns: ['STT', 'Hành động', 'Đơn vị phụ trách', 'Kết quả mong đợi', 'Thời hạn'],
      rows: [['1', 'Lập kế hoạch', 'TVC', 'Kế hoạch được duyệt', '25/06/2026']],
    },
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

function postGenerate(baseUrl: string, body: unknown, apiKey = 'user-test-key') {
  return fetch(`${baseUrl}/api/minutes/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-gemini-api-key': apiKey },
    body: JSON.stringify(body),
  });
}

function postCheckKey(baseUrl: string, apiKey = 'user-test-key') {
  return fetch(`${baseUrl}/api/minutes/gemini/check`, {
    method: 'POST',
    headers: { 'x-gemini-api-key': apiKey },
  });
}

test('validateMeetingMinutes accepts the complete structured schema', () => {
  assert.deepEqual(validateMeetingMinutes(minutes), minutes);
});

test('validateMeetingMinutes rejects an unsupported block type', () => {
  const invalid = structuredClone(minutes) as unknown as Record<string, unknown>;
  const main = invalid.noiDungChinh as { tongQuan: unknown[] };
  main.tongQuan = [{ type: 'quote', text: 'Không hợp lệ' }];

  assert.throws(() => validateMeetingMinutes(invalid), /block|khối/i);
});

test('POST /api/minutes/generate returns 400 for empty input', async () => {
  await withServer(
    {
      generateMinutes: async () => minutes,
    },
    async (baseUrl) => {
      const response = await postGenerate(baseUrl, { metadata, rawText: '   ' });
      assert.equal(response.status, 400);
    },
  );
});

test('POST /api/minutes/generate does not require a server GEMINI_API_KEY', async () => {
  await withServer(
    {
      generateMinutes: async () => minutes,
    },
    async (baseUrl) => {
      const response = await postGenerate(baseUrl, { metadata, rawText: 'Ghi chú họp' });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { content: minutes });
    },
  );
});

test('POST /api/minutes/generate requires a user Gemini API key header', async () => {
  await withServer(
    {
      generateMinutes: async () => minutes,
    },
    async (baseUrl) => {
      const response = await postGenerate(baseUrl, { metadata, rawText: 'Meeting notes' }, '');
      assert.equal(response.status, 400);
      assert.doesNotMatch(JSON.stringify(await response.json()), /user-test-key/);
    },
  );
});

test('POST /api/minutes/generate forwards the user key only to the Gemini adapter', async () => {
  let receivedKey = '';
  await withServer(
    {
      generateMinutes: async (_metadata, _rawText, apiKey) => {
        receivedKey = apiKey;
        return minutes;
      },
    },
    async (baseUrl) => {
      const response = await postGenerate(baseUrl, { metadata, rawText: 'Meeting notes' });
      assert.equal(response.status, 200);
      assert.equal(receivedKey, 'user-test-key');
      assert.doesNotMatch(JSON.stringify(await response.json()), /user-test-key/);
    },
  );
});

test('POST /api/minutes/gemini/check validates the user key without returning it', async () => {
  let receivedKey = '';
  await withServer(
    {
      checkGeminiKey: async (apiKey) => {
        receivedKey = apiKey;
      },
    },
    async (baseUrl) => {
      const response = await postCheckKey(baseUrl);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { valid: true });
      assert.equal(receivedKey, 'user-test-key');
    },
  );
});

test('Gemini API errors are normalized and never expose the supplied key', async () => {
  await withServer(
    {
      generateMinutes: async () => {
        throw Object.assign(new Error('request failed for user-test-key'), { status: 429 });
      },
    },
    async (baseUrl) => {
      const response = await postGenerate(baseUrl, { metadata, rawText: 'Meeting notes' });
      const body = JSON.stringify(await response.json());
      assert.equal(response.status, 429);
      assert.doesNotMatch(body, /user-test-key/);
      assert.match(body, /quota/i);
    },
  );
});

test('POST /api/minutes/generate returns validated generated content', async () => {
  await withServer(
    {
      generateMinutes: async () => minutes,
    },
    async (baseUrl) => {
      const response = await postGenerate(baseUrl, { metadata, rawText: 'Ghi chú họp' });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { content: minutes });
    },
  );
});
