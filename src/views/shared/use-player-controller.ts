import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { AudioPlayerProps } from '../../types';
import { useAudioEngine } from '../../engine/use-audio-engine';
import type { AudioEngineState } from '../../engine/use-audio-engine';
import { usePlaylist } from '../../engine/use-playlist';
import type { PlaylistState } from '../../engine/use-playlist';
import { usePlaybackTime } from '../../engine/use-playback-time';
import type { PlaybackTimeState } from '../../engine/use-playback-time';
import { useKeyboard } from '../../engine/use-keyboard';

export interface PlayerController {
  engine: AudioEngineState;
  playlist: PlaylistState;
  time: PlaybackTimeState;
  handlePlay: () => void;
  handlePrev: () => void;
  handleNext: () => void;
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
): PlayerController {
  const {
    tracks,
    thread = 'worker',
    initialVolume = 0.5,
    enableKeyboard = true,
    onTrackChange,
    onPlayStateChange,
    onTimeUpdate,
  } = props;

  const hasInitializedRef = useRef(false);

  const playlist = usePlaylist(tracks);
  const engine = useAudioEngine({ thread, initialVolume });
  const time = usePlaybackTime(engine.currentTime, engine.duration);

  // Wire up auto-advance on song end
  useEffect(() => {
    const engineWithInternal = engine as typeof engine & {
      _setSongEndCallback: (cb: () => void) => void;
    };
    if (engineWithInternal._setSongEndCallback) {
      engineWithInternal._setSongEndCallback(playlist.next);
    }
  }, [engine, playlist.next]);

  // Load song when track changes (but only after first play)
  useEffect(() => {
    if (hasInitializedRef.current) {
      engine.loadAndPlay(playlist.currentTrack.url);
      onTrackChange?.(playlist.currentTrack, playlist.currentIndex);
    }
  }, [playlist.currentTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of play state changes
  useEffect(() => {
    onPlayStateChange?.(engine.isPlaying);
  }, [engine.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of time updates
  useEffect(() => {
    onTimeUpdate?.(engine.currentTime, engine.duration);
  }, [engine.currentTime, engine.duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = useCallback(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      engine.loadAndPlay(playlist.currentTrack.url);
    } else {
      engine.play();
    }
  }, [engine, playlist.currentTrack.url]);

  const handleNext = useCallback(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
    playlist.next();
  }, [playlist]);

  const handlePrev = useCallback(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
    playlist.prev();
  }, [playlist]);

  const togglePlay = useCallback(() => {
    if (engine.isPlaying) {
      engine.pause();
    } else {
      handlePlay();
    }
  }, [engine, handlePlay]);

  const keyboardHandlers = useMemo(
    () => ({
      togglePlay,
      next: handleNext,
      prev: handlePrev,
    }),
    [togglePlay, handleNext, handlePrev],
  );

  useKeyboard(keyboardHandlers, enableKeyboard);

  return {
    engine,
    playlist,
    time,
    handlePlay,
    handlePrev,
    handleNext,
    togglePlay,
  };
}
