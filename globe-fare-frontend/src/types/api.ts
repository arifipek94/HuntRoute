/**
 * API response types for internal backend communication
 */

// Base response structure from your backend
export interface FlightApiResponse {
  success: boolean;
  flights: Record<string, unknown>[]; // Raw flight data from Amadeus/cache
  source: 'cache' | 'api' | 'stale-cache' | 'error' | 'results-file';
  count: number;
  meta: {
    destination: string;
    date: string;
    count: number;
    source: string;
    cached?: boolean;
    fresh?: boolean;
    cache_updated_at?: string;
    timestamp?: number;
    warning?: string;
    message?: string;
  };
}

// For the reference data loading (airlines.json, airports.json)
export interface ReferenceDataResponse {
  [key: string]: {
    name?: string;
    city?: string;
    country?: string;
    iata?: string;
    code?: string;
  };
}
