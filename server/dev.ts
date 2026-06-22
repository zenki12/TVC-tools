import { spawn } from 'node:child_process';
import { getNpmInvocation } from './dev-command.js';

const children = ['dev:client', 'dev:server'].map((script) => {
  const invocation = getNpmInvocation(script);
  return spawn(invocation.command, invocation.args, { stdio: 'inherit' });
});

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
