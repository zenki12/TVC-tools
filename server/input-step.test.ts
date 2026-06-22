import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InputStep } from '../src/modules/meeting-minutes/InputStep.js';

test('meeting input marks required fields and provides contextual examples', () => {
  const html = renderToStaticMarkup(
    createElement(InputStep, {
      metadata: {
        khachHang: '',
        noiDung: '',
        thoiGian: '',
        ngay: '',
        diaDiem: '',
        thanhPhan: [{ toChuc: '', nguoi: [{ hoTen: '', chucDanh: '' }] }],
      },
      rawText: '',
      loading: false,
      error: null,
      canGenerate: false,
      geminiConfiguration: null,
      onMetadataChange: () => undefined,
      onRawTextChange: () => undefined,
      onGenerate: () => undefined,
    }),
  );

  assert.match(html, /Bắt buộc<\/p>/);
  assert.equal(html.match(/data-required-marker="true"/g)?.length, 6);
  assert.match(html, /placeholder="Ví dụ: Công ty ABC"/);
  assert.match(html, /placeholder="Ví dụ: Trao đổi kế hoạch triển khai dự án"/);
  assert.match(html, /placeholder="Ví dụ: Họp trực tuyến qua Microsoft Teams"/);
  assert.match(html, /placeholder="Ví dụ: Nguyễn Văn A"/);
  assert.match(html, /Không bắt buộc/);
});
