import Plot from 'react-plotly.js';
import { SoluteTransportResult } from '../../types';
import './ResultsChart.css';

interface ResultsChartProps {
  results: SoluteTransportResult[];
}

const PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

export default function ResultsChart({ results }: ResultsChartProps) {
  if (results.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>Configure parameters and click <strong>Calculate</strong> to view results.</p>
      </div>
    );
  }

  const mainChannelTraces: Plotly.Data[] = results.map((r, i) => ({
    x: r.distance,
    y: r.mainChannel,
    type: 'scatter',
    mode: 'lines',
    name: `C  t=${r.time.toFixed(0)}s`,
    line: { color: PALETTE[i % PALETTE.length], dash: 'solid' },
    legendgroup: `t${i}`,
  }));

  const storageZoneTraces: Plotly.Data[] = results.map((r, i) => ({
    x: r.distance,
    y: r.storageZone,
    type: 'scatter',
    mode: 'lines',
    name: `Cs t=${r.time.toFixed(0)}s`,
    line: { color: PALETTE[i % PALETTE.length], dash: 'dot' },
    legendgroup: `t${i}`,
  }));

  const sedimentTraces: Plotly.Data[] = results.map((r, i) => ({
    x: r.distance,
    y: r.sediment,
    type: 'scatter',
    mode: 'lines',
    name: `Csed t=${r.time.toFixed(0)}s`,
    line: { color: PALETTE[i % PALETTE.length], dash: 'dash' },
    legendgroup: `t${i}`,
    yaxis: 'y2',
  }));

  const allTraces: Plotly.Data[] = [
    ...mainChannelTraces,
    ...storageZoneTraces,
    ...sedimentTraces,
  ];

  const layout: Partial<Plotly.Layout> = {
    title: { text: 'Solute Transport — Concentration Profiles' },
    xaxis: { title: { text: 'Distance (m)' } },
    yaxis: { title: { text: 'Concentration (kg/m³)' } },
    yaxis2: {
      title: { text: 'Sediment Conc. (kg/kg)' },
      overlaying: 'y',
      side: 'right',
    },
    legend: { orientation: 'v', font: { size: 11 } },
    autosize: true,
    margin: { l: 70, r: 80, t: 50, b: 60 },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#f8fafc',
  };

  return (
    <div className="chart-container">
      <Plot
        data={allTraces}
        layout={layout}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true, displayModeBar: true }}
      />
    </div>
  );
}
