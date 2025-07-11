// 📁 utils/getAirlineName.js
import airlines from "../data/airlines.json" with { type: "json" };

function getAirlineName(code) {
  const airline = airlines.find((a) => a.id === code);
  return airline ? airline.name : code;
}

export default getAirlineName;
