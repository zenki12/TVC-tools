interface NpmInvocation {
  command: string;
  args: string[];
}

export function getNpmInvocation(
  script: string,
  platform: NodeJS.Platform = process.platform,
  comSpec = process.env.ComSpec,
): NpmInvocation {
  if (platform === 'win32') {
    return {
      command: comSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', `npm.cmd run ${script}`],
    };
  }

  return {
    command: 'npm',
    args: ['run', script],
  };
}
