/**
 * Flight service - currently handled by useFlights.ts
 * This could consolidate the API calls but useFlights.ts is working fine
 */

import type { FlightSearchParams } from '@/types/flight';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchFlights(params: FlightSearchParams) {
  const { to, date, people = 1 } = params;

  const response = await fetch(
    `${API_BASE_URL}/flights?to=${to}&date=${date}&people=${people}`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch flights`);
  }

  return response.json();
}

export async function clearFlightCache() {
  const response = await fetch(`${API_BASE_URL}/flights?action=clear-cache`, {
    method: 'POST',
  });

  const result = await response.json();
  return result.success;
}

export async function getFlightCacheStatus() {
  const response = await fetch(`${API_BASE_URL}/flights?action=cache-status`, {
    method: 'POST',
  });

  return response.json();
}
