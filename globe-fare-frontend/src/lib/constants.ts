export const DESTINATIONS = [
  { code: 'BKK', label: 'Bangkok', country: 'Thailand' },
  { code: 'DPS', label: 'Bali', country: 'Indonesia' },
];

export const MESSAGES = {
  WELCOME: '👋 Hi! Where would you like to fly?',
  SEARCHING: '🔍 Searching destinations...',
  SELECT_DATE: '📅 Great choice! When would you like to travel?',
  SEARCHING_FLIGHTS: '✈️ Finding the best flights for you...',
} as const;

export const API_ENDPOINTS = {
  FLIGHTS: '/api/flights',
  AIRLINES: '/data/airlines.json',
  AIRPORTS: '/data/airports.json',
} as const;

export const FLIGHT_SEARCH_DEFAULTS = {
  CURRENCY: 'USD',
  MAX_RESULTS: 50,
  TIMEOUT: 30000,
};
