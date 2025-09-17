

// 📁 utils/getAirlineName.js
const airlines = require("../data/airlines.json");

function getAirlineName(code) {
  const airline = airlines.find((a) => a.id === code);
  return airline ? airline.name : code;
}

module.exports = getAirlineName;
