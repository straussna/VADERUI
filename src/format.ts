/** Unit for a chart's time axis. */
export interface TimeAxis {
  unit: 's' | 'min' | 'h';
  /** Seconds per unit. */
  factor: number;
}

/** Seconds below 10 minutes, minutes below 10 hours, hours beyond. */
export function timeAxisFor(durationSeconds: number): TimeAxis {
  if (durationSeconds < 600) return { unit: 's', factor: 1 };
  if (durationSeconds < 36000) return { unit: 'min', factor: 60 };
  return { unit: 'h', factor: 3600 };
}

/** Distance to four significant figures. */
export function formatDistance(metres: number): string {
  return `${Number(metres.toPrecision(4))} m`;
}
