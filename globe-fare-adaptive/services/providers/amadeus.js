// 📁 services/providers/amadeus.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

let cachedToken = null;

// 🔐 Access Token alma (cache'li)
async function getAccessToken() {
  if (cachedToken) return cachedToken;
  const response = await fetch(
    "https://test.api.amadeus.com/v1/security/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
    },
  );
  const data = await response.json();
  cachedToken = data.access_token;
  return cachedToken;
}

// 📦 Uçuş verisini Amadeus üzerinden çek
async function fetchFromAmadeus(
  origin,
  destination,
  date,
  adults = 1,
  max = 5,
) {
  const cachePath = path.join(
    __dirname,
    `../../cache/flight-${origin}-${destination}-${date}.json`,
  );
  if (fs.existsSync(cachePath)) {
    console.log(`⚠️ [CACHE] ${origin} → ${destination} ${date}`);
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  }

  const token = await getAccessToken();
  const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
  url.searchParams.append("originLocationCode", origin);
  url.searchParams.append("destinationLocationCode", destination);
  url.searchParams.append("departureDate", date);
  url.searchParams.append("adults", adults);
  url.searchParams.append("max", max);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  return data;
}

module.exports = {
  fetchFromAmadeus,
};
