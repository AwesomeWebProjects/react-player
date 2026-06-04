import { AudioPlayer } from '../src';
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

export function App() {
  return (
    <div className={styles.app}>
      <AudioPlayer
        tracks={tracks}
        thread="worker"
        initialVolume={0.5}
        enableKeyboard
        enableVisualization
      />
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
