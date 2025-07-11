const fs = require("fs");
const path = require("path");
const getAirlineName = require("./getAirlineName");
const getAirportName = require("./getAirportName");

// Use proper path resolution to find data files
const dataPath = path.join(__dirname, "..", "data");

/**
 * Convert raw flight data to user-friendly format for printing
 */
function convertFlightForDisplay(flightData) {
  if (!flightData) return null;

  try {
    // Get human-readable names
    const fromAirportName = getAirportName(flightData.from);
    const toAirportName = getAirportName(flightData.to);
    const airlineName = getAirlineName(flightData.airline);

    // Format departure time
    const departureDate = new Date(flightData.departure);
    const formattedDeparture =
      departureDate.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      departureDate.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });

    return {
      from: fromAirportName,
      to: toAirportName,
      price: flightData.price,
      airline: airlineName,
      airlineCode: flightData.airline,
      departure: formattedDeparture,
      route: `${fromAirportName} → ${toAirportName}`,
      originalData: flightData,
    };
  } catch (error) {
    console.warn("[CONVERT] Error converting flight data:", error.message);
    return {
      from: flightData.from,
      to: flightData.to,
      price: flightData.price,
      airline: flightData.airline,
      departure: flightData.departure,
      route: `${flightData.from} → ${flightData.to}`,
      originalData: flightData,
    };
  }
}

module.exports = {
  convertFlightForDisplay,
};
