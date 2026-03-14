import { useForm, SubmitHandler } from 'react-hook-form';
import { SoluteTransportInput } from '../../types';
import './InputForm.css';

interface InputFormProps {
  onSubmit: SubmitHandler<SoluteTransportInput>;
  isLoading?: boolean;
}

const DEFAULT_VALUES: SoluteTransportInput = {
  velocity: 0.1,
  dispersionCoefficient: 0.01,
  retardationFactor: 1.0,
  decayConstant: 0.0,
  sourceConcentration: 1.0,
  columnLength: 10.0,
  timeSteps: 10,
  totalTime: 100.0,
};

const FIELD_LABELS: Record<keyof SoluteTransportInput, string> = {
  velocity: 'Pore Water Velocity (m/d)',
  dispersionCoefficient: 'Dispersion Coefficient (m²/d)',
  retardationFactor: 'Retardation Factor',
  decayConstant: 'Decay Constant (1/d)',
  sourceConcentration: 'Source Concentration (mg/L)',
  columnLength: 'Column Length (m)',
  timeSteps: 'Number of Time Steps',
  totalTime: 'Total Simulation Time (d)',
};

export default function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SoluteTransportInput>({ defaultValues: DEFAULT_VALUES });

  return (
    <form className="input-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="form-title">Simulation Parameters</h2>

      {(Object.keys(DEFAULT_VALUES) as Array<keyof SoluteTransportInput>).map((field) => (
        <div className="form-group" key={field}>
          <label htmlFor={field}>{FIELD_LABELS[field]}</label>
          <input
            id={field}
            type="number"
            step="any"
            {...register(field, {
              required: 'This field is required',
              valueAsNumber: true,
              validate: (value) =>
                field === 'decayConstant'
                  ? value >= 0 || 'Must be ≥ 0'
                  : value > 0 || 'Must be a positive number',
            })}
            className={errors[field] ? 'input-error' : ''}
          />
          {errors[field] && (
            <span className="error-message">{errors[field]?.message}</span>
          )}
        </div>
      ))}

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Calculating…' : 'Calculate'}
      </button>
    </form>
  );
}
