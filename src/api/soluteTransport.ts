import axios from 'axios';
import { SoluteTransportInput, SoluteTransportResult } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
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
