// 📁 services/flightFetcher.js
const { fetchFromAmadeus } = require('./providers/amadeus.js');
// İleride başka sağlayıcılar için:
// import { fetchFromKiwi } from './providers/kiwi.js';

const API_MODE = process.env.API_MODE || 'amadeus';

/**
 * Genel uçuş fetch fonksiyonu
 * @param {string} origin Kalkış IATA
 * @param {string} destination Varış IATA
 * @param {string} date Kalkış tarihi YYYY-MM-DD
 * @param {number} adults Yetişkin sayısı
 * @param {number} max Maksimum sonuç sayısı
 */
async function fetchFlight(origin, destination, date, adults = 1, max = 5) {
  if (API_MODE === 'amadeus') {
    return fetchFromAmadeus(origin, destination, date, adults, max);
  }
  // else if (API_MODE === 'kiwi') {
  //   return fetchFromKiwi(origin, destination, date, adults, max);
  // }

  throw new Error(`Unsupported API_MODE: ${API_MODE}`);
}

module.exports = {
  fetchFlight
};

