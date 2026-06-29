import {
  createBirthdayBackgroundStore,
  serializeBirthdayBackground,
  type BirthdayBackground,
  type BirthdayBackgroundStore,
} from './birthday-backgrounds.js';

export type JsonResponse = {
  status: number;
  body?: unknown;
};

export async function listBirthdayBackgrounds(
  store: BirthdayBackgroundStore = createBirthdayBackgroundStore(),
): Promise<JsonResponse> {
  try {
    const backgrounds = await store.list();
    return {
      status: 200,
      body: { backgrounds: backgrounds.map(serializeBirthdayBackground) },
    };
  } catch (error) {
    console.error('Birthday background list failed:', error);
    return { status: 500, body: { error: 'Không thể tải thư viện background dùng chung.' } };
  }
}

export function checkBirthdayBackgroundAdminPin(
  suppliedPin: string,
  expectedPin = process.env.BACKGROUND_ADMIN_PIN ?? '',
): JsonResponse {
  if (!isBackgroundAdminPinValid(suppliedPin, expectedPin)) {
    return { status: 401, body: { error: 'Mã quản trị background không đúng.' } };
  }
  return { status: 200, body: { valid: true } };
}

export async function createBirthdayBackground(
  suppliedPin: string,
  body: unknown,
  store: BirthdayBackgroundStore = createBirthdayBackgroundStore(),
  expectedPin = process.env.BACKGROUND_ADMIN_PIN ?? '',
): Promise<JsonResponse> {
  const authFailure = requireAdminPin(suppliedPin, expectedPin);
  if (authFailure) return authFailure;

  const payload = validateBackgroundPayload(body);
  if (!payload) {
    return { status: 400, body: { error: 'Thông tin background không hợp lệ.' } };
  }

  try {
    const background = await store.create(payload);
    return {
      status: 201,
      body: { background: serializeBirthdayBackground(background) },
    };
  } catch (error) {
    console.error('Birthday background create failed:', error);
    return { status: 503, body: { error: 'Không thể lưu background dùng chung lúc này.' } };
  }
}

export async function updateBirthdayBackground(
  suppliedPin: string,
  id: string,
  body: unknown,
  store: BirthdayBackgroundStore = createBirthdayBackgroundStore(),
  expectedPin = process.env.BACKGROUND_ADMIN_PIN ?? '',
): Promise<JsonResponse> {
  const authFailure = requireAdminPin(suppliedPin, expectedPin);
  if (authFailure) return authFailure;

  try {
    const background = await store.update(id, (body ?? {}) as Partial<BirthdayBackground>);
    if (!background) {
      return { status: 404, body: { error: 'Không tìm thấy background.' } };
    }
    return { status: 200, body: { background: serializeBirthdayBackground(background) } };
  } catch (error) {
    console.error('Birthday background update failed:', error);
    return { status: 503, body: { error: 'Không thể cập nhật background dùng chung lúc này.' } };
  }
}

export async function deleteBirthdayBackground(
  suppliedPin: string,
  id: string,
  store: BirthdayBackgroundStore = createBirthdayBackgroundStore(),
  expectedPin = process.env.BACKGROUND_ADMIN_PIN ?? '',
): Promise<JsonResponse> {
  const authFailure = requireAdminPin(suppliedPin, expectedPin);
  if (authFailure) return authFailure;

  try {
    const removed = await store.remove(id);
    if (!removed) {
      return { status: 404, body: { error: 'Không tìm thấy background.' } };
    }
    return { status: 204 };
  } catch (error) {
    console.error('Birthday background delete failed:', error);
    return { status: 503, body: { error: 'Không thể xóa background dùng chung lúc này.' } };
  }
}

function requireAdminPin(suppliedPin: string, expectedPin: string) {
  if (!isBackgroundAdminPinValid(suppliedPin, expectedPin)) {
    return { status: 401, body: { error: 'Mã quản trị background không đúng.' } };
  }
  return null;
}

function isBackgroundAdminPinValid(suppliedPin: string, expectedPin: string) {
  return expectedPin.length > 0 && suppliedPin.trim().length > 0 && suppliedPin.trim() === expectedPin;
}

function validateBackgroundPayload(value: unknown): Omit<BirthdayBackground, 'id' | 'uploadedAt'> | null {
  const candidate = value as {
    name?: unknown;
    gender?: unknown;
    url?: unknown;
    isActive?: unknown;
    isDefault?: unknown;
  } | null;
  if (!candidate) return null;

  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const gender = candidate.gender === 'male' || candidate.gender === 'female' ? candidate.gender : null;
  const url = typeof candidate.url === 'string' ? candidate.url.trim() : '';

  if (!name || !gender || !url) return null;

  return {
    name,
    gender,
    url,
    isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
    isDefault: typeof candidate.isDefault === 'boolean' ? candidate.isDefault : false,
  };
}
