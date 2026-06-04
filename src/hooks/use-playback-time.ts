import { useMemo } from 'react';
import { formatTime } from '../utils/format-time';

export interface PlaybackTimeState {
  formattedTime: string;
  formattedDuration: string;
  progress: number;
}

export function usePlaybackTime(
  currentTime: number,
  duration: number,
): PlaybackTimeState {
  return useMemo(
    () => ({
      formattedTime: formatTime(currentTime),
      formattedDuration: formatTime(duration),
      progress: duration > 0 ? currentTime / duration : 0,
    }),
    [currentTime, duration],
  );
}
