/**
 * Firebase Cloud Storage & Blob Management
 * Handles PDF binary uploads and signed download references with offline fallback.
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './config';
import { telemetry } from '../utils/telemetry';

let storageInstance: ReturnType<typeof getStorage> | null = null;

try {
  storageInstance = getStorage(app);
} catch (err) {
  console.warn('Firebase Storage initialization fallback:', err);
}

/**
 * Uploads a PDF ArrayBuffer / Uint8Array to Firebase Cloud Storage
 */
export async function uploadPdfBlobToCloud(
  userId: string,
  docId: string,
  pdfData: Uint8Array | ArrayBuffer,
  filename: string
): Promise<{ storagePath: string; downloadUrl: string }> {
  if (!storageInstance) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const path = `users/${userId}/pdfs/${docId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storageInstance, path);

  return telemetry.measureAsync('firebase_upload_pdf', async () => {
    const bytes = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
    await uploadBytes(storageRef, bytes, {
      contentType: 'application/pdf',
      customMetadata: {
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return { storagePath: path, downloadUrl };
  }, { userId, docId, filename });
}

/**
 * Deletes a PDF file from Cloud Storage
 */
export async function deletePdfBlobFromCloud(storagePath: string): Promise<void> {
  if (!storageInstance || !storagePath) return;

  try {
    const storageRef = ref(storageInstance, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete Cloud Storage PDF blob:', err);
  }
}
