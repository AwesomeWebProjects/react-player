import { useRef, useCallback, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX, Loader2 } from 'lucide-react';
import type { AudioPlayerProps } from '../../types';
import { usePlayerController } from '../../hooks/use-player-controller';
import { useAnimatedProgressBar } from '../shared/use-animated-progress';
import styles from './MinimalPlayer.module.css';

const DEFAULT_COLOR = 'rgba(97, 218, 251, 0.8)';

export function MinimalPlayer({
  visualizerColor = DEFAULT_COLOR,
  className,
  ...props
}: AudioPlayerProps) {
  const { controller, time, handlePlay, handleNext, handlePrev } =
    usePlayerController(props);

  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const volumeDragging = useRef(false);

  const applySeek = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const track = trackRef.current;
      if (!track || !controller.isFullSong) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      controller.seek(x / rect.width);
    },
    [controller],
  );

  const onProgressDown = (e: React.MouseEvent) => {
    dragging.current = true;
    applySeek(e);
  };

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

  const onVolumeDown = (e: React.MouseEvent) => {
    volumeDragging.current = true;
    applyVolume(e);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) applySeek(e);
      if (volumeDragging.current) applyVolume(e);
    };
    const onUp = () => {
      dragging.current = false;
      volumeDragging.current = false;
    };
    const onClickOutside = (e: MouseEvent) => {
      if (
        volumeContainerRef.current &&
        !volumeContainerRef.current.contains(e.target as Node)
      ) {
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
      className={`${styles.minimal} ${className ?? ''}`}
      style={{ '--rp-color': visualizerColor } as React.CSSProperties}
    >
      {/* Progress bar */}
      <div
        ref={trackRef}
        className={styles.progressTrack}
        onMouseDown={onProgressDown}
      >
        <div
          ref={progressFillRef}
          className={styles.progressFill}
          style={{ width: '0%', backgroundColor: visualizerColor }}
        />
        {!controller.isFullSong && controller.isPlaying && (
          <div
            className={styles.progressShimmer}
            style={{
              background: `linear-gradient(90deg, transparent, ${visualizerColor}, transparent)`,
            }}
          />
        )}
      </div>

      {/* Controls row */}
      <div className={styles.row}>
        <div className={styles.controls}>
          <button className={styles.btn} onClick={handlePrev} type="button" aria-label="Previous">
            <SkipBack size={18} color={visualizerColor} fill={visualizerColor} />
          </button>
          <button
            className={styles.playBtn}
            onClick={controller.isPlaying ? controller.pause : handlePlay}
            type="button"
            aria-label={controller.isPlaying ? 'Pause' : 'Play'}
            style={{ borderColor: visualizerColor }}
          >
            {controller.isLoading ? (
              <Loader2 size={20} color={visualizerColor} className={styles.spin} />
            ) : controller.isPlaying ? (
              <Pause size={20} color={visualizerColor} fill={visualizerColor} />
            ) : (
              <Play size={20} color={visualizerColor} fill={visualizerColor} />
            )}
          </button>
          <button className={styles.btn} onClick={handleNext} type="button" aria-label="Next">
            <SkipForward size={18} color={visualizerColor} fill={visualizerColor} />
          </button>
        </div>

        <div className={styles.info}>
          <span className={styles.artist}>{controller.currentTrack.artist}</span>
          <span className={styles.separator}>&mdash;</span>
          <span className={styles.name}>{controller.currentTrack.name}</span>
        </div>

        <div className={styles.right}>
          <span className={styles.time}>{time.formattedTime}</span>
          <div className={styles.volumeArea} ref={volumeContainerRef}>
            <button
              className={styles.btn}
              onClick={() => setVolumeOpen((o) => !o)}
              type="button"
              aria-label={`Volume: ${Math.round(controller.volume * 100)}%`}
            >
              <VolumeIcon size={18} color={visualizerColor} />
            </button>
            {volumeOpen && (
              <div className={styles.volumeSlider}>
                <div
                  ref={volumeRef}
                  className={styles.volumeTrack}
                  onMouseDown={onVolumeDown}
                >
                  <div
                    className={styles.volumeFill}
                    style={{
                      width: `${controller.volume * 100}%`,
                      backgroundColor: visualizerColor,
                    }}
                  />
                  <div
                    className={styles.volumeThumb}
                    style={{
                      left: `${controller.volume * 100}%`,
                      backgroundColor: visualizerColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
