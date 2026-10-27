import { useEffect, useMemo, useState } from 'react';
import ObservedData from './components/ObservedData';
import ParameterControl from './components/ParameterControl';
import ResultsChart, { SeriesVisibility, StationStyle } from './components/ResultsChart/ResultsChart';
import { CONTROL_GROUPS, ControlSpec, DEFAULT_INPUT, SOURCE_CONTROLS, readValue, writeValue } from './controls';
import { formatDistance, timeAxisFor } from './format';
import { ObservedSeries, fitStatistics, loadObserved, parseSeries, saveObserved } from './observed';
import { rampColour, readTheme } from './theme';
import { ModelInput, SimulationRequest, SourceMode } from './types';
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

const SOURCES: { mode: SourceMode; label: string; description: string }[] = [
  {
    mode: 'step',
    label: 'Step',
    description: 'A steady source switched on upstream at t = 0 and held at C₀.',
  },
  {
    mode: 'slug',
    label: 'Slug',
    description: 'A mass M dumped upstream all at once at t = 0, carried in by the flow.',
  },
];

/** A request with what the chart needs to draw each of its stations. */
interface RunPlan {
  request: SimulationRequest;
  styles: StationStyle[];
  /** Result station index of each observed data set, by id. */
  observedStation: Record<string, number>;
}

export default function App() {
  const theme = useMemo(readTheme, []);
  const [input, setInput] = useState<ModelInput>(DEFAULT_INPUT);
  const [observed, setObserved] = useState<ObservedSeries[]>(loadObserved);
  const [visible, setVisible] = useState<SeriesVisibility>({
    mainChannel: true,
    storageZone: false,
    sediment: false,
  });

  useEffect(() => saveObserved(observed), [observed]);

  const observedColours = observed.map((_, i) => theme.categorical[i % theme.categorical.length]);
  const parsed = useMemo(() => observed.map(parseSeries), [observed]);

  // Plan inputs from the data sets; edits to their data alone do not rerun the model.
  const observedKey = JSON.stringify(observed.map((o) => [o.id, o.name, o.distance]));

  const plan = useMemo<RunPlan>(() => {
    const sets = JSON.parse(observedKey) as [string, string, number | null][];
    const n = Math.max(0, Math.round(input.stationCount));
    const stations: number[] = [];
    const styles: StationStyle[] = [];
    for (let k = 1; k <= n; k++) {
      const x = (input.streamLength * k) / n;
      stations.push(x);
      styles.push({ label: `x = ${formatDistance(x)}`, colour: rampColour(theme.ramp, n > 1 ? (k - 1) / (n - 1) : 1) });
    }
    const observedStation: Record<string, number> = {};
    sets.forEach(([id, name, distance], i) => {
      if (distance === null || !Number.isFinite(distance)) return;
      observedStation[id] = stations.length;
      stations.push(distance);
      styles.push({ label: `${name} model`, colour: theme.categorical[i % theme.categorical.length] });
    });
    if (stations.length === 0) {
      stations.push(input.streamLength);
      styles.push({ label: `x = ${formatDistance(input.streamLength)}`, colour: theme.ramp[theme.ramp.length - 1] });
    }
    const request: SimulationRequest = {
      streamLength: input.streamLength,
      totalDuration: input.totalDuration,
      dt: input.dt,
      dx: input.dx,
      source: input.source,
      upstreamConcentration: input.upstreamConcentration,
      slugMass: input.slugMass,
      stations,
      parameters: input.parameters,
    };
    return { request, styles, observedStation };
  }, [input, observedKey, theme]);

  const segments = Math.max(0, Math.round(input.streamLength / input.dx));
  const steps = Math.max(0, Math.round(input.totalDuration / input.dt));
  const cost = segments * steps;
  const auto = Number.isFinite(cost) && cost <= AUTO_RUN_LIMIT;

  const { result, shownPlan, error, busy, run } = useSimulation(plan, auto);
  const stale = shownPlan !== plan;
  const timeAxis = timeAxisFor(shownPlan?.request.totalDuration ?? input.totalDuration);

  const fits = observed.map((o, i) => {
    const station = shownPlan?.observedStation[o.id];
    if (!result || station === undefined) return null;
    return fitStatistics(parsed[i].points, result.time, result.stations[station].mainChannel);
  });
  const segmentCentres = observed.map((o) => {
    const station = shownPlan?.observedStation[o.id];
    return result && station !== undefined ? result.stations[station].segmentCentre : null;
  });

  const setValue = (spec: ControlSpec) => (v: number) => setInput((prev) => writeValue(prev, spec, v));
  const source = SOURCES.find((s) => s.mode === input.source)!;

  return (
    <main className="shell wide">
      <header>
        <p className="eyebrow">VADER · OTIS transient-storage model</p>
        <h1>Solute breakthrough along a stream reach</h1>
        <p className="standfirst">
          Concentration over time at stations along the reach, for a steady step source or a
          slug dumped upstream. Move a slider or type a value and the curves recompute; add
          measured data to compare.
        </p>
      </header>

      <div className="workbench">
        <div className="chart-pane">
          <article className="plot-card">
            <header>
              <h3>Concentration over time · {source.label.toLowerCase()} source</h3>
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
            {shownPlan && (
              <span className="chips station-key">
                {shownPlan.styles.map((s) => (
                  <span key={s.label} className="chip" style={{ color: s.colour }}>
                    {s.label}
                  </span>
                ))}
              </span>
            )}
            {error && (
              <div className="warning" role="alert">
                <p>{error}</p>
              </div>
            )}
            <div className={`chart-frame${stale ? ' stale' : ''}`}>
              {result && shownPlan ? (
                <ResultsChart
                  result={result}
                  stations={shownPlan.styles}
                  observed={observed.map((o, i) => ({
                    name: o.name,
                    colour: observedColours[i],
                    points: parsed[i].points,
                  }))}
                  visible={visible}
                  timeAxis={timeAxis}
                  theme={theme}
                  revision={`${shownPlan.request.source}:${shownPlan.request.totalDuration}`}
                />
              ) : (
                <p className="chart-empty">{busy ? 'Computing…' : 'No results yet.'}</p>
              )}
            </div>
            {!auto && (
              <p className="plot-caption">
                This grid has {fmt(cost)} segment-steps, so it runs only on <b>Run</b>.
                Curves update live below {fmt(AUTO_RUN_LIMIT)}.
              </p>
            )}
          </article>
        </div>

        <div className="controls">
          <section className="control-group">
            <div className="section-head">
              <h2>Upstream source</h2>
            </div>
            <div className="segmented" role="group" aria-label="Source type">
              {SOURCES.map((s) => (
                <button
                  key={s.mode}
                  type="button"
                  aria-pressed={input.source === s.mode}
                  onClick={() => setInput((prev) => ({ ...prev, source: s.mode }))}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="lede source-note">{source.description}</p>
            {SOURCE_CONTROLS.filter((spec) => spec.source === input.source).map((spec) => (
              <ParameterControl key={spec.key} spec={spec} value={readValue(input, spec)} onChange={setValue(spec)} />
            ))}
          </section>

          <section className="control-group">
            <div className="section-head">
              <h2>Observed data</h2>
              <span className="count">{observed.length} sets</span>
            </div>
            <ObservedData
              series={observed}
              parsed={parsed}
              fits={fits}
              segmentCentres={segmentCentres}
              colours={observedColours}
              defaultDistance={input.streamLength}
              onChange={setObserved}
            />
          </section>

          {CONTROL_GROUPS.map((group) => (
            <section key={group.title} className="control-group">
              <div className="section-head">
                <h2>{group.title}</h2>
                <span className="count">{group.controls.length} values</span>
              </div>
              {group.controls.map((spec) => (
                <ParameterControl key={spec.key} spec={spec} value={readValue(input, spec)} onChange={setValue(spec)} />
              ))}
            </section>
          ))}
          <button type="button" className="button" onClick={() => setInput(DEFAULT_INPUT)}>
            Reset model to defaults
          </button>
        </div>
      </div>

      <footer>
        <p>
          Computed by the SoluteTransport solver behind the VADERUI API. Sliders cover typical
          ranges; a typed value can be anything the solver accepts. Observed data stay in this
          browser.
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
