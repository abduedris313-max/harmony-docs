import { DirectoryScanItem } from '../types';

/**
 * Utility to scan local disk directories for documents (PDF, MD, TXT, EPUB)
 */

export function parseFileListToScanItems(fileList: FileList | File[]): DirectoryScanItem[] {
  const items: DirectoryScanItem[] = [];
  const supportedExtensions = ['.pdf', '.md', '.markdown', '.txt', '.epub'];

  const filesArray = Array.from(fileList);

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const nameLower = file.name.toLowerCase();
    const matchedExt = supportedExtensions.find((ext) => nameLower.endsWith(ext));

    if (matchedExt) {
      let format: 'pdf' | 'md' | 'txt' | 'epub' = 'md';
      if (matchedExt === '.pdf') format = 'pdf';
      else if (matchedExt === '.txt') format = 'txt';
      else if (matchedExt === '.epub') format = 'epub';
      else format = 'md';

      const relativePath = (file as any).webkitRelativePath || file.name;

      items.push({
        id: `scan-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        relativePath: relativePath,
        sizeBytes: file.size,
        fileFormat: format,
        lastModified: file.lastModified || Date.now(),
        file: file,
        selected: true,
        status: 'pending',
      });
    }
  }

  return items;
}

/**
 * Modern File System Access API Scanner (Chrome/Edge/Desktop)
 */
export async function scanDirectoryWithNativePicker(): Promise<DirectoryScanItem[]> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory Picker API not supported on this browser.');
  }

  const items: DirectoryScanItem[] = [];
  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    await scanHandleRecursively(dirHandle, '', items);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return [];
    }
    throw err;
  }
  return items;
}

async function scanHandleRecursively(
  dirHandle: any,
  currentPath: string,
  results: DirectoryScanItem[]
) {
  for await (const entry of dirHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    if (entry.kind === 'file') {
      const nameLower = entry.name.toLowerCase();
      if (
        nameLower.endsWith('.pdf') ||
        nameLower.endsWith('.md') ||
        nameLower.endsWith('.txt') ||
        nameLower.endsWith('.epub')
      ) {
        try {
          const file = await entry.getFile();
          let format: 'pdf' | 'md' | 'txt' | 'epub' = 'md';
          if (nameLower.endsWith('.pdf')) format = 'pdf';
          else if (nameLower.endsWith('.txt')) format = 'txt';
          else if (nameLower.endsWith('.epub')) format = 'epub';

          results.push({
            id: `scan-${Date.now()}-${results.length}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            relativePath: entryPath,
            sizeBytes: file.size,
            fileFormat: format,
            lastModified: file.lastModified || Date.now(),
            file: file,
            selected: true,
            status: 'pending',
          });
        } catch (e) {
          console.warn('Could not read file handle:', entry.name, e);
        }
      }
    } else if (entry.kind === 'directory') {
      // Avoid scanning hidden or node_modules directories
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await scanHandleRecursively(entry, entryPath, results);
      }
    }
  }
}
