import { validateDate } from '@/lib/validation';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

// Type definitions for flight data
interface FlightSegment {
  carrierCode?: string;
  number?: string;
  departure?: {
    iataCode?: string;
    at?: string;
  };
  arrival?: {
    iataCode?: string;
    at?: string;
  };
  aircraft?: {
    code?: string;
  };
}

interface RawFlightData {
  id?: string;
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  from?: string;
  to?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  stops?: number;
  price?: number | string;
  currency?: string;
  aircraft?: string;
  availableSeats?: number;
  segments?: FlightSegment[];
  departure_airport?: string;
  arrival_airport?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departure_time?: string;
  arrival_time?: string;
  departureTime?: string;
  arrivalTime?: string;
  cabin_class?: string;
  cabinClass?: string;
  class?: string;
  [key: string]: unknown;
}

interface StandardizedFlight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration?: string;
  stops: number;
  price: number;
  currency: string;
  aircraft?: string;
  availableSeats?: number;
  cabinClass?: string;
}

export const dynamic = 'force-dynamic';

const CACHE_DIR = path.join(
  process.cwd(),
  '..',
  'globe-fare-adaptive',
  'cache'
);
const CACHE_REFRESH_HOURS = 12; // Refresh every 12 hours (twice a day)
const CACHE_DELETE_HOURS = 24; // Delete files older than 24 hours

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Generate cache filename for specific destination and date
function getCacheFileName(destination: string, date: string): string {
  return `flight-cache-${destination}-${date}.json`;
}

// Check if cache file exists and is still valid (within 12 hours)
function isCacheValid(to: string, date: string): boolean {
  const cacheFile = path.join(
    CACHE_DIR,
    `flight-cache-${to.toUpperCase()}-${date}.json`
  );

  if (!fs.existsSync(cacheFile)) {
    console.log(
      `ℹ️ [CACHE VALIDATION] No cache file exists for ${to} on ${date}`
    );
    return false;
  }

  try {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    const now = Date.now();
    const cacheAge = (now - cacheData.timestamp) / (1000 * 60 * 60); // hours

    // CRITICAL: If we have 15+ results, cache is valid for 12 hours
    const hasEnoughResults =
      cacheData.flights && cacheData.flights.length >= 15;
    const cacheExpiryHours = hasEnoughResults ? 12 : 2; // 12 hours if 15+ results, 2 hours otherwise

    const isValid = cacheAge < cacheExpiryHours;

    console.log(`ℹ️ [CACHE VALIDATION] ${to} on ${date}:`);
    console.log(`   - Cache age: ${cacheAge.toFixed(2)} hours`);
    console.log(`   - Flight count: ${cacheData.flights?.length || 0}`);
    console.log(`   - Required for 12h cache: 15+ flights`);
    console.log(`   - Expiry threshold: ${cacheExpiryHours} hours`);
    console.log(`   - Cache status: ${isValid ? 'VALID' : 'EXPIRED'}`);

    if (hasEnoughResults && isValid) {
      console.log(
        `✅ [CACHE LOCK] ${to} has ${cacheData.flights.length} flights - LOCKED for 12 hours`
      );
    }

    return isValid;
  } catch (error) {
    console.error(
      `❌ [CACHE VALIDATION] Error reading cache for ${to} on ${date}:`,
      error
    );
    return false;
  }
}

// Standardize flight data format from different sources
function standardizeFlightData(
  rawFlight: RawFlightData,
  source: string = 'api'
): StandardizedFlight {
  // Handle different data structures from various sources
  let standardized: Partial<StandardizedFlight> = {};

  if (source === 'cache' && rawFlight.segments) {
    // Handle cached Amadeus-style data
    const segments = rawFlight.segments as FlightSegment[];
    standardized = {
      id:
        rawFlight.id ||
        `${rawFlight.airline || segments[0]?.carrierCode}-${rawFlight.flightNumber || segments[0]?.number}-${Date.now()}`,
      airline: rawFlight.airline || segments[0]?.carrierCode || '',
      airlineCode: rawFlight.airline || segments[0]?.carrierCode || '',
      flightNumber:
        rawFlight.flightNumber ||
        `${segments[0]?.carrierCode || ''}${segments[0]?.number || ''}`,
      from: rawFlight.from || segments[0]?.departure?.iataCode || '',
      to:
        rawFlight.to || segments[segments.length - 1]?.arrival?.iataCode || '',
      departure: rawFlight.departure || segments[0]?.departure?.at || '',
      arrival:
        rawFlight.arrival || segments[segments.length - 1]?.arrival?.at || '',
      duration: rawFlight.duration as string | undefined,
      stops: rawFlight.stops ?? segments.length - 1,
      price: Number(rawFlight.price) || 0,
      currency: rawFlight.currency || 'EUR',
      aircraft:
        (rawFlight.aircraft as string | undefined) ||
        segments[0]?.aircraft?.code,
      availableSeats: rawFlight.availableSeats as number | undefined,
    };
  } else {
    // Handle direct API response or already standardized data
    standardized = {
      id:
        rawFlight.id ||
        `flight-${rawFlight.airline || rawFlight.airlineCode}-${rawFlight.flightNumber}-${Date.now()}`,
      airline: ((rawFlight.airline || rawFlight.airlineCode) as string) || '',
      airlineCode:
        ((rawFlight.airlineCode || rawFlight.airline) as string) || '',
      flightNumber: (rawFlight.flightNumber as string) || '',
      from:
        ((rawFlight.from ||
          rawFlight.departure_airport ||
          rawFlight.departureAirport) as string) || '',
      to:
        ((rawFlight.to ||
          rawFlight.arrival_airport ||
          rawFlight.arrivalAirport) as string) || '',
      departure:
        ((rawFlight.departure ||
          rawFlight.departure_time ||
          rawFlight.departureTime) as string) || '',
      arrival:
        ((rawFlight.arrival ||
          rawFlight.arrival_time ||
          rawFlight.arrivalTime) as string) || '',
      duration: (rawFlight.duration ||
        rawFlight.flight_duration ||
        rawFlight.flightDuration) as string | undefined,
      stops:
        ((rawFlight.stops ||
          rawFlight.number_of_stops ||
          rawFlight.numberOfStops) as number) || 0,
      price: Number(
        rawFlight.price || rawFlight.total_price || rawFlight.totalPrice || 0
      ),
      currency: (rawFlight.currency as string) || 'USD',
      aircraft: (rawFlight.aircraft ||
        rawFlight.airplane ||
        rawFlight.aircraftType) as string | undefined,
      availableSeats: (rawFlight.availableSeats ||
        rawFlight.available_seats ||
        rawFlight.seatsAvailable) as number | undefined,
    };
  }

  // Validate required fields and provide defaults
  const finalStandardized: StandardizedFlight = {
    id:
      standardized.id ||
      `flight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    airline: standardized.airline || 'Unknown Airline',
    airlineCode: standardized.airlineCode || 'XX',
    flightNumber:
      standardized.flightNumber || `${standardized.airlineCode || 'XX'}000`,
    from: standardized.from || '',
    to: standardized.to || '',
    departure: standardized.departure || '',
    arrival: standardized.arrival || '',
    duration: standardized.duration,
    stops: typeof standardized.stops === 'number' ? standardized.stops : 0,
    price: standardized.price || 0,
    currency: standardized.currency || 'USD',
    aircraft: standardized.aircraft,
    availableSeats: standardized.availableSeats,
  };

  return finalStandardized;
}

// Enhanced flight data processing with consistent formatting
function processFlightData(
  flights: RawFlightData[],
  source: string = 'api'
): StandardizedFlight[] {
  if (!Array.isArray(flights)) {
    console.warn('[DATA PROCESSING] Expected array, got:', typeof flights);
    return [];
  }

  return flights
    .map((flight, index) => {
      try {
        const standardized = standardizeFlightData(flight, source);
        return standardized;
      } catch (error) {
        console.error(
          `[DATA PROCESSING] Error processing flight ${index}:`,
          error,
          flight
        );
        return null;
      }
    })
    .filter((flight): flight is StandardizedFlight => flight !== null);
}

// Read cache data for specific destination and date
function readCache(
  to: string,
  date: string
): { flights: StandardizedFlight[]; meta: Record<string, unknown> } | null {
  const cacheFile = path.join(
    CACHE_DIR,
    `flight-cache-${to.toUpperCase()}-${date}.json`
  );

  if (!fs.existsSync(cacheFile)) {
    console.log(`ℹ️ [CACHE READ] No cache file for ${to} on ${date}`);
    return null;
  }

  try {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    const flightCount = cacheData.flights?.length || 0;

    console.log(
      `✅ [CACHE READ] Found ${flightCount} flights for ${to} on ${date}`
    );

    return {
      flights: cacheData.flights || [],
      meta: {
        cache_updated_at: cacheData.cached_at || cacheData.last_refresh,
        timestamp: cacheData.timestamp,
        source: cacheData.source || 'cache',
        flight_count: flightCount,
      },
    };
  } catch (error) {
    console.error(
      `❌ [CACHE READ] Error reading cache for ${to} on ${date}:`,
      error
    );
    return null;
  }
}

// Save flights to cache with standardized format
function saveToCache(
  destination: string,
  date: string,
  flights: StandardizedFlight[]
): void {
  try {
    ensureCacheDir();

    const fileName = getCacheFileName(destination, date);
    const filePath = path.join(CACHE_DIR, fileName);

    const cacheData = {
      destination,
      date,
      flights: flights, // flights are already standardized
      timestamp: Date.now(),
      cached_at: new Date().toISOString(),
      expires_at: new Date(
        Date.now() + CACHE_REFRESH_HOURS * 60 * 60 * 1000
      ).toISOString(),
      format_version: '1.0',
      total_flights: flights.length,
    };

    fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
    console.log(
      `[CACHE SAVE] Saved ${flights.length} standardized flights for ${destination} on ${date}`
    );
  } catch (error) {
    console.error('[CACHE SAVE] Error saving to cache:', error);
  }
}

// Clean up old cache files (older than 24 hours)
function cleanupOldCache(): void {
  try {
    ensureCacheDir();

    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (file.startsWith('flight-cache-') && file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);

        try {
          const stat = fs.statSync(filePath);
          const ageInHours = (now - stat.mtime.getTime()) / (1000 * 60 * 60);

          if (ageInHours > CACHE_DELETE_HOURS) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(
              `🧹 [CACHE CLEANUP] Deleted old cache file: ${file} (${ageInHours.toFixed(1)}h old)`
            );
          }
        } catch (fileError: any) {
          console.warn(
            `⚠️ [CACHE CLEANUP] Error processing file ${file}:`,
            fileError.message
          );
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 [CACHE CLEANUP] Deleted ${deletedCount} old cache files`);
    }
  } catch (error: any) {
    console.error(`❌ [CACHE CLEANUP] Error during cleanup:`, error.message);
  }
}

// Fetch flights from your backend API with enhanced error handling
async function fetchFlightsFromBackend(
  destination: string,
  date: string,
  requestId: string = 'unknown'
): Promise<StandardizedFlight[]> {
  try {
    // Enhanced backend URL detection and validation
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:5000';
    console.log(`🔗 [REQUEST:${requestId}] Using backend URL: ${backendUrl}`);

    const apiUrl = `${backendUrl}/api/flights?to=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;

    console.log(
      `🌐 [REQUEST:${requestId}] Fetching flights from backend: ${apiUrl}`
    );
    console.log(
      `📋 [REQUEST:${requestId}] Request params - Destination: ${destination}, Date: ${date}`
    );

    // Enhanced health check with more details
    try {
      console.log(
        `🏥 [REQUEST:${requestId}] Performing health check on backend...`
      );
      const healthCheck = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: 'application/json',
        },
      });

      if (!healthCheck.ok) {
        const healthText = await healthCheck
          .text()
          .catch(() => 'No response body');
        console.log(
          `❌ [REQUEST:${requestId}] Health check failed: ${healthCheck.status} - ${healthText}`
        );
        throw new Error(
          `Backend health check failed: ${healthCheck.status} - ${healthText}`
        );
      }

      const healthData = await healthCheck
        .json()
        .catch(() => ({ status: 'unknown' }));
      console.log(
        `✅ [REQUEST:${requestId}] Backend health check passed:`,
        healthData
      );
    } catch (healthError: any) {
      console.log(
        `❌ [REQUEST:${requestId}] Backend health check error:`,
        healthError.message
      );
      throw new Error(
        `Backend not available: ${healthError.message}. Make sure the backend is running on ${backendUrl}`
      );
    }

    // Make the actual flight request with enhanced logging
    console.log(`📡 [REQUEST:${requestId}] Making flight data request...`);
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Globe-Fare-Frontend/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    });

    console.log(
      `📊 [REQUEST:${requestId}] Response status: ${response.status} ${response.statusText}`
    );
    console.log(
      `📊 [REQUEST:${requestId}] Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'Unable to read error response');
      console.log(
        `❌ [REQUEST:${requestId}] Backend API error response:`,
        errorText
      );
      throw new Error(
        `Backend API returned ${response.status}: ${response.statusText}. Response: ${errorText}`
      );
    }

    const backendData = await response.json();
    console.log(`📦 [REQUEST:${requestId}] Raw backend response structure:`, {
      hasSuccess: 'success' in backendData,
      successValue: backendData.success,
      hasFlights: 'flights' in backendData,
      hasData: 'data' in backendData,
      hasResults: 'results' in backendData,
      hasError: 'error' in backendData,
      hasMessage: 'message' in backendData,
      isArray: Array.isArray(backendData),
      flightsLength: backendData.flights?.length,
      dataLength: backendData.data?.length,
      resultsLength: backendData.results?.length,
      topLevelKeys: Object.keys(backendData),
      sampleFlightKeys: backendData.flights?.[0]
        ? Object.keys(backendData.flights[0])
        : 'no flights',
      errorMessage: backendData.error,
      responseMessage: backendData.message,
    });

    // Check if backend explicitly says no data found
    if (backendData.success === false && backendData.message) {
      console.log(
        `⚠️ [REQUEST:${requestId}] Backend reports no data: ${backendData.message}`
      );
      if (
        backendData.message.includes('No data') ||
        backendData.message.includes('not found')
      ) {
        // This is a valid "no results" response, not an error
        return [];
      }
    }

    // Enhanced flight extraction with multiple fallback strategies
    let rawFlights = [];

    if (
      backendData.success &&
      backendData.flights &&
      Array.isArray(backendData.flights)
    ) {
      rawFlights = backendData.flights;
      console.log(
        `✅ [REQUEST:${requestId}] Using backendData.flights (${rawFlights.length} flights)`
      );
    } else if (
      backendData.success &&
      backendData.data &&
      Array.isArray(backendData.data)
    ) {
      rawFlights = backendData.data;
      console.log(
        `✅ [REQUEST:${requestId}] Using backendData.data (${rawFlights.length} flights)`
      );
    } else if (
      backendData.success &&
      backendData.results &&
      Array.isArray(backendData.results)
    ) {
      rawFlights = backendData.results;
      console.log(
        `✅ [REQUEST:${requestId}] Using backendData.results (${rawFlights.length} flights)`
      );
    } else if (Array.isArray(backendData)) {
      rawFlights = backendData;
      console.log(
        `✅ [REQUEST:${requestId}] Using direct array response (${rawFlights.length} flights)`
      );
    } else if (backendData.flights && Array.isArray(backendData.flights)) {
      rawFlights = backendData.flights;
      console.log(
        `✅ [REQUEST:${requestId}] Using backendData.flights without success check (${rawFlights.length} flights)`
      );
    } else if (backendData.data && Array.isArray(backendData.data)) {
      rawFlights = backendData.data;
      console.log(
        `✅ [REQUEST:${requestId}] Using backendData.data without success check (${rawFlights.length} flights)`
      );
    } else {
      console.log(
        `❌ [REQUEST:${requestId}] No valid flight data found in response`
      );
      console.log(
        `📦 [REQUEST:${requestId}] Full response:`,
        JSON.stringify(backendData, null, 2)
      );

      // Check if this is a "no results found" vs actual error
      if (backendData.success !== false && !backendData.error) {
        console.log(
          `ℹ️ [REQUEST:${requestId}] Treating as valid "no results" response`
        );
        return [];
      }

      // Log specific backend error if available
      if (backendData.error) {
        console.log(
          `❌ [REQUEST:${requestId}] Backend error: ${backendData.error}`
        );
        throw new Error(`Backend error: ${backendData.error}`);
      }

      return [];
    }

    // Log sample flight for debugging
    if (rawFlights.length > 0) {
      console.log(
        `🛩️ [REQUEST:${requestId}] Sample flight data:`,
        JSON.stringify(rawFlights[0], null, 2)
      );
    } else {
      console.log(
        `ℹ️ [REQUEST:${requestId}] Backend returned valid response but no flights available for ${destination} on ${date}`
      );
    }

    // Process and standardize the flight data
    const processedFlights = processFlightData(rawFlights, 'api');

    console.log(
      `✅ [REQUEST:${requestId}] Successfully processed ${processedFlights.length} flights from backend`
    );
    return processedFlights;
  } catch (error: any) {
    console.error(`❌ [REQUEST:${requestId}] Complete error details:`, {
      destination,
      date,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCause: error.cause,
    });

    // Only trigger refresh if backend is reachable but returned no data
    if (
      !error.message.includes('Backend not available') &&
      !error.message.includes('ECONNREFUSED')
    ) {
      try {
        const backendUrl =
          process.env.BACKEND_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          'http://localhost:5000';
        const refreshUrl = `${backendUrl}/api/refresh?to=${destination}&date=${date}`;

        console.log(
          `🔄 [REQUEST:${requestId}] Requesting cache refresh: ${refreshUrl}`
        );

        const refreshResponse = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Globe-Fare-Frontend/1.0',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse
            .json()
            .catch(() => ({ status: 'unknown' }));
          console.log(
            `✅ [REQUEST:${requestId}] Cache refresh completed:`,
            refreshData
          );
        } else {
          const refreshError = await refreshResponse
            .text()
            .catch(() => 'Unknown error');
          console.warn(
            `⚠️ [REQUEST:${requestId}] Backend refresh failed with status ${refreshResponse.status}: ${refreshError}`
          );
        }
      } catch (refreshError: any) {
        console.warn(
          `⚠️ [REQUEST:${requestId}] Could not trigger refresh: ${refreshError.message}`
        );
      }
    }

    throw error;
  }
}

// Simple pass-through format function to replace the removed flightFormatter
// This function can be enhanced later if any formatting is actually needed
async function formatFlightData(
  flights: StandardizedFlight[]
): Promise<StandardizedFlight[]> {
  if (!Array.isArray(flights)) {
    console.warn(
      '[API] formatFlightData: Expected array, got:',
      typeof flights
    );
    return [];
  }

  // Just pass through the already processed flights
  return flights;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to');
  const date = searchParams.get('date');
  const requestId = `${to}-${date}-${Date.now().toString(36).substring(0, 8)}`;

  console.log(`🔍 [REQUEST:${requestId}] FLIGHT SEARCH REQUEST`);
  console.log(`🔍 [REQUEST:${requestId}] Destination: ${to}, Date: ${date}`);

  // Validate required parameters
  if (!to || !date) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters: to and date',
        data: [],
        meta: {
          destination: to || 'unknown',
          date: date || 'unknown',
          count: 0,
          source: 'validation-error',
        },
      },
      { status: 400 }
    );
  }

  const dateValidation = validateDate(date);
  if (!dateValidation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid date',
        details: dateValidation.errors,
        data: [],
        meta: {
          destination: to,
          date: date,
          count: 0,
          source: 'validation-error',
        },
      },
      { status: 400 }
    );
  }

  try {
    // STEP 1: STRICT CACHE CHECK - NO API CALLS IF 15+ RESULTS EXIST
    console.log(
      `📋 [REQUEST:${requestId}] STEP 1: Checking cache protection...`
    );

    if (isCacheValid(to, date)) {
      const cacheResult = readCache(to, date);

      if (cacheResult && cacheResult.flights.length > 0) {
        console.log(
          `✅ [REQUEST:${requestId}] CACHE SERVED: ${cacheResult.flights.length} flights`
        );

        // Format flights for display
        const formattedFlights = await formatFlightData(cacheResult.flights);

        return NextResponse.json({
          success: true,
          data: formattedFlights,
          meta: {
            destination: to,
            date: date,
            count: formattedFlights.length,
            source: 'protected-cache',
            cache_protected: cacheResult.flights.length >= 15,
            cache_updated_at: cacheResult.meta.cache_updated_at,
            timestamp: cacheResult.meta.timestamp,
            request_id: requestId,
            message:
              cacheResult.flights.length >= 15
                ? `Cache locked with ${cacheResult.flights.length} flights - no API calls for 12 hours`
                : `Using recent cache data`,
          },
        });
      }
    }

    // STEP 2: ONLY IF NO SUFFICIENT CACHE - TRIGGER BACKEND SEARCH
    console.log(
      `❌ [REQUEST:${requestId}] INSUFFICIENT CACHE: Checking backend...`
    );

    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:5000';

    try {
      // Try to get fresh data from backend
      const freshFlights = await fetchFlightsFromBackend(to, date, requestId);

      if (freshFlights && freshFlights.length > 0) {
        console.log(
          `✅ [REQUEST:${requestId}] BACKEND SUCCESS: ${freshFlights.length} flights`
        );

        // Save to cache with protection
        saveToCache(to, date, freshFlights);

        const formattedFlights = await formatFlightData(freshFlights);

        return NextResponse.json({
          success: true,
          data: formattedFlights,
          meta: {
            destination: to,
            date: date,
            count: formattedFlights.length,
            source: 'fresh-backend',
            cache_will_be_protected: formattedFlights.length >= 15,
            request_id: requestId,
            message:
              formattedFlights.length >= 15
                ? `Found ${formattedFlights.length} flights - cache will be protected for 12 hours`
                : `Found ${formattedFlights.length} flights - will retry sooner`,
          },
        });
      }
    } catch (apiError) {
      console.error(
        `❌ [REQUEST:${requestId}] Backend API failed:`,
        apiError instanceof Error ? apiError.message : 'Unknown error'
      );
    }

    // STEP 3: FALLBACK TO ANY EXISTING CACHE
    console.log(
      `🔄 [REQUEST:${requestId}] FALLBACK: Checking for any existing data...`
    );
    const fallbackResult = readCache(to, date);
    if (fallbackResult && fallbackResult.flights.length > 0) {
      console.log(
        `⚠️ [REQUEST:${requestId}] STALE CACHE FALLBACK: ${fallbackResult.flights.length} flights`
      );

      const formattedFlights = await formatFlightData(fallbackResult.flights);

      return NextResponse.json({
        success: true,
        data: formattedFlights,
        meta: {
          destination: to,
          date: date,
          count: formattedFlights.length,
          source: 'stale-fallback',
          cache_updated_at: fallbackResult.meta.cache_updated_at,
          timestamp: fallbackResult.meta.timestamp,
          warning: 'Using older data - backend refresh in progress',
          request_id: requestId,
        },
      });
    }

    // STEP 4: NO DATA AVAILABLE
    console.log(`❌ [REQUEST:${requestId}] NO DATA AVAILABLE`);

    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        destination: to,
        date: date,
        count: 0,
        source: 'no-data',
        message: 'No flights available. Backend search initiated.',
        request_id: requestId,
      },
    });
  } catch (error) {
    console.error(
      `❌ [REQUEST:${requestId}] SYSTEM ERROR:`,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'System error during flight search',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        meta: {
          destination: to,
          date: date,
          count: 0,
          source: 'error',
          request_id: requestId,
        },
      },
      { status: 500 }
    );
  }
}

// Optional: Add cache status endpoint for debugging
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'clear-cache') {
    try {
      ensureCacheDir();
      const files = fs.readdirSync(CACHE_DIR);
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('flight-cache-') && file.endsWith('.json')) {
          fs.unlinkSync(path.join(CACHE_DIR, file));
          deletedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedCount} cache files`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to clear cache',
        },
        { status: 500 }
      );
    }
  }

  if (action === 'cache-status') {
    try {
      ensureCacheDir();
      const files = fs.readdirSync(CACHE_DIR);
      const cacheFiles = files.filter(
        f => f.startsWith('flight-cache-') && f.endsWith('.json')
      );

      const status = cacheFiles.map(file => {
        const stat = fs.statSync(path.join(CACHE_DIR, file));
        const ageInHours =
          (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);

        return {
          file,
          age_hours: ageInHours,
          valid: ageInHours < CACHE_REFRESH_HOURS,
          expires_in_hours: CACHE_REFRESH_HOURS - ageInHours,
        };
      });

      return NextResponse.json({
        success: true,
        cache_files: status,
        total_files: cacheFiles.length,
        cache_settings: {
          refresh_hours: CACHE_REFRESH_HOURS,
          delete_hours: CACHE_DELETE_HOURS,
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get cache status',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      error: 'Invalid action',
    },
    { status: 400 }
  );
}
