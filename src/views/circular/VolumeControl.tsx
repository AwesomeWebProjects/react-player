import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import styles from './VolumeControl.module.css';

interface VolumeControlProps {
  volume: number;
  color: string;
  onChange: (volume: number) => void;
}

export function VolumeControl({ volume, color, onChange }: VolumeControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const VolumeIcon =
    volume === 0 ? VolumeX : volume < 1 ? Volume1 : Volume2;

  const applyVolume = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      onChange(x / rect.width);
    },
    [onChange],
  );

  const onPointerDown = (e: React.MouseEvent) => {
    dragging.current = true;
    applyVolume(e);
  };

  useEffect(() => {
    if (!open) return;

    const onMove = (e: MouseEvent) => {
      if (dragging.current) applyVolume(e);
    };
    const onUp = () => {
      dragging.current = false;
    };
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
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
  }, [open, applyVolume]);

  return (
    <div className={styles.volumeControl} ref={containerRef}>
      {open ? (
        <div className={styles.slider}>
          <div
            ref={trackRef}
            className={styles.track}
            onMouseDown={onPointerDown}
          >
            <div
              className={styles.fill}
              style={{
                width: `${volume * 100}%`,
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}`,
              }}
            />
            <div
              className={styles.thumb}
              style={{
                left: `${volume * 100}%`,
                backgroundColor: color,
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          </div>
        </div>
      ) : (
        <button
          className={styles.btn}
          onClick={() => setOpen(true)}
          aria-label={`Volume: ${Math.round(volume * 100)}%`}
          type="button"
        >
          <VolumeIcon size={24} color={color} />
        </button>
      )}
    </div>
  );
}
