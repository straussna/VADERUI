/** Measured concentrations over time at one station, entered for comparison with the model. */
export interface ObservedSeries {
  id: string;
  name: string;
  /** Distance from the upstream boundary (m). */
  distance: number;
  timeUnit: TimeUnit;
  concentrationUnit: ConcentrationUnit;
  /** Pasted or loaded text: one "time, concentration" pair per line. */
  text: string;
}

export type TimeUnit = 's' | 'min' | 'h';
export type ConcentrationUnit = 'kg/m³' | 'g/m³' | 'mg/m³';

export const TIME_UNITS: Record<TimeUnit, number> = { s: 1, min: 60, h: 3600 };
/** Factor to kg/m³. g/m³ equals mg/L. */
export const CONCENTRATION_UNITS: Record<ConcentrationUnit, number> = {
  'kg/m³': 1,
  'g/m³': 1e-3,
  'mg/m³': 1e-6,
};

export interface ObservedPoint {
  /** Time (s). */
  time: number;
  /** Concentration (kg/m³). */
  concentration: number;
}

export interface ParsedSeries {
  points: ObservedPoint[];
  /** Non-blank lines that do not start with two numbers. */
  skipped: number;
}

/**
 * Reads one point per line from the first two numbers on the line, separated
 * by commas, semicolons, tabs or spaces. Header and other lines without two
 * leading numbers are skipped.
 */
export function parseSeries(series: ObservedSeries): ParsedSeries {
  const timeFactor = TIME_UNITS[series.timeUnit];
  const concentrationFactor = CONCENTRATION_UNITS[series.concentrationUnit];
  const points: ObservedPoint[] = [];
  let skipped = 0;
  for (const line of series.text.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const fields = line.trim().split(/[,;\t ]+/);
    const time = Number(fields[0]);
    const concentration = Number(fields[1]);
    if (fields.length < 2 || !Number.isFinite(time) || !Number.isFinite(concentration)) {
      skipped++;
      continue;
    }
    points.push({ time: time * timeFactor, concentration: concentration * concentrationFactor });
  }
  points.sort((p, q) => p.time - q.time);
  return { points, skipped };
}

export interface FitStatistics {
  /** Points inside the simulated time span. */
  compared: number;
  /** Root-mean-square error (kg/m³). */
  rmse: number;
  /** Nash–Sutcliffe efficiency; 1 is a perfect fit, 0 no better than the observed mean. */
  nse: number;
}

/** Compares observed points with a model series sampled at `time`, interpolating the model linearly. */
export function fitStatistics(
  points: ObservedPoint[],
  time: number[],
  model: number[]
): FitStatistics | null {
  const pairs: [number, number][] = [];
  let k = 0;
  for (const p of points) {
    if (p.time < time[0] || p.time > time[time.length - 1]) continue;
    while (k < time.length - 2 && time[k + 1] < p.time) k++;
    const span = time[k + 1] - time[k];
    const f = span > 0 ? (p.time - time[k]) / span : 0;
    pairs.push([p.concentration, model[k] + f * (model[k + 1] - model[k])]);
  }
  if (pairs.length === 0) return null;
  const mean = pairs.reduce((sum, [o]) => sum + o, 0) / pairs.length;
  let squaredError = 0;
  let variance = 0;
  for (const [o, m] of pairs) {
    squaredError += (o - m) ** 2;
    variance += (o - mean) ** 2;
  }
  return {
    compared: pairs.length,
    rmse: Math.sqrt(squaredError / pairs.length),
    nse: variance > 0 ? 1 - squaredError / variance : NaN,
  };
}

const STORAGE_KEY = 'vader.observed';

export function loadObserved(): ObservedSeries[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as ObservedSeries[]) : [];
  } catch {
    return [];
  }
}

export function saveObserved(series: ObservedSeries[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(series));
  } catch {
    // Storage is unavailable; the data lasts for this page only.
  }
}
