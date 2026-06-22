const GEMINI_API_KEY_SESSION_KEY = 'tvc:meeting-minutes:gemini-api-key';

type SessionStorageReader = Pick<Storage, 'getItem'>;
type SessionStorageWriter = Pick<Storage, 'setItem'>;
type SessionStorageRemover = Pick<Storage, 'removeItem'>;

export function getGeminiApiKey(storage: SessionStorageReader = sessionStorage) {
  return storage.getItem(GEMINI_API_KEY_SESSION_KEY)?.trim() ?? '';
}

export function saveGeminiApiKey(
  apiKey: string,
  storage: SessionStorageWriter = sessionStorage,
) {
  const normalizedKey = apiKey.trim();
  if (!normalizedKey) throw new Error('Gemini API key không được để trống.');
  storage.setItem(GEMINI_API_KEY_SESSION_KEY, normalizedKey);
}

export function clearGeminiApiKey(storage: SessionStorageRemover = sessionStorage) {
  storage.removeItem(GEMINI_API_KEY_SESSION_KEY);
}
