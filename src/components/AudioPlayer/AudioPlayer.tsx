import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { AudioPlayerProps } from '../../types';
import { useAudioEngine } from '../../hooks/use-audio-engine';
import { usePlaylist } from '../../hooks/use-playlist';
import { useVisualizer } from '../../hooks/use-visualizer';
import { usePlaybackTime } from '../../hooks/use-playback-time';
import { useKeyboard } from '../../hooks/use-keyboard';
import { Controls } from '../Controls/Controls';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { SongInfo } from '../SongInfo/SongInfo';
import { Visualizer } from '../Visualizer/Visualizer';
import styles from './AudioPlayer.module.css';

const DEFAULT_COLOR = 'rgba(97, 218, 251, 0.8)';

export function AudioPlayer({
  tracks,
  thread = 'worker',
  initialVolume = 0.5,
  enableKeyboard = true,
  enableVisualization = true,
  visualizerColor = DEFAULT_COLOR,
  className,
  onTrackChange,
  onPlayStateChange,
  onTimeUpdate,
}: AudioPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInitializedRef = useRef(false);

  const playlist = usePlaylist(tracks);
  const engine = useAudioEngine({ thread, initialVolume });
  const time = usePlaybackTime(engine.currentTime, engine.duration);

  useVisualizer(canvasRef, engine.analyserNode, engine.frequencyData, {
    color: visualizerColor,
    enabled: enableVisualization,
    isPlaying: engine.isPlaying,
    volume: engine.volume,
    getProgress: engine.getProgress,
    isFullSong: engine.isFullSong,
  });

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

  return (
    <div
      className={`${styles.audioPlayer} ${className ?? ''}`}
      style={{ '--rp-color': visualizerColor } as React.CSSProperties}
    >
      <div className={styles.player}>
        <Visualizer ref={canvasRef} />
        <SongInfo track={playlist.currentTrack} />
        <Controls
          isPlaying={engine.isPlaying}
          isLoading={engine.isLoading}
          color={visualizerColor}
          onPlay={handlePlay}
          onPause={engine.pause}
          onNext={handleNext}
          onPrev={handlePrev}
        />
        <div className={styles.footer}>
          <VolumeControl
            volume={engine.volume}
            color={visualizerColor}
            onChange={engine.setVolume}
          />
          <div className={styles.time}>{time.formattedTime}</div>
        </div>
      </div>
    </div>
  );
}
