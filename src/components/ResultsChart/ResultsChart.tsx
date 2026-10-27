import Plot from 'react-plotly.js';
import { ObservedPoint } from '../../observed';
import { Theme } from '../../theme';
import { BreakthroughResult } from '../../types';
import { TimeAxis } from '../../format';

export interface SeriesVisibility {
  mainChannel: boolean;
  storageZone: boolean;
  sediment: boolean;
}

/** How to draw the model series at one station of the result. */
export interface StationStyle {
  label: string;
  colour: string;
}

export interface ObservedTrace {
  name: string;
  colour: string;
  points: ObservedPoint[];
}

interface ResultsChartProps {
  result: BreakthroughResult;
  stations: StationStyle[];
  observed: ObservedTrace[];
  visible: SeriesVisibility;
  timeAxis: TimeAxis;
  theme: Theme;
  /** Zoom and pan persist while this stays the same. */
  revision: string;
}

/** Concentration over time at each station, with observed data as markers. */
export default function ResultsChart({
  result,
  stations,
  observed,
  visible,
  timeAxis,
  theme,
  revision,
}: ResultsChartProps) {
  const narrow = window.matchMedia('(max-width: 48rem)').matches;
  const time = result.time.map((t) => t / timeAxis.factor);

  const traces: Plotly.Data[] = [];
  result.stations.forEach((station, i) => {
    const style = stations[i];
    const series: [boolean, number[], Plotly.Dash, string, string?][] = [
      [visible.mainChannel, station.mainChannel, 'solid', 'C'],
      [visible.storageZone, station.storageZone, 'dot', 'C_S'],
      [visible.sediment, station.sediment, 'dash', 'C_sed', 'y2'],
    ];
    let legendShown = false;
    for (const [on, y, dash, label, axis] of series) {
      if (!on) continue;
      traces.push({
        x: time,
        y,
        type: 'scatter',
        mode: 'lines',
        name: style.label,
        legendgroup: `s${i}`,
        showlegend: !legendShown,
        line: { color: style.colour, dash, width: dash === 'solid' ? 2 : 1.6 },
        hovertemplate: `${label} %{y:.4g} at t = %{x:.4g} ${timeAxis.unit}, ${style.label}<extra></extra>`,
        yaxis: axis,
      });
      legendShown = true;
    }
  });

  for (const o of observed) {
    traces.push({
      x: o.points.map((p) => p.time / timeAxis.factor),
      y: o.points.map((p) => p.concentration),
      type: 'scatter',
      mode: 'markers',
      name: `${o.name} (observed)`,
      marker: { color: o.colour, size: 7, line: { color: theme.surface, width: 1 } },
      hovertemplate: `${o.name} %{y:.4g} at t = %{x:.4g} ${timeAxis.unit}<extra></extra>`,
    });
  }

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
    xaxis: { ...axis, title: { ...axis.title, text: `Time (${timeAxis.unit})` }, rangemode: 'tozero' },
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
      title: { text: 'Station', font: { color: theme.faint, size: 11 } },
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
