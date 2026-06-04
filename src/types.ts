export interface Track {
  name: string;
  artist: string;
  url: string;
}

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

export interface WorkerMessage {
  type: 'audio' | 'preload';
  data: {
    url?: string;
    playingFullMusic: boolean;
    all?: boolean;
  };
}

export interface WorkerResponse {
  response: ArrayBuffer;
  actionType: 'load' | 'preload';
  playingFullMusic: boolean;
}

export interface StreamParams {
  all: boolean;
  sec?: number;
  amount?: number;
}
