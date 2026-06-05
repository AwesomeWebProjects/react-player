import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioEngine } from '../core/audio-engine';
import {
  fetchAudioStream,
  fetchAudioXHR,
  hasStreamSupport,
} from '../core/audio-loader';
import type { WorkerResponse } from '../types';

interface AudioEngineOptions {
  thread: 'main' | 'worker';
  initialVolume: number;
}

export interface AudioEngineState {
  isReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isFullSong: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  analyserNode: AnalyserNode | null;
  frequencyData: Uint8Array<ArrayBuffer> | null;
  getProgress: () => number;
  loadAndPlay: (url: string) => void;
  play: () => void;
  pause: () => void;
  seek: (progress: number) => void;
  setVolume: (v: number) => void;
}

const AUTO_ADVANCE_THRESHOLD = 1.5; // seconds before end to trigger next song

export function useAudioEngine(
  options: AudioEngineOptions,
): AudioEngineState {
  const engineRef = useRef<AudioEngine | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const preloadFnRef = useRef<(() => Promise<ArrayBuffer>) | null>(null);
  const isPreloadingRef = useRef(false);
  const isFullSongRef = useRef(false);
  const canPreloadRef = useRef(true);
  const currentUrlRef = useRef<string | null>(null);
  const onSongEndRef = useRef<(() => void) | null>(null);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(options.initialVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullSong, setIsFullSong] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array<ArrayBuffer> | null>(null);

  // Expose a way for the parent to set the onSongEnd callback
  // We'll attach this externally
  const setSongEndCallback = useCallback((cb: () => void) => {
    onSongEndRef.current = cb;
  }, []);

  // Initialize engine on first interaction
  const ensureEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current;

    const engine = new AudioEngine();
    engine.init(options.initialVolume);
    engineRef.current = engine;

    setAnalyserNode(engine.getAnalyser());
    setFrequencyData(engine.getFrequencyData());
    setIsReady(true);

    // Start time tracking interval
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    timeIntervalRef.current = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;

      const ct = eng.getCurrentTime();
      const dur = eng.getDuration();
      setCurrentTime(ct);
      setDuration(dur);

      // Song context management: auto-advance when near the end
      if (
        dur > 0 &&
        !eng.isContextSuspended() &&
        isFullSongRef.current &&
        ct >= dur - AUTO_ADVANCE_THRESHOLD
      ) {
        onSongEndRef.current?.();
      }
    }, 300);

    return engine;
  }, [options.initialVolume]);

  // Set up worker
  useEffect(() => {
    if (options.thread === 'worker') {
      const worker = new Worker(
        new URL('../core/audio-worker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { response, actionType, playingFullMusic } = event.data;
        const engine = engineRef.current;
        if (!engine) return;

        if (actionType === 'load') {
          engine
            .decodeAndPlay(response)
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
              canPreloadRef.current = true;
              isFullSongRef.current = playingFullMusic;
              setIsFullSong(playingFullMusic);

              // Immediately start preloading the full song
              if (!playingFullMusic && !isPreloadingRef.current) {
                isPreloadingRef.current = true;
                workerRef.current?.postMessage({
                  type: 'preload',
                  data: { playingFullMusic: false, all: true },
                });
              }
            })
            .catch(console.error);
        } else if (actionType === 'preload') {
          if (canPreloadRef.current) {
            engine
              .decodeAndSwap(response)
              .then(() => {
                setIsPlaying(true);
                isPreloadingRef.current = false;
                isFullSongRef.current = true;
                setIsFullSong(true);
                canPreloadRef.current = false;
              })
              .catch(console.error);
          }
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    }
  }, [options.thread]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const triggerPreload = useCallback(() => {
    if (options.thread === 'worker' && workerRef.current) {
      workerRef.current.postMessage({
        type: 'preload',
        data: { playingFullMusic: isFullSongRef.current, all: true },
      });
    } else if (preloadFnRef.current) {
      preloadFnRef.current()
        .then((buffer) => {
          const engine = engineRef.current;
          if (engine && canPreloadRef.current) {
            return engine.decodeAndSwap(buffer).then(() => {
              setIsPlaying(true);
              isPreloadingRef.current = false;
              isFullSongRef.current = true;
              setIsFullSong(true);
              canPreloadRef.current = false;
            });
          }
        })
        .catch(console.error);
    }
  }, [options.thread]);

  const loadAndPlay = useCallback(
    (url: string) => {
      currentUrlRef.current = url;
      isFullSongRef.current = false;
      setIsFullSong(false);
      canPreloadRef.current = true;
      isPreloadingRef.current = false;
      preloadFnRef.current = null;
      setIsLoading(true);

      const engine = ensureEngine();

      if (options.thread === 'worker' && workerRef.current) {
        workerRef.current.postMessage({
          type: 'audio',
          data: { url, playingFullMusic: false },
        });
      } else if (hasStreamSupport) {
        fetchAudioStream(url)
          .then(({ buffer, isFullSong: fullSong, preloadFn }) => {
            if (currentUrlRef.current !== url) return; // stale
            preloadFnRef.current = preloadFn;
            isFullSongRef.current = fullSong;
            setIsFullSong(fullSong);
            return engine.decodeAndPlay(buffer);
          })
          .then(() => {
            if (currentUrlRef.current !== url) return;
            setIsPlaying(true);
            setIsLoading(false);
            canPreloadRef.current = true;

            // Immediately start preloading the full song
            if (!isFullSongRef.current && preloadFnRef.current && !isPreloadingRef.current) {
              isPreloadingRef.current = true;
              triggerPreload();
            }
          })
          .catch(console.error);
      } else {
        fetchAudioXHR(url)
          .then(({ buffer }) => {
            if (currentUrlRef.current !== url) return;
            isFullSongRef.current = true;
            setIsFullSong(true);
            return engine.decodeAndPlay(buffer);
          })
          .then(() => {
            if (currentUrlRef.current !== url) return;
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(console.error);
      }
    },
    [ensureEngine, options.thread],
  );

  const play = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.resume();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.suspend();
      setIsPlaying(false);
    }
  }, []);

  const getProgress = useCallback((): number => {
    return engineRef.current?.getProgress() ?? 0;
  }, []);

  const seek = useCallback((progress: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const dur = engine.getDuration();
    if (dur <= 0) return;
    engine.seek(Math.max(0, Math.min(1, progress)) * dur);
  }, []);

  const setVolume = useCallback((v: number) => {
    engineRef.current?.setVolume(v);
    setVolumeState(v);
  }, []);

  return {
    isReady,
    isPlaying,
    isLoading,
    isFullSong,
    volume,
    currentTime,
    duration,
    analyserNode,
    frequencyData,
    getProgress,
    loadAndPlay,
    play,
    pause,
    seek,
    setVolume,
    // Expose setSongEndCallback so the parent can wire it
    ...({ _setSongEndCallback: setSongEndCallback } as Record<string, unknown>),
  } as AudioEngineState & { _setSongEndCallback: (cb: () => void) => void };
}
