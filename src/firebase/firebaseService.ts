import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, googleProvider } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { Book, DocumentFolder, HistoryItem, VersionSnapshot } from '../types';

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in Error:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out Error:', error);
    throw error;
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

// Books CRUD in Firestore
export const saveBookToFirestore = async (userId: string, book: Book): Promise<void> => {
  const path = `users/${userId}/books/${book.id}`;
  try {
    const bookDocRef = doc(db, 'users', userId, 'books', book.id);
    const cleanData: Record<string, any> = {
      id: book.id,
      userId,
      title: book.title || 'Untitled',
      content: book.content || '',
      source: book.source || 'local',
      category: book.category || 'General',
      shelf: book.shelf || 'Currently Reading',
      coverColor: book.coverColor || '#007AFF',
      progressPercent: typeof book.progressPercent === 'number' ? book.progressPercent : 0,
      lastReadTimestamp: book.lastReadTimestamp || Date.now(),
      tags: Array.isArray(book.tags) ? book.tags.slice(0, 20) : [],
      wordCount: typeof book.wordCount === 'number' ? book.wordCount : 0,
    };

    if (book.author) cleanData.author = book.author;
    if (book.folderId) cleanData.folderId = book.folderId;

    await setDoc(bookDocRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteBookFromFirestore = async (userId: string, bookId: string): Promise<void> => {
  const path = `users/${userId}/books/${bookId}`;
  try {
    const bookDocRef = doc(db, 'users', userId, 'books', bookId);
    await deleteDoc(bookDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToUserBooks = (
  userId: string,
  onUpdate: (books: Book[]) => void,
  onError?: (err: any) => void
): Unsubscribe => {
  const path = `users/${userId}/books`;
  const booksCol = collection(db, 'users', userId, 'books');
  return onSnapshot(
    booksCol,
    (snapshot) => {
      const items: Book[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          title: data.title || 'Untitled',
          author: data.author || 'Unknown',
          source: data.source || 'cloud',
          category: data.category || 'General',
          shelf: data.shelf || 'Currently Reading',
          content: data.content || '',
          coverColor: data.coverColor || '#007AFF',
          progressPercent: data.progressPercent || 0,
          lastReadTimestamp: data.lastReadTimestamp || Date.now(),
          tags: data.tags || [],
          wordCount: data.wordCount || 0,
          bookmarks: [],
          folderId: data.folderId,
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
};

// Folders CRUD in Firestore
export const saveFolderToFirestore = async (userId: string, folder: DocumentFolder): Promise<void> => {
  const path = `users/${userId}/folders/${folder.id}`;
  try {
    const folderRef = doc(db, 'users', userId, 'folders', folder.id);
    const cleanData: Record<string, any> = {
      id: folder.id,
      userId,
      name: folder.name || 'New Folder',
      color: folder.color || '#007AFF',
      createdAt: folder.createdAt || Date.now(),
    };
    await setDoc(folderRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteFolderFromFirestore = async (userId: string, folderId: string): Promise<void> => {
  const path = `users/${userId}/folders/${folderId}`;
  try {
    const folderRef = doc(db, 'users', userId, 'folders', folderId);
    await deleteDoc(folderRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToUserFolders = (
  userId: string,
  onUpdate: (folders: DocumentFolder[]) => void,
  onError?: (err: any) => void
): Unsubscribe => {
  const path = `users/${userId}/folders`;
  const foldersCol = collection(db, 'users', userId, 'folders');
  return onSnapshot(
    foldersCol,
    (snapshot) => {
      const items: DocumentFolder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          name: data.name || 'Folder',
          color: data.color || '#007AFF',
          createdAt: data.createdAt || Date.now(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
};

// Sync all local items to cloud
export const syncAllLocalToFirestore = async (
  userId: string,
  books: Book[],
  folders: DocumentFolder[],
  history: HistoryItem[],
  snapshots: VersionSnapshot[]
): Promise<{ booksCount: number; foldersCount: number }> => {
  let bCount = 0;
  let fCount = 0;

  for (const book of books) {
    try {
      await saveBookToFirestore(userId, book);
      bCount++;
    } catch (e) {
      console.warn('Sync book error:', e);
    }
  }

  for (const folder of folders) {
    try {
      await saveFolderToFirestore(userId, folder);
      fCount++;
    } catch (e) {
      console.warn('Sync folder error:', e);
    }
  }

  return { booksCount: bCount, foldersCount: fCount };
};
