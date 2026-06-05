import { useState, useCallback, useEffect } from 'react';
import type { Track } from '../types';

export interface PlaylistState {
  currentTrack: Track;
  currentIndex: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export function usePlaylist(tracks: Track[]): PlaylistState {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [tracks]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i >= tracks.length - 1 ? 0 : i + 1));
  }, [tracks.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? tracks.length - 1 : i - 1));
  }, [tracks.length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, tracks.length - 1)));
    },
    [tracks.length],
  );

  return {
    currentTrack: tracks[currentIndex],
    currentIndex,
    next,
    prev,
    goTo,
  };
}
