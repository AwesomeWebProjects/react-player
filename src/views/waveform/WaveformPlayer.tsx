import { useRef, useCallback, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX, Loader2 } from 'lucide-react';
import type { AudioPlayerProps } from '../../types';
import { usePlayerController } from '../shared/use-player-controller';
import { useWaveformVisualizer } from './use-waveform-visualizer';
import styles from './WaveformPlayer.module.css';

const DEFAULT_COLOR = 'rgba(97, 218, 251, 0.8)';

export function WaveformPlayer({
  enableVisualization = true,
  visualizerColor = DEFAULT_COLOR,
  className,
  ...props
}: AudioPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engine, playlist, time, handlePlay, handleNext, handlePrev } =
    usePlayerController(props);

  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const volumeDragging = useRef(false);

  useWaveformVisualizer(canvasRef, engine.analyserNode, engine.frequencyData, {
    color: visualizerColor,
    enabled: enableVisualization,
    isPlaying: engine.isPlaying,
    getProgress: engine.getProgress,
    isFullSong: engine.isFullSong,
    onSeek: engine.seek,
  });

  const applyVolume = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const el = volumeRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      engine.setVolume(x / rect.width);
    },
    [engine],
  );

  const onVolumeDown = (e: React.MouseEvent) => {
    volumeDragging.current = true;
    applyVolume(e);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (volumeDragging.current) applyVolume(e);
    };
    const onUp = () => { volumeDragging.current = false; };
    const onClickOutside = (e: MouseEvent) => {
      if (volumeContainerRef.current && !volumeContainerRef.current.contains(e.target as Node)) {
        setVolumeOpen(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [applyVolume]);

  const VolumeIcon =
    engine.volume === 0 ? VolumeX : engine.volume < 1 ? Volume1 : Volume2;

  return (
    <div
      className={`${styles.waveform} ${className ?? ''}`}
      style={{ '--rp-color': visualizerColor } as React.CSSProperties}
    >
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.bottom}>
        <div className={styles.infoCol}>
          <div className={styles.artist}>{playlist.currentTrack.artist}</div>
          <div className={styles.name}>{playlist.currentTrack.name}</div>
        </div>

        <div className={styles.controls}>
          <button className={styles.btn} onClick={handlePrev} type="button" aria-label="Previous">
            <SkipBack size={20} color={visualizerColor} fill={visualizerColor} />
          </button>
          <button
            className={styles.playBtn}
            onClick={engine.isPlaying ? engine.pause : handlePlay}
            type="button"
            aria-label={engine.isPlaying ? 'Pause' : 'Play'}
            style={{ borderColor: visualizerColor }}
          >
            {engine.isLoading ? (
              <Loader2 size={22} color={visualizerColor} className={styles.spin} />
            ) : engine.isPlaying ? (
              <Pause size={22} color={visualizerColor} fill={visualizerColor} />
            ) : (
              <Play size={22} color={visualizerColor} fill={visualizerColor} />
            )}
          </button>
          <button className={styles.btn} onClick={handleNext} type="button" aria-label="Next">
            <SkipForward size={20} color={visualizerColor} fill={visualizerColor} />
          </button>
        </div>

        <div className={styles.rightCol}>
          <span className={styles.time}>{time.formattedTime}</span>
          <div className={styles.volumeArea} ref={volumeContainerRef}>
            <button
              className={styles.btn}
              onClick={() => setVolumeOpen((o) => !o)}
              type="button"
              aria-label={`Volume: ${Math.round(engine.volume * 100)}%`}
            >
              <VolumeIcon size={18} color={visualizerColor} />
            </button>
            {volumeOpen && (
              <div className={styles.volumeSlider}>
                <div ref={volumeRef} className={styles.volumeTrack} onMouseDown={onVolumeDown}>
                  <div className={styles.volumeFill} style={{ width: `${engine.volume * 100}%`, backgroundColor: visualizerColor }} />
                  <div className={styles.volumeThumb} style={{ left: `${engine.volume * 100}%`, backgroundColor: visualizerColor }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
