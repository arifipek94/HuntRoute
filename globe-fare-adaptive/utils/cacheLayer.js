// 📁 utils/cacheLayer.js
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "..", "cache");

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Enhanced cache saving with better error handling
function saveToCache(from, to, date, data) {
  try {
    ensureCacheDir();

    const fileName = `flight-${from}-${to}-${date}.json`;
    const filePath = path.join(CACHE_DIR, fileName);

    const cacheData = {
      from,
      to,
      date,
      data: data.data || data,
      timestamp: Date.now(),
      __timestamp: Date.now(),
      __source: "amadeus-api",
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
    console.log(`[CACHE] Saved cache file: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`[CACHE] Failed to save cache:`, error);
    return false;
  }
}

// Enhanced cache reading with wildcard support for aggregated results
function loadFromCache(from, to, date) {
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
}

// Clean up old cache files
function cleanOldCacheFiles() {
  try {
    const CACHE_DIR = path.join(__dirname, "..", "cache");
    if (!fs.existsSync(CACHE_DIR)) {
      return;
    }

    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      // Check for both old and new cache file formats
      if (
        (file.startsWith("flight-") || file.startsWith("flight-cache-")) &&
        file.endsWith(".json")
      ) {
        const filePath = path.join(CACHE_DIR, file);
        const stat = fs.statSync(filePath);
        const ageInHours = (now - stat.mtime.getTime()) / (1000 * 60 * 60);

        // Delete files older than 24 hours
        if (ageInHours > 24) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[CACHE] Deleted ${deletedCount} old cache files`);
    }
  } catch (error) {
    console.error("[CACHE] Error cleaning old cache files:", error);
  }
}

// Fix for the undefined 'cleanupCache' function reference
function cleanupCache() {
  console.log("[CACHE] Cleaning up old cache files");
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return;
    }

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

        // Delete files older than 24 hours
        if (ageInHours > 24) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[CACHE] Deleted ${deletedCount} old cache files`);
    }
  } catch (error) {
    console.error("[CACHE] Error cleaning cache:", error);
  }
}

// Add these functions at the end of the file, before module.exports:

function appendToFlightMemory(flightData) {
  try {
    const MEMORY_DIR = path.join(__dirname, "..", "data");
    const MEMORY_FILE = path.join(MEMORY_DIR, "flight-memory.json");

    // Create directory if needed
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }

    // Load existing memory or create new array
    let memoryData = [];
    if (fs.existsSync(MEMORY_FILE)) {
      memoryData = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8")) || [];
    }

    // Add new flight with timestamp
    memoryData.push({
      ...flightData,
      saved_at: new Date().toISOString(),
    });

    // Keep only last 500 flights for performance
    if (memoryData.length > 500) {
      memoryData = memoryData.slice(-500);
    }

    // Save back to file
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoryData, null, 2));
    return true;
  } catch (error) {
    console.error("[MEMORY] Failed to append flight memory:", error);
    return false;
  }
}

function saveNoDataInfo(from, to, date) {
  try {
    const NO_DATA_DIR = path.join(__dirname, "..", "cache", "no-data");

    // Create directory if needed
    if (!fs.existsSync(NO_DATA_DIR)) {
      fs.mkdirSync(NO_DATA_DIR, { recursive: true });
    }

    const fileName = `no-data-${from}-${to}-${date}.json`;
    const filePath = path.join(NO_DATA_DIR, fileName);

    const info = {
      from,
      to,
      date,
      timestamp: Date.now(),
      checked_at: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
    return true;
  } catch (error) {
    console.error("[NO-DATA] Failed to save no-data info:", error);
    return false;
  }
}

// Make sure to export all functions
module.exports = {
  loadFromCache,
  saveToCache,
  appendToFlightMemory,
  saveNoDataInfo,
  cleanOldCacheFiles: function () {
    // Implement cache cleanup
    try {
      const CACHE_DIR = path.join(__dirname, "..", "cache");
      if (!fs.existsSync(CACHE_DIR)) {
        return;
      }

      const files = fs.readdirSync(CACHE_DIR);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith("flight-") && file.endsWith(".json")) {
          const filePath = path.join(CACHE_DIR, file);
          const stat = fs.statSync(filePath);
          const ageInHours = (now - stat.mtime.getTime()) / (1000 * 60 * 60);

          if (ageInHours > 24) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`[CACHE] Deleted ${deletedCount} old cache files`);
      }
    } catch (error) {
      console.error("[CACHE] Error cleaning old cache files:", error);
    }
  },
  // For backward compatibility
  cleanupCache: function () {
    return this.cleanOldCacheFiles();
  },
};
