/** Palette tokens read from the page's stylesheets, for drawing Plotly charts. */
export interface Theme {
  surface: string;
  rule: string;
  ink: string;
  soft: string;
  faint: string;
  /** Sequential ramp for evenly spaced stations, upstream to downstream. */
  ramp: string[];
  /** Distinct colours for observed data sets, in order. */
  categorical: string[];
}

export function readTheme(): Theme {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    surface: token('--surface'),
    rule: token('--rule'),
    ink: token('--ink'),
    soft: token('--soft'),
    faint: token('--faint'),
    ramp: ['--info', '--link', '--ok', '--accent'].map(token),
    categorical: ['--mark', '--key', '--define', '--danger'].map(token),
  };
}

/** Colour at fraction `f` along the piecewise-linear ramp through `stops`. */
export function rampColour(stops: string[], f: number): string {
  const rgb = stops.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const x = Math.min(1, Math.max(0, f)) * (rgb.length - 1);
  const i = Math.min(rgb.length - 2, Math.floor(x));
  const t = x - i;
  const c = rgb[i].map((v, k) => Math.round(v + (rgb[i + 1][k] - v) * t));
  return `rgb(${c.join(',')})`;
}
