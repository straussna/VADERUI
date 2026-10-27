import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { SoluteTransportResult } from '../../types';
import { formatTime } from '../../format';

export interface SeriesVisibility {
  mainChannel: boolean;
  storageZone: boolean;
  sediment: boolean;
}

interface ResultsChartProps {
  results: SoluteTransportResult[];
  visible: SeriesVisibility;
  /** Zoom and pan persist while this stays the same. */
  revision: number;
}

interface Theme {
  surface: string;
  rule: string;
  ink: string;
  soft: string;
  faint: string;
  ramp: string[];
}

function readTheme(): Theme {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    surface: token('--surface'),
    rule: token('--rule'),
    ink: token('--ink'),
    soft: token('--soft'),
    faint: token('--faint'),
    ramp: ['--info', '--link', '--ok', '--accent'].map(token),
  };
}

/** Colour at fraction `f` along the piecewise-linear ramp through `stops`. */
function rampColour(stops: string[], f: number): string {
  const rgb = stops.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const x = Math.min(1, Math.max(0, f)) * (rgb.length - 1);
  const i = Math.min(rgb.length - 2, Math.floor(x));
  const t = x - i;
  const c = rgb[i].map((v, k) => Math.round(v + (rgb[i + 1][k] - v) * t));
  return `rgb(${c.join(',')})`;
}

export default function ResultsChart({ results, visible, revision }: ResultsChartProps) {
  const theme = useMemo(readTheme, []);
  const narrow = window.matchMedia('(max-width: 48rem)').matches;

  const traces: Plotly.Data[] = [];
  results.forEach((r, i) => {
    const colour = rampColour(theme.ramp, results.length > 1 ? i / (results.length - 1) : 1);
    const name = `${formatTime(r.time)}`;
    const series: [boolean, number[], Plotly.Dash, string, string?][] = [
      [visible.mainChannel, r.mainChannel, 'solid', 'C'],
      [visible.storageZone, r.storageZone, 'dot', 'C_S'],
      [visible.sediment, r.sediment, 'dash', 'C_sed', 'y2'],
    ];
    let legendShown = false;
    for (const [on, y, dash, label, axis] of series) {
      if (!on) continue;
      traces.push({
        x: r.distance,
        y,
        type: 'scatter',
        mode: 'lines',
        name,
        legendgroup: `t${i}`,
        showlegend: !legendShown,
        line: { color: colour, dash, width: dash === 'solid' ? 2 : 1.6 },
        hovertemplate: `${label} %{y:.4g} at x = %{x:.3g} m, t = ${name}<extra></extra>`,
        yaxis: axis,
      });
      legendShown = true;
    }
  });

  const axis = {
    gridcolor: theme.rule,
    zerolinecolor: theme.rule,
    linecolor: theme.rule,
    tickcolor: theme.rule,
    tickfont: { color: theme.faint, family: 'Fira Code, monospace', size: 11 },
    title: { font: { color: theme.soft, size: 12 } },
  };

  const layout: Partial<Plotly.Layout> = {
    uirevision: revision,
    autosize: true,
    paper_bgcolor: theme.surface,
    plot_bgcolor: theme.surface,
    font: { family: 'Fira Sans, system-ui, sans-serif', color: theme.soft },
    margin: { l: narrow ? 52 : 64, r: visible.sediment ? 64 : 16, t: 12, b: narrow ? 40 : 52 },
    xaxis: { ...axis, title: { ...axis.title, text: 'Distance from upstream boundary (m)' } },
    yaxis: { ...axis, title: { ...axis.title, text: 'Concentration (kg/m³)' }, rangemode: 'tozero' },
    yaxis2: {
      ...axis,
      title: { ...axis.title, text: 'Sorbed concentration (kg/kg)' },
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      rangemode: 'tozero',
      visible: visible.sediment,
    },
    showlegend: !narrow,
    legend: {
      title: { text: 'Time', font: { color: theme.faint, size: 11 } },
      font: { color: theme.soft, size: 11 },
      bgcolor: 'rgba(0,0,0,0)',
    },
    hoverlabel: {
      bgcolor: theme.surface,
      bordercolor: theme.rule,
      font: { family: 'Fira Code, monospace', color: theme.ink, size: 11 },
    },
  };

  return (
    <Plot
      className="chart"
      data={traces}
      layout={layout}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
      config={{ responsive: true, displaylogo: false, displayModeBar: narrow ? false : 'hover' }}
    />
  );
}
