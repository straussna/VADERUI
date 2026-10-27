import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateTransport, describeError } from './api/soluteTransport';
import { SoluteTransportInput, SoluteTransportResult } from './types';

export interface SimulationState {
  results: SoluteTransportResult[];
  /** Input that produced `results`. */
  shownInput: SoluteTransportInput | null;
  error: string | null;
  busy: boolean;
  run: () => void;
}

/**
 * Keeps at most one request in flight. A change made while a request runs is
 * sent when that request returns, so only the newest input is computed.
 * With `auto` false, runs happen only through `run`.
 */
export function useSimulation(input: SoluteTransportInput, auto: boolean): SimulationState {
  const [results, setResults] = useState<SoluteTransportResult[]>([]);
  const [shownInput, setShownInput] = useState<SoluteTransportInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const latest = useRef(input);
  latest.current = input;
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const inFlight = useRef(false);

  const run = useCallback(function send() {
    if (inFlight.current) return;
    const request = latest.current;
    inFlight.current = true;
    setBusy(true);
    calculateTransport(request)
      .then((r) => {
        setResults(r);
        setShownInput(request);
        setError(null);
      })
      .catch((e: unknown) => setError(describeError(e)))
      .finally(() => {
        inFlight.current = false;
        if (latest.current !== request && autoRef.current) send();
        else setBusy(false);
      });
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(run, 30);
    return () => clearTimeout(timer);
  }, [input, auto, run]);

  return { results, shownInput, error, busy, run };
}
