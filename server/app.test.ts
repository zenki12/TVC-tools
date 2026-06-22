import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './app.js';

test('Gemini endpoints are available without an access token', async () => {
  let receivedKey = '';
  const app = createApp({
    serveFrontend: false,
    checkGeminiKey: async (apiKey) => {
      receivedKey = apiKey;
    },
  });
  const server = app.listen(0);

  try {
    const address = server.address();
    assert(address && typeof address === 'object');
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/minutes/gemini/check`,
      { method: 'POST', headers: { 'x-gemini-api-key': 'user-key' } },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { valid: true });
    assert.equal(receivedKey, 'user-key');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
