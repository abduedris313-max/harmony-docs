/**
 * Google Docs API v1 & Drive Export Integration Service
 * Provides document creation, markdown-to-doc conversion, doc-to-markdown parsing,
 * listing, and direct sync with Google Docs.
 */

import { getStoredGoogleDriveToken } from './googleDriveService';
import { CloudFile } from '../types';

export interface GoogleDocSummary {
  id: string;
  title: string;
  modifiedTime: number;
  webViewLink: string;
  sizeBytes?: number;
}

const fetchWithAuth = async (url: string, options: RequestInit = {}, token?: string): Promise<Response> => {
  const authToken = token || getStoredGoogleDriveToken();
  if (!authToken) {
    throw new Error('Google authentication token missing. Please sign in with Google.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error('Google session expired (401). Please re-authenticate.');
  }

  return response;
};

// ==========================================
// List Google Docs
// ==========================================

export const listGoogleDocs = async (
  searchQuery?: string,
  pageSize: number = 30,
  token?: string
): Promise<CloudFile[]> => {
  try {
    let queryParts = [
      "mimeType = 'application/vnd.google-apps.document'",
      'trashed = false',
    ];

    if (searchQuery && searchQuery.trim()) {
      const clean = searchQuery.trim().replace(/'/g, "\\'");
      queryParts.push(`name contains '${clean}'`);
    }

    const q = queryParts.join(' and ');
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime desc&pageSize=${pageSize}&spaces=drive`;

    const response = await fetchWithAuth(url, { method: 'GET' }, token);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to list Google Docs: ${response.statusText}`);
    }

    const data = await response.json();
    const rawFiles: any[] = data.files || [];

    return rawFiles.map((file) => ({
      id: file.id,
      name: file.name.endsWith('.gdoc') || file.name.includes('.') ? file.name : `${file.name}`,
      provider: 'google-drive',
      type: 'gdoc',
      sizeBytes: file.size ? parseInt(file.size, 10) : 0,
      updatedAt: file.modifiedTime ? new Date(file.modifiedTime).getTime() : Date.now(),
      path: `/Google Docs/${file.name}`,
      webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
    }));
  } catch (error) {
    console.error('listGoogleDocs error:', error);
    throw error;
  }
};

// ==========================================
// Create Google Doc from Markdown
// ==========================================

export const createGoogleDocFromMarkdown = async (
  title: string,
  markdownContent: string,
  token?: string
): Promise<{ documentId: string; title: string; webViewLink: string }> => {
  try {
    // 1. Create a blank Google Document
    const createUrl = 'https://docs.googleapis.com/v1/documents';
    const createRes = await fetchWithAuth(
      createUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.replace(/\.md$|\.gdoc$/i, '') }),
      },
      token
    );

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Google Doc: ${createRes.statusText}`);
    }

    const docData = await createRes.json();
    const documentId = docData.documentId;
    const cleanTitle = docData.title || title;

    // 2. Insert text content into document
    if (markdownContent && markdownContent.trim()) {
      const updateUrl = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
      
      const insertRequest = {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: markdownContent,
            },
          },
        ],
      };

      const updateRes = await fetchWithAuth(
        updateUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(insertRequest),
        },
        token
      );

      if (!updateRes.ok) {
        console.warn('Batch update to Google Doc warning (content partially written):', await updateRes.text());
      }
    }

    const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;
    return { documentId, title: cleanTitle, webViewLink };
  } catch (error) {
    console.error('createGoogleDocFromMarkdown error:', error);
    throw error;
  }
};

// ==========================================
// Fetch & Convert Google Doc to Markdown
// ==========================================

/**
 * Parses Google Docs JSON AST structure into Markdown
 */
const parseDocJsonToMarkdown = (doc: any): string => {
  if (!doc || !doc.body || !doc.body.content) return '';

  const elements: any[] = doc.body.content;
  const lines: string[] = [];

  for (const el of elements) {
    if (el.paragraph) {
      const p = el.paragraph;
      const namedStyleType = p.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
      let paragraphText = '';

      if (p.elements) {
        for (const child of p.elements) {
          if (child.textRun && child.textRun.content) {
            let runText = child.textRun.content;
            const style = child.textRun.textStyle || {};

            // Strip trailing newline from run to apply Markdown inline styles cleanly
            const hasTrailingNewline = runText.endsWith('\n');
            if (hasTrailingNewline) {
              runText = runText.slice(0, -1);
            }

            if (runText.trim()) {
              if (style.bold && style.italic) {
                runText = `***${runText}***`;
              } else if (style.bold) {
                runText = `**${runText}**`;
              } else if (style.italic) {
                runText = `*${runText}*`;
              }

              if (style.link?.url) {
                runText = `[${runText}](${style.link.url})`;
              }
            }

            if (hasTrailingNewline) {
              runText += '\n';
            }

            paragraphText += runText;
          }
        }
      }

      // Prefix according to heading styles
      const trimmed = paragraphText.replace(/\n$/, '');
      if (namedStyleType === 'TITLE') {
        lines.push(`# ${trimmed}`);
      } else if (namedStyleType === 'SUBTITLE') {
        lines.push(`### ${trimmed}`);
      } else if (namedStyleType === 'HEADING_1') {
        lines.push(`# ${trimmed}`);
      } else if (namedStyleType === 'HEADING_2') {
        lines.push(`## ${trimmed}`);
      } else if (namedStyleType === 'HEADING_3') {
        lines.push(`### ${trimmed}`);
      } else if (namedStyleType === 'HEADING_4') {
        lines.push(`#### ${trimmed}`);
      } else if (p.bullet) {
        lines.push(`- ${trimmed}`);
      } else {
        lines.push(trimmed);
      }
    } else if (el.table) {
      // Basic table support
      const table = el.table;
      if (table.tableRows) {
        for (let rowIndex = 0; rowIndex < table.tableRows.length; rowIndex++) {
          const row = table.tableRows[rowIndex];
          const cellTexts: string[] = [];

          for (const cell of row.tableCells || []) {
            let cellContent = '';
            for (const cellEl of cell.content || []) {
              if (cellEl.paragraph?.elements) {
                for (const tr of cellEl.paragraph.elements) {
                  if (tr.textRun?.content) {
                    cellContent += tr.textRun.content.trim() + ' ';
                  }
                }
              }
            }
            cellTexts.push(cellContent.trim() || ' ');
          }

          lines.push(`| ${cellTexts.join(' | ')} |`);

          if (rowIndex === 0) {
            const separator = cellTexts.map(() => '---').join(' | ');
            lines.push(`| ${separator} |`);
          }
        }
      }
    }
  }

  return lines.join('\n\n').trim();
};

export const getGoogleDocAsMarkdown = async (
  documentId: string,
  token?: string
): Promise<{ title: string; markdown: string; webViewLink: string }> => {
  try {
    const url = `https://docs.googleapis.com/v1/documents/${documentId}`;
    const response = await fetchWithAuth(url, { method: 'GET' }, token);

    if (!response.ok) {
      // Fallback to Drive export endpoint if Docs API returns an issue
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=text/plain`;
      const exportRes = await fetchWithAuth(exportUrl, { method: 'GET' }, token);
      if (exportRes.ok) {
        const text = await exportRes.text();
        return {
          title: `Google Doc ${documentId}`,
          markdown: text,
          webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
        };
      }

      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Google Doc: ${response.statusText}`);
    }

    const docJson = await response.json();
    const markdown = parseDocJsonToMarkdown(docJson);
    const title = docJson.title || 'Untitled Document';
    const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;

    return { title, markdown, webViewLink };
  } catch (error) {
    console.error('getGoogleDocAsMarkdown error:', error);
    throw error;
  }
};

// ==========================================
// Update Existing Google Doc
// ==========================================

export const updateGoogleDocContent = async (
  documentId: string,
  newMarkdown: string,
  token?: string
): Promise<void> => {
  try {
    // 1. Get current document end index
    const getUrl = `https://docs.googleapis.com/v1/documents/${documentId}`;
    const getRes = await fetchWithAuth(getUrl, { method: 'GET' }, token);
    if (!getRes.ok) {
      throw new Error('Failed to retrieve Google Doc metadata');
    }
    const docData = await getRes.json();
    
    // Find last content index
    let endIndex = 1;
    if (docData.body?.content && docData.body.content.length > 0) {
      const lastEl = docData.body.content[docData.body.content.length - 1];
      endIndex = Math.max(1, (lastEl.endIndex || 2) - 1);
    }

    const requests: any[] = [];

    // Delete previous content if document contains characters
    if (endIndex > 1) {
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: 1,
            endIndex: endIndex,
          },
        },
      });
    }

    // Insert new markdown content
    if (newMarkdown.trim()) {
      requests.push({
        insertText: {
          location: { index: 1 },
          text: newMarkdown,
        },
      });
    }

    if (requests.length > 0) {
      const updateUrl = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
      const updateRes = await fetchWithAuth(
        updateUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
        },
        token
      );

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to update Google Doc content.');
      }
    }
  } catch (error) {
    console.error('updateGoogleDocContent error:', error);
    throw error;
  }
};
