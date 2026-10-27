import axios from 'axios';
import { SoluteTransportInput, SoluteTransportResult } from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function calculateTransport(
  input: SoluteTransportInput
): Promise<SoluteTransportResult[]> {
  const response = await apiClient.post<SoluteTransportResult[]>(
    '/calculate',
    input
  );
  return response.data;
}

/** The API's own message for a rejected request, or a description of the failure. */
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === 'string' && error.response.data !== '')
      return error.response.data;
    if (!error.response) return `Cannot reach the API at ${API_BASE_URL}.`;
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}
