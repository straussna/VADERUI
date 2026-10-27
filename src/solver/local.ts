import { BreakthroughResult, SimulationRequest } from '../types';
import { calculate } from './calculate';
import SolverWorker from './worker?worker&inline';

let worker: Worker | null | undefined;

/** The solver worker, or null where the page cannot start one. */
function solverWorker(): Worker | null {
  if (worker === undefined) {
    try {
      worker = new SolverWorker();
    } catch {
      worker = null;
    }
  }
  return worker;
}

/**
 * Runs the solver in the page. Requests go to a worker, one at a time, so the
 * page stays responsive; without a worker they run on the main thread.
 */
export function calculateLocally(request: SimulationRequest): Promise<BreakthroughResult> {
  const w = solverWorker();
  if (!w) return new Promise((resolve) => resolve(calculate(request)));
  return new Promise((resolve, reject) => {
    w.onmessage = (event: MessageEvent<{ result?: BreakthroughResult; error?: string }>) => {
      if (event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error));
    };
    w.onerror = (event) => {
      event.preventDefault();
      worker = null;
      calculateLocally(request).then(resolve, reject);
    };
    w.postMessage(request);
  });
}
