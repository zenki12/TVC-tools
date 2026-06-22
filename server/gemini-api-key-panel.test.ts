import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeminiApiKeyPanel } from '../src/modules/meeting-minutes/GeminiApiKeyPanel.js';

test('Gemini API key panel is collapsed by default', () => {
  const html = renderToStaticMarkup(
    createElement(GeminiApiKeyPanel, {
      savedKey: '',
      status: 'idle',
      statusMessage: null,
      onSave: () => undefined,
      onClear: () => undefined,
      onCheck: () => undefined,
    }),
  );

  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Cấu hình Gemini API/);
  assert.doesNotMatch(html, /Cảnh báo bảo mật và chi phí/);
  assert.doesNotMatch(html, /Gemini API key<\/label>/);
});
