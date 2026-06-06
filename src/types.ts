import type { Track } from '@awesome-web-projects/audio-engine';

export interface AudioPlayerProps {
  tracks: Track[];
  thread?: 'main' | 'worker';
  autoPlay?: boolean;
  initialVolume?: number;
  enableKeyboard?: boolean;
  enableVisualization?: boolean;
  visualizerColor?: string;
  className?: string;
  onTrackChange?: (track: Track, index: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}
