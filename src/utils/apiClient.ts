import { auth } from '../firebase/config';

/**
 * Gets Firebase Auth ID Token header if a user is logged in
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('Could not retrieve Auth ID token:', err);
  }

  return headers;
}

/**
 * Robust API POST fetcher with automatic Auth token injection and 429 rate-limit handling
 */
export async function postApiJson<T = any>(url: string, body: any): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || 'Rate limit reached. Please wait a moment before sending another request.'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Server error (${response.status})`);
    }
    throw new Error(`Server request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Real-time Server-Sent Events (SSE) stream consumer
 */
export async function streamApiSse(
  url: string,
  body: any,
  callbacks: {
    onChunk?: (chunk: string) => void;
    onProgress?: (progress: number, message: string, stage: string) => void;
    onComplete?: (result: any) => void;
    onError?: (err: Error) => void;
  }
): Promise<void> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 'Rate limit reached for streaming AI processing. Please try again shortly.'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Streaming connection failed (${response.status})`);
    }

    if (!response.body) {
      throw new Error('No readable stream available from server.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing fragment

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.substring(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.chunk && callbacks.onChunk) {
              callbacks.onChunk(data.chunk);
            }

            if (data.progress !== undefined && callbacks.onProgress) {
              callbacks.onProgress(data.progress, data.message || '', data.stage || '');
            }

            if (data.done && callbacks.onComplete) {
              callbacks.onComplete(data);
            }
          } catch (pErr: any) {
            console.warn('Error parsing SSE event data:', pErr, jsonStr);
          }
        }
      }
    }
  } catch (err: any) {
    if (callbacks.onError) {
      callbacks.onError(err);
    } else {
      throw err;
    }
  }
}
