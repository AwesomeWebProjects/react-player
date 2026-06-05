import { useEffect, useRef, type RefObject } from 'react';

interface GlassVisualizerOptions {
  color: string;
  enabled: boolean;
  isPlaying: boolean;
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

export function useGlassVisualizer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  analyserNode: AnalyserNode | null,
  frequencyData: Uint8Array<ArrayBuffer> | null,
  options: GlassVisualizerOptions,
): void {
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(options.isPlaying);
  const colorRef = useRef(options.color);
  const enabledRef = useRef(options.enabled);
  const needsInitialDraw = useRef(true);

  isPlayingRef.current = options.isPlaying;
  colorRef.current = options.color;
  enabledRef.current = options.enabled;

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
        const barCount = 24;
        const gap = 6;
        const barWidth = (w - (barCount - 1) * gap) / barCount;
        const color = colorRef.current;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * (data.length * 0.6));
          const value = data[dataIndex] || 0;
          const barH = Math.max(4, (value / 255) * h * 0.9);
          const x = i * (barWidth + gap);
          const y = h - barH;

          ctx.save();
          const grad = ctx.createLinearGradient(x, h, x, y);
          grad.addColorStop(0, colorWithAlpha(color, 0.5));
          grad.addColorStop(0.5, colorWithAlpha(color, 0.25));
          grad.addColorStop(1, colorWithAlpha(color, 0.05));
          ctx.fillStyle = grad;
          ctx.shadowColor = colorWithAlpha(color, 0.3);
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 3);
          ctx.fill();
          ctx.restore();
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
    };
  }, [canvasRef, analyserNode, frequencyData, options.enabled]);
}
