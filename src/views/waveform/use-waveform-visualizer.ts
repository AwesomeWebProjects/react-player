import { useEffect, useRef, type RefObject } from 'react';

interface WaveformOptions {
  color: string;
  enabled: boolean;
  isPlaying: boolean;
  getProgress: () => number;
  isFullSong: boolean;
  onSeek?: (progress: number) => void;
}

function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgbaMatch = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/,
  );
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
  }
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  return color;
}

export function useWaveformVisualizer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  analyserNode: AnalyserNode | null,
  frequencyData: Uint8Array<ArrayBuffer> | null,
  options: WaveformOptions,
): void {
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(options.isPlaying);
  const colorRef = useRef(options.color);
  const enabledRef = useRef(options.enabled);
  const getProgressRef = useRef(options.getProgress);
  const isFullSongRef = useRef(options.isFullSong);
  const onSeekRef = useRef(options.onSeek);
  const needsInitialDraw = useRef(true);
  const isDragging = useRef(false);

  isPlayingRef.current = options.isPlaying;
  colorRef.current = options.color;
  enabledRef.current = options.enabled;
  getProgressRef.current = options.getProgress;
  isFullSongRef.current = options.isFullSong;
  onSeekRef.current = options.onSeek;

  useEffect(() => {
    if (!options.enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const configureSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      return { w: rect.width, h: rect.height };
    };

    let size = configureSize();

    const onResize = () => {
      size = configureSize();
      needsInitialDraw.current = true;
    };
    window.addEventListener('resize', onResize);

    // Seek interaction
    const seekFromEvent = (e: MouseEvent) => {
      if (!isFullSongRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      onSeekRef.current?.(x / rect.width);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isFullSongRef.current) return;
      isDragging.current = true;
      seekFromEvent(e);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) seekFromEvent(e);
    };
    const onMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const render = () => {
      if (!enabledRef.current) return;

      const shouldDraw = isPlayingRef.current || needsInitialDraw.current;

      if (shouldDraw) {
        if (analyserNode && frequencyData) {
          analyserNode.getByteFrequencyData(frequencyData);
        }

        const { w, h } = size;
        ctx.clearRect(0, 0, w, h);

        const data = frequencyData ?? new Uint8Array(0);
        const barCount = 64;
        const gap = 2;
        const barWidth = (w - (barCount - 1) * gap) / barCount;
        const color = colorRef.current;
        const progress = getProgressRef.current();

        // Use logarithmic mapping so bars focus on low-mid frequencies
        // where the actual musical energy lives
        const maxIndex = data.length * 0.55;
        for (let i = 0; i < barCount; i++) {
          const t = i / barCount;
          const dataIndex = Math.floor(Math.pow(t, 2.2) * maxIndex);
          const value = data[dataIndex] || 0;
          const barH = Math.max(2, (value / 255) * h * 0.85);
          const x = i * (barWidth + gap);
          const y = h - barH;

          const isPlayed = isFullSongRef.current && (i / barCount) <= progress;

          ctx.save();
          if (isPlayed) {
            const grad = ctx.createLinearGradient(x, y, x, h);
            grad.addColorStop(0, colorWithAlpha(color, 0.95));
            grad.addColorStop(1, colorWithAlpha(color, 0.4));
            ctx.fillStyle = grad;
            ctx.shadowColor = colorWithAlpha(color, 0.3);
            ctx.shadowBlur = 8;
          } else {
            const grad = ctx.createLinearGradient(x, y, x, h);
            grad.addColorStop(0, colorWithAlpha(color, 0.3));
            grad.addColorStop(1, colorWithAlpha(color, 0.08));
            ctx.fillStyle = grad;
          }

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 2);
          ctx.fill();
          ctx.restore();
        }

        // Streaming shimmer effect
        if (!isFullSongRef.current && isPlayingRef.current) {
          const t = (performance.now() % 2000) / 2000;
          const shimmerX = t * w;
          const grad = ctx.createLinearGradient(shimmerX - 80, 0, shimmerX + 80, 0);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.5, colorWithAlpha(color, 0.15));
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        needsInitialDraw.current = false;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    needsInitialDraw.current = true;
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasRef, analyserNode, frequencyData, options.enabled]);
}
