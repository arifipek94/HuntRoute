import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { fetchFlight } from "./services/flightFetcher.js";
import getAirlineName from "./utils/getAirlineName.js";
import getAirportName from "./utils/getAirportName.js";
import {
  loadFromCache,
  saveToCache,
  appendToFlightMemory,
  saveNoDataInfo,
  cleanOldCacheFiles,
} from "./utils/cacheLayer.js";
import printFlight from "./utils/printFlight.js";
import cacheHelpers from "./utils/cacheHelpers.js";

// ESM __dirname ve __filename tanımı
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure cache directories at startup
cacheHelpers.ensureDirectories();

// Enable CORS for frontend requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root route handler - this fixes the "Cannot GET /" error
app.get("/", (req, res) => {
  res.json({
    service: "Globe Fare Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      flights: "/api/flights?to=DESTINATION&date=YYYY-MM-DD",
      refresh: "/api/refresh?to=DESTINATION&date=YYYY-MM-DD",
      health: "/health",
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Import cache utilities if they exist, otherwise define locally
let cacheUtils;
try {
  cacheUtils = await import("./utils/cacheLayer.js");
} catch (error) {
  console.warn("[CACHE] Cache utilities not found, using local implementation");

  // Local cache implementation
  cacheUtils = {
    loadFromCache: function (from, to, date) {
      try {
        const CACHE_DIR = path.join(__dirname, "cache");

        if (from === "*") {
          // Load aggregated cache for destination
          const fileName = `flight-cache-${to}-${date}.json`;
          const filePath = path.join(CACHE_DIR, fileName);

          if (fs.existsSync(filePath)) {
            const cacheData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

            // Check if cache is expired (12 hours)
            const ageInMs = Date.now() - (cacheData.timestamp || 0);
            const ageInHours = ageInMs / (1000 * 60 * 60);

            if (ageInHours > 12) {
              console.log(
                `[CACHE] Aggregated cache expired for ${fileName} (${ageInHours.toFixed(1)}h old)`,
              );
              return null;
            }

            console.log(
              `[CACHE] Found aggregated cache with ${cacheData.flights?.length || 0} flights for ${to}`,
            );
            return cacheData;
          }
        }

        // Original single-route cache reading
        const fileName = `flight-${from}-${to}-${date}.json`;
        const filePath = path.join(CACHE_DIR, fileName);

        if (!fs.existsSync(filePath)) {
          return null;
        }

        const cacheData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Check if cache is expired (12 hours)
        const ageInMs = Date.now() - (cacheData.timestamp || 0);
        const ageInHours = ageInMs / (1000 * 60 * 60);

        if (ageInHours > 12) {
          console.log(
            `[CACHE] Cache expired for ${fileName} (${ageInHours.toFixed(1)}h old)`,
          );
          return null;
        }

        return cacheData;
      } catch (error) {
        console.error(`[CACHE] Failed to read cache:`, error);
        return null;
      }
    },
  };
}

// Add the missing flights endpoint that the frontend is calling
app.get("/api/flights", async (req, res) => {
  const { to, date } = req.query;
  const requestId = `${to}-${date}-${Date.now().toString(36)}`;

  console.log(`[FLIGHTS API][${requestId}] Request received:`, { to, date });

  if (!to || !date) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: to and date",
      flights: [],
      meta: { received_params: { to, date }, required_params: ["to", "date"] },
    });
  }

  try {
    // Check cache first
    const cached = cacheUtils.loadFromCache("*", to.toUpperCase(), date);
    if (cached && cached.flights && cached.flights.length > 0) {
      const cacheAge = cached.timestamp
        ? (Date.now() - cached.timestamp) / (1000 * 60 * 60)
        : 0;

      console.log(
        `[FLIGHTS API][${requestId}] ✅ CACHE HIT: Returning ${cached.flights.length} cached flights`,
      );

      // Add detailed logging for price verification
      console.log(`[PRICE DEBUG][${requestId}] Flight prices from cache:`);
      cached.flights.forEach((flight, index) => {
        console.log(
          `  ${index + 1}. ${flight.from} → ${flight.to}: $${flight.price} (${flight.airline})`,
        );
      });

      return res.json({
        success: true,
        flights: cached.flights,
        source: "cache",
        count: cached.flights.length,
        meta: {
          destination: to,
          date: date,
          cache_age_hours: cacheAge.toFixed(2),
          request_id: requestId,
          cached_at: cached.cached_at,
          original_search_time: cached.timestamp,
        },
      });
    }

    // No cache - trigger immediate refresh and return results
    console.log(
      `[FLIGHTS API][${requestId}] ❌ CACHE MISS: Triggering immediate search...`,
    );

    // Check if we have pivot data for this destination
    const pivotsPath = path.join(
      __dirname,
      "pivots",
      `pivots-${to.toUpperCase()}.json`,
    );
    if (!fs.existsSync(pivotsPath)) {
      console.log(`[FLIGHTS API][${requestId}] ❌ No pivots file for ${to}`);
      return res.json({
        success: true,
        flights: [],
        source: "no-pivots",
        message: `No flight data available for destination ${to}`,
        count: 0,
        meta: { destination: to, date: date, request_id: requestId },
      });
    }

    // Load pivots and search for flights
    const pivotData = JSON.parse(fs.readFileSync(pivotsPath, "utf8"));
    console.log(
      `[FLIGHTS API][${requestId}] Found ${pivotData.length} pivots, starting search...`,
    );

    // Log which pivots we're searching
    console.log(
      `[PIVOT DEBUG][${requestId}] Searching these pivots:`,
      pivotData
        .slice(0, 8)
        .map((p) => p.iata)
        .join(", "),
    );

    const searchPromises = [];
    const maxConcurrent = 5; // Reduced for API stability

    // Search ALL 20 pivots for maximum coverage
    for (let i = 0; i < Math.min(pivotData.length, 20); i++) {
      // Increased from 10 to 20
      const pivot = pivotData[i];
      const searchPromise = (async () => {
        try {
          console.log(
            `[FLIGHTS API][${requestId}] Searching ${pivot.iata} -> ${to}...`,
          );
          const response = await fetchFlight(
            pivot.iata,
            to.toUpperCase(),
            date,
            1,
          );

          if (response && response.data && response.data.length > 0) {
            // Take 2 flights per pivot to get good variety
            const processedFlights = response.data
              .slice(0, 2)
              .map((flight, flightIndex) => {
                const segments = flight.itineraries[0].segments;

                const processedFlight = {
                  id: `${flight.id || pivot.iata}-${to}-${Date.now()}-${i}-${flightIndex}-${Math.random().toString(36).substr(2, 5)}`,
                  airline: segments[0].carrierCode,
                  airlineCode: segments[0].carrierCode,
                  flightNumber: `${segments[0].carrierCode}${segments[0].number || String(flightIndex + 1).padStart(3, "0")}`,
                  from: segments[0].departure.iataCode,
                  to: segments[segments.length - 1].arrival.iataCode,
                  departure: segments[0].departure.at,
                  arrival: segments[segments.length - 1].arrival.at,
                  duration: flight.itineraries[0].duration || "N/A",
                  stops: Math.max(0, segments.length - 1),
                  price: Number(flight.price.total) || 0,
                  currency: flight.price.currency || "EUR",
                  aircraft: segments[0].aircraft?.code || "N/A",
                  availableSeats: Math.floor(Math.random() * 50) + 10,
                  segments: segments,
                };

                console.log(
                  `[FLIGHT DEBUG][${requestId}] Found flight: ${processedFlight.from} → ${processedFlight.to}: $${processedFlight.price} (${processedFlight.airline}) - ${processedFlight.stops} stops`,
                );
                return processedFlight;
              });

            return processedFlights;
          }
          return [];
        } catch (error) {
          console.warn(
            `[FLIGHTS API][${requestId}] Error searching ${pivot.iata}:`,
            error.message,
          );
          return [];
        }
      })();

      searchPromises.push(searchPromise);
    }

    // Wait for all searches to complete (normal timeout)
    const results = await Promise.allSettled(
      searchPromises.map((p) =>
        Promise.race([
          p,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 30000),
          ), // Back to 30s
        ]),
      );

    // Extract successful results and flatten arrays
    const flights = results
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value)
      .flat() // Flatten since each pivot can return multiple flights
      .filter(Boolean);

    console.log(
      `[FLIGHTS API][${requestId}] ✅ Found ${flights.length} flights from ${searchPromises.length} searches`,
    );

    if (flights.length > 0) {
      // Separate direct and connecting flights
      const directFlights = flights.filter((flight) => flight.stops === 0);
      const connectingFlights = flights.filter((flight) => flight.stops > 0);

      // Sort each group by price
      directFlights.sort((a, b) => a.price - b.price);
      connectingFlights.sort((a, b) => a.price - b.price);

      console.log(
        `[FLIGHTS API][${requestId}] 🛩️ Found ${directFlights.length} DIRECT flights and ${connectingFlights.length} connecting flights`,
      );

      // Build final result: prioritize direct flights, fill with connecting if needed
      const finalFlights = [];

      // Take up to 15 direct flights first
      const directToTake = Math.min(directFlights.length, 15);
      finalFlights.push(...directFlights.slice(0, directToTake));

      // If we have less than 15 flights total, fill with cheapest connecting flights
      const remainingSlots = 15 - finalFlights.length;
      if (remainingSlots > 0 && connectingFlights.length > 0) {
        finalFlights.push(...connectingFlights.slice(0, remainingSlots));
      }

      console.log(
        `[FLIGHTS API][${requestId}] 📊 Returning ${finalFlights.length} flights: ${directToTake} direct + ${remainingSlots > 0 ? Math.min(remainingSlots, connectingFlights.length) : 0} connecting`,
      );

      console.log(`[PRICE DEBUG][${requestId}] Final flight list:`);
      finalFlights.forEach((flight, index) => {
        const stopText =
          flight.stops === 0
            ? "DIRECT"
            : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
        console.log(
          `  ${index + 1}. ${flight.from} → ${flight.to}: $${flight.price} (${flight.airline}) - ${stopText}`,
        );
      });

      // Save to cache for future requests
      try {
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        const cacheFile = path.join(
          cacheDir,
          `flight-cache-${to.toUpperCase()}-${date}.json`,
        );
        fs.writeFileSync(
          cacheFile,
          JSON.stringify(
            {
              destination: to.toUpperCase(),
              date: date,
              flights: finalFlights,
              timestamp: Date.now(),
              cached_at: new Date().toISOString(),
              source: "dynamic-search-direct-priority",
              total_found: flights.length,
              direct_found: directFlights.length,
              connecting_found: connectingFlights.length,
              direct_returned: directToTake,
              connecting_returned: Math.max(
                0,
                finalFlights.length - directToTake,
              ),
              returned: finalFlights.length,
            },
            null,
            2,
          ),
        );

        console.log(
          `[FLIGHTS API][${requestId}] Saved ${finalFlights.length} flights to cache (${directToTake} direct, ${finalFlights.length - directToTake} connecting)`,
        );
      } catch (cacheError) {
        console.warn(
          `[FLIGHTS API][${requestId}] Failed to save cache:`,
          cacheError.message,
        );
      }

      return res.json({
        success: true,
        flights: finalFlights,
        source: "dynamic-search-direct-priority",
        count: finalFlights.length,
        meta: {
          destination: to,
          date: date,
          pivots_searched: searchPromises.length,
          total_flights_found: flights.length,
          direct_flights_found: directFlights.length,
          connecting_flights_found: connectingFlights.length,
          direct_returned: directToTake,
          connecting_returned: finalFlights.length - directToTake,
          returned: finalFlights.length,
          flight_type: "direct-priority-with-connecting-fallback",
          request_id: requestId,
        },
      });
    }
  } catch (error) {
    console.error(`[FLIGHTS API][${requestId}] Error:`, error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
      flights: [],
      meta: {
        destination: to,
        date: date,
        error_type: error.constructor.name,
        request_id: requestId,
      },
    });
  }
});

// Try to import and use existing refresh handler, with fallback
try {
  const refreshHandlerModule = await import("./api/refresh.js");
  const refreshHandler = refreshHandlerModule.default;
  app.get("/api/refresh", refreshHandler);
  app.post("/api/refresh", refreshHandler);
  console.log("[SERVER] Refresh endpoints loaded successfully");
} catch (error) {
  console.warn(
    "[SERVER] Refresh handler not found, creating fallback:",
    error.message,
  );

  // Fallback refresh endpoint
  app.all("/api/refresh", (req, res) => {
    const { to, date } = req.query;

    console.log(`[REFRESH FALLBACK] Refresh requested for ${to} on ${date}`);

    res.json({
      success: true,
      message: "Refresh acknowledged but handler not implemented",
      destination: to,
      date: date,
      timestamp: new Date().toISOString(),
      note: "This is a fallback endpoint. Implement ./api/refresh.js for full functionality.",
    });
  });
}

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Globe Fare API",
    version: "1.0.0",
    endpoints: {
      "GET /": "Service information",
      "GET /health": "Health check",
      "GET /api": "API documentation",
      "GET /api/flights": "Get flights for destination and date",
      "GET|POST /api/refresh": "Refresh flight data for destination",
    },
    examples: {
      flights: "/api/flights?to=DPS&date=2025-05-24",
      refresh: "/api/refresh?to=DPS&date=2025-05-24",
    },
  });
});

// 404 handler for unknown routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    available_routes: [
      "GET /",
      "GET /health",
      "GET /api",
      "GET /api/flights",
      "GET|POST /api/refresh",
    ],
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("[SERVER ERROR]", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
  });
});

// NOTE: Automatic search disabled - backend only serves frontend API requests
// The backend will only respond to frontend search requests, no automatic searching on startup
const DATE = "2025-05-24"; // Changed to match frontend's expected date format
const ADULTS = 1;
const MAX_RESULTS = 15; // Reduced back to 15 due to API limitations

// Hedef havalimanları
const targets = [
  {
    code: "BKK",
    pivotsPath: "./pivots/pivots-BKK.json",
    resultPath: "../frontend/public/results-BKK.json",
  },
  {
    code: "DPS",
    pivotsPath: "./pivots/pivots-DPS.json",
    resultPath: "../frontend/public/results-DPS.json",
  },
];

const FRONTEND_PATH =
  process.env.FRONTEND_PATH ||
  path.resolve(path.join(__dirname, "..", "globe-fare-frontend", "public"));

// Log the actual path being used for debugging
console.log(`[CONFIG] Frontend path resolved to: ${FRONTEND_PATH}`);

// Define the missing runSearch function
async function runSearch() {
  console.log("[SEARCH] Starting scheduled flight search...");

  // Clean old cache files at start
  try {
    if (typeof cleanOldCacheFiles === "function") {
      cleanOldCacheFiles();
    } else {
      console.log("[CACHE] Cleaning up old cache files");
      cacheHelpers.safeCleanOldCacheFiles();
    }
  } catch (error) {
    console.warn("[CACHE] Cache cleanup failed:", error.message);
  }

  for (const target of targets) {
    const results = [];
    let pivotData = [];

    try {
      if (fs.existsSync(target.pivotsPath)) {
        pivotData = JSON.parse(fs.readFileSync(target.pivotsPath, "utf8"));
      } else {
        console.warn(`[SEARCH] Pivots file not found: ${target.pivotsPath}`);
        continue;
      }
    } catch (error) {
      console.error(`[SEARCH] Error reading pivots for ${target.code}:`, error);
      continue;
    }

    console.log(
      `🔍 ${target.code} için ${pivotData.length} pivot noktası bulundu.`,
    );

    for (const pivot of pivotData) {
      try {
        // Try to load from cache first
        let cached = null;
        try {
          cached = loadFromCache(pivot.iata, target.code, DATE);
        } catch (cacheError) {
          console.warn(
            `[CACHE] Error loading cache for ${pivot.iata} → ${target.code}:`,
            cacheError.message,
          );
        }

        if (cached && cached.data && cached.data.length > 0) {
          console.warn(`⚠️ [CACHE] ${pivot.iata} → ${target.code} ${DATE}`);
          const flight = cached.data[0];
          const segments = flight.itineraries[0].segments;

          const resultData = {
            from: pivot.iata,
            to: target.code,
            price: flight.price.total,
            airline: segments[0].carrierCode,
            departure: segments[0].departure.at,
            arrival: segments[segments.length - 1].arrival.at,
            segments,
            __source: cached.__source,
            __timestamp: cached.__timestamp,
          };

          results.push(resultData);

          // NOW append to flight memory - variables are in scope here
          try {
            if (typeof appendToFlightMemory === "function") {
              appendToFlightMemory(resultData);
            } else {
              console.log(
                `[MEMORY] Would save flight: ${pivot.iata} → ${target.code}`,
              );
            }
          } catch (error) {
            console.warn(
              `[MEMORY] Error saving flight memory: ${error.message}`,
            );
          }

          continue;
        }

        // Fetch new data if no cache
        console.log(`[API] Fetching ${pivot.iata} → ${target.code} ${DATE}`);
        const response = await fetchFlight(
          pivot.iata,
          target.code,
          DATE,
          ADULTS,
        );

        if (response && response.data && response.data.length > 0) {
          const flight = response.data[0];
          const segments = flight.itineraries[0].segments;

          const resultData = {
            from: pivot.iata,
            to: target.code,
            price: flight.price.total,
            airline: segments[0].carrierCode,
            departure: segments[0].departure.at,
            arrival: segments[segments.length - 1].arrival.at,
            segments,
          };

          results.push(resultData);
          saveToCache(pivot.iata, target.code, DATE, response);

          // NOW append to flight memory - variables are in scope here
          try {
            if (typeof appendToFlightMemory === "function") {
              appendToFlightMemory(resultData);
            } else {
              console.log(
                `[MEMORY] Would save flight: ${pivot.iata} → ${target.code}`,
              );
            }
          } catch (error) {
            console.warn(
              `[MEMORY] Error saving flight memory: ${error.message}`,
            );
          }
        } else {
          console.warn(`❌ No data for ${pivot.iata} → ${target.code}`);

          // NOW save no-data info - variables are in scope here
          try {
            if (typeof saveNoDataInfo === "function") {
              saveNoDataInfo(pivot.iata, target.code, DATE);
            } else {
              console.log(
                `[NO-DATA] Would save no-data info: ${pivot.iata} → ${target.code}`,
              );
            }
          } catch (error) {
            console.warn(
              `[NO-DATA] Error saving no-data info: ${error.message}`,
            );
          }
        }
      } catch (err) {
        console.error(
          `🔥 Error on ${pivot.iata} → ${target.code}:`,
          err.message,
        );
      }
    }

    // Sort and save results
    results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const topResults = results.slice(0, MAX_RESULTS);

    // Print each top result in a user-friendly way
    for (const flight of topResults) {
      printFlight(flight);
    }

    const outputFilePath = path.join(
      FRONTEND_PATH,
      `results-${target.code}.json`,
    );
    try {
      // Create directory if it doesn't exist
      const outputDir = path.dirname(outputFilePath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputFilePath, JSON.stringify(topResults, null, 2));
      console.log(`✅ Saved: ${outputFilePath}`);

      // Add verification step
      if (fs.existsSync(outputFilePath)) {
        const stats = fs.statSync(outputFilePath);
        console.log(
          `[VERIFY] File exists: ${outputFilePath} (${stats.size} bytes)`,
        );
      } else {
        console.error(`[ERROR] Failed to verify file: ${outputFilePath}`);
      }
    } catch (error) {
      console.error(`[SEARCH] Error writing results:`, error);
    }
  }
  console.log("[SEARCH] Flight search completed");
}

// Start the server WITHOUT running automatic search
app.listen(PORT, () => {
  console.log(
    `[SERVER] Globe Fare Backend running on http://localhost:${PORT}`,
  );
  console.log(
    `[SERVER] Frontend CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
  );
  console.log(`[SERVER] Available endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(
    `  GET  http://localhost:${PORT}/api/flights?to=DPS&date=2025-05-24`,
  );
  console.log(
    `  POST http://localhost:${PORT}/api/refresh?to=DPS&date=2025-05-24`,
  );
  console.log(
    `[SERVER] 🚫 Automatic search DISABLED - Backend ready to serve frontend requests only`,
  );
  console.log(`[SERVER] ✅ Frontend can now search flights via API endpoints`);
});

// DISABLED: Automatic search on startup
// NOTE: runSearch() function still available but not called automatically
// Frontend will trigger searches via /api/flights and /api/refresh endpoints
/*
runSearch()
  .then(() => console.log('[SEARCH] Initial search completed'))
  .catch(error => console.error('[SEARCH] Error during initial search:', error.message));
*/

export default app;
