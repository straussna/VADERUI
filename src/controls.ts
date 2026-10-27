import { SoluteTransportInput, StreamParametersDto } from './types';

type TopKey = Exclude<keyof SoluteTransportInput, 'parameters'>;
type ParamKey = keyof StreamParametersDto;

/**
 * One tunable input. The slider spans [min, max]; a typed value may lie anywhere.
 * `log` sliders are logarithmic, and with `zero` their leftmost position is 0.
 */
export interface ControlSpec {
  key: TopKey | ParamKey;
  inParameters: boolean;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  scale: 'linear' | 'log';
  zero?: boolean;
  integer?: boolean;
}

export interface ControlGroup {
  title: string;
  controls: ControlSpec[];
}

const top = (key: TopKey, rest: Omit<ControlSpec, 'key' | 'inParameters'>): ControlSpec =>
  ({ key, inParameters: false, ...rest });
const param = (key: ParamKey, rest: Omit<ControlSpec, 'key' | 'inParameters'>): ControlSpec =>
  ({ key, inParameters: true, ...rest });

export const DEFAULT_INPUT: SoluteTransportInput = {
  streamLength: 50,
  totalDuration: 3600,
  dt: 1,
  dx: 0.5,
  upstreamConcentration: 1,
  upstreamDuration: 600,
  outputTimeSteps: 10,
  parameters: {
    a: 1,
    aS: 0.1,
    cL: 0,
    d: 0.05,
    q: 0.5,
    qLin: 0,
    alpha: 0.001,
    chatS: 0,
    kd: 0,
    lambda: 0,
    lambdaS: 0,
    lambdaHat: 0,
    lambdaHatS: 0,
    rho: 0,
    qLout: 0,
  },
};

export const CONTROL_GROUPS: ControlGroup[] = [
  {
    title: 'Upstream input',
    controls: [
      top('upstreamConcentration', { label: 'Pulse concentration', symbol: 'C₀', unit: 'kg/m³', min: 0, max: 10, scale: 'linear' }),
      top('upstreamDuration', { label: 'Pulse duration', symbol: 'tₚ', unit: 's', min: 10, max: 14400, scale: 'log', zero: true }),
    ],
  },
  {
    title: 'Flow and channel',
    controls: [
      param('q', { label: 'Upstream flow rate', symbol: 'Q', unit: 'm³/s', min: 0.001, max: 10, scale: 'log', zero: true }),
      param('a', { label: 'Main-channel area', symbol: 'A', unit: 'm²', min: 0.01, max: 10, scale: 'log' }),
      param('d', { label: 'Dispersion coefficient', symbol: 'D', unit: 'm²/s', min: 0.001, max: 10, scale: 'log', zero: true }),
      param('qLin', { label: 'Lateral inflow', symbol: 'q_LIN', unit: 'm²/s', min: 1e-5, max: 0.1, scale: 'log', zero: true }),
      param('qLout', { label: 'Lateral outflow', symbol: 'q_LOUT', unit: 'm²/s', min: 1e-5, max: 0.1, scale: 'log', zero: true }),
      param('cL', { label: 'Lateral inflow concentration', symbol: 'C_L', unit: 'kg/m³', min: 0, max: 10, scale: 'linear' }),
    ],
  },
  {
    title: 'Transient storage',
    controls: [
      param('aS', { label: 'Storage-zone area', symbol: 'A_S', unit: 'm²', min: 0.001, max: 10, scale: 'log', zero: true }),
      param('alpha', { label: 'Exchange coefficient', symbol: 'α', unit: '1/s', min: 1e-6, max: 0.1, scale: 'log', zero: true }),
      param('chatS', { label: 'Background storage concentration', symbol: 'Ĉ_S', unit: 'kg/m³', min: 0, max: 10, scale: 'linear' }),
      param('lambdaS', { label: 'Storage decay', symbol: 'λ_S', unit: '1/s', min: 1e-7, max: 0.01, scale: 'log', zero: true }),
      param('lambdaHatS', { label: 'Storage sorption rate', symbol: 'λ̂_S', unit: '1/s', min: 1e-7, max: 0.01, scale: 'log', zero: true }),
    ],
  },
  {
    title: 'Main-channel reactions',
    controls: [
      param('lambda', { label: 'Decay', symbol: 'λ', unit: '1/s', min: 1e-7, max: 0.01, scale: 'log', zero: true }),
      param('lambdaHat', { label: 'Sorption rate', symbol: 'λ̂', unit: '1/s', min: 1e-7, max: 0.01, scale: 'log', zero: true }),
      param('kd', { label: 'Distribution coefficient', symbol: 'K_d', unit: 'm³/kg', min: 1e-4, max: 10, scale: 'log', zero: true }),
      param('rho', { label: 'Accessible sediment', symbol: 'ρ', unit: 'kg/m³', min: 1, max: 5000, scale: 'log', zero: true }),
    ],
  },
  {
    title: 'Grid and time',
    controls: [
      top('streamLength', { label: 'Reach length', symbol: 'L', unit: 'm', min: 5, max: 500, scale: 'log' }),
      top('totalDuration', { label: 'Duration', symbol: 'T', unit: 's', min: 60, max: 14400, scale: 'log' }),
      top('dt', { label: 'Time step', symbol: 'Δt', unit: 's', min: 0.5, max: 60, scale: 'log' }),
      top('dx', { label: 'Segment length', symbol: 'Δx', unit: 'm', min: 0.1, max: 10, scale: 'log' }),
      top('outputTimeSteps', { label: 'Snapshots', symbol: 'n', unit: '', min: 1, max: 30, scale: 'linear', integer: true }),
    ],
  },
];

export function readValue(input: SoluteTransportInput, spec: ControlSpec): number {
  return spec.inParameters
    ? input.parameters[spec.key as ParamKey]
    : input[spec.key as TopKey];
}

export function writeValue(
  input: SoluteTransportInput,
  spec: ControlSpec,
  value: number
): SoluteTransportInput {
  return spec.inParameters
    ? { ...input, parameters: { ...input.parameters, [spec.key]: value } }
    : { ...input, [spec.key]: value };
}

/** Number of positions on every slider. */
export const SLIDER_STEPS = 1000;

/** Slider position of `value`, pinned to the ends when the value lies outside [min, max]. */
export function toPosition(spec: ControlSpec, value: number): number {
  const clamp = (p: number, lo: number) => Math.min(SLIDER_STEPS, Math.max(lo, p));
  if (spec.scale === 'linear')
    return clamp(((value - spec.min) / (spec.max - spec.min)) * SLIDER_STEPS, 0);
  if (spec.zero && value <= 0) return 0;
  const start = spec.zero ? 1 : 0;
  if (value <= 0) return start;
  const f = Math.log(value / spec.min) / Math.log(spec.max / spec.min);
  return clamp(start + f * (SLIDER_STEPS - start), start);
}

/** Value at slider position `position`, rounded to three significant figures. */
export function fromPosition(spec: ControlSpec, position: number): number {
  let value: number;
  if (spec.scale === 'linear') {
    value = spec.min + (position / SLIDER_STEPS) * (spec.max - spec.min);
  } else {
    if (spec.zero && position === 0) return 0;
    const start = spec.zero ? 1 : 0;
    const f = (position - start) / (SLIDER_STEPS - start);
    value = spec.min * Math.pow(spec.max / spec.min, f);
  }
  if (spec.integer) return Math.round(value);
  return value === 0 ? 0 : Number(value.toPrecision(3));
}

export function isBeyondSlider(spec: ControlSpec, value: number): boolean {
  if (spec.zero && value === 0) return false;
  return value < spec.min || value > spec.max;
}
