import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Drives a progress bar fill element at 60fps by writing directly to the DOM.
 * No React state updates — avoids re-renders.
 */
export function useAnimatedProgressBar(
  fillRef: RefObject<HTMLDivElement | null>,
  getProgress: () => number,
  isFullSong: boolean,
  isPlaying: boolean,
): void {
  const rafRef = useRef<number | null>(null);
  const getProgressRef = useRef(getProgress);
  const isFullSongRef = useRef(isFullSong);
  const isPlayingRef = useRef(isPlaying);

  getProgressRef.current = getProgress;
  isFullSongRef.current = isFullSong;
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const tick = () => {
      const el = fillRef.current;
      if (el) {
        if (isFullSongRef.current) {
          const p = getProgressRef.current();
          el.style.width = `${p * 100}%`;
          el.style.display = '';
        } else {
          el.style.width = '0%';
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [fillRef]);
}
