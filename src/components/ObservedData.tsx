import { ChangeEvent } from 'react';
import {
  CONCENTRATION_UNITS,
  ConcentrationUnit,
  FitStatistics,
  ObservedSeries,
  ParsedSeries,
  TIME_UNITS,
  TimeUnit,
} from '../observed';

interface ObservedDataProps {
  series: ObservedSeries[];
  parsed: ParsedSeries[];
  fits: (FitStatistics | null)[];
  /** Model segment centre (m) each series is compared at, once a result exists. */
  segmentCentres: (number | null)[];
  colours: string[];
  defaultDistance: number;
  onChange: (series: ObservedSeries[]) => void;
}

const PLACEHOLDER = 'time, concentration\n0, 0\n60, 0.05\n120, 0.42';

/** Editor for measured breakthrough curves; each is drawn as markers on the chart. */
export default function ObservedData({
  series,
  parsed,
  fits,
  segmentCentres,
  colours,
  defaultDistance,
  onChange,
}: ObservedDataProps) {
  const update = (index: number, change: Partial<ObservedSeries>) =>
    onChange(series.map((s, i) => (i === index ? { ...s, ...change } : s)));

  const add = () =>
    onChange([
      ...series,
      {
        id: crypto.randomUUID(),
        name: `Station ${series.length + 1}`,
        distance: defaultDistance,
        timeUnit: 's',
        concentrationUnit: 'kg/m³',
        text: '',
      },
    ]);

  const load = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then((text) =>
      update(index, { text, name: series[index].name || file.name.replace(/\.[^.]+$/, '') })
    );
  };

  return (
    <>
      <p className="lede">
        Paste or load measured time, concentration pairs and the distance they were taken at.
        Each set is drawn as markers with the model curve at that distance.
      </p>
      {series.map((s, i) => {
        const fit = fits[i];
        const unitFactor = CONCENTRATION_UNITS[s.concentrationUnit];
        return (
          <article key={s.id} className="observed" style={{ '--series': colours[i] } as React.CSSProperties}>
            <div className="observed-head">
              <i className="observed-mark" />
              <input
                className="observed-name"
                aria-label="Data set name"
                value={s.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <button
                type="button"
                className="button quiet"
                aria-label={`Remove ${s.name}`}
                onClick={() => onChange(series.filter((_, k) => k !== i))}
              >
                Remove
              </button>
            </div>
            <div className="observed-fields">
              <label>
                Distance
                <span className="control-value">
                  <input
                    type="number"
                    step="any"
                    value={Number.isFinite(s.distance) ? s.distance : ''}
                    onChange={(e) => update(i, { distance: e.target.valueAsNumber })}
                  />
                  <span className="unit">m</span>
                </span>
              </label>
              <label>
                Time
                <select
                  value={s.timeUnit}
                  onChange={(e) => update(i, { timeUnit: e.target.value as TimeUnit })}
                >
                  {Object.keys(TIME_UNITS).map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
              <label>
                Concentration
                <select
                  value={s.concentrationUnit}
                  onChange={(e) =>
                    update(i, { concentrationUnit: e.target.value as ConcentrationUnit })
                  }
                >
                  {Object.keys(CONCENTRATION_UNITS).map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
            </div>
            <textarea
              rows={5}
              spellCheck={false}
              aria-label={`${s.name} data`}
              placeholder={PLACEHOLDER}
              value={s.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
            <div className="observed-foot">
              <label className="button quiet file-button">
                Load CSV…
                <input type="file" accept=".csv,.tsv,.txt,text/plain" onChange={load(i)} />
              </label>
              <span className="observed-stats">
                {parsed[i].points.length} points
                {parsed[i].skipped > 0 && ` · ${parsed[i].skipped} lines skipped`}
                {fit && (
                  <>
                    {' · '}RMSE <b>{(fit.rmse / unitFactor).toPrecision(3)}</b> {s.concentrationUnit}
                    {Number.isFinite(fit.nse) && (
                      <>
                        {' · '}NSE <b>{fit.nse.toFixed(3)}</b>
                      </>
                    )}
                    {segmentCentres[i] !== null && ` · model at x = ${segmentCentres[i]!.toPrecision(4)} m`}
                  </>
                )}
              </span>
            </div>
          </article>
        );
      })}
      <button type="button" className="button" onClick={add}>
        Add observed data
      </button>
    </>
  );
}
