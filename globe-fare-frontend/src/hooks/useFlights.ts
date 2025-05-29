import { prepareFlightsForDisplay } from '@/lib/dataUtils';
import { Flight } from '@/types/flight';
import { useQuery } from '@tanstack/react-query';

interface FlightParams {
  to: string;
  date: string;
  people?: number; // Add the missing people property
}

interface FlightResponse {
  success: boolean;
  data: Flight[];
  meta: {
    destination: string;
    date: string;
    count: number;
    source: 'cache' | 'api' | 'stale-cache' | 'error';
    cached?: boolean;
    fresh?: boolean;
    cache_updated_at?: string;
    timestamp?: number;
    warning?: string;
    message?: string;
  };
  error?: string;
}

// SINGLE request deduplication map
const activeRequests = new Map<string, Promise<FlightResponse>>();

async function fetchFlights({
  to,
  date,
}: FlightParams): Promise<FlightResponse> {
  const requestKey = `${to}-${date}`;

  // Check if there's already an active request for this exact search
  if (activeRequests.has(requestKey)) {
    console.log(`🔄 [DEDUP] Using existing request for ${requestKey}`);
    return activeRequests.get(requestKey)!;
  }

  const requestPromise = (async () => {
    try {
      console.log(
        `🔍 [AMADEUS API CALL] Searching flights TO: ${to}, DATE: ${date} - PURPOSE: Get 15 departure points`
      );

      const response = await fetch(`/api/flights?to=${to}&date=${date}`);

      if (!response.ok) {
        console.error(
          `❌ [AMADEUS API] Failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`HTTP ${response.status}: Failed to fetch flights`);
      }

      const result: FlightResponse = await response.json();

      if (!result.success) {
        console.error(`❌ [AMADEUS API] Backend error: ${result.error}`);
        throw new Error(result.error || 'Failed to fetch flights');
      }

      // 2. Convert raw data to readable format using dataUtils
      // This automatically loads airlines.json/airports.json and enriches the data
      const processedFlights = await prepareFlightsForDisplay(
        result.data || []
      );

      console.log(
        `✅ [AMADEUS API] Success: Found ${result.meta.count} flights from ${result.meta.source}`
      );
      return {
        ...result,
        data: processedFlights,
      };
    } finally {
      // Clean up the active request after a delay to prevent immediate duplicates
      setTimeout(() => {
        activeRequests.delete(requestKey);
      }, 1000);
    }
  })();

  // Store the promise to prevent duplicate requests
  activeRequests.set(requestKey, requestPromise);

  return requestPromise;
}

export function useFlights(params: FlightParams | null) {
  return useQuery({
    queryKey: ['flights', params?.to, params?.date, params?.people],
    queryFn: () => fetchFlights(params!),
    enabled: Boolean(
      params?.to && params?.date && typeof window !== 'undefined'
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false,
  });
}

// Export cache management functions for debugging
export async function clearFlightCache(): Promise<boolean> {
  try {
    const response = await fetch('/api/flights?action=clear-cache', {
      method: 'POST',
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

export async function getFlightCacheStatus(): Promise<any> {
  try {
    const response = await fetch('/api/flights?action=cache-status', {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return null;
  }
}
