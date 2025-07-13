// 📁 utils/getAirlineName.js
import airlines from "./airlines.json" assert { type: "json" };

function getAirlineName(code) {
  const airline = airlines.find((a) => a.id === code);
  return airline ? airline.name : code;
}

export default getAirlineName;
