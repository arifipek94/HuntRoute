/**
 * OPTIMIZED DATA UTILITIES - Only functions actually used
 * Removed: getAirlineInfo, resolveCityName, validateFlightData, formatPrice, formatDate, logDataSource, debugDataLoading
 */

import type { Flight } from '../types/flight';

// ====================================
// TYPE DEFINITIONS
// ====================================

export interface Airline {
  id: string;
  name: string;
  code: string;
  logo?: string;
  country?: string;
}

export interface Airport {
  name: string;
  city: string;
  country: string;
  code: string;
}

// ====================================
// DATA CACHING (SINGLE INSTANCE)
// ====================================

let airlinesCache: Record<string, Airline> | null = null;
let airportsCache: Record<string, Airport> | null = null;
let dataLoadingPromise: Promise<void> | null = null;

// ====================================
// CLEAN ASYNC DATA LOADING
// ====================================

export async function loadAirlineData(): Promise<Record<string, Airline>> {
  if (airlinesCache) return airlinesCache;

  try {
    const response = await fetch('/airlines.json');
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: Failed to load airline data`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const airlines: any[] = await response.json();

    airlinesCache = airlines.reduce(
      (acc, airline) => {
        if (airline.id || airline.iata || airline.code) {
          const code = (
            airline.id ||
            airline.iata ||
            airline.code
          ).toUpperCase();
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
      },
      {} as Record<string, Airline>
    );

    console.log(
      `✅ [AIRLINES] Successfully loaded ${Object.keys(airlinesCache || {}).length} airlines`
    );
    return airlinesCache || {};
  } catch (error) {
    console.error('❌ [AIRLINES] Failed to load airline data:', error);
    airlinesCache = {};
    return airlinesCache;
  }
}

export async function loadAirportData(): Promise<Record<string, Airport>> {
  if (airportsCache) return airportsCache;

  try {
    console.log('🔄 [AIRPORTS] Loading airport data...');
    const response = await fetch('/airports.json');
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: Failed to load airport data`);

    const airportData = await response.json();
    console.log('📥 [AIRPORTS] Raw data loaded');

    airportsCache = Object.entries(airportData).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc, [code, airport]: [string, any]) => {
        acc[code] = {
          code: code,
          name: airport.name || `${code} Airport`,
          city: airport.city || code,
          country: airport.country || '',
        };
        return acc;
      },
      {} as Record<string, Airport>
    );

    console.log(
      `✅ [AIRPORTS] Successfully loaded ${Object.keys(airportsCache || {}).length} airports`
    );
    return airportsCache || {};
  } catch (error) {
    console.error('❌ [AIRPORTS] Failed to load airport data:', error);
    airportsCache = {};
    return airportsCache;
  }
}

// ====================================
// DYNAMIC CITY NAME RESOLUTION FROM JSON
// ====================================

export function resolveLocationInfo(airportCode: string): {
  city: string;
  country: string;
} {
  if (!airportCode) return { city: 'Unknown', country: '' };

  const code = airportCode.toUpperCase();

  if (airportsCache) {
    const airport = airportsCache[code];
    if (airport) {
      return {
        city: airport.city || code,
        country: airport.country || '',
      };
    }
  }

  // Fallback to hardcoded data
  const majorAirports: Record<string, { city: string; country: string }> = {
    DPS: { city: 'Bali', country: 'Indonesia' },
    BKK: { city: 'Bangkok', country: 'Thailand' },
    SIN: { city: 'Singapore', country: 'Singapore' },
    KUL: { city: 'Kuala Lumpur', country: 'Malaysia' },
    CGK: { city: 'Jakarta', country: 'Indonesia' },
    IST: { city: 'Istanbul', country: 'Turkey' },
    DXB: { city: 'Dubai', country: 'UAE' },
    DOH: { city: 'Doha', country: 'Qatar' },
    LHR: { city: 'London', country: 'UK' },
    CDG: { city: 'Paris', country: 'France' },
    LAX: { city: 'Los Angeles', country: 'USA' },
    JFK: { city: 'New York', country: 'USA' },
    NRT: { city: 'Tokyo', country: 'Japan' },
  };

  return majorAirports[code] || { city: code, country: '' };
}

// ====================================
// DATA INITIALIZATION HELPER
// ====================================

async function ensureDataLoaded(): Promise<void> {
  if (dataLoadingPromise) {
    await dataLoadingPromise;
    return;
  }

  if (airlinesCache && airportsCache) {
    return; // Already loaded
  }

  dataLoadingPromise = Promise.all([loadAirlineData(), loadAirportData()]).then(
    () => {
      console.log('🎉 [DATA] All reference data loaded successfully');
    }
  );

  await dataLoadingPromise;
}

// ====================================
// FORMATTING FUNCTIONS
// ====================================

export function formatTime(time: string): string {
  if (!time) return '--:--';

  try {
    // If already in HH:MM format, return as-is
    if (/^\d{2}:\d{2}$/.test(time)) return time;

    // Parse ISO date string
    if (time.includes('T')) {
      const date = new Date(time);
      if (isNaN(date.getTime())) return '--:--';

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC', // Use UTC to avoid timezone confusion
      });
    }

    // Try to parse other formats
    const date = new Date(time);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    return time; // Return as-is if can't parse
  } catch {
    return '--:--';
  }
}

export function formatDuration(
  durationString: string | number | undefined
): string {
  if (!durationString) return '--h --m';

  try {
    // If it's a number, assume it's minutes
    if (typeof durationString === 'number') {
      const hours = Math.floor(durationString / 60);
      const mins = durationString % 60;
      if (hours === 0) return `${mins}m`;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }

    // If it's a string like "PT2H30M" (ISO 8601 duration)
    if (typeof durationString === 'string' && durationString.startsWith('PT')) {
      const hours = durationString.match(/(\d+)H/);
      const minutes = durationString.match(/(\d+)M/);

      const h = hours ? parseInt(hours[1]) : 0;
      const m = minutes ? parseInt(minutes[1]) : 0;

      if (h === 0 && m === 0) return '--h --m';
      if (h === 0) return `${m}m`;
      return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    }

    // If it's already formatted like "2h 30m"
    if (typeof durationString === 'string' && durationString.includes('h')) {
      return durationString;
    }

    return durationString.toString();
  } catch {
    return '--h --m';
  }
}

export function generateFlightId(
  flight: Partial<Flight>,
  index: number
): string {
  const origin = flight.origin || flight.from || 'UNK';
  const destination = flight.destination || flight.to || 'UNK';
  const departure = flight.departureTime || flight.departure || Date.now();
  const airline = flight.airline || flight.airlineCode || 'XX';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);

  return `${airline}-${origin}-${destination}-${departure}-${index}-${timestamp}-${random}`;
}

export async function prepareFlightsForDisplay(
  flights: any[]
): Promise<Flight[]> {
  if (!Array.isArray(flights)) {
    console.warn('[DATA PROCESSING] Expected array, got:', typeof flights);
    return [];
  }

  console.log(
    `🔧 [FLIGHT PROCESSING] Processing ${flights.length} flights for display`
  );

  // ENSURE DATA IS LOADED FIRST
  await ensureDataLoaded();

  console.log(
    `📊 [DATA VERIFICATION] Airlines: ${Object.keys(airlinesCache || {}).length}, Airports: ${Object.keys(airportsCache || {}).length}`
  );

  const processedFlights = flights
    .map((flight, index) => {
      try {
        // Create base flight object
        const processed: Flight = {
          id: flight.id || generateFlightId(flight, index),
          airline: flight.airline || flight.airlineCode || 'XX',
          airlineCode: flight.airlineCode || flight.airline || 'XX',
          flightNumber:
            flight.flightNumber ||
            `${flight.airline || 'XX'}${String(index + 1).padStart(3, '0')}`,

          from: flight.from || flight.origin || 'XXX',
          to: flight.to || flight.destination || 'XXX',
          origin: flight.origin || flight.from || 'XXX',
          destination: flight.destination || flight.to || 'XXX',

          departure: flight.departure || flight.departureTime || '',
          arrival: flight.arrival || flight.arrivalTime || '',
          departureTime: flight.departureTime || flight.departure || '',
          arrivalTime: flight.arrivalTime || flight.arrival || '',

          duration: flight.duration || flight.flightDuration || 'N/A',
          stops: Number(flight.stops) || 0,
          price: Number(flight.price) || 0,
          currency: flight.currency || 'EUR',
          aircraft: flight.aircraft || flight.aircraftType || '738',
          availableSeats:
            flight.availableSeats || Math.floor(Math.random() * 50) + 10,

          segments: flight.segments || [],
        };

        // RESOLVE AIRLINE NAME - Improved logic
        const airlineInfo = airlinesCache?.[processed.airline.toUpperCase()];
        const airlineName =
          airlineInfo?.name || `${processed.airline} Airlines`;

        // RESOLVE CITY AND COUNTRY INFORMATION
        const originLocation = resolveLocationInfo(processed.from);
        const destinationLocation = resolveLocationInfo(processed.to);

        // Add enriched display data
        return Object.assign(processed, {
          airlineName: airlineName,
          originCity: originLocation.city,
          destinationCity: destinationLocation.city,
          originCountry: originLocation.country,
          destinationCountry: destinationLocation.country,
          originAirport:
            airportsCache?.[processed.from]?.name ||
            `${processed.from} Airport`,
          destinationAirport:
            airportsCache?.[processed.to]?.name || `${processed.to} Airport`,
          departureFormatted: formatTime(processed.departure),
          arrivalFormatted: formatTime(processed.arrival),
          durationFormatted: formatDuration(processed.duration),
        });
      } catch (error) {
        console.error(
          `❌ [FLIGHT PROCESSING] Error processing flight ${index + 1}:`,
          error
        );
        return null;
      }
    })
    .filter(Boolean) as Flight[];

  console.log(
    `✅ [FLIGHT PROCESSING] Successfully processed ${processedFlights.length}/${flights.length} flights`
  );

  return processedFlights;
}

// ====================================
// DATA PRELOAD FUNCTION
// ====================================

export async function preloadData(): Promise<void> {
  console.log(
    '🚀 [DATA PRELOAD] Preloading airport and airline data for faster lookups'
  );

  try {
    await ensureDataLoaded();
    console.log('✅ [DATA PRELOAD] Data loaded successfully');
  } catch (error) {
    console.error('❌ [DATA PRELOAD] Error preloading data:', error);
  }
}
