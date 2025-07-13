const express = require("express");
const fs = require("fs");
const path = require("path");
const fetchFlight = require("../utils/fetchFlight");
const standardizeFlightData = require("../utils/standardizeFlightData");
const { saveToCache } = require("../utils/cache");

const router = express.Router();
const pivotsPath = path.join(__dirname, "../pivot-airports");

const refreshHandler = (req, res) => {
  const { to, date } = req.query;

  console.log(`➡️ [REFRESH] Called with to=${to}, date=${date}`);

  if (!to || !date) {
    console.warn("⛔ Missing 'to' or 'date' in query");
    return res.status(400).json({
      success: false,
      message: "Missing required query parameters: 'to' and/or 'date'.",
    });
  }

  try {
    const pivotPath = path.join(pivotsPath, `pivots-${to}.json`);
    if (!fs.existsSync(pivotPath)) {
      console.error(`❌ Pivot file not found for ${to}`);
      return res.status(404).json({
        success: false,
        message: `No pivot file found for destination: ${to}`,
      });
    }

    const raw = fs.readFileSync(pivotPath, "utf-8");
    const pivotAirports = JSON.parse(raw);
    console.log(`📌 Found ${pivotAirports.length} pivot airports for ${to}`);

    let allFlights = [];

    for (const from of pivotAirports) {
      console.log(`🔄 Fetching flight from ${from} to ${to} on ${date}`);
      const result = await fetchFlight(from, to, date);

      if (result?.data?.length > 0) {
        console.log(`✅ ${result.data.length} flights found from ${from}`);
        allFlights.push(...result.data);
      } else {
        console.warn(`⚠️ No flights found from ${from}`);
      }
    }

    if (allFlights.length === 0) {
      console.warn(`🚫 No flights found for any pivot to ${to}`);
      return res.status(404).json({
        success: false,
        message: "No flights found for any pivot location.",
      });
    }

    const standardized = standardizeFlightData(allFlights);
    const cachePath = saveToCache(to, date, standardized);

    console.log(`💾 Flights saved to cache: ${cachePath}`);

    return res.json({
      success: true,
      message: "Flight data refreshed and cached.",
      count: standardized.length,
    });
  } catch (err) {
    console.error("🔥 Refresh error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during refresh",
      error: err?.message,
    });
  }
};

router.get("/refresh", refreshHandler);

export default refreshHandler;
