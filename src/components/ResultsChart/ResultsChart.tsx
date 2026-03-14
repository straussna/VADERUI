import Plot from 'react-plotly.js';
import { SoluteTransportResult } from '../../types';
import './ResultsChart.css';

interface ResultsChartProps {
  results: SoluteTransportResult[];
}

export default function ResultsChart({ results }: ResultsChartProps) {
  if (results.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>Configure parameters and click <strong>Calculate</strong> to view results.</p>
      </div>
    );
  }

  const traces: Plotly.Data[] = results.map((result) => ({
    x: result.distance,
    y: result.concentration,
    type: 'scatter',
    mode: 'lines',
    name: `t = ${result.time.toFixed(2)}`,
  }));

  const layout: Partial<Plotly.Layout> = {
    title: { text: 'Solute Transport Results' },
    xaxis: { title: { text: 'Distance (m)' } },
    yaxis: { title: { text: 'Concentration (mg/L)' } },
    legend: { orientation: 'v' },
    autosize: true,
    margin: { l: 60, r: 20, t: 50, b: 60 },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#f8fafc',
  };

  return (
    <div className="chart-container">
      <Plot
        data={traces}
        layout={layout}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true, displayModeBar: true }}
      />
    </div>
  );
}
