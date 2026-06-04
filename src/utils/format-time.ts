export function formatTime(seconds: number): string {
  const raw = Math.max(0, Math.floor(seconds));
  const min = Math.floor(raw / 60);
  const sec = raw - min * 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
