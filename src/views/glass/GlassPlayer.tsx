import { useRef, useCallback, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX, Loader2 } from 'lucide-react';
import type { AudioPlayerProps } from '../../types';
import { usePlayerController } from '../../hooks/use-player-controller';
import { useAnimatedProgressBar } from '../shared/use-animated-progress';
import { useGlassVisualizer } from './use-glass-visualizer';
import styles from './GlassPlayer.module.css';

const DEFAULT_COLOR = 'rgba(97, 218, 251, 0.8)';

export function GlassPlayer({
  enableVisualization = true,
  visualizerColor = DEFAULT_COLOR,
  className,
  ...props
}: AudioPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { controller, time, handlePlay, handleNext, handlePrev } =
    usePlayerController(props);

  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const volumeDragging = useRef(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressDragging = useRef(false);

  useGlassVisualizer(canvasRef, controller.analyserNode, controller.frequencyData, {
    color: visualizerColor,
    enabled: enableVisualization,
    isPlaying: controller.isPlaying,
  });

  const applySeek = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const el = progressRef.current;
      if (!el || !controller.isFullSong) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      controller.seek(x / rect.width);
    },
    [controller],
  );

  const applyVolume = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const el = volumeRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      controller.setVolume(x / rect.width);
    },
    [controller],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (progressDragging.current) applySeek(e);
      if (volumeDragging.current) applyVolume(e);
    };
    const onUp = () => {
      progressDragging.current = false;
      volumeDragging.current = false;
    };
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
  }, [applySeek, applyVolume]);

  useAnimatedProgressBar(progressFillRef, controller.getProgress, controller.isFullSong, controller.isPlaying);
  const VolumeIcon =
    controller.volume === 0 ? VolumeX : controller.volume < 1 ? Volume1 : Volume2;

  return (
    <div
      className={`${styles.glass} ${className ?? ''}`}
      style={{ '--rp-color': visualizerColor } as React.CSSProperties}
    >
      {/* Background visualizer */}
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Glass overlay */}
      <div className={styles.overlay}>
        {/* Song info */}
        <div className={styles.info}>
          <div className={styles.artist}>{controller.currentTrack.artist}</div>
          <div className={styles.name}>{controller.currentTrack.name}</div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button className={styles.btn} onClick={handlePrev} type="button" aria-label="Previous">
            <SkipBack size={22} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" />
          </button>
          <button
            className={styles.playBtn}
            onClick={controller.isPlaying ? controller.pause : handlePlay}
            type="button"
            aria-label={controller.isPlaying ? 'Pause' : 'Play'}
          >
            {controller.isLoading ? (
              <Loader2 size={28} color="rgba(255,255,255,0.9)" className={styles.spin} />
            ) : controller.isPlaying ? (
              <Pause size={28} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.9)" />
            ) : (
              <Play size={28} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.9)" />
            )}
          </button>
          <button className={styles.btn} onClick={handleNext} type="button" aria-label="Next">
            <SkipForward size={22} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* Progress */}
        <div
          ref={progressRef}
          className={styles.progressTrack}
          onMouseDown={(e) => {
            progressDragging.current = true;
            applySeek(e);
          }}
        >
          <div
          ref={progressFillRef}
          className={styles.progressFill}
          style={{
            width: '0%',
            backgroundColor: visualizerColor,
            boxShadow: `0 0 10px ${visualizerColor}`,
          }}
        />
        {!controller.isFullSong && controller.isPlaying && (
          <div
            className={styles.progressShimmer}
            style={{ background: `linear-gradient(90deg, transparent, ${visualizerColor}, transparent)` }}
          />
        )}
        </div>

        {/* Bottom row */}
        <div className={styles.bottomRow}>
          <span className={styles.time}>{time.formattedTime}</span>
          <div className={styles.volumeArea} ref={volumeContainerRef}>
            <button
              className={styles.btn}
              onClick={() => setVolumeOpen((o) => !o)}
              type="button"
              aria-label={`Volume: ${Math.round(controller.volume * 100)}%`}
            >
              <VolumeIcon size={18} color="rgba(255,255,255,0.7)" />
            </button>
            {volumeOpen && (
              <div className={styles.volumeSlider}>
                <div ref={volumeRef} className={styles.volumeTrack} onMouseDown={(e) => { volumeDragging.current = true; applyVolume(e); }}>
                  <div className={styles.volumeFill} style={{ width: `${controller.volume * 100}%`, backgroundColor: visualizerColor }} />
                  <div className={styles.volumeThumb} style={{ left: `${controller.volume * 100}%`, backgroundColor: visualizerColor }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
