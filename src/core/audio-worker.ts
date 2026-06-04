import type { StreamParams } from '../types';

const INITIAL_STREAM_AMOUNT = 1245184;
const FALLBACK_CHUNK_LIMIT = 65536 * 5;

let audioStreamData: { response: Response; contentLength: string } | null =
  null;
let playingFullMusic = false;

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
              playingFullMusic = true;
              reader.releaseLock();
              controller.close();
              return;
            }

            loaded += value.byteLength;
            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            console.error('Worker stream error:', error);
            controller.error(error);
          });
      };

      read();
    },
  });
}

async function fetchSong(url: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported.');
  }

  const contentLength = response.headers.get('content-length');
  if (!contentLength) {
    throw new Error('Content-Length unavailable');
  }

  audioStreamData = {
    response: response.clone(),
    contentLength,
  };

  const stream = readAudioStream(response, contentLength, {
    all: false,
    sec: 3,
    amount: INITIAL_STREAM_AMOUNT,
  });

  const partialResponse = new Response(stream);
  const buffer = await partialResponse.arrayBuffer();

  self.postMessage({
    response: buffer,
    actionType: 'load',
    playingFullMusic,
  });
}

async function preloadSong(): Promise<void> {
  if (!audioStreamData) return;

  const stream = readAudioStream(
    audioStreamData.response,
    audioStreamData.contentLength,
    { all: true },
  );

  const fullResponse = new Response(stream);
  const buffer = await fullResponse.arrayBuffer();

  self.postMessage({
    response: buffer,
    actionType: 'preload',
    playingFullMusic,
  });
}

self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;
  playingFullMusic = data.playingFullMusic;

  switch (type) {
    case 'audio':
      fetchSong(data.url);
      break;
    case 'preload':
      preloadSong();
      break;
  }
};
