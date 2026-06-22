import assert from 'node:assert/strict';
import test from 'node:test';
import { getNpmInvocation } from './dev-command.js';

test('uses ComSpec to execute npm scripts on Windows', () => {
  assert.deepEqual(getNpmInvocation('dev:client', 'win32', 'C:\\Windows\\System32\\cmd.exe'), {
    command: 'C:\\Windows\\System32\\cmd.exe',
    args: ['/d', '/s', '/c', 'npm.cmd run dev:client'],
  });
});

test('executes npm directly on non-Windows platforms', () => {
  assert.deepEqual(getNpmInvocation('dev:server', 'linux'), {
    command: 'npm',
    args: ['run', 'dev:server'],
  });
});
