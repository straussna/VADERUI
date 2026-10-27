import axios from 'axios';
import { BreakthroughResult, SimulationRequest } from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

/** True in the standalone build, which runs the solver in the page instead of calling the API. */
export const STANDALONE = import.meta.env.MODE === 'standalone';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function calculateTransport(
  request: SimulationRequest
): Promise<BreakthroughResult> {
  if (STANDALONE) {
    const { calculateLocally } = await import('../solver/local');
    return calculateLocally(request);
  }
  const response = await apiClient.post<BreakthroughResult>(
    '/calculate',
    request
  );
  return response.data;
}

/** The solver's or API's own message for a rejected request, or a description of the failure. */
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === 'string' && error.response.data !== '')
      return error.response.data;
    if (!error.response) return `Cannot reach the API at ${API_BASE_URL}.`;
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}
