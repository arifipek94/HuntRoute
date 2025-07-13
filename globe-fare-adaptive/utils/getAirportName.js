import iataData from "../data/iata-data.json" with { type: "json" };
import airports from "./airports.json" assert { type: "json" };

function getAirportName(code) {
  const entry = iataData[code];
  if (!entry) return code;
  // Şehir ve ülke varsa birleştir
  if (entry.city && entry.country) return `${entry.city}, ${entry.country}`;
  if (entry.city) return entry.city;
  return code;
}

export default getAirportName;
