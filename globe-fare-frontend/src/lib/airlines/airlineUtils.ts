/**
 * Airline-specific utilities and data management
 */

import type {
  Airline,
  AirlineCache,
  AirlineLookupResult,
  RawAirlineData,
} from '@/types/airline';

// Airline cache (singleton)
let airlinesCache: AirlineCache | null = null;

/**
 * Load airline data from JSON file
 */
export async function loadAirlineData(): Promise<AirlineCache> {
  if (airlinesCache) return airlinesCache;

  try {
    const response = await fetch('/data/airlines.json');
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: Failed to load airline data`);

    const airlines: RawAirlineData[] = await response.json();

    airlinesCache = airlines.reduce((acc, airline) => {
      if (airline.id || airline.iata || airline.code) {
        const code = (airline.id ||
          airline.iata ||
          airline.code)!.toUpperCase();
        acc[code] = {
          id: code,
          name: airline.name || `${code} Airlines`,
          code: code,
          country: airline.country,
          logo:
            airline.logo || `https://images.kiwi.com/airlines/64/${code}.png`,
        };
      }
      return acc;
    }, {} as AirlineCache);

    console.log(
      `✅ [AIRLINES] Successfully loaded ${Object.keys(airlinesCache).length} airlines`
    );
    return airlinesCache;
  } catch (error) {
    console.error('❌ [AIRLINES] Failed to load airline data:', error);
    airlinesCache = {};
    return airlinesCache;
  }
}

/**
 * Get airline information by code
 */
export async function getAirlineInfo(
  airlineCode: string
): Promise<Airline | undefined> {
  if (!airlineCode) return undefined;

  try {
    // Ensure data is loaded
    const airlines = await loadAirlineData();
    const airline = airlines[airlineCode.toUpperCase()];

    if (!airline) {
      return {
        id: airlineCode,
        name: `${airlineCode} Airlines`,
        code: airlineCode,
        logo: `https://images.kiwi.com/airlines/64/${airlineCode}.png`,
      };
    }

    return airline;
  } catch (error) {
    console.warn(`Failed to get airline info for ${airlineCode}:`, error);
    return {
      id: airlineCode,
      name: `${airlineCode} Airlines`,
      code: airlineCode,
      logo: `https://images.kiwi.com/airlines/64/${airlineCode}.png`,
    };
  }
}

/**
 * Lookup airline with detailed result info
 */
export async function lookupAirline(
  airlineCode: string
): Promise<AirlineLookupResult> {
  if (!airlineCode) {
    return { found: false, code: airlineCode };
  }

  try {
    const airlines = await loadAirlineData();
    const code = airlineCode.toUpperCase();
    const airline = airlines[code];

    if (airline) {
      return {
        found: true,
        airline,
        code,
        fallback: false,
      };
    }

    // Return fallback airline
    return {
      found: false,
      airline: {
        id: code,
        name: `${code} Airlines`,
        code,
        logo: `https://images.kiwi.com/airlines/64/${code}.png`,
      },
      code,
      fallback: true,
    };
  } catch (error) {
    console.warn(`Airline lookup failed for ${airlineCode}:`, error);
    return { found: false, code: airlineCode };
  }
}

/**
 * Get airline name (simple version)
 */
export function getAirlineName(airlineCode: string): string {
  if (!airlineCode || !airlinesCache) {
    return `${airlineCode || 'Unknown'} Airlines`;
  }

  const airline = airlinesCache[airlineCode.toUpperCase()];
  return airline?.name || `${airlineCode} Airlines`;
}

/**
 * Clear airline cache (for testing/development)
 */
export function clearAirlineCache(): void {
  airlinesCache = null;
}

/**
 * Check if airline cache is loaded
 */
export function isAirlineCacheLoaded(): boolean {
  return airlinesCache !== null && Object.keys(airlinesCache).length > 0;
}
