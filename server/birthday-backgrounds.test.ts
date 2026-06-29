import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import test from 'node:test';
import { createApp } from './app.js';

type SharedBackground = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  url: string;
  isActive: boolean;
  isDefault: boolean;
  uploadedAt: number;
};

function createMemoryStore(initial: SharedBackground[] = []) {
  const records = new Map(initial.map((item) => [item.id, item]));

  return {
    async list() {
      return [...records.values()];
    },
    async create(input: Omit<SharedBackground, 'id' | 'uploadedAt'>) {
      const item: SharedBackground = {
        ...input,
        id: `bg_${records.size + 1}`,
        uploadedAt: 1000 + records.size,
      };
      if (item.isDefault) {
        for (const current of records.values()) {
          if (current.gender === item.gender) current.isDefault = false;
        }
      }
      records.set(item.id, item);
      return item;
    },
    async update(id: string, updates: Partial<Omit<SharedBackground, 'id' | 'uploadedAt' | 'url'>>) {
      const current = records.get(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      if (next.isDefault) {
        for (const item of records.values()) {
          if (item.gender === next.gender && item.id !== id) item.isDefault = false;
        }
      }
      records.set(id, next);
      return next;
    },
    async remove(id: string) {
      return records.delete(id);
    },
  };
}

async function withServer(
  options: Parameters<typeof createApp>[0],
  run: (baseUrl: string) => Promise<void>,
) {
  const server: Server = createApp({ ...options, serveFrontend: false }).listen(0);
  try {
    const address = server.address();
    assert(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('GET /api/birthday/backgrounds returns shared backgrounds without an admin PIN', async () => {
  await withServer(
    {
      birthdayBackgroundStore: createMemoryStore([
        {
          id: 'shared_1',
          name: 'Nền tím',
          gender: 'female',
          url: 'https://cdn.example/background.png',
          isActive: true,
          isDefault: false,
          uploadedAt: 123,
        },
      ]),
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/birthday/backgrounds`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        backgrounds: [
          {
            id: 'shared_1',
            name: 'Nền tím',
            gender: 'female',
            url: 'https://cdn.example/background.png',
            isActive: true,
            isDefault: false,
            uploadedAt: 123,
          },
        ],
      });
    },
  );
});

test('birthday background admin routes require the configured PIN', async () => {
  await withServer(
    {
      birthdayBackgroundAdminPin: '2468',
      birthdayBackgroundStore: createMemoryStore(),
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/birthday/backgrounds`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Nền mới',
          gender: 'male',
          url: 'data:image/png;base64,AAAA',
          isActive: true,
          isDefault: false,
        }),
      });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: 'Mã quản trị background không đúng.' });
    },
  );
});

test('POST /api/birthday/backgrounds creates a shared background with a valid PIN', async () => {
  await withServer(
    {
      birthdayBackgroundAdminPin: '2468',
      birthdayBackgroundStore: createMemoryStore(),
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/birthday/backgrounds`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-background-admin-pin': '2468',
        },
        body: JSON.stringify({
          name: 'Nền mới',
          gender: 'male',
          url: 'data:image/png;base64,AAAA',
          isActive: true,
          isDefault: true,
        }),
      });

      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.background.name, 'Nền mới');
      assert.equal(body.background.gender, 'male');
      assert.equal(body.background.isDefault, true);
      assert.equal(body.background.url, 'data:image/png;base64,AAAA');
    },
  );
});

test('DELETE /api/birthday/backgrounds/:id removes a shared background with a valid PIN', async () => {
  await withServer(
    {
      birthdayBackgroundAdminPin: '2468',
      birthdayBackgroundStore: createMemoryStore([
        {
          id: 'shared_1',
          name: 'Nền cũ',
          gender: 'male',
          url: 'https://cdn.example/old.png',
          isActive: true,
          isDefault: false,
          uploadedAt: 123,
        },
      ]),
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/birthday/backgrounds/shared_1`, {
        method: 'DELETE',
        headers: { 'x-background-admin-pin': '2468' },
      });

      assert.equal(response.status, 204);

      const listResponse = await fetch(`${baseUrl}/api/birthday/backgrounds`);
      assert.deepEqual(await listResponse.json(), { backgrounds: [] });
    },
  );
});
