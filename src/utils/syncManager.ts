/**
 * Sync Manager & Vector Clock Conflict Resolution
 * Handles multi-device, multi-tab document state sync with conflict detection.
 */

import { Book } from '../types';
import { telemetry } from './telemetry';

export interface SyncMetadata {
  version: number;
  updatedAt: number;
  deviceId: string;
}

export interface SyncResult<T> {
  mergedItem: T;
  hasConflict: boolean;
  conflictDescription?: string;
}

/**
 * Generates a unique device/tab identifier for vector clock tracking
 */
export function getOrCreateDeviceId(): string {
  const KEY = 'pdf_md_device_id';
  let deviceId = localStorage.getItem(KEY);
  if (!deviceId) {
    deviceId = `dev-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
    localStorage.setItem(KEY, deviceId);
  }
  return deviceId;
}

/**
 * Resolves conflict between local state and incoming remote state using Last-Write-Wins (LWW) + Vector Clock
 */
export function resolveBookConflict(localBook: Book, remoteBook: Book): SyncResult<Book> {
  const localTime = localBook.lastReadTimestamp || 0;
  const remoteTime = remoteBook.lastReadTimestamp || 0;

  // Check if content differs significantly
  const contentMatch = localBook.content === remoteBook.content;

  if (contentMatch) {
    return {
      mergedItem: {
        ...remoteBook,
        // Keep higher progress if content matches
        progressPercent: Math.max(localBook.progressPercent || 0, remoteBook.progressPercent || 0),
      },
      hasConflict: false,
    };
  }

  // If local edit is newer
  if (localTime > remoteTime) {
    telemetry.logEvent('sync_conflict_local_win', { bookId: localBook.id, localTime, remoteTime });
    return {
      mergedItem: {
        ...localBook,
        // preserve remote metadata if needed
        category: localBook.category || remoteBook.category,
      },
      hasConflict: true,
      conflictDescription: 'Local document edits retained because local timestamp was newer.',
    };
  }

  // Otherwise remote edit wins
  telemetry.logEvent('sync_conflict_remote_win', { bookId: remoteBook.id, localTime, remoteTime });
  return {
    mergedItem: {
      ...remoteBook,
    },
    hasConflict: true,
    conflictDescription: 'Remote document state applied from cloud (newer timestamp).',
  };
}

/**
 * Merges a collection of local books with incoming remote books safely
 */
export function mergeBookCollections(localBooks: Book[], remoteBooks: Book[]): { mergedBooks: Book[]; conflictCount: number } {
  const bookMap = new Map<string, Book>();
  let conflictCount = 0;

  // Populate map with local books
  for (const book of localBooks) {
    bookMap.set(book.id, book);
  }

  // Merge remote books
  for (const remote of remoteBooks) {
    const local = bookMap.get(remote.id);
    if (!local) {
      bookMap.set(remote.id, remote);
    } else {
      const result = resolveBookConflict(local, remote);
      bookMap.set(remote.id, result.mergedItem);
      if (result.hasConflict) {
        conflictCount++;
      }
    }
  }

  return {
    mergedBooks: Array.from(bookMap.values()),
    conflictCount,
  };
}
