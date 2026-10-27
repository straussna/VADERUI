/** Snapshot time in seconds, minutes or hours, to three significant figures. */
export function formatTime(seconds: number): string {
  if (seconds < 120) return `${Number(seconds.toPrecision(3))} s`;
  if (seconds < 7200) return `${Number((seconds / 60).toPrecision(3))} min`;
  return `${Number((seconds / 3600).toPrecision(3))} h`;
}
