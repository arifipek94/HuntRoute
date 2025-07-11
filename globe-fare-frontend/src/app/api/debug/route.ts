import { NextResponse } from 'next/server';

interface DebugTest {
  name: string;
  success: boolean;
  status?: number;
  statusText?: string;
  data?: unknown;
  error?: string;
  hasData?: boolean;
  dataStructure?: {
    hasSuccess: boolean;
    hasFlights: boolean;
    hasData: boolean;
    isArray: boolean;
    flightCount: number;
  } | null;
  sampleData?: unknown;
}

export async function GET(request: Request) {
  // Extract query parameters from the URL
  const { searchParams } = new URL(request.url);

  // Get 'to' parameter (destination) from URL, default to 'BKK' if not provided
  const to = searchParams.get('to') || 'BKK';

  // Get 'date' parameter from URL, default to '2025-09-01' if not provided
  const date = searchParams.get('date') || '2025-09-01';

  // Determine backend URL from environment variables with fallback
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://huntroute.onrender.com/';

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: process.env.BACKEND_URL,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      resolvedBackendUrl: backendUrl,
    },
    testParams: { to, date },
    tests: [] as DebugTest[],
  };

  // Test 1: Backend health check
  try {
    const healthResponse = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    debugInfo.tests.push({
      name: 'Backend Health Check',
      success: healthResponse.ok,
      status: healthResponse.status,
      statusText: healthResponse.statusText,
      data: await healthResponse.json().catch(() => null),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    debugInfo.tests.push({
      name: 'Backend Health Check',
      success: false,
      error: errorMessage,
    });
  }

  // Test 2: Flight API endpoint
  try {
    const flightResponse = await fetch(
      `${backendUrl}/api/flights?to=${to}&date=${date}`,
      {
        signal: AbortSignal.timeout(10000),
      }
    );

    const responseData = await flightResponse.json().catch(() => null);

    debugInfo.tests.push({
      name: 'Flight API Test',
      success: flightResponse.ok,
      status: flightResponse.status,
      statusText: flightResponse.statusText,
      hasData: !!responseData,
      dataStructure: responseData
        ? {
            hasSuccess: 'success' in responseData,
            hasFlights: 'flights' in responseData,
            hasData: 'data' in responseData,
            isArray: Array.isArray(responseData),
            flightCount:
              responseData.flights?.length ||
              responseData.data?.length ||
              (Array.isArray(responseData) ? responseData.length : 0),
          }
        : null,
      sampleData: responseData,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    debugInfo.tests.push({
      name: 'Flight API Test',
      success: false,
      error: errorMessage,
    });
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
