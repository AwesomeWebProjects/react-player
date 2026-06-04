import type { StreamParams } from '../types';

const INITIAL_STREAM_AMOUNT = 1245184; // ~1.2MB initial chunk
const FALLBACK_CHUNK_LIMIT = 65536 * 5; // ~320KB fallback

export interface LoadResult {
  buffer: ArrayBuffer;
  isFullSong: boolean;
  preloadFn: (() => Promise<ArrayBuffer>) | null;
}

function readAudioStream(
  response: Response,
  contentLength: string,
  params: StreamParams,
): ReadableStream<Uint8Array> {
  const total = parseInt(contentLength, 10);
  let loaded = 0;
  const startedStream = Date.now();

  return new ReadableStream({
    start(controller) {
      const reader = response.body!.getReader();

      const read = (): void => {
        reader
          .read()
          .then(({ done, value }) => {
            if (!params.all) {
              if (params.amount) {
                if (
                  (params.amount < total && loaded >= params.amount) ||
                  loaded >= FALLBACK_CHUNK_LIMIT
                ) {
                  reader.releaseLock();
                  controller.close();
                  return;
                }
              } else {
                const elapsed = (Date.now() - startedStream) / 1000;
                if (elapsed >= (params.sec ?? 5)) {
                  reader.releaseLock();
                  controller.close();
                  return;
                }
              }
            }

            if (done) {
              reader.releaseLock();
              controller.close();
              return;
            }

            loaded += value.byteLength;
            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            console.error('Stream read error:', error);
            controller.error(error);
          });
      };

      read();
    },
  });
}

export async function fetchAudioStream(url: string): Promise<LoadResult> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported in this browser.');
  }

  const contentLength = response.headers.get('content-length');
  if (!contentLength) {
    throw new Error('Content-Length response header unavailable');
  }

  const clonedResponse = response.clone();

  const stream = readAudioStream(response, contentLength, {
    all: false,
    sec: 3,
    amount: INITIAL_STREAM_AMOUNT,
  });

  const partialResponse = new Response(stream);
  const buffer = await partialResponse.arrayBuffer();

  const preloadFn = async (): Promise<ArrayBuffer> => {
    const fullStream = readAudioStream(clonedResponse, contentLength, {
      all: true,
    });
    const fullResponse = new Response(fullStream);
    return fullResponse.arrayBuffer();
  };

  return { buffer, isFullSong: false, preloadFn };
}

export async function fetchAudioXHR(url: string): Promise<LoadResult> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = () => {
      resolve({
        buffer: request.response as ArrayBuffer,
        isFullSong: true,
        preloadFn: null,
      });
    };

    request.onerror = () => reject(new Error('XHR request failed'));
    request.send();
  });
}

export const hasStreamSupport =
  typeof window !== 'undefined' && !!window.fetch && !!window.ReadableStream;
