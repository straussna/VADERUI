import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateTransport, describeError } from './api/soluteTransport';
import { BreakthroughResult, SimulationRequest } from './types';

/** A request plus whatever the caller needs to read its result. */
export interface Plan {
  request: SimulationRequest;
}

export interface SimulationState<P extends Plan> {
  result: BreakthroughResult | null;
  /** Plan whose request produced `result`. */
  shownPlan: P | null;
  error: string | null;
  busy: boolean;
  run: () => void;
}

/**
 * Keeps at most one request in flight. A change made while a request runs is
 * sent when that request returns, so only the newest plan is computed.
 * With `auto` false, runs happen only through `run`.
 */
export function useSimulation<P extends Plan>(plan: P, auto: boolean): SimulationState<P> {
  const [result, setResult] = useState<BreakthroughResult | null>(null);
  const [shownPlan, setShownPlan] = useState<P | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const latest = useRef(plan);
  latest.current = plan;
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const inFlight = useRef(false);

  const run = useCallback(function send() {
    if (inFlight.current) return;
    const sent = latest.current;
    inFlight.current = true;
    setBusy(true);
    calculateTransport(sent.request)
      .then((r) => {
        setResult(r);
        setShownPlan(sent);
        setError(null);
      })
      .catch((e: unknown) => setError(describeError(e)))
      .finally(() => {
        inFlight.current = false;
        if (latest.current !== sent && autoRef.current) send();
        else setBusy(false);
      });
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(run, 30);
    return () => clearTimeout(timer);
  }, [plan, auto, run]);

  return { result, shownPlan, error, busy, run };
}
