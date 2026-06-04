import { Volume2, Volume1, VolumeX } from 'lucide-react';
import styles from './VolumeControl.module.css';

interface VolumeControlProps {
  volume: number;
  color: string;
  onChange: (volume: number) => void;
}

export function VolumeControl({ volume, color, onChange }: VolumeControlProps) {
  const cycleVolume = () => {
    if (volume === 0) {
      onChange(0.5);
    } else if (volume <= 0.5) {
      onChange(1);
    } else {
      onChange(0);
    }
  };

  const VolumeIcon =
    volume === 0 ? VolumeX : volume < 1 ? Volume1 : Volume2;

  return (
    <div className={styles.volumeControl}>
      <button
        className={styles.btn}
        onClick={cycleVolume}
        aria-label={`Volume: ${Math.round(volume * 100)}%`}
        type="button"
      >
        <VolumeIcon size={24} color={color} />
      </button>
    </div>
  );
}
