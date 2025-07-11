// 📁 utils/printFlight.js
const chalk = require("chalk");
const getAirportName = require("./getAirportName");
const getAirlineName = require("./getAirlineName");

/**
 * Format a timestamp in a user-friendly way
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return timestamp.toString();
  }
}

/**
 * Uçuş sonucunu kullanıcıya sade ve stilize şekilde yazdırır.
 */
function formatDateTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function printFlight(result) {
  const fromName = getAirportName(result.from);
  const toName = getAirportName(result.to);
  const airlineName = getAirlineName(result.airline);
  const fetched = result.fetchedAt || result.__timestamp;

  const mainInfo = `💸 ${fromName} → ${toName} | ${result.price} EUR | ${airlineName} (${result.airline})`;
  const departureTime = result.departure
    ? ` | 🕒 Departure: ${formatDateTime(result.departure)}`
    : "";
  const timeInfo = fetched
    ? chalk.gray(` — updated: ${formatTimestamp(fetched)}`)
    : "";

  console.log(mainInfo + departureTime + timeInfo);
}

module.exports = printFlight;
