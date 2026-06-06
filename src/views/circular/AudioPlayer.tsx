import { useRef } from 'react';
import type { AudioPlayerProps } from '../../types';
import { usePlayerController } from '../../hooks/use-player-controller';
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
  const { controller, time, handlePlay, handleNext, handlePrev } =
    usePlayerController(props);

  useVisualizer(canvasRef, controller.analyserNode, controller.frequencyData, {
    color: visualizerColor,
    enabled: enableVisualization,
    isPlaying: controller.isPlaying,
    volume: controller.volume,
    getProgress: controller.getProgress,
    isFullSong: controller.isFullSong,
    onSeek: controller.seek,
  });

  return (
    <div
      className={`${styles.audioPlayer} ${className ?? ''}`}
      style={{ '--rp-color': visualizerColor } as React.CSSProperties}
    >
      <div className={styles.player}>
        <Visualizer ref={canvasRef} />
        <SongInfo track={controller.currentTrack} />
        <Controls
          isPlaying={controller.isPlaying}
          isLoading={controller.isLoading}
          color={visualizerColor}
          onPlay={handlePlay}
          onPause={controller.pause}
          onNext={handleNext}
          onPrev={handlePrev}
        />
        <div className={styles.footer}>
          <VolumeControl
            volume={controller.volume}
            color={visualizerColor}
            onChange={controller.setVolume}
          />
          <div className={styles.time}>{time.formattedTime}</div>
        </div>
      </div>
    </div>
  );
}
