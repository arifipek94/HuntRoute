const { fetchFlight } = require('../services/flightFetcher');
const { saveToCache } = require('../utils/cacheLayer');
const fs = require('fs');
const path = require('path');

// Import our safe cache helpers
const cacheHelpers = require('../utils/cacheHelpers');

// Constants for cache management
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const MAX_CONCURRENT_REQUESTS = 3; // Reduced for API stability
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RESULTS_PER_DESTINATION = 15; // Back to 15 due to API limitations

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Enhanced logging with timestamps
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

// Process flight data to match frontend expectations
function standardizeFlightData(flightData, fromPivot, destination) {
  if (!flightData || !flightData.data || !Array.isArray(flightData.data)) {
    return null;
  }

  return flightData.data.map(flight => {
    const segments = flight.itineraries?.[0]?.segments || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    return {
      id: `${flight.id || 'flight'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      airline: firstSegment?.carrierCode || 'XX',
      airlineCode: firstSegment?.carrierCode || 'XX',
      flightNumber: `${firstSegment?.carrierCode || 'XX'}${firstSegment?.number || '000'}`,
      from: firstSegment?.departure?.iataCode || fromPivot,
      to: lastSegment?.arrival?.iataCode || destination,
      departure: firstSegment?.departure?.at || '',
      arrival: lastSegment?.arrival?.at || '',
      duration: flight.itineraries?.[0]?.duration || 'N/A',
      stops: Math.max(0, segments.length - 1),
      price: Number(flight.price?.total || 0),
      currency: flight.price?.currency || 'EUR',
      aircraft: firstSegment?.aircraft?.code || '',
      availableSeats: Math.floor(Math.random() * 50) + 10, // Mock data
      segments: segments,
      // Add metadata for tracking
      _metadata: {
        source: 'amadeus-api',
        pivot: fromPivot,
        fetched_at: new Date().toISOString(),
        original_id: flight.id
      }
    };
  });
}

// Save standardized data to cache with proper structure
function saveStandardizedToCache(fromPivot, destination, date, standardizedFlights) {
  try {
    ensureCacheDir();
    
    const fileName = `flight-cache-${destination}-${date}.json`;
    const filePath = path.join(CACHE_DIR, fileName);
    
    // Read existing cache if it exists
    let existingData = { flights: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (error) {
        log('warn', `Failed to read existing cache file ${fileName}`, error.message);
      }
    }
    
    // Merge with existing flights (avoid duplicates)
    const existingFlights = existingData.flights || [];
    const existingIds = new Set(existingFlights.map(f => f.id));
    const newFlights = standardizedFlights.filter(f => !existingIds.has(f.id));
    
    const allFlights = [...existingFlights, ...newFlights];
    
    // Sort by price and limit to MAX_RESULTS_PER_DESTINATION
    allFlights.sort((a, b) => (a.price || 0) - (b.price || 0));
    const limitedFlights = allFlights.slice(0, MAX_RESULTS_PER_DESTINATION);
    
    const cacheData = {
      destination,
      date,
      flights: limitedFlights,
      timestamp: Date.now(),
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
      format_version: '1.0',
      total_flights: limitedFlights.length,
      total_found: allFlights.length,
      pivots_processed: [...new Set([
        ...(existingData.pivots_processed || []),
        fromPivot
      ])],
      last_refresh: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
    log('info', `Saved ${newFlights.length} new flights to cache (${limitedFlights.length} total, ${allFlights.length} found)`, {
      destination,
      date,
      pivot: fromPivot,
      fileName
    });
    
    return true;
  } catch (error) {
    log('error', 'Failed to save to cache', {
      error: error.message,
      destination,
      date,
      pivot: fromPivot
    });
    return false;
  }
}

// Smart cache protection - prevents unnecessary API calls
function isCacheProtected(destination, date) {
  try {
    const fileName = `flight-cache-${destination}-${date}.json`;
    const filePath = path.join(CACHE_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return { protected: false, reason: 'no_cache' };
    }
    
    const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const flightCount = cacheData.flights?.length || 0;
    const cacheAge = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60); // hours
    
    // PROTECTION RULE: 15+ flights = 12 hour protection
    const hasEnoughFlights = flightCount >= 15;
    const withinProtectionPeriod = cacheAge < 12;
    const isProtected = hasEnoughFlights && withinProtectionPeriod;
    
    log('info', `Cache protection check for ${destination}`, {
      flight_count: flightCount,
      cache_age_hours: cacheAge.toFixed(2),
      has_enough_flights: hasEnoughFlights,
      within_protection: withinProtectionPeriod,
      is_protected: isProtected
    });
    
    if (isProtected) {
      return {
        protected: true,
        reason: 'sufficient_data',
        flight_count: flightCount,
        cache_age_hours: cacheAge.toFixed(2),
        expires_in_hours: (12 - cacheAge).toFixed(2)
      };
    }
    
    return {
      protected: false,
      reason: hasEnoughFlights ? 'cache_expired' : 'insufficient_data',
      flight_count: flightCount,
      cache_age_hours: cacheAge.toFixed(2)
    };
    
  } catch (error) {
    log('error', `Error checking cache protection for ${destination}`, error.message);
    return { protected: false, reason: 'error' };
  }
}

// Process a single pivot with enhanced error handling
async function processPivot(pivot, destination, date) {
  const startTime = Date.now();
  
  try {
    log('info', `Processing pivot ${pivot.iata} -> ${destination}`, {
      pivot: pivot.iata,
      destination,
      date
    });
    
    const response = await Promise.race([
      fetchFlight(pivot.iata, destination, date, 1, 5),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response || !response.data || response.data.length === 0) {
      log('warn', `No flights found for pivot ${pivot.iata}`, {
        pivot: pivot.iata,
        destination,
        response: response ? 'empty' : 'null'
      });
      return { success: false, pivot: pivot.iata, reason: 'no_flights' };
    }
    
    // Standardize flight data for frontend compatibility
    const standardizedFlights = standardizeFlightData(response, pivot.iata, destination);
    
    if (!standardizedFlights || standardizedFlights.length === 0) {
      log('warn', `Failed to standardize flights for pivot ${pivot.iata}`);
      return { success: false, pivot: pivot.iata, reason: 'standardization_failed' };
    }
    
    // Save to both old cache (for backward compatibility) and new cache (for frontend)
    let oldCacheSaved = false;
    try {
      oldCacheSaved = saveToCache(pivot.iata, destination, date, response);
    } catch (cacheError) {
      log('warn', `Original cache save failed, using fallback`, {
        pivot: pivot.iata,
        error: cacheError.message
      });
      
      // If original save fails, try with our safe implementation
      try {
        // Create a simple version of the cache data
        const simpleCacheData = {
          data: response.data,
          timestamp: Date.now(),
          __source: 'safe-fallback',
          __timestamp: new Date().toISOString()
        };
        
        // Write to cache using fs directly to avoid dependencies
        const cacheFileName = `flight-${pivot.iata}-${destination}-${date}.json`;
        const cacheFilePath = path.join(CACHE_DIR, cacheFileName);
        fs.writeFileSync(cacheFilePath, JSON.stringify(simpleCacheData, null, 2));
        
        log('info', `Fallback cache save successful`, {
          pivot: pivot.iata,
          cacheFile: cacheFileName
        });
        
        oldCacheSaved = true;
      } catch (fallbackError) {
        log('error', `Both cache saves failed`, {
          pivot: pivot.iata,
          original_error: cacheError.message,
          fallback_error: fallbackError.message
        });
      }
    }
    
    // Save to new standardized cache
    const newCacheSaved = saveStandardizedToCache(pivot.iata, destination, date, standardizedFlights);
    
    const duration = Date.now() - startTime;
    log('info', `Successfully processed pivot ${pivot.iata}`, {
      pivot: pivot.iata,
      flights_count: standardizedFlights.length,
      duration_ms: duration,
      old_cache: oldCacheSaved,
      new_cache: newCacheSaved
    });
    
    return {
      success: true,
      pivot: pivot.iata,
      flights_count: standardizedFlights.length,
      duration_ms: duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log('error', `Failed to process pivot ${pivot.iata}`, {
      pivot: pivot.iata,
      error: error.message,
      duration_ms: duration
    });
    
    return {
      success: false,
      pivot: pivot.iata,
      reason: 'api_error',
      error: error.message,
      duration_ms: duration
    };
  }
}

// Enhanced refresh handler with strict cache protection
module.exports = async function refreshHandler(req, res) {
  const startTime = Date.now();
  const { to, date } = req.query;
  
  // Enhanced request validation
  if (!to || !date) {
    log('warn', 'Missing required parameters', { to, date });
    return res.status(400).json({
      success: false,
      error: 'Missing to or date parameter',
      required: ['to', 'date'],
      received: { to: !!to, date: !!date }
    });
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    log('warn', 'Invalid date format', { date });
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Expected YYYY-MM-DD',
      received: date
    });
  }
  
  // Validate destination code
  if (!/^[A-Z]{3}$/.test(to.toUpperCase())) {
    log('warn', 'Invalid destination code', { to });
    return res.status(400).json({
      success: false,
      error: 'Invalid destination code. Expected 3-letter IATA code',
      received: to
    });
  }
  
  const destination = to.toUpperCase();
  
  log('info', 'Refresh request received', {
    destination,
    date,
    timestamp: new Date().toISOString()
  });
  
  // CRITICAL: Check cache protection FIRST
  const protectionStatus = isCacheProtected(destination, date);
  
  if (protectionStatus.protected) {
    log('info', `CACHE PROTECTED - Rejecting refresh request for ${destination}`, protectionStatus);
    
    return res.status(200).json({
      success: true,
      message: 'Cache is protected - no refresh needed',
      data: {
        destination,
        date,
        cache_protected: true,
        protection_reason: protectionStatus.reason,
        flight_count: protectionStatus.flight_count,
        cache_age_hours: protectionStatus.cache_age_hours,
        expires_in_hours: protectionStatus.expires_in_hours,
        next_allowed_refresh: new Date(Date.now() + (protectionStatus.expires_in_hours * 60 * 60 * 1000)).toISOString()
      }
    });
  }
  
  // Only proceed if cache is not protected
  log('info', `Cache not protected - proceeding with refresh for ${destination}`, protectionStatus);
  
  // Find pivot data
  const pivotsPath = path.join(__dirname, '../pivots', `pivots-${destination}.json`);
  if (!fs.existsSync(pivotsPath)) {
    log('error', 'No pivots file found', { 
      destination, 
      expected_path: pivotsPath 
    });
    return res.status(404).json({
      success: false,
      error: 'No pivots configuration found for this destination',
      destination,
      pivots_file: `pivots-${destination}.json`
    });
  }
  
  let pivotData;
  try {
    pivotData = JSON.parse(fs.readFileSync(pivotsPath, 'utf8'));
  } catch (error) {
    log('error', 'Failed to parse pivots file', {
      destination,
      error: error.message
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to read pivots configuration',
      details: error.message
    });
  }
  
  log('info', `Found ${pivotData.length} pivots for ${destination} - starting search`);
  
  // Process pivots with controlled concurrency (maximum efficiency)
  const results = [];
  const chunks = [];
  
  // Split pivots into chunks for concurrent processing
  for (let i = 0; i < pivotData.length; i += MAX_CONCURRENT_REQUESTS) {
    chunks.push(pivotData.slice(i, i + MAX_CONCURRENT_REQUESTS));
  }
  
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(pivot => processPivot(pivot, destination, date));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalFlights = successful.reduce((sum, r) => sum + (r.flights_count || 0), 0);
  const totalDuration = Date.now() - startTime;
  
  // Log summary with protection status
  log('info', 'Refresh completed', {
    destination,
    date,
    total_pivots: pivotData.length,
    successful_pivots: successful.length,
    failed_pivots: failed.length,
    total_flights: totalFlights,
    duration_ms: totalDuration,
    will_be_protected: totalFlights >= 15
  });
  
  // Success response with protection information
  return res.status(200).json({
    success: true,
    message: 'Cache refresh completed',
    data: {
      destination,
      date,
      total_pivots: pivotData.length,
      successful_pivots: successful.length,
      failed_pivots: failed.length,
      total_flights: totalFlights,
      duration_ms: totalDuration,
      cache_updated: true,
      cache_will_be_protected: totalFlights >= 15,
      protection_duration_hours: totalFlights >= 15 ? 12 : 2,
      next_allowed_refresh: new Date(Date.now() + ((totalFlights >= 15 ? 12 : 2) * 60 * 60 * 1000)).toISOString(),
      successful_results: successful.map(r => ({
        pivot: r.pivot,
        flights_count: r.flights_count,
        duration_ms: r.duration_ms
      }))
    }
  });
};
