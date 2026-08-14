/**
 * Google Drive REST API v3 Integration Service
 * Manages OAuth tokens, file operations (search/list, upload/save, download/read, delete),
 * and folder management for user-based document storage.
 */

import { CloudFile, CloudAccount } from '../types';

const GDRIVE_TOKEN_KEY = 'gdrive_oauth_access_token';
const GDRIVE_TOKEN_TIME_KEY = 'gdrive_oauth_token_timestamp';
const GDRIVE_FOLDER_NAME = 'PDF Conversions';

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveUser {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface DriveAboutInfo {
  user?: DriveUser;
  storageQuota?: DriveStorageQuota;
}

// ==========================================
// Token Management
// ==========================================

export const getStoredGoogleDriveToken = (): string | null => {
  const token = localStorage.getItem(GDRIVE_TOKEN_KEY) || sessionStorage.getItem(GDRIVE_TOKEN_KEY);
  if (!token) return null;
  return token;
};

export const saveGoogleDriveToken = (token: string): void => {
  localStorage.setItem(GDRIVE_TOKEN_KEY, token);
  sessionStorage.setItem(GDRIVE_TOKEN_KEY, token);
  localStorage.setItem(GDRIVE_TOKEN_TIME_KEY, Date.now().toString());
};

export const clearGoogleDriveToken = (): void => {
  localStorage.removeItem(GDRIVE_TOKEN_KEY);
  sessionStorage.removeItem(GDRIVE_TOKEN_KEY);
  localStorage.removeItem(GDRIVE_TOKEN_TIME_KEY);
};

// ==========================================
// API Helpers
// ==========================================

const fetchWithAuth = async (url: string, options: RequestInit = {}, token?: string): Promise<Response> => {
  const authToken = token || getStoredGoogleDriveToken();
  if (!authToken) {
    throw new Error('Google Drive access token missing. Please sign in with Google.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearGoogleDriveToken();
    throw new Error('Google Drive authentication session expired (401). Please re-connect your Google Account.');
  }

  return response;
};

// ==========================================
// User Info & Storage Quota
// ==========================================

export const getDriveAboutInfo = async (token?: string): Promise<DriveAboutInfo> => {
  try {
    const response = await fetchWithAuth(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink),storageQuota(limit,usage,usageInDrive,usageInDriveTrash)',
      { method: 'GET' },
      token
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Drive account info: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('getDriveAboutInfo error:', error);
    throw error;
  }
};

// ==========================================
// Folder Management
// ==========================================

/**
 * Finds or creates the dedicated app folder in the user's Google Drive
 */
export const getOrCreateAppFolder = async (
  folderName: string = GDRIVE_FOLDER_NAME,
  token?: string
): Promise<string> => {
  try {
    // 1. Search for existing folder
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;
    
    const searchRes = await fetchWithAuth(searchUrl, { method: 'GET' }, token);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }
    }

    // 2. Create folder if not found
    const createRes = await fetchWithAuth(
      'https://www.googleapis.com/drive/v3/files',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Dedicated folder for PDF to Markdown Converter & Reader documents',
        }),
      },
      token
    );

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Could not create app folder in Google Drive');
    }

    const created = await createRes.json();
    return created.id;
  } catch (error) {
    console.warn('getOrCreateAppFolder warning:', error);
    // If folder creation fails due to scope restriction, fallback to root
    return 'root';
  }
};

// ==========================================
// List & Search Files
// ==========================================

export interface ListDriveFilesOptions {
  folderId?: string;
  searchQuery?: string;
  fileType?: 'all' | 'pdf' | 'md';
  pageSize?: number;
}

export const listDriveFiles = async (
  options: ListDriveFilesOptions = {},
  token?: string
): Promise<CloudFile[]> => {
  try {
    const { folderId, searchQuery, fileType = 'all', pageSize = 50 } = options;

    let queryParts: string[] = ['trashed = false'];

    if (fileType === 'pdf') {
      queryParts.push("mimeType = 'application/pdf'");
    } else if (fileType === 'md') {
      queryParts.push("(mimeType = 'text/markdown' or mimeType = 'text/plain' or mimeType = 'application/x-markdown' or name contains '.md')");
    } else {
      // All supported document types
      queryParts.push(
        "(mimeType = 'application/pdf' or mimeType = 'text/markdown' or mimeType = 'text/plain' or mimeType = 'application/x-markdown' or name contains '.md' or name contains '.pdf')"
      );
    }

    if (folderId && folderId !== 'root' && folderId !== 'all') {
      queryParts.push(`'${folderId}' in parents`);
    }

    if (searchQuery && searchQuery.trim()) {
      const cleanSearch = searchQuery.trim().replace(/'/g, "\\'");
      queryParts.push(`name contains '${cleanSearch}'`);
    }

    const q = queryParts.join(' and ');
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,iconLink,thumbnailLink,parents)&orderBy=modifiedTime desc&pageSize=${pageSize}&spaces=drive`;

    const response = await fetchWithAuth(url, { method: 'GET' }, token);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to list files from Google Drive: ${response.statusText}`);
    }

    const data = await response.json();
    const rawFiles: any[] = data.files || [];

    const cloudFiles: CloudFile[] = rawFiles.map((file) => {
      const isPdf = file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isMd =
        file.mimeType === 'text/markdown' ||
        file.mimeType === 'application/x-markdown' ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.txt');

      return {
        id: file.id,
        name: file.name,
        provider: 'google-drive',
        type: isPdf ? 'pdf' : isMd ? 'md' : 'txt',
        sizeBytes: file.size ? parseInt(file.size, 10) : 0,
        updatedAt: file.modifiedTime ? new Date(file.modifiedTime).getTime() : Date.now(),
        path: `/My Drive/${GDRIVE_FOLDER_NAME}/${file.name}`,
      };
    });

    return cloudFiles;
  } catch (error) {
    console.error('listDriveFiles error:', error);
    throw error;
  }
};

// ==========================================
// Upload & Save File (Multipart REST v3)
// ==========================================

export interface UploadFileOptions {
  name: string;
  content: string | Blob | ArrayBuffer;
  mimeType?: string;
  folderId?: string;
  existingFileId?: string;
}

export const uploadFileToGoogleDrive = async (
  options: UploadFileOptions,
  token?: string
): Promise<{ id: string; name: string; webViewLink?: string; size?: number }> => {
  const { name, content, folderId, existingFileId } = options;

  let mimeType = options.mimeType;
  if (!mimeType) {
    if (name.endsWith('.md')) mimeType = 'text/markdown';
    else if (name.endsWith('.pdf')) mimeType = 'application/pdf';
    else mimeType = 'text/plain';
  }

  // Get target parent folder if new file
  let parentFolderId = folderId;
  if (!existingFileId && !parentFolderId) {
    parentFolderId = await getOrCreateAppFolder(GDRIVE_FOLDER_NAME, token);
  }

  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name,
    mimeType,
  };

  if (!existingFileId && parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

  let bodyBlob: Blob;
  if (typeof content === 'string') {
    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const dataPart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n${content}${closeDelimiter}`;
    bodyBlob = new Blob([metaPart, dataPart], { type: `multipart/related; boundary=${boundary}` });
  } else if (content instanceof Blob) {
    const metaPart = new Blob(
      [`${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}${delimiter}Content-Type: ${mimeType}\r\n\r\n`],
      { type: 'text/plain' }
    );
    const closePart = new Blob([closeDelimiter], { type: 'text/plain' });
    bodyBlob = new Blob([metaPart, content, closePart], { type: `multipart/related; boundary=${boundary}` });
  } else {
    // ArrayBuffer
    const dataBlob = new Blob([content], { type: mimeType });
    const metaPart = new Blob(
      [`${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}${delimiter}Content-Type: ${mimeType}\r\n\r\n`],
      { type: 'text/plain' }
    );
    const closePart = new Blob([closeDelimiter], { type: 'text/plain' });
    bodyBlob = new Blob([metaPart, dataBlob, closePart], { type: `multipart/related; boundary=${boundary}` });
  }

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,size,webViewLink,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,modifiedTime`;

  const method = existingFileId ? 'PATCH' : 'POST';

  const response = await fetchWithAuth(
    url,
    {
      method,
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBlob,
    },
    token
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file to Google Drive: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};

// ==========================================
// Download / Read File
// ==========================================

export const downloadFileContentFromDrive = async (
  fileId: string,
  isBinary: boolean = false,
  token?: string
): Promise<{ text?: string; blob?: Blob; dataUrl?: string }> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetchWithAuth(url, { method: 'GET' }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to download file from Google Drive: ${response.statusText}`);
  }

  if (isBinary) {
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          blob,
          dataUrl: reader.result as string,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    const text = await response.text();
    return { text };
  }
};

// ==========================================
// Delete File
// ==========================================

export const deleteFileFromDrive = async (fileId: string, token?: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetchWithAuth(url, { method: 'DELETE' }, token);

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive: ${response.statusText}`);
  }
};

// ==========================================
// Revoke Token / Disconnect
// ==========================================

export const revokeGoogleDriveToken = async (token?: string): Promise<void> => {
  const authToken = token || getStoredGoogleDriveToken();
  if (authToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${authToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (e) {
      console.warn('Revoke token request failed (ignored):', e);
    }
  }
  clearGoogleDriveToken();
};
