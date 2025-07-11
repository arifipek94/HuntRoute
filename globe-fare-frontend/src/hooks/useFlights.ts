import { prepareFlightsForDisplay } from '@/lib/dataUtils';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Flight } from '@/types/flight';
import { useQuery } from '@tanstack/react-query';

interface FlightParams {
  destination: string;
  date: string;
  people?: number;
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

// Request deduplication map
const activeRequests = new Map<string, Promise<FlightResponse>>();

async function fetchFlights({
  destination,
  date,
  people,
}: FlightParams): Promise<FlightResponse> {
  const requestKey = `${destination}-${date}`;

  // Check if there's already an active request
  if (activeRequests.has(requestKey)) {
    console.log(`🔄 Using existing request for ${requestKey}`);
    return activeRequests.get(requestKey)!;
  }

  const requestPromise = (async () => {
    try {
      console.log(`🔍 Searching flights to ${destination} for ${date}`);

      const searchParams = new URLSearchParams({
        to: destination, // destination yerine to
        date,
        ...(people ? { people: people.toString() } : {}),
      });

      const response = await fetch(`${API_ENDPOINTS.FLIGHTS}?${searchParams}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      const processedData: FlightResponse = {
        success: true,
        data: await prepareFlightsForDisplay(data.data),
        meta: {
          destination,
          date,
          count: data.data.length,
          source: data.meta?.source || 'api',
          cached: data.meta?.cached,
          fresh: data.meta?.fresh,
          cache_updated_at: data.meta?.cache_updated_at,
          timestamp: Date.now(),
        },
      };

      return processedData;
    } catch (error) {
      const errorResponse: FlightResponse = {
        success: false,
        data: [],
        meta: {
          destination,
          date,
          count: 0,
          source: 'error',
          timestamp: Date.now(),
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
        error:
          error instanceof Error ? error.message : 'Failed to fetch flights',
      };
      return errorResponse;
    } finally {
      // Clean up the request from the map after a delay
      setTimeout(() => {
        activeRequests.delete(requestKey);
      }, 5000);
    }
  })();

  // Store the promise in the map
  activeRequests.set(requestKey, requestPromise);
  return requestPromise;
}

export function useFlights(params: FlightParams | null) {
  return useQuery({
    queryKey: params ? ['flights', params.destination, params.date] : [],
    queryFn: () => (params ? fetchFlights(params) : Promise.resolve(null)),
    enabled: !!params,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
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

export async function getFlightCacheStatus(): Promise<unknown> {
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
