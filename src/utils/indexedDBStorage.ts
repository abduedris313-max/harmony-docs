/**
 * IndexedDB Local Storage Manager
 * Enables robust offline persistence for large PDFs, documents, books, and version history.
 */

const DB_NAME = 'PdfToMdOfflineDB';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';
const STORE_FILES = 'files';
const STORE_FOLDERS = 'folders';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToOfflineStore(storeName: string, item: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`IndexedDB save error in ${storeName}:`, err);
  }
}

export async function getAllFromOfflineStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`IndexedDB getAll error in ${storeName}:`, err);
    return [];
  }
}

export async function removeFromOfflineStore(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`IndexedDB delete error in ${storeName}:`, err);
  }
}

export async function getStorageUsage(): Promise<{ usedMb: number; estimateMb?: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMb = Math.round(((estimate.usage || 0) / (1024 * 1024)) * 10) / 10;
      const estimateMb = Math.round(((estimate.quota || 0) / (1024 * 1024)) * 10) / 10;
      return { usedMb, estimateMb };
    } catch {
      return { usedMb: 0 };
    }
  }
  return { usedMb: 0 };
}
