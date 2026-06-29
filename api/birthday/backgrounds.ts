import {
  createBirthdayBackground,
  listBirthdayBackgrounds,
  type JsonResponse,
} from '../../server/birthday-background-api.js';

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    send(response, await listBirthdayBackgrounds());
    return;
  }

  if (request.method === 'POST') {
    send(
      response,
      await createBirthdayBackground(
        readHeader(request.headers?.['x-background-admin-pin']),
        request.body,
      ),
    );
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
