import { del, list, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface BirthdayBackground {
  id: string;
  name: string;
  gender: 'male' | 'female';
  url: string;
  isActive: boolean;
  isDefault: boolean;
  uploadedAt: number;
  pathname?: string;
}

export interface BirthdayBackgroundStore {
  list(): Promise<BirthdayBackground[]>;
  create(input: Omit<BirthdayBackground, 'id' | 'uploadedAt'>): Promise<BirthdayBackground>;
  update(
    id: string,
    updates: Partial<Omit<BirthdayBackground, 'id' | 'uploadedAt' | 'url' | 'pathname'>>,
  ): Promise<BirthdayBackground | null>;
  remove(id: string): Promise<boolean>;
}

const INDEX_PATH = 'birthday-backgrounds/index.json';
const LOCAL_DATA_FILE = path.resolve(process.cwd(), '.data/birthday-backgrounds.json');

export function createBirthdayBackgroundStore(): BirthdayBackgroundStore {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobBirthdayBackgroundStore();
  }
  if (process.env.VERCEL) {
    return new UnconfiguredBirthdayBackgroundStore();
  }
  return new FileBirthdayBackgroundStore(LOCAL_DATA_FILE);
}

export function serializeBirthdayBackground(background: BirthdayBackground) {
  return {
    id: background.id,
    name: background.name,
    gender: background.gender,
    url: background.url,
    isActive: background.isActive,
    isDefault: background.isDefault,
    uploadedAt: background.uploadedAt,
  };
}

class VercelBlobBirthdayBackgroundStore implements BirthdayBackgroundStore {
  async list() {
    return sortBackgrounds(await this.readIndex());
  }

  async create(input: Omit<BirthdayBackground, 'id' | 'uploadedAt'>) {
    const id = `bg_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const uploaded = await uploadBackgroundImage(id, input.name, input.url);
    const item: BirthdayBackground = {
      ...input,
      id,
      url: uploaded.url,
      pathname: uploaded.pathname,
      uploadedAt: Date.now(),
    };
    const next = applyDefaultRule([...(await this.readIndex()), item], item);
    await this.writeIndex(next);
    return item;
  }

  async update(
    id: string,
    updates: Partial<Omit<BirthdayBackground, 'id' | 'uploadedAt' | 'url' | 'pathname'>>,
  ) {
    const current = await this.readIndex();
    const target = current.find((item) => item.id === id);
    if (!target) return null;
    Object.assign(target, sanitizeBackgroundUpdates(updates));
    const next = target.isDefault ? applyDefaultRule(current, target) : current;
    await this.writeIndex(next);
    return target;
  }

  async remove(id: string) {
    const current = await this.readIndex();
    const target = current.find((item) => item.id === id);
    if (!target) return false;
    const next = current.filter((item) => item.id !== id);
    await this.writeIndex(next);
    if (target.pathname) {
      await del(target.pathname);
    }
    return true;
  }

  private async readIndex() {
    const result = await list({ prefix: INDEX_PATH, limit: 1 });
    const blob = result.blobs.find((item) => item.pathname === INDEX_PATH);
    if (!blob) return [];

    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return [];

    return parseBackgrounds(await response.json());
  }

  private async writeIndex(backgrounds: BirthdayBackground[]) {
    await put(INDEX_PATH, JSON.stringify(sortBackgrounds(backgrounds)), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });
  }
}

class FileBirthdayBackgroundStore implements BirthdayBackgroundStore {
  constructor(private readonly filePath: string) {}

  async list() {
    return sortBackgrounds(await this.readIndex());
  }

  async create(input: Omit<BirthdayBackground, 'id' | 'uploadedAt'>) {
    const item: BirthdayBackground = {
      ...input,
      id: `bg_${Date.now()}_${randomUUID().slice(0, 8)}`,
      uploadedAt: Date.now(),
    };
    const next = applyDefaultRule([...(await this.readIndex()), item], item);
    await this.writeIndex(next);
    return item;
  }

  async update(
    id: string,
    updates: Partial<Omit<BirthdayBackground, 'id' | 'uploadedAt' | 'url' | 'pathname'>>,
  ) {
    const current = await this.readIndex();
    const target = current.find((item) => item.id === id);
    if (!target) return null;
    Object.assign(target, sanitizeBackgroundUpdates(updates));
    const next = target.isDefault ? applyDefaultRule(current, target) : current;
    await this.writeIndex(next);
    return target;
  }

  async remove(id: string) {
    const current = await this.readIndex();
    const next = current.filter((item) => item.id !== id);
    if (next.length === current.length) return false;
    await this.writeIndex(next);
    return true;
  }

  private async readIndex() {
    try {
      return parseBackgrounds(JSON.parse(await readFile(this.filePath, 'utf8')));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  private async writeIndex(backgrounds: BirthdayBackground[]) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(sortBackgrounds(backgrounds), null, 2));
  }
}

class UnconfiguredBirthdayBackgroundStore implements BirthdayBackgroundStore {
  async list() {
    return [];
  }

  async create(): Promise<BirthdayBackground> {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  }

  async update(): Promise<BirthdayBackground | null> {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  }

  async remove(): Promise<boolean> {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  }
}

async function uploadBackgroundImage(id: string, name: string, dataUrl: string) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return { url: dataUrl, pathname: undefined };
  }

  const extension = parsed.contentType === 'image/jpeg' ? 'jpg' : parsed.contentType.split('/')[1];
  const pathname = `birthday-backgrounds/images/${id}-${slugPart(name)}.${extension}`;
  const blob = await put(pathname, parsed.body, {
    access: 'public',
    contentType: parsed.contentType,
  });
  return { url: blob.url, pathname: blob.pathname };
}

function parseDataUrl(value: string) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) return null;
  const contentType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  return { contentType, body: Buffer.from(match[2], 'base64') };
}

function sanitizeBackgroundUpdates(
  updates: Partial<Omit<BirthdayBackground, 'id' | 'uploadedAt' | 'url' | 'pathname'>>,
) {
  const next: Partial<Omit<BirthdayBackground, 'id' | 'uploadedAt' | 'url' | 'pathname'>> = {};
  if (typeof updates.name === 'string') next.name = updates.name.trim();
  if (updates.gender === 'male' || updates.gender === 'female') next.gender = updates.gender;
  if (typeof updates.isActive === 'boolean') next.isActive = updates.isActive;
  if (typeof updates.isDefault === 'boolean') next.isDefault = updates.isDefault;
  return next;
}

function applyDefaultRule(backgrounds: BirthdayBackground[], selected: BirthdayBackground) {
  if (!selected.isDefault) return backgrounds;
  return backgrounds.map((item) => {
    if (item.gender === selected.gender && item.id !== selected.id) {
      return { ...item, isDefault: false };
    }
    return item;
  });
}

function sortBackgrounds(backgrounds: BirthdayBackground[]) {
  return [...backgrounds].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return b.uploadedAt - a.uploadedAt;
  });
}

function parseBackgrounds(value: unknown): BirthdayBackground[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isBirthdayBackground);
}

function isBirthdayBackground(value: unknown): value is BirthdayBackground {
  const candidate = value as BirthdayBackground | null;
  return Boolean(
    candidate &&
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      (candidate.gender === 'male' || candidate.gender === 'female') &&
      typeof candidate.url === 'string' &&
      typeof candidate.isActive === 'boolean' &&
      typeof candidate.isDefault === 'boolean' &&
      typeof candidate.uploadedAt === 'number',
  );
}

function slugPart(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'background'
  );
}
