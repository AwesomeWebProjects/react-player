import type { Track } from '../../types';
import styles from './SongInfo.module.css';

interface SongInfoProps {
  track: Track;
}

export function SongInfo({ track }: SongInfoProps) {
  return (
    <div className={styles.songInfo}>
      <div className={styles.artist}>{track.artist}</div>
      <div className={styles.name}>{track.name}</div>
    </div>
  );
}
