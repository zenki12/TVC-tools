import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkGeminiKey as checkGeminiKeyWithGemini,
  generateMinutes as generateMinutesWithGemini,
} from './gemini.js';
import { renderMinutesDocx as renderMinutesDocxFile } from './docx.js';
import {
  createBirthdayBackgroundStore,
  type BirthdayBackgroundStore,
} from './birthday-backgrounds.js';
import {
  checkBirthdayBackgroundAdminPin,
  createBirthdayBackground,
  deleteBirthdayBackground,
  listBirthdayBackgrounds,
  updateBirthdayBackground,
} from './birthday-background-api.js';
import {
  validateMeetingMinutes,
  validateMinutesMetadata,
  type MeetingMinutes,
  type MinutesMetadata,
} from '../src/modules/meeting-minutes/types.js';

interface AppOptions {
  serveFrontend?: boolean;
  generateMinutes?: (
    metadata: MinutesMetadata,
    rawText: string,
    apiKey: string,
  ) => Promise<MeetingMinutes>;
  checkGeminiKey?: (apiKey: string) => Promise<void>;
  renderMinutesDocx?: (minutes: MeetingMinutes) => Buffer;
  birthdayBackgroundStore?: BirthdayBackgroundStore;
  birthdayBackgroundAdminPin?: string;
}

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(serverDirectory, '../dist');

export function createApp(options: AppOptions = {}) {
  const app = express();
  const generateMinutes = options.generateMinutes ?? generateMinutesWithGemini;
  const checkGeminiKey = options.checkGeminiKey ?? checkGeminiKeyWithGemini;
  const renderMinutesDocx = options.renderMinutesDocx ?? renderMinutesDocxFile;
  const birthdayBackgroundStore = options.birthdayBackgroundStore ?? createBirthdayBackgroundStore();
  const birthdayBackgroundAdminPin =
    options.birthdayBackgroundAdminPin ?? process.env.BACKGROUND_ADMIN_PIN ?? '';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/birthday/backgrounds', async (_request, response) => {
    sendJson(response, await listBirthdayBackgrounds(birthdayBackgroundStore));
  });

  app.post('/api/birthday/backgrounds/admin/check', (request, response) => {
    sendJson(
      response,
      checkBirthdayBackgroundAdminPin(
        readHeaderSecret(request.headers['x-background-admin-pin']),
        birthdayBackgroundAdminPin,
      ),
    );
  });

  app.post('/api/birthday/backgrounds', async (request, response) => {
    sendJson(
      response,
      await createBirthdayBackground(
        readHeaderSecret(request.headers['x-background-admin-pin']),
        request.body,
        birthdayBackgroundStore,
        birthdayBackgroundAdminPin,
      ),
    );
  });

  app.patch('/api/birthday/backgrounds/:id', async (request, response) => {
    sendJson(
      response,
      await updateBirthdayBackground(
        readHeaderSecret(request.headers['x-background-admin-pin']),
        request.params.id,
        request.body,
        birthdayBackgroundStore,
        birthdayBackgroundAdminPin,
      ),
    );
  });

  app.delete('/api/birthday/backgrounds/:id', async (request, response) => {
    sendJson(
      response,
      await deleteBirthdayBackground(
        readHeaderSecret(request.headers['x-background-admin-pin']),
        request.params.id,
        birthdayBackgroundStore,
        birthdayBackgroundAdminPin,
      ),
    );
  });

  app.post('/api/minutes/generate', async (request, response) => {
    const apiKey = readGeminiApiKey(request.headers['x-gemini-api-key']);
    if (!apiKey) {
      response.status(400).json({ error: 'Vui lòng nhập Gemini API key của bạn.' });
      return;
    }

    const rawText = request.body?.rawText;
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
      response.status(400).json({ error: 'Vui lòng nhập nội dung cuộc họp.' });
      return;
    }

    let metadata: MinutesMetadata;
    try {
      metadata = validateMinutesMetadata(request.body?.metadata);
    } catch {
      response.status(400).json({ error: 'Thông tin cuộc họp không hợp lệ.' });
      return;
    }

    try {
      const content = validateMeetingMinutes(await generateMinutes(metadata, rawText, apiKey));
      response.json({ content });
    } catch (error) {
      const failure = normalizeGeminiError(error);
      console.error('Gemini minutes generation failed', { status: failure.status });
      response.status(failure.status).json({ error: failure.message });
    }
  });

  app.post('/api/minutes/gemini/check', async (request, response) => {
    const apiKey = readGeminiApiKey(request.headers['x-gemini-api-key']);
    if (!apiKey) {
      response.status(400).json({ error: 'Vui lòng nhập Gemini API key của bạn.' });
      return;
    }

    try {
      await checkGeminiKey(apiKey);
      response.json({ valid: true });
    } catch (error) {
      const failure = normalizeGeminiError(error);
      console.error('Gemini key check failed', { status: failure.status });
      response.status(failure.status).json({ error: failure.message });
    }
  });

  app.post('/api/minutes/export', (request, response) => {
    let content: MeetingMinutes;
    try {
      content = validateMeetingMinutes(request.body?.content);
    } catch {
      response.status(400).json({ error: 'Nội dung biên bản không hợp lệ.' });
      return;
    }

    try {
      const file = renderMinutesDocx(content);
      const title = slugPart(content.title) || 'bien-ban';
      const date = slugPart(content.metadata.ngay) || 'khong-ngay';
      const filename = `bien-ban-hop-${title}-${date}.docx`;
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.send(file);
    } catch (error) {
      console.error('Minutes DOCX export failed:', error);
      response.status(500).json({
        error: 'Không thể xuất file .docx lúc này. Vui lòng thử lại.',
      });
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found' });
  });

  if (options.serveFrontend !== false && existsSync(frontendDirectory)) {
    app.use(express.static(frontendDirectory));
    app.use((request, response, next) => {
      if (request.method !== 'GET') {
        next();
        return;
      }
      response.sendFile(path.join(frontendDirectory, 'index.html'));
    });
  }

  return app;
}

function readGeminiApiKey(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function readHeaderSecret(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function sendJson(response: express.Response, result: { status: number; body?: unknown }) {
  if (result.status === 204) {
    response.status(204).end();
    return;
  }
  response.status(result.status).json(result.body);
}

function normalizeGeminiError(error: unknown) {
  const candidate = error as { status?: unknown; code?: unknown } | null;
  const rawStatus = candidate?.status ?? candidate?.code;
  const status = typeof rawStatus === 'number' ? rawStatus : Number(rawStatus);

  if (status === 400 || status === 401 || status === 403) {
    return { status: 401, message: 'Gemini API key không hợp lệ hoặc không có quyền truy cập.' };
  }
  if (status === 429) {
    return { status: 429, message: 'Gemini đã vượt hạn mức (quota). Vui lòng kiểm tra quota hoặc thử lại sau.' };
  }
  if (status >= 500) {
    return { status: 503, message: 'Dịch vụ Gemini đang tạm thời không khả dụng. Vui lòng thử lại sau.' };
  }
  return { status: 502, message: 'Không thể kết nối với Gemini. Vui lòng kiểm tra key và thử lại.' };
}

function slugPart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
