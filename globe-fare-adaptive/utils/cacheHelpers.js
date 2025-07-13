import fs from 'fs';
import path from 'path';
/**
 * Cache helpers that don't interfere with existing functionality
 * These functions supplement the original cacheLayer functions without replacing them
 */

// Constants for cache management
const CACHE_DIR = path.join(__dirname, "..", "cache");
const CACHE_TTL_HOURS = 12; // Default TTL for cache entries
const MEMORY_FILE = path.join(__dirname, "..", "data", "flight-memory.json");

// Create needed directories if they don't exist
function ensureDirectories() {
  const dirs = [CACHE_DIR, path.join(__dirname, "..", "data")];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[CACHE HELPERS] Created directory: ${dir}`);
    }
  }
}

// Safely append to flight memory without replacing existing function
function safeAppendToFlightMemory(flightData) {
  try {
    ensureDirectories();

    // Initialize or load existing memory
    let memoryData = [];
    if (fs.existsSync(MEMORY_FILE)) {
      try {
        memoryData = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
        if (!Array.isArray(memoryData)) {
          memoryData = []; // Reset if not an array
        }
      } catch (error) {
        console.error("[MEMORY] Error reading flight memory file:", error);
        memoryData = []; // Reset on error
      }
    }

    // Add new flight data with timestamp
    memoryData.push({
      ...flightData,
      _saved: new Date().toISOString(),
    });

    // Keep only the most recent 1000 flights
    if (memoryData.length > 1000) {
      memoryData = memoryData.slice(-1000);
    }

    // Save the updated memory file
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoryData, null, 2));

    return true;
  } catch (error) {
    console.error("[MEMORY] Failed to append to flight memory:", error);
    return false;
  }
}

// Safely save no-data information without replacing existing function
function safeSaveNoDataInfo(from, to, date) {
  try {
    ensureDirectories();
    const NO_DATA_DIR = path.join(CACHE_DIR, "no-data");

    // Create no-data directory if it doesn't exist
    if (!fs.existsSync(NO_DATA_DIR)) {
      fs.mkdirSync(NO_DATA_DIR, { recursive: true });
    }

    const fileName = `no-data-${from}-${to}-${date}.json`;
    const filePath = path.join(NO_DATA_DIR, fileName);

    const noDataInfo = {
      from,
      to,
      date,
      timestamp: Date.now(),
      saved_at: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(noDataInfo, null, 2));
    return true;
  } catch (error) {
    console.error("[CACHE] Failed to save no-data info:", error);
    return false;
  }
}

// Safely clean old cache files without interfering with existing functions
function safeCleanOldCacheFiles(maxAgeHours = 24) {
  try {
    ensureDirectories();

    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (
        (file.startsWith("flight-") || file.startsWith("flight-cache-")) &&
        file.endsWith(".json")
      ) {
        const filePath = path.join(CACHE_DIR, file);
        const stat = fs.statSync(filePath);
        const ageInHours = (now - stat.mtime.getTime()) / (1000 * 60 * 60);

        if (ageInHours > maxAgeHours) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(
            `[CACHE CLEANUP] Deleted old cache file: ${file} (${ageInHours.toFixed(1)}h old)`,
          );
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[CACHE CLEANUP] Deleted ${deletedCount} old cache files`);
    }

    return { deletedCount, success: true };
  } catch (error) {
    console.error("[CACHE CLEANUP] Error cleaning old cache files:", error);
    return { deletedCount: 0, success: false, error: error.message };
  }
}

// Safely load cache data without replacing existing function
function safeLoadFromCache(from, to, date) {
  try {
    if (from === "*") {
      // Load aggregated cache for destination
      const fileName = `flight-cache-${to}-${date}.json`;
      const filePath = path.join(CACHE_DIR, fileName);

      if (fs.existsSync(filePath)) {
        const cacheData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Check if cache is expired (12 hours)
        const ageInMs = Date.now() - (cacheData.timestamp || 0);
        const ageInHours = ageInMs / (1000 * 60 * 60);

        if (ageInHours > CACHE_TTL_HOURS) {
          console.log(
            `[SAFE CACHE] Aggregated cache expired for ${fileName} (${ageInHours.toFixed(1)}h old)`,
          );
          return null;
        }

        console.log(
          `[SAFE CACHE] Found aggregated cache with ${cacheData.flights?.length || 0} flights for ${to}`,
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

    if (ageInHours > CACHE_TTL_HOURS) {
      console.log(
        `[SAFE CACHE] Cache expired for ${fileName} (${ageInHours.toFixed(1)}h old)`,
      );
      return null;
    }

    return cacheData;
  } catch (error) {
    console.error(`[SAFE CACHE] Failed to read cache:`, error);
    return null;
  }
}

export default {
  ensureDirectories,
  safeAppendToFlightMemory,
  safeSaveNoDataInfo,
  safeCleanOldCacheFiles,
  safeLoadFromCache,
};