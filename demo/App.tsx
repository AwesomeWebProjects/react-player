import { useState } from 'react';
import {
  AudioPlayer,
  MinimalPlayer,
  WaveformPlayer,
  VinylPlayer,
  GlassPlayer,
} from '../src';
import type { Track } from '../src';
import styles from './App.module.css';

import shortLegendsNeverDie from './tracks/short-legends-never-die.mp3';
import legendsNeverDie from './tracks/legends-never-die.mp3';
import rise from './tracks/rise.mp3';
import fantastic from './tracks/fantastic.mp3';

const tracks: Track[] = [
  {
    name: 'Small Piece of music LND',
    artist: 'League of Legends',
    url: shortLegendsNeverDie,
  },
  {
    name: 'Legends Never Die',
    artist: 'League of Legends',
    url: legendsNeverDie,
  },
  {
    name: 'Rise',
    artist: 'League of Legends',
    url: rise,
  },
  {
    name: 'Fantastic - Cinematic Sound',
    artist: 'AudioJungle',
    url: fantastic,
  },
];

const VIEWS = ['Circular', 'Minimal', 'Waveform', 'Vinyl', 'Glass'] as const;
type ViewName = (typeof VIEWS)[number];

const sharedProps = {
  tracks,
  thread: 'worker' as const,
  initialVolume: 0.5,
  enableKeyboard: true,
  enableVisualization: true,
};

export function App() {
  const [view, setView] = useState<ViewName>('Circular');

  return (
    <div className={styles.app}>
      {/* View switcher */}
      <nav className={styles.viewSwitcher}>
        {VIEWS.map((v) => (
          <button
            key={v}
            className={`${styles.viewBtn} ${v === view ? styles.viewBtnActive : ''}`}
            onClick={() => setView(v)}
            type="button"
          >
            {v}
          </button>
        ))}
      </nav>

      {/* Player views */}
      <div className={styles.playerArea}>
        {view === 'Circular' && <AudioPlayer {...sharedProps} />}
        {view === 'Minimal' && <MinimalPlayer {...sharedProps} />}
        {view === 'Waveform' && <WaveformPlayer {...sharedProps} />}
        {view === 'Vinyl' && <VinylPlayer {...sharedProps} />}
        {view === 'Glass' && <GlassPlayer {...sharedProps} />}
      </div>

      <footer className={styles.footer}>
        <div className={styles.shortcuts}>
          <span>Space</span> Play/Pause &nbsp;|&nbsp;
          <span>N</span> Next &nbsp;|&nbsp;
          <span>B</span> Previous
        </div>
        <a
          href="https://github.com/danielbarion/react-player"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.github}
        >
          GitHub
        </a>
        <div className={styles.version}>v2.0.0</div>
      </footer>
    </div>
  );
}
