import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../src/shell/AppShell.js';

test('app shell shows only the HiStaff product logo', () => {
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, null, createElement(AppShell)),
  );

  assert.match(html, /alt="Logo sản phẩm HiStaff"/);
  assert.doesNotMatch(html, /Logo công ty TVC/);
  assert.doesNotMatch(html, /Đơn vị phát triển/);
});
