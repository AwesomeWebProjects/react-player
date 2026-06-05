import { useRef } from 'react';
import type { AudioPlayerProps } from '../../types';
import { usePlayerController } from '../shared/use-player-controller';
import { useVisualizer } from './use-visualizer';
import { Controls } from './Controls';
import { VolumeControl } from './VolumeControl';
import { SongInfo } from './SongInfo';
import { Visualizer } from './Visualizer';
import styles from './AudioPlayer.module.css';

const DEFAULT_COLOR = 'rgba(97, 218, 251, 0.8)';

export function AudioPlayer({
  enableVisualization = true,
  visualizerColor = DEFAULT_COLOR,
  className,
  ...props
}: AudioPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engine, playlist, time, handlePlay, handleNext, handlePrev } =
    usePlayerController(props);

  useVisualizer(canvasRef, engine.analyserNode, engine.frequencyData, {
    color: visualizerColor,
    enabled: enableVisualization,
    isPlaying: engine.isPlaying,
    volume: engine.volume,
    getProgress: engine.getProgress,
    isFullSong: engine.isFullSong,
    onSeek: engine.seek,
  });

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
