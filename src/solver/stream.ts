import { StreamParametersDto } from '../types';

/** Concentrations at the requested segments (first index) and time levels (second index). */
export interface SimulationResult {
  c: Float64Array[];
  cs: Float64Array[];
  csed: Float64Array[];
  segments: number[];
  timeLevels: number[];
}

/** Rounds to the nearest integer, halves to even. */
export function roundHalfEven(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/**
 * One-dimensional stream transport model (OTIS, Runkel 1998): the
 * advection-dispersion equation with lateral inflow, transient storage,
 * streambed sorption and first-order decay, solved by Crank-Nicolson.
 * A TypeScript port of the SoluteTransport package's `Stream` class, with the
 * same equations, boundary conditions and error messages.
 *
 * Segment i spans [i dx, (i + 1) dx). The upstream boundary is a fixed
 * concentration Cbc at the upstream face of the first segment; the downstream
 * boundary is a zero dispersive flux. Flow varies along the reach by
 * dQ/dx = qLin - qLout.
 */
export class Stream {
  readonly segmentCount: number;
  readonly timeStepCount: number;
  private readonly upstreamBoundary: ArrayLike<number>;

  // Right-hand side of equation (17) at segment i:
  //   explicitLower[i] C[i-1] + explicitCentre[i] C[i] + explicitUpper[i] C[i+1]
  //   + storageWeight CS[i] + sedimentWeight Csed[i] + sourceTerm,
  // plus upstreamTerm (Cbc[j] + Cbc[j+1]) in the first segment.
  private readonly explicitLower: Float64Array;
  private readonly explicitCentre: Float64Array;
  private readonly explicitUpper: Float64Array;
  private readonly storageWeight: number;
  private readonly sedimentWeight: number;
  private readonly sourceTerm: number;
  private readonly upstreamTerm: number;

  // Equations (25) and (26) as
  //   CS[j+1]   = storageOld CS[j]    + storageFromC (C[j] + C[j+1]) + storageConstant
  //   Csed[j+1] = sedimentOld Csed[j] + sedimentFromC (C[j] + C[j+1]).
  private readonly storageOld: number;
  private readonly storageFromC: number;
  private readonly storageConstant: number;
  private readonly sedimentOld: number;
  private readonly sedimentFromC: number;

  // Thomas-algorithm factors of the constant Crank-Nicolson matrix.
  private readonly subDiagonal: Float64Array;
  private readonly modifiedUpper: Float64Array;
  private readonly reciprocalPivot: Float64Array;

  /** Throws an Error with the package's message for invalid input. */
  constructor(
    streamLength: number,
    totalDuration: number,
    dt: number,
    dx: number,
    upstreamBoundary: ArrayLike<number>,
    p: StreamParametersDto,
  ) {
    if (dx <= 0) throw new Error('dx must be positive.');
    if (dt <= 0) throw new Error('dt must be positive.');
    if (p.a <= 0) throw new Error('A must be positive.');
    if (p.d < 0) throw new Error('D must not be negative.');
    if (p.q < 0) throw new Error('Q must not be negative.');
    if (p.qLin < 0) throw new Error('QLin must not be negative.');
    if (p.qLout < 0) throw new Error('QLout must not be negative.');
    if (p.alpha !== 0 && p.aS <= 0) throw new Error('AS must be positive when Alpha is non-zero.');

    const n = roundHalfEven(streamLength / dx);
    this.segmentCount = n;
    this.timeStepCount = roundHalfEven(totalDuration / dt);
    if (!(n >= 2)) throw new Error('streamLength must hold at least two segments of length dx.');
    if (!(this.timeStepCount >= 1)) throw new Error('totalDuration must be at least one time step.');
    this.upstreamBoundary = upstreamBoundary;

    // Flow rate at segment centres, Runkel and Broshears (1991) equation (31).
    const lateralNet = p.qLin - p.qLout;
    const flow = new Float64Array(n);
    for (let i = 0; i < n; i++) flow[i] = p.q + lateralNet * (i + 0.5) * dx;
    if (flow[n - 1] < 0) throw new Error('QLout must not drain the flow rate below zero within the reach.');

    // Interior segments: Runkel (1998) equation (12).
    const adv = new Float64Array(n);
    const disp = p.d / (dx * dx);
    const lower = new Float64Array(n);
    const diag = new Float64Array(n);
    const upper = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      adv[i] = flow[i] / (2 * p.a * dx);
      lower[i] = adv[i] + disp;
      diag[i] = -2 * disp;
      upper[i] = -adv[i] + disp;
    }

    // First segment: equations (B11) and (B14).
    lower[0] = 0;
    diag[0] = -adv[0] - 3 * disp;
    upper[0] = -adv[0] + disp;
    const upstreamWeight = 2 * adv[0] + 2 * disp;

    // Last segment: equations (B16)–(B18) with a zero dispersive flux.
    const last = n - 1;
    diag[last] = -adv[last] - disp;
    upper[last] = 0;

    // Decoupling constants, Runkel (1998) equations (25)–(27).
    const gamma = p.alpha === 0 ? 0 : (p.alpha * dt * p.a) / p.aS;
    const storageDenominator = 2 + gamma + dt * p.lambdaHatS + dt * p.lambdaS;
    const sedimentDenominator = 2 + dt * p.lambdaHat;
    this.storageOld = (2 - gamma - dt * p.lambdaHatS - dt * p.lambdaS) / storageDenominator;
    this.storageFromC = gamma / storageDenominator;
    this.storageConstant = (2 * dt * p.lambdaHatS * p.chatS) / storageDenominator;
    this.sedimentOld = (2 - dt * p.lambdaHat) / sedimentDenominator;
    this.sedimentFromC = (dt * p.lambdaHat * p.kd) / sedimentDenominator;

    // Reaction part of F' (equation 29).
    const lateral = p.qLin / p.a;
    const sorption = p.rho * p.lambdaHat;
    const reaction =
      lateral + p.alpha * (1 - this.storageFromC) + sorption * (p.kd - this.sedimentFromC) + p.lambda;

    // Equation (17): the implicit half on the left, the explicit half on the right.
    const half = dt / 2;
    this.storageWeight = half * p.alpha * (1 + this.storageOld);
    this.sedimentWeight = half * sorption * (1 + this.sedimentOld);
    this.sourceTerm = half * (2 * lateral * p.cL + p.alpha * this.storageConstant);
    this.upstreamTerm = half * upstreamWeight;

    this.explicitLower = new Float64Array(n);
    this.explicitCentre = new Float64Array(n);
    this.explicitUpper = new Float64Array(n);
    this.subDiagonal = new Float64Array(n);
    this.modifiedUpper = new Float64Array(n);
    this.reciprocalPivot = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      this.explicitLower[i] = half * lower[i];
      this.explicitCentre[i] = 1 - half * (reaction - diag[i]);
      this.explicitUpper[i] = half * upper[i];

      const a = -half * lower[i];
      const b = 1 + half * (reaction - diag[i]);
      const c = -half * upper[i];
      const pivot = i === 0 ? b : b - a * this.modifiedUpper[i - 1];
      this.subDiagonal[i] = a;
      this.reciprocalPivot[i] = 1 / pivot;
      this.modifiedUpper[i] = c / pivot;
    }
  }

  /**
   * Runs to the last requested time level and returns concentrations at the
   * requested segments and strictly increasing time levels.
   */
  simulate(timeLevels: number[], segments: number[]): SimulationResult {
    timeLevels.forEach((level, k) => {
      if (level < 0 || level > this.timeStepCount)
        throw new Error(`Time level ${level} is outside 0 to ${this.timeStepCount}.`);
      if (k > 0 && level <= timeLevels[k - 1]) throw new Error('Time levels must be strictly increasing.');
    });
    for (const segment of segments) {
      if (segment < 0 || segment >= this.segmentCount)
        throw new Error(`Segment ${segment} is outside 0 to ${this.segmentCount - 1}.`);
    }

    const levels = timeLevels.length;
    const c = segments.map(() => new Float64Array(levels));
    const cs = segments.map(() => new Float64Array(levels));
    const csed = segments.map(() => new Float64Array(levels));

    let current = newLevel(this.segmentCount);
    let next = newLevel(this.segmentCount);

    let output = 0;
    for (let j = 0; output < levels; j++) {
      if (j > 0) {
        this.incrementTimeForward(j - 1, current, next);
        [current, next] = [next, current];
      }
      if (timeLevels[output] === j) {
        segments.forEach((i, s) => {
          c[s][output] = current.c[i];
          cs[s][output] = current.cs[i];
          csed[s][output] = current.csed[i];
        });
        output++;
      }
    }

    return { c, cs, csed, segments: [...segments], timeLevels: [...timeLevels] };
  }

  private upstreamConcentration(j: number): number {
    return j < this.upstreamBoundary.length ? this.upstreamBoundary[j] : 0;
  }

  /** Advances `current` at time level j to `next` at j + 1. */
  private incrementTimeForward(j: number, current: Level, next: Level): void {
    const last = this.segmentCount - 1;
    const { c, cs, csed: sed } = current;
    const { c: x, cs: nextCS, csed: nextSed } = next;
    const el = this.explicitLower, ec = this.explicitCentre, eu = this.explicitUpper;
    const sub = this.subDiagonal, mu = this.modifiedUpper, rp = this.reciprocalPivot;
    const sw = this.storageWeight, dw = this.sedimentWeight, source = this.sourceTerm;

    let rhs =
      ec[0] * c[0] + eu[0] * c[1] + sw * cs[0] + dw * sed[0] + source +
      this.upstreamTerm * (this.upstreamConcentration(j) + this.upstreamConcentration(j + 1));
    x[0] = rhs * rp[0];
    for (let i = 1; i < last; i++) {
      rhs = el[i] * c[i - 1] + ec[i] * c[i] + eu[i] * c[i + 1] + sw * cs[i] + dw * sed[i] + source;
      x[i] = (rhs - sub[i] * x[i - 1]) * rp[i];
    }
    rhs = el[last] * c[last - 1] + ec[last] * c[last] + sw * cs[last] + dw * sed[last] + source;
    x[last] = (rhs - sub[last] * x[last - 1]) * rp[last];

    const so = this.storageOld, sc = this.storageFromC, sk = this.storageConstant;
    const ho = this.sedimentOld, hc = this.sedimentFromC;
    for (let i = last; i >= 0; i--) {
      if (i < last) x[i] -= mu[i] * x[i + 1];
      const sum = c[i] + x[i];
      nextCS[i] = so * cs[i] + sc * sum + sk;
      nextSed[i] = ho * sed[i] + hc * sum;
    }
  }
}

/** Main-channel, storage-zone and sediment concentrations at one time level. */
interface Level {
  c: Float64Array;
  cs: Float64Array;
  csed: Float64Array;
}

function newLevel(n: number): Level {
  return { c: new Float64Array(n), cs: new Float64Array(n), csed: new Float64Array(n) };
}
