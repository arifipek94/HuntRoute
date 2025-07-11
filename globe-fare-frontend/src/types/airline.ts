/**
 * Airline types based on actual usage in dataUtils.ts
 */

// Used in dataUtils.ts loadAirlineData() and getAirlineInfo()
export interface Airline {
  id: string;
  name: string;
  code: string;
  logo?: string;
  country?: string;
}

// Used for caching in dataUtils.ts
export interface AirlineCache {
  [code: string]: Airline;
}

// For processing raw JSON data from airlines.json
export interface RawAirlineData {
  id?: string;
  iata?: string;
  code?: string;
  name?: string;
  country?: string;
  logo?: string;
}

// For airline lookup results
export interface AirlineLookupResult {
  found: boolean;
  airline?: Airline;
  code?: string;
  fallback?: boolean;
}
