import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PlayerController } from '@awesome-web-projects/audio-engine';
import type { Track } from '@awesome-web-projects/audio-engine';
import type { AudioPlayerProps } from '../types';
import { usePlaybackTime } from './use-playback-time';
import type { PlaybackTimeState } from './use-playback-time';
import { useKeyboard } from './use-keyboard';

export interface PlayerControllerState {
  isReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isFullSong: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  currentTrack: Track;
  currentIndex: number;
  analyserNode: AnalyserNode | null;
  frequencyData: Uint8Array<ArrayBuffer> | null;
  getProgress: () => number;
  play: () => void;
  pause: () => void;
  seek: (progress: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
}

export interface PlayerControllerHook {
  controller: PlayerControllerState;
  time: PlaybackTimeState;
  handlePlay: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  togglePlay: () => void;
}

export function usePlayerController(
  props: Pick<
    AudioPlayerProps,
    | 'tracks'
    | 'thread'
    | 'initialVolume'
    | 'enableKeyboard'
    | 'onTrackChange'
    | 'onPlayStateChange'
    | 'onTimeUpdate'
  >,
): PlayerControllerHook {
  const {
    tracks,
    thread = 'worker',
    initialVolume = 0.5,
    enableKeyboard = true,
    onTrackChange,
    onPlayStateChange,
    onTimeUpdate,
  } = props;

  const controllerRef = useRef<PlayerController | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullSong, setIsFullSong] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track>(tracks[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array<ArrayBuffer> | null>(null);

  // Stable refs for callbacks
  const onTrackChangeRef = useRef(onTrackChange);
  const onPlayStateChangeRef = useRef(onPlayStateChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTrackChangeRef.current = onTrackChange;
  onPlayStateChangeRef.current = onPlayStateChange;
  onTimeUpdateRef.current = onTimeUpdate;

  // Create controller once
  useEffect(() => {
    const ctrl = new PlayerController({
      tracks,
      thread,
      initialVolume,
      workerURL: new URL(
        '../worker/audio-worker.ts',
        import.meta.url,
      ),
    });
    controllerRef.current = ctrl;

    ctrl.on('ready', () => {
      setIsReady(true);
      setAnalyserNode(ctrl.analyserNode);
      setFrequencyData(ctrl.frequencyData);
    });

    ctrl.on('play', () => {
      setIsPlaying(true);
      onPlayStateChangeRef.current?.(true);
    });

    ctrl.on('pause', () => {
      setIsPlaying(false);
      onPlayStateChangeRef.current?.(false);
    });

    ctrl.on('loading', (loading) => {
      setIsLoading(loading);
    });

    ctrl.on('timeupdate', (ct, dur) => {
      setCurrentTime(ct);
      setDuration(dur);
      onTimeUpdateRef.current?.(ct, dur);
    });

    ctrl.on('trackchange', (track, index) => {
      setCurrentTrack(track);
      setCurrentIndex(index);
      setIsFullSong(false);
      onTrackChangeRef.current?.(track, index);
    });

    ctrl.on('fullsongloaded', () => {
      setIsFullSong(true);
    });

    ctrl.on('volumechange', (v) => {
      setVolumeState(v);
    });

    return () => {
      ctrl.dispose();
      controllerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update tracks when they change
  useEffect(() => {
    controllerRef.current?.setTracks(tracks);
  }, [tracks]);

  const getProgress = useCallback((): number => {
    return controllerRef.current?.getProgress() ?? 0;
  }, []);

  const handlePlay = useCallback(() => {
    controllerRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const handleSeek = useCallback((progress: number) => {
    controllerRef.current?.seek(progress);
  }, []);

  const handleSetVolume = useCallback((v: number) => {
    controllerRef.current?.setVolume(v);
  }, []);

  const handleNext = useCallback(() => {
    controllerRef.current?.next();
  }, []);

  const handlePrev = useCallback(() => {
    controllerRef.current?.prev();
  }, []);

  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay();
  }, []);

  const time = usePlaybackTime(currentTime, duration);

  const keyboardHandlers = useMemo(
    () => ({
      togglePlay,
      next: handleNext,
      prev: handlePrev,
    }),
    [togglePlay, handleNext, handlePrev],
  );

  useKeyboard(keyboardHandlers, enableKeyboard);

  const controller: PlayerControllerState = useMemo(
    () => ({
      isReady,
      isPlaying,
      isLoading,
      isFullSong,
      volume,
      currentTime,
      duration,
      currentTrack,
      currentIndex,
      analyserNode,
      frequencyData,
      getProgress,
      play: handlePlay,
      pause: handlePause,
      seek: handleSeek,
      setVolume: handleSetVolume,
      next: handleNext,
      prev: handlePrev,
    }),
    [
      isReady,
      isPlaying,
      isLoading,
      isFullSong,
      volume,
      currentTime,
      duration,
      currentTrack,
      currentIndex,
      analyserNode,
      frequencyData,
      getProgress,
      handlePlay,
      handlePause,
      handleSeek,
      handleSetVolume,
      handleNext,
      handlePrev,
    ],
  );

  return {
    controller,
    time,
    handlePlay,
    handleNext,
    handlePrev,
    togglePlay,
  };
}