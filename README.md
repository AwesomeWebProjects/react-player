# @awesome-web-projects/react-player

A React audio player component with circular frequency visualization powered by the Web Audio API and Canvas.

Listed on [Awesome Audio Visualization](https://github.com/willianjusten/awesome-audio-visualization). Layout inspired by [Alex Permyakov's CodePen](https://codepen.io/alexdevp/full/RNELPV).

## Features

- Circular audio frequency visualizer rendered on Canvas
- Streaming audio loading via Web Workers for smooth playback
- Partial loading — starts playing in seconds, preloads the full song in the background
- Keyboard shortcuts (Space, N, B)
- Configurable colors, volume, and visualization
- Zero runtime dependencies (besides React and Lucide icons)
- Full TypeScript support with exported types
- CSS Modules for style isolation

## Installation

```bash
npm install @awesome-web-projects/react-player
```

## Usage

```tsx
import { AudioPlayer } from '@awesome-web-projects/react-player';
import '@awesome-web-projects/react-player/styles.css';

function App() {
  return (
    <AudioPlayer
      tracks={[
        { name: 'My Song', artist: 'Artist', url: '/song.mp3' },
        { name: 'Another', artist: 'Band', url: '/another.mp3' },
      ]}
      initialVolume={0.5}
      enableKeyboard
      enableVisualization
      visualizerColor="rgba(97, 218, 251, 0.8)"
      onTrackChange={(track, index) => console.log('Now playing:', track.name)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tracks` | `Track[]` | *required* | Array of tracks to play |
| `thread` | `'main' \| 'worker'` | `'worker'` | Audio fetching strategy |
| `initialVolume` | `number` | `0.5` | Initial volume (0-1) |
| `enableKeyboard` | `boolean` | `true` | Enable keyboard shortcuts |
| `enableVisualization` | `boolean` | `true` | Enable canvas visualizer |
| `visualizerColor` | `string` | `'rgba(97, 218, 251, 0.8)'` | Primary color for the visualizer |
| `className` | `string` | — | Additional CSS class |
| `onTrackChange` | `(track, index) => void` | — | Called when track changes |
| `onPlayStateChange` | `(playing) => void` | — | Called on play/pause |
| `onTimeUpdate` | `(time, duration) => void` | — | Called as playback progresses |

### Track

```typescript
interface Track {
  name: string;
  artist: string;
  url: string;
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| N | Next track |
| B | Previous track |

## Development

```bash
# Install dependencies
npm install

# Start demo dev server
npm run dev

# Build library
npm run build

# Type check
npm run typecheck
```

## License

MIT
