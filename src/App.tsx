import { useState } from 'react';
import ParameterControl from './components/ParameterControl';
import ResultsChart, { SeriesVisibility } from './components/ResultsChart/ResultsChart';
import { formatTime } from './format';
import { CONTROL_GROUPS, DEFAULT_INPUT, readValue, writeValue } from './controls';
import { useSimulation } from './useSimulation';
import './App.css';

/** Segment-steps above which a run waits for the Run button (about two seconds of solver time). */
const AUTO_RUN_LIMIT = 2e8;
/** Solver time per segment per time step (s). */
const SECONDS_PER_SEGMENT_STEP = 8e-9;

const SERIES: { key: keyof SeriesVisibility; label: string; mark: string }[] = [
  { key: 'mainChannel', label: 'Main channel C', mark: '' },
  { key: 'storageZone', label: 'Storage zone C_S', mark: 'dotted' },
  { key: 'sediment', label: 'Sorbed C_sed', mark: 'dashed' },
];

export default function App() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [visible, setVisible] = useState<SeriesVisibility>({
    mainChannel: true,
    storageZone: true,
    sediment: false,
  });

  const segments = Math.max(0, Math.round(input.streamLength / input.dx));
  const steps = Math.max(0, Math.round(input.totalDuration / input.dt));
  const cost = segments * steps;
  const auto = Number.isFinite(cost) && cost <= AUTO_RUN_LIMIT;

  const { results, shownInput, error, busy, run } = useSimulation(input, auto);
  const stale = shownInput !== input;

  return (
    <main className="shell wide">
      <header>
        <p className="eyebrow">VADER · OTIS transient-storage model</p>
        <h1>Solute transport along a stream reach</h1>
        <p className="standfirst">
          Move a slider or type a value and the concentration profiles recompute. A pulse
          enters at the upstream boundary and is carried downstream by advection and
          dispersion, with exchange into a storage zone, decay and sorption.
        </p>
      </header>

      <div className="workbench">
        <div className="chart-pane">
          <article className="plot-card">
            <header>
              <h3>Concentration along the reach</h3>
              <span className="source">
                {fmt(segments)} segments × {fmt(steps)} steps
              </span>
            </header>
            <div className="chart-status">
              <span className="legend">
                {SERIES.map((s) => (
                  <label key={s.key} className="legend-key series-toggle">
                    <input
                      type="checkbox"
                      checked={visible[s.key]}
                      onChange={(e) => setVisible({ ...visible, [s.key]: e.target.checked })}
                    />
                    <i className={`legend-mark ${s.mark}`} />
                    {s.label}
                  </label>
                ))}
              </span>
              {results.length > 1 && (
                <span className="time-key">
                  {formatTime(results[0].time)}
                  <i className="time-ramp" />
                  {formatTime(results[results.length - 1].time)}
                </span>
              )}
              <span className="chips">
                {busy && <span className="chip c2">computing</span>}
                {!busy && stale && !error && <span className="chip pending">not yet run</span>}
                {error && <span className="chip c3">last run failed</span>}
              </span>
              {!auto && (
                <button type="button" className="button" onClick={run} disabled={busy}>
                  Run · about {fmtSeconds(cost * SECONDS_PER_SEGMENT_STEP)}
                </button>
              )}
            </div>
            {error && (
              <div className="warning" role="alert">
                <p>{error}</p>
              </div>
            )}
            <div className={`chart-frame${stale ? ' stale' : ''}`}>
              {results.length > 0 ? (
                <ResultsChart results={results} visible={visible} revision={input.streamLength} />
              ) : (
                <p className="chart-empty">{busy ? 'Computing…' : 'No results yet.'}</p>
              )}
            </div>
            {!auto && (
              <p className="plot-caption">
                This grid has {fmt(cost)} segment-steps, so it runs only on <b>Run</b>.
                Profiles update live below {fmt(AUTO_RUN_LIMIT)}.
              </p>
            )}
          </article>
        </div>

        <div className="controls">
          {CONTROL_GROUPS.map((group) => (
            <section key={group.title} className="control-group">
              <div className="section-head">
                <h2>{group.title}</h2>
                <span className="count">{group.controls.length} values</span>
              </div>
              {group.controls.map((spec) => (
                <ParameterControl
                  key={spec.key}
                  spec={spec}
                  value={readValue(input, spec)}
                  onChange={(v) => setInput((prev) => writeValue(prev, spec, v))}
                />
              ))}
            </section>
          ))}
          <button type="button" className="button" onClick={() => setInput(DEFAULT_INPUT)}>
            Reset to defaults
          </button>
        </div>
      </div>

      <footer>
        <p>
          Computed by the SoluteTransport solver behind the VADERUI API. Sliders cover typical
          ranges; a typed value can be anything the solver accepts.
        </p>
      </footer>
    </main>
  );
}

function fmt(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '∞';
}

function fmtSeconds(s: number): string {
  if (!Number.isFinite(s)) return '∞';
  if (s < 60) return `${Math.max(1, Math.round(s))} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.round(s / 3600)} h`;
}
