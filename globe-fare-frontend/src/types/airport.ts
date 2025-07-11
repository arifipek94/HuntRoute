/**
 * Airport types based on actual usage in dataUtils.ts
 */

// Used in dataUtils.ts loadAirportData()
export interface Airport {
  name: string;
  city: string;
  country: string;
  code: string;
}

// Used for caching in dataUtils.ts
export interface AirportCache {
  [code: string]: Airport;
}

// For resolveLocationInfo function
export interface LocationInfo {
  city: string;
  country: string;
}

// For processing raw JSON data from airports.json
export interface RawAirportData {
  name?: string;
  city?: string;
  country?: string;
  code?: string;
}

// Airport lookup result
export interface AirportLookupResult {
  found: boolean;
  airport?: Airport;
  location?: LocationInfo;
  fallback?: boolean;
}

// Destination for search dropdown
export interface Destination {
  code: string;
  label: string;
  country: string;
}
