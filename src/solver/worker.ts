import { SimulationRequest } from '../types';
import { calculate } from './calculate';

/** Replies to each request with `{ result }` or `{ error }`. */
self.onmessage = (event: MessageEvent<SimulationRequest>) => {
  try {
    self.postMessage({ result: calculate(event.data) });
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : String(e) });
  }
};
