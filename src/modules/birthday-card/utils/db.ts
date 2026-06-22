import { Background } from '../types';
import { generateDefaultBackground } from './defaultTemplates';

const DB_NAME = 'HiStaffBirthdayCardDB';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Lấy toàn bộ danh sách background
export async function getAllBackgrounds(): Promise<Background[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let results = request.result as Background[];
      
      // Nếu DB trống rỗng, khởi tạo với data mẫu mặc định
      if (results.length === 0) {
        initDefaultBackgrounds(db)
          .then((defaults) => resolve(defaults))
          .catch(reject);
      } else {
        // Sắp xếp: Mẫu mặc định lên đầu, sau đó sắp theo thời gian tạo giảm dần
        results.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return b.uploadedAt - a.uploadedAt;
        });
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Khởi tạo các mẫu mặc định
async function initDefaultBackgrounds(db: IDBDatabase): Promise<Background[]> {
  const defaultMaleUrl = generateDefaultBackground('male');
  const defaultFemaleUrl = generateDefaultBackground('female');

  const defaultBackgrounds: Background[] = [
    {
      id: 'default_male',
      name: 'Mẫu Nam chuẩn HiStaff (Tuxedo)',
      gender: 'male',
      url: defaultMaleUrl,
      isActive: true,
      isDefault: true,
      uploadedAt: Date.now(),
    },
    {
      id: 'default_female',
      name: 'Mẫu Nữ chuẩn HiStaff (Blue Butterfly)',
      gender: 'female',
      url: defaultFemaleUrl,
      isActive: true,
      isDefault: true,
      uploadedAt: Date.now() + 10, // Đảm bảo khác timestamp xíu
    }
  ];

  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  for (const bg of defaultBackgrounds) {
    store.put(bg);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve(defaultBackgrounds);
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// Lưu hoặc cập nhật background (Cho Admin)
export async function saveBackground(background: Background): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Nếu background này được set làm mặc định, chúng ta phải hủy mặc định của các mẫu khác cùng giới tính
    if (background.isDefault) {
      const getRequest = store.getAll();
      getRequest.onsuccess = () => {
        const list = getRequest.result as Background[];
        list.forEach((item) => {
          if (item.gender === background.gender && item.id !== background.id && item.isDefault) {
            item.isDefault = false;
            store.put(item);
          }
        });
        // Cuối cùng đưa background mới vào
        store.put(background);
      };
    } else {
      store.put(background);
    }

    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// Xóa background (Cho Admin)
export async function deleteBackground(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);

    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// Khôi phục cài đặt gốc thư viện template
export async function resetDatabaseToDefault(): Promise<Background[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = async () => {
      try {
        const defaults = await initDefaultBackgrounds(db);
        resolve(defaults);
      } catch (err) {
        reject(err);
      }
    };

    clearRequest.onerror = () => {
      reject(clearRequest.error);
    };
  });
}
