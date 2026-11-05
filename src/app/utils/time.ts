export function formatMs(ms: number, showMinutes = true): string {
  if (!Number.isFinite(ms) || ms < 0) return showMinutes ? '0:00.000' : '0.000';
  const rounded = Math.floor(ms);
  const minutes = Math.floor(rounded / 60000);
  const seconds = Math.floor((rounded % 60000) / 1000);
  const millis = rounded % 1000;
  if (!showMinutes && minutes === 0) {
    return `${seconds}.${millis.toString().padStart(3, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis
    .toString()
    .padStart(3, '0')}`;
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export function trimmedAverage(times: number[]): number | null {
  if (!times.length) return null;
  const sorted = [...times].sort((a, b) => a - b);
  if (sorted.length >= 5) {
    sorted.shift();
    sorted.pop();
  }
  return sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
}
