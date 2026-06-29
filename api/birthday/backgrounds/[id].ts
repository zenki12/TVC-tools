import {
  deleteBirthdayBackground,
  updateBirthdayBackground,
  type JsonResponse,
} from '../../../server/birthday-background-api.js';

export default async function handler(request: any, response: any) {
  const id = readRouteId(request.query?.id);
  if (!id) {
    response.status(400).json({ error: 'Thiếu mã background.' });
    return;
  }

  const adminPin = readHeader(request.headers?.['x-background-admin-pin']);

  if (request.method === 'PATCH') {
    send(response, await updateBirthdayBackground(adminPin, id, request.body));
    return;
  }

  if (request.method === 'DELETE') {
    send(response, await deleteBirthdayBackground(adminPin, id));
    return;
  }

  response.status(405).json({ error: 'Method not allowed' });
}

function send(response: any, result: JsonResponse) {
  if (result.status === 204) {
    response.status(204).end();
    return;
  }
  response.status(result.status).json(result.body);
}

function readHeader(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function readRouteId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
