import { checkBirthdayBackgroundAdminPin } from '../../../../server/birthday-background-api.js';

export default function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = checkBirthdayBackgroundAdminPin(readHeader(request.headers?.['x-background-admin-pin']));
  response.status(result.status).json(result.body);
}

function readHeader(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}
