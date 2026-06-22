import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  saveGeminiApiKey,
} from '../src/modules/meeting-minutes/geminiKeySession.js';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test('Gemini key session trims, reads, and clears a key', () => {
  const storage = createStorage();

  saveGeminiApiKey('  user-key  ', storage);
  assert.equal(getGeminiApiKey(storage), 'user-key');

  clearGeminiApiKey(storage);
  assert.equal(getGeminiApiKey(storage), '');
});

test('Gemini key session rejects an empty key', () => {
  const storage = createStorage();
  assert.throws(() => saveGeminiApiKey('   ', storage), /API key/i);
});
