import { useEffect, useRef, type RefObject } from "react";

interface VisualizerOptions {
  color: string;
  enabled: boolean;
  isPlaying: boolean;
  volume: number;
  getProgress: () => number; // called at 60fps for smooth progress
  isFullSong: boolean; // true when full song duration is known
  onSeek?: (progress: number) => void;
}

const SCENE_PADDING = 120;
const MIN_SIZE = 740;
const OPTIMIZE_HEIGHT = 982;
const BASE_TICK_SIZE = 10;
const FULL_CIRCLE_DEG = 360;
const LESSER = 160;

interface TickCoord {
  x: number;
  y: number;
  angle: number;
}

interface TickSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getTickPoints(countTicks: number): TickCoord[] {
  const step = FULL_CIRCLE_DEG / countTicks;
  const coords: TickCoord[] = [];
  for (let deg = 0; deg < FULL_CIRCLE_DEG; deg += step) {
    const rad = (deg * Math.PI) / (FULL_CIRCLE_DEG / 2);
    coords.push({ x: Math.cos(rad), y: -Math.sin(rad), angle: deg });
  }
  return coords;
}

function computeTicks(
  frequencyData: Uint8Array,
  sceneRadius: number,
  scaleCoef: number,
  volume: number,
): TickSegment[] {
  const countTicks = Math.floor(FULL_CIRCLE_DEG * scaleCoef);
  const tickPoints = getTickPoints(countTicks);
  const ticks: TickSegment[] = [];

  for (let i = 0; i < tickPoints.length; i++) {
    const coef = 1 - i / (tickPoints.length * 2.5);
    let delta = 0;

    const freq = frequencyData[i] || 0;
    if (volume === 0) {
      delta = 0;
    } else if (volume <= 0.5) {
      delta = ((freq - LESSER * coef) * scaleCoef * volume) / 0.5 / 2;
    } else {
      delta = ((freq - LESSER * coef) * scaleCoef * volume) / 1;
    }

    if (delta < 0) delta = 0;

    const tick = tickPoints[i];
    const k = sceneRadius / (sceneRadius - (BASE_TICK_SIZE + delta));
    const x1 = tick.x * (sceneRadius - BASE_TICK_SIZE);
    const y1 = tick.y * (sceneRadius - BASE_TICK_SIZE);
    const x2 = x1 * k;
    const y2 = y1 * k;
    ticks.push({ x1, y1, x2, y2 });
  }

  return ticks;
}

function drawTick(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tick: TickSegment,
  color: string,
): void {
  const dx1 = Math.round(cx + tick.x1);
  const dy1 = Math.round(cy + tick.y1);
  const dx2 = Math.round(cx + tick.x2);
  const dy2 = Math.round(cy + tick.y2);

  const gradient = ctx.createLinearGradient(dx1, dy1, dx2, dy2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.6, color);
  gradient.addColorStop(1, "#F5F5F5");

  ctx.beginPath();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.moveTo(cx + tick.x1, cy + tick.y1);
  ctx.lineTo(cx + tick.x2, cy + tick.y2);
  ctx.stroke();
}

function drawEdging(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sceneRadius: number,
  color: string,
): void {
  const trackerR = sceneRadius - (TRACKER_INNER_DELTA + TRACKER_LINE_WIDTH / 2);

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = colorWithAlpha(color, 0.5);
  ctx.lineWidth = 1;
  ctx.arc(cx, cy, trackerR, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.restore();
}

const TRACKER_INNER_DELTA = 20;
const TRACKER_LINE_WIDTH = 3;

function drawTracker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sceneRadius: number,
  color: string,
  progress: number,
): void {
  const trackerR = sceneRadius - (TRACKER_INNER_DELTA + TRACKER_LINE_WIDTH / 2);
  const angle = progress * 2 * Math.PI;

  if (angle <= 0) return;

  // Draw progress arc
  ctx.save();
  ctx.strokeStyle = colorWithAlpha(color, 0.8);
  ctx.beginPath();
  ctx.lineWidth = TRACKER_LINE_WIDTH;
  ctx.lineCap = "round";
  ctx.arc(cx, cy, trackerR, -Math.PI / 2, -Math.PI / 2 + angle, false);
  ctx.stroke();
  ctx.restore();

  // Draw position dot
  const dotAngle = -Math.PI / 2 + angle;
  const dotX = cx + trackerR * Math.cos(dotAngle);
  const dotY = cy + trackerR * Math.sin(dotAngle);

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = colorWithAlpha(color, 0.9);
  ctx.arc(dotX, dotY, 5, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.restore();
}

function drawStreamingIndicator(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sceneRadius: number,
  color: string,
  timestamp: number,
): void {
  const trackerR = sceneRadius - (TRACKER_INNER_DELTA + TRACKER_LINE_WIDTH / 2);

  const speed = 0.0016;
  const baseAngle = (timestamp * speed) % (Math.PI * 2);
  const arcLength = Math.PI * 0.8;
  const steps = 50;
  const stepSize = arcLength / steps;

  // Draw the arc as a series of tiny segments with fading opacity
  // to create a comet-tail / light-trail effect
  for (let i = 0; i < steps; i++) {
    const t = i / steps; // 0 = tail, 1 = head
    const opacity = t * t * 0.9; // quadratic fade-in toward the head
    const startAngle = baseAngle + i * stepSize;
    const endAngle = startAngle + stepSize + 0.005; // tiny overlap to avoid gaps

    ctx.save();
    ctx.strokeStyle = colorWithAlpha(color, opacity);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.shadowColor = colorWithAlpha(color, opacity * 0.8);
    ctx.shadowBlur = 12 * t;
    ctx.beginPath();
    ctx.arc(cx, cy, trackerR, startAngle, endAngle, false);
    ctx.stroke();
    ctx.restore();
  }
}

function colorWithAlpha(color: string, alpha: number): string {
  // hex: #rrggbb
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // rgba(r, g, b, a) — replace existing alpha
  const rgbaMatch = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/,
  );
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
  }
  // rgb(r, g, b) — add alpha
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  return color;
}

export function useVisualizer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  analyserNode: AnalyserNode | null,
  frequencyData: Uint8Array<ArrayBuffer> | null,
  options: VisualizerOptions,
): void {
  const rafRef = useRef<number | null>(null);
  const isPlayingRef = useRef(options.isPlaying);
  const volumeRef = useRef(options.volume);
  const colorRef = useRef(options.color);
  const enabledRef = useRef(options.enabled);
  const getProgressRef = useRef(options.getProgress);
  const isFullSongRef = useRef(options.isFullSong);
  const onSeekRef = useRef(options.onSeek);
  const needsInitialDraw = useRef(true);
  const layoutRef = useRef({ cx: 0, cy: 0, sceneRadius: 0, scaleCoef: 0 });
  const isDraggingRef = useRef(false);

  // Keep refs in sync
  isPlayingRef.current = options.isPlaying;
  volumeRef.current = options.volume;
  colorRef.current = options.color;
  enabledRef.current = options.enabled;
  getProgressRef.current = options.getProgress;
  isFullSongRef.current = options.isFullSong;
  onSeekRef.current = options.onSeek;

  useEffect(() => {
    if (!options.enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const configureSize = () => {
      const scaleCoef = Math.max(0.5, MIN_SIZE / OPTIMIZE_HEIGHT);
      const size = MIN_SIZE;
      canvas.width = size;
      canvas.height = size;
      return {
        scaleCoef,
        sceneRadius: (size - SCENE_PADDING * 2) / 2,
        cx: (size - SCENE_PADDING * 2) / 2 + SCENE_PADDING,
        cy: (size - SCENE_PADDING * 2) / 2 + SCENE_PADDING,
      };
    };

    let layout = configureSize();
    layoutRef.current = layout;

    const onResize = () => {
      layout = configureSize();
      layoutRef.current = layout;
      needsInitialDraw.current = true;
    };

    window.addEventListener("resize", onResize);

    // Seek interaction: click/drag on the progress arc
    const canvasToProgress = (e: MouseEvent): number | null => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const { cx: lCx, cy: lCy, sceneRadius: lR } = layoutRef.current;
      const trackerR = lR - (TRACKER_INNER_DELTA + TRACKER_LINE_WIDTH / 2);

      const dx = mx - lCx;
      const dy = my - lCy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only respond if click is near the tracker ring (within 20px tolerance)
      if (Math.abs(dist - trackerR) > 20) return null;

      // atan2 gives angle from positive X axis; our arc starts at top (-PI/2)
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      return angle / (Math.PI * 2);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isFullSongRef.current) return;
      const progress = canvasToProgress(e);
      if (progress !== null) {
        isDraggingRef.current = true;
        onSeekRef.current?.(progress);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const { cx: lCx, cy: lCy } = layoutRef.current;
      const dx = mx - lCx;
      const dy = my - lCy;

      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      onSeekRef.current?.(angle / (Math.PI * 2));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    const render = () => {
      if (!enabledRef.current) return;

      const shouldDraw = isPlayingRef.current || needsInitialDraw.current;

      if (shouldDraw) {
        // Update frequency data from analyser
        if (analyserNode && frequencyData) {
          analyserNode.getByteFrequencyData(frequencyData);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw ticks
        const ticks = computeTicks(
          frequencyData ?? new Uint8Array(0),
          layout.sceneRadius,
          layout.scaleCoef,
          volumeRef.current,
        );

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 1;
        for (const tick of ticks) {
          drawTick(ctx, layout.cx, layout.cy, tick, colorRef.current);
        }
        ctx.restore();

        // Draw edging
        drawEdging(
          ctx,
          layout.cx,
          layout.cy,
          layout.sceneRadius,
          colorRef.current,
        );

        // Draw tracker
        const progress = getProgressRef.current();
        if (isFullSongRef.current) {
          drawTracker(
            ctx,
            layout.cx,
            layout.cy,
            layout.sceneRadius,
            colorRef.current,
            progress,
          );
        } else if (progress > 0) {
          drawStreamingIndicator(
            ctx,
            layout.cx,
            layout.cy,
            layout.sceneRadius,
            colorRef.current,
            performance.now(),
          );
        }

        needsInitialDraw.current = false;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    needsInitialDraw.current = true;
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [canvasRef, analyserNode, frequencyData, options.enabled]);
}
