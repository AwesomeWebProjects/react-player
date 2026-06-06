// Views
export { AudioPlayer, CircularPlayer } from './views/circular';
export { MinimalPlayer } from './views/minimal';
export { WaveformPlayer } from './views/waveform';
export { VinylPlayer } from './views/vinyl';
export { GlassPlayer } from './views/glass';

// Re-export engine classes for convenience
export {
  AudioEngine,
  PlayerController,
  Playlist,
  formatTime,
} from '@awesome-web-projects/audio-engine';
export type {
  Track,
  PlayerControllerOptions,
  PlayerControllerEvents,
} from '@awesome-web-projects/audio-engine';

// React-specific hooks
export { usePlayerController } from './hooks/use-player-controller';
export type { PlayerControllerState, PlayerControllerHook } from './hooks/use-player-controller';
export { usePlaybackTime } from './hooks/use-playback-time';
export type { PlaybackTimeState } from './hooks/use-playback-time';
export { useKeyboard } from './hooks/use-keyboard';

// Types
export type { AudioPlayerProps } from './types';
