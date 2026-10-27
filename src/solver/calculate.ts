import { BreakthroughResult, SimulationRequest, StationSeries } from '../types';
import { Stream, roundHalfEven } from './stream';

const MAX_TIME_SAMPLES = 1000;

/**
 * The in-browser equivalent of POST /api/calculate: the same validation,
 * upstream boundary, sampling and station segments. Throws an Error with the
 * API's message for a rejected request.
 */
export function calculate(req: SimulationRequest): BreakthroughResult {
  if (req.streamLength <= 0) throw new Error('streamLength must be positive.');
  if (req.totalDuration <= 0) throw new Error('totalDuration must be positive.');
  if (req.dt <= 0) throw new Error('dt must be positive.');
  if (req.dx <= 0) throw new Error('dx must be positive.');
  if (req.source !== 'step' && req.source !== 'slug') throw new Error('source must be "step" or "slug".');
  if (req.source === 'slug' && req.parameters.q <= 0) throw new Error('Q must be positive for a slug source.');
  if (req.stations.length === 0) throw new Error('stations must hold at least one distance.');
  if (req.stations.some((x) => !Number.isFinite(x))) throw new Error('stations must be finite distances.');

  // One upstream-boundary value per time level. A step holds C0 throughout; a
  // slug sets level 0 to 2 M / (Q dt), so the first step's inflow carries M.
  const totalSteps = roundHalfEven(req.totalDuration / req.dt);
  const upstreamBoundary = new Float64Array(Math.max(totalSteps, 0) + 1);
  if (req.source === 'step') upstreamBoundary.fill(req.upstreamConcentration);
  else upstreamBoundary[0] = (2 * req.slugMass) / (req.parameters.q * req.dt);

  const stream = new Stream(req.streamLength, req.totalDuration, req.dt, req.dx, upstreamBoundary, req.parameters);

  // At most MAX_TIME_SAMPLES + 1 evenly strided levels from 0, ending at timeStepCount.
  const stride = Math.floor((stream.timeStepCount + MAX_TIME_SAMPLES - 1) / MAX_TIME_SAMPLES);
  const levels: number[] = [];
  for (let j = 0; j < stream.timeStepCount; j += stride) levels.push(j);
  levels.push(stream.timeStepCount);

  const segments = req.stations.map((x) =>
    Math.min(Math.max(Math.floor(x / req.dx), 0), stream.segmentCount - 1),
  );

  const result = stream.simulate(levels, segments);
  const stations: StationSeries[] = req.stations.map((distance, s) => ({
    distance,
    segmentCentre: (segments[s] + 0.5) * req.dx,
    mainChannel: Array.from(result.c[s]),
    storageZone: Array.from(result.cs[s]),
    sediment: Array.from(result.csed[s]),
  }));
  return { time: levels.map((j) => j * req.dt), stations };
}
