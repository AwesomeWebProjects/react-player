import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Loader } from '../Loader/Loader';
import styles from './Controls.module.css';

interface ControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  color: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Controls({
  isPlaying,
  isLoading,
  color,
  onPlay,
  onPause,
  onNext,
  onPrev,
}: ControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        className={styles.btn}
        onClick={onPrev}
        aria-label="Previous track"
        type="button"
      >
        <SkipBack size={48} color={color} fill={color} />
      </button>

      <button
        className={styles.playBtn}
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        type="button"
        style={{ borderColor: color }}
      >
        {isLoading ? (
          <Loader />
        ) : isPlaying ? (
          <Pause size={48} color={color} fill={color} />
        ) : (
          <Play size={48} color={color} fill={color} />
        )}
      </button>

      <button
        className={styles.btn}
        onClick={onNext}
        aria-label="Next track"
        type="button"
      >
        <SkipForward size={48} color={color} fill={color} />
      </button>
    </div>
  );
}
