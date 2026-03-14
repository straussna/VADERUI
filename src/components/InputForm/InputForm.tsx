import { useForm, SubmitHandler } from 'react-hook-form';
import { SoluteTransportInput } from '../../types';
import './InputForm.css';

interface InputFormProps {
  onSubmit: SubmitHandler<SoluteTransportInput>;
  isLoading?: boolean;
}

const DEFAULT_VALUES: SoluteTransportInput = {
  streamLength: 50.0,
  totalDuration: 3600.0,
  dt: 1.0,
  dx: 0.5,
  upstreamConcentration: 1.0,
  upstreamDuration: 600.0,
  outputTimeSteps: 10,
  parameters: {
    a: 1.0,
    aS: 0.1,
    cL: 0.0,
    d: 0.05,
    q: 0.5,
    qLin: 0.0,
    alpha: 0.001,
    chatS: 0.0,
    kd: 0.0,
    lambda: 0.0,
    lambdaS: 0.0,
    lambdaHat: 0.0,
    lambdaHatS: 0.0,
    rho: 0.0,
  },
};

interface FieldMeta {
  label: string;
  min?: number;
  step?: string;
  allowZero?: boolean;
}

const SIMULATION_FIELDS: Record<
  'streamLength' | 'totalDuration' | 'dt' | 'dx' | 'upstreamConcentration' | 'upstreamDuration' | 'outputTimeSteps',
  FieldMeta
> = {
  streamLength:         { label: 'Stream Length (m)',                   min: 0 },
  totalDuration:        { label: 'Total Duration (s)',                   min: 0 },
  dt:                   { label: 'Time-Step Size dt (s)',                min: 0 },
  dx:                   { label: 'Segment Length dx (m)',                min: 0 },
  upstreamConcentration:{ label: 'Upstream Concentration C₀ (kg/m³)',   min: 0, allowZero: true },
  upstreamDuration:     { label: 'Upstream BC Duration (s)',             min: 0, allowZero: true },
  outputTimeSteps:      { label: 'Output Time Snapshots',               min: 1, step: '1' },
};

const PARAMETER_FIELDS: Record<
  'a' | 'aS' | 'cL' | 'd' | 'q' | 'qLin' | 'alpha' | 'chatS' | 'kd' | 'lambda' | 'lambdaS' | 'lambdaHat' | 'lambdaHatS' | 'rho',
  FieldMeta
> = {
  a:          { label: 'Main-Channel Area A (m²)',           min: 0 },
  aS:         { label: 'Storage-Zone Area Aₛ (m²)',         min: 0 },
  cL:         { label: 'Lateral Inflow Conc. Cₗ (kg/m³)',  min: 0, allowZero: true },
  d:          { label: 'Dispersion Coefficient D (m²/s)',   min: 0 },
  q:          { label: 'Flow Rate Q (m³/s)',                min: 0 },
  qLin:       { label: 'Lateral Inflow Qₗᵢₙ (m²/s)',       min: 0, allowZero: true },
  alpha:      { label: 'Storage Exchange α (1/s)',           min: 0, allowZero: true },
  chatS:      { label: 'Storage Equilib. Conc. Ĉₛ (kg/m³)',min: 0, allowZero: true },
  kd:         { label: 'Partition Coeff. Kd (m³/kg)',       min: 0, allowZero: true },
  lambda:     { label: 'Decay Rate λ (1/s)',                min: 0, allowZero: true },
  lambdaS:    { label: 'Storage Decay λₛ (1/s)',           min: 0, allowZero: true },
  lambdaHat:  { label: 'Sediment Desorption λ̂ (1/s)',      min: 0, allowZero: true },
  lambdaHatS: { label: 'Storage Desorption λ̂ₛ (1/s)',     min: 0, allowZero: true },
  rho:        { label: 'Sediment Density ρ (kg/m³)',        min: 0, allowZero: true },
};

export default function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SoluteTransportInput>({ defaultValues: DEFAULT_VALUES });

  type TopField = keyof typeof SIMULATION_FIELDS;
  type ParamField = keyof typeof PARAMETER_FIELDS;

  function renderTopField(field: TopField) {
    const meta = SIMULATION_FIELDS[field];
    return (
      <div className="form-group" key={field}>
        <label htmlFor={field}>{meta.label}</label>
        <input
          id={field}
          type="number"
          step={meta.step ?? 'any'}
          {...register(field, {
            required: 'This field is required',
            valueAsNumber: true,
            validate: (value) =>
              meta.allowZero
                ? value >= 0 || 'Must be ≥ 0'
                : value > 0 || 'Must be a positive number',
          })}
          className={errors[field] ? 'input-error' : ''}
        />
        {errors[field] && <span className="error-message">{errors[field]?.message}</span>}
      </div>
    );
  }

  function renderParamField(field: ParamField) {
    const meta = PARAMETER_FIELDS[field];
    const name = `parameters.${field}` as const;
    return (
      <div className="form-group" key={field}>
        <label htmlFor={name}>{meta.label}</label>
        <input
          id={name}
          type="number"
          step={meta.step ?? 'any'}
          {...register(name, {
            required: 'This field is required',
            valueAsNumber: true,
            validate: (value) =>
              meta.allowZero
                ? value >= 0 || 'Must be ≥ 0'
                : value > 0 || 'Must be a positive number',
          })}
          className={errors.parameters?.[field] ? 'input-error' : ''}
        />
        {errors.parameters?.[field] && (
          <span className="error-message">{errors.parameters[field]?.message}</span>
        )}
      </div>
    );
  }

  return (
    <form className="input-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="form-title">Simulation Setup</h2>

      <fieldset className="form-section">
        <legend>Grid &amp; Time</legend>
        {(Object.keys(SIMULATION_FIELDS) as TopField[]).map(renderTopField)}
      </fieldset>

      <fieldset className="form-section">
        <legend>Stream Parameters</legend>
        {(Object.keys(PARAMETER_FIELDS) as ParamField[]).map(renderParamField)}
      </fieldset>

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Calculating…' : 'Calculate'}
      </button>
    </form>
  );
}
