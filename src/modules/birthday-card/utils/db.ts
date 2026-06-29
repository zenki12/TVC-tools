import { Background } from '../types';
import { generateDefaultBackground } from './defaultTemplates';

const ADMIN_PIN_SESSION_KEY = 'tvc-birthday-background-admin-pin';

// Lấy toàn bộ danh sách background
export async function getAllBackgrounds(): Promise<Background[]> {
  const defaults = createDefaultBackgrounds();

  try {
    const response = await fetch('/api/birthday/backgrounds', { cache: 'no-store' });
    if (!response.ok) return defaults;
    const body = await response.json();
    const shared = parseSharedBackgrounds(body?.backgrounds);
    return mergeDefaultAndSharedBackgrounds(defaults, shared);
  } catch {
    return defaults;
  }
}

// Khởi tạo các mẫu mặc định
function createDefaultBackgrounds(): Background[] {
  const defaultMaleUrl = generateDefaultBackground('male');
  const defaultFemaleUrl = generateDefaultBackground('female');

  return [
    {
      id: 'default_male',
      name: 'Mẫu Nam chuẩn HiStaff (Tuxedo)',
      gender: 'male',
      url: defaultMaleUrl,
      isActive: true,
      isDefault: true,
      uploadedAt: Date.now(),
      origin: 'builtin',
    },
    {
      id: 'default_female',
      name: 'Mẫu Nữ chuẩn HiStaff (Blue Butterfly)',
      gender: 'female',
      url: defaultFemaleUrl,
      isActive: true,
      isDefault: true,
      uploadedAt: Date.now() + 10, // Đảm bảo khác timestamp xíu
      origin: 'builtin',
    }
  ];
}

// Lưu hoặc cập nhật background (Cho Admin)
export async function saveBackground(
  background: Omit<Background, 'id' | 'uploadedAt'> | Background,
  adminPin: string,
): Promise<void> {
  const isSharedExisting = 'id' in background && background.origin === 'shared';
  const response = await fetch(
    isSharedExisting ? `/api/birthday/backgrounds/${encodeURIComponent(background.id)}` : '/api/birthday/backgrounds',
    {
      method: isSharedExisting ? 'PATCH' : 'POST',
      headers: {
        'content-type': 'application/json',
        'x-background-admin-pin': adminPin,
      },
      body: JSON.stringify(background),
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

// Xóa background (Cho Admin)
export async function deleteBackground(id: string, adminPin: string): Promise<void> {
  const response = await fetch(`/api/birthday/backgrounds/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-background-admin-pin': adminPin },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

// Khôi phục cài đặt gốc thư viện template
export async function resetDatabaseToDefault(adminPin: string): Promise<Background[]> {
  const backgrounds = await getAllBackgrounds();
  const shared = backgrounds.filter((background) => background.origin === 'shared');

  for (const background of shared) {
    await deleteBackground(background.id, adminPin);
  }

  return createDefaultBackgrounds();
}

export async function checkBackgroundAdminPin(adminPin: string): Promise<void> {
  const response = await fetch('/api/birthday/backgrounds/admin/check', {
    method: 'POST',
    headers: { 'x-background-admin-pin': adminPin },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export function readSavedBackgroundAdminPin() {
  return sessionStorage.getItem(ADMIN_PIN_SESSION_KEY) ?? '';
}

export function saveBackgroundAdminPin(adminPin: string) {
  sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, adminPin);
}

export function clearBackgroundAdminPin() {
  sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
}

function mergeDefaultAndSharedBackgrounds(defaults: Background[], shared: Background[]) {
  const sharedDefaultGenders = new Set(
    shared
      .filter((background) => background.isDefault && background.isActive)
      .map((background) => background.gender),
  );

  const adjustedDefaults = defaults.map((background) => ({
    ...background,
    isDefault: sharedDefaultGenders.has(background.gender) ? false : background.isDefault,
  }));

  return [...adjustedDefaults, ...shared].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return b.uploadedAt - a.uploadedAt;
  });
}

function parseSharedBackgrounds(value: unknown): Background[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => {
      const candidate = item as Background | null;
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
    })
    .map((item) => ({ ...(item as Background), origin: 'shared' }));
}

async function readApiError(response: Response) {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // ignore non-JSON API errors
  }
  return 'Không thể cập nhật thư viện background dùng chung.';
}
