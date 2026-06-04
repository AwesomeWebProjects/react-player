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
  volume: number;
  currentTime: number;
  duration: number;
  analyserNode: AnalyserNode | null;
  frequencyData: Uint8Array<ArrayBuffer> | null;
  loadAndPlay: (url: string) => void;
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
}

const PRELOAD_THRESHOLD = 3.5; // seconds before end of fragment to start preload
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

      // Song context management
      if (dur > 0 && !eng.isContextSuspended()) {
        if (
          ct >= dur - PRELOAD_THRESHOLD &&
          !isFullSongRef.current &&
          !isPreloadingRef.current &&
          canPreloadRef.current
        ) {
          // Time to preload the full song
          isPreloadingRef.current = true;
          triggerPreload();
        } else if (
          isFullSongRef.current &&
          ct >= dur - AUTO_ADVANCE_THRESHOLD
        ) {
          // Song is about to end, advance
          onSongEndRef.current?.();
        }
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
          .then(({ buffer, isFullSong, preloadFn }) => {
            if (currentUrlRef.current !== url) return; // stale
            preloadFnRef.current = preloadFn;
            isFullSongRef.current = isFullSong;
            return engine.decodeAndPlay(buffer);
          })
          .then(() => {
            if (currentUrlRef.current !== url) return;
            setIsPlaying(true);
            setIsLoading(false);
            canPreloadRef.current = true;
          })
          .catch(console.error);
      } else {
        fetchAudioXHR(url)
          .then(({ buffer }) => {
            if (currentUrlRef.current !== url) return;
            isFullSongRef.current = true;
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

  const setVolume = useCallback((v: number) => {
    engineRef.current?.setVolume(v);
    setVolumeState(v);
  }, []);

  return {
    isReady,
    isPlaying,
    isLoading,
    volume,
    currentTime,
    duration,
    analyserNode,
    frequencyData,
    loadAndPlay,
    play,
    pause,
    setVolume,
    // Expose setSongEndCallback so the parent can wire it
    ...({ _setSongEndCallback: setSongEndCallback } as Record<string, unknown>),
  } as AudioEngineState & { _setSongEndCallback: (cb: () => void) => void };
}
