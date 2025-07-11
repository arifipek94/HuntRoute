import { validateDate } from '@/lib/validation';
import { BACKEND_URL } from '@/lib/constants';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache configuration
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const CACHE_REFRESH_HOURS = 24;
const CACHE_DELETE_HOURS = 48;
const CACHE_DIR = path.join(process.cwd(), 'cache');
const cacheMap = new Map();

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    if (!to) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      );
    }

    if (!date || !validateDate(date)) {
      return NextResponse.json(
        { error: 'Valid date is required' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `${to}-${date}`;

    // Check memory cache first
    const cachedData = cacheMap.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
      console.log(`Cache hit for ${cacheKey}`);
      return NextResponse.json(cachedData.data);
    }

    // Fetch from backend
    const backendUrl = `${BACKEND_URL}/api/flights?to=${to}&date=${date}`;
    console.log(`Fetching from backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format backend response for frontend compatibility
    const formatted = {
      success: true,
      data: data.flights ?? [],
      meta: data.meta ?? {},
    };

    // Update memory cache
    cacheMap.set(cacheKey, {
      timestamp: Date.now(),
      data: formatted,
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'clear-cache') {
    cacheMap.clear();
    return NextResponse.json({
      success: true,
      message: 'Memory cache cleared',
      timestamp: Date.now(),
    });
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
          age_in_hours: ageInHours,
          valid: ageInHours < CACHE_REFRESH_HOURS,
          expires_in_hours: CACHE_REFRESH_HOURS - ageInHours,
        };
      });

      return NextResponse.json({
        success: true,
        cache_info: {
          memory: {
            type: 'memory',
            entries: cacheMap.size,
            max_age: CACHE_DURATION / 1000,
            keys: Array.from(cacheMap.keys()),
          },
          file_system: {
            cache_files: status,
            total_files: cacheFiles.length,
            cache_settings: {
              refresh_hours: CACHE_REFRESH_HOURS,
              delete_hours: CACHE_DELETE_HOURS,
            },
          },
          timestamp: Date.now(),
        },
      });
    } catch (_error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get cache status',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
