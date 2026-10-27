import { useId, useState } from 'react';
import { ControlSpec, SLIDER_STEPS, fromPosition, isBeyondSlider, toPosition } from '../controls';

interface ParameterControlProps {
  spec: ControlSpec;
  value: number;
  onChange: (value: number) => void;
}

/** Slider with a number box beside it; a value typed in the box may lie outside the slider's range. */
export default function ParameterControl({ spec, value, onChange }: ParameterControlProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const draftInvalid = draft !== null && !isFiniteNumber(draft);
  const beyond = isBeyondSlider(spec, value);
  const position = toPosition(spec, value);

  const commitDraft = (text: string) => {
    setDraft(text);
    if (isFiniteNumber(text)) onChange(Number(text));
  };

  return (
    <div className={`control${beyond ? ' beyond' : ''}`}>
      <div className="control-head">
        <label htmlFor={id}>
          {spec.label} <var>{spec.symbol}</var>
        </label>
        <span className="control-value">
          <input
            type="text"
            inputMode="decimal"
            spellCheck={false}
            aria-label={`${spec.label} value`}
            aria-invalid={draftInvalid}
            className={draftInvalid ? 'invalid' : undefined}
            value={draft ?? String(value)}
            onFocus={() => setDraft(String(value))}
            onChange={(e) => commitDraft(e.target.value)}
            onBlur={() => setDraft(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
          <span className="unit">{spec.unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={SLIDER_STEPS}
        step={1}
        value={position}
        style={{ '--fill': `${(position / SLIDER_STEPS) * 100}%` } as React.CSSProperties}
        onChange={(e) => onChange(fromPosition(spec, Number(e.target.value)))}
      />
      <div className="control-range">
        <span>{spec.zero ? 0 : formatBound(spec.min)}</span>
        {beyond && <span className="beyond-note">typed value beyond slider</span>}
        <span>{formatBound(spec.max)}</span>
      </div>
    </div>
  );
}

function isFiniteNumber(text: string): boolean {
  return text.trim() !== '' && Number.isFinite(Number(text));
}

function formatBound(value: number): string {
  return value !== 0 && Math.abs(value) < 0.01
    ? value.toExponential(0)
    : value.toLocaleString('en-US');
}
