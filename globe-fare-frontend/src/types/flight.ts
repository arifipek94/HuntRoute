/**
 * Core flight data types and interfaces
 * Based on actual usage in dataUtils.ts and components
 */

export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;

  // Route information
  from: string;
  to: string;
  origin: string;
  destination: string;

  // Timing
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;

  // Flight details
  duration: string | number;
  stops: number;
  price: number;
  currency: string;
  aircraft?: string;
  availableSeats?: number;

  // Additional data
  segments?: FlightSegment[];

  // Enriched display fields (added by prepareFlightsForDisplay)
  airlineName?: string;
  originCity?: string;
  destinationCity?: string;
  originCountry?: string;
  destinationCountry?: string;
  originAirport?: string;
  destinationAirport?: string;
  departureFormatted?: string;
  arrivalFormatted?: string;
  durationFormatted?: string;
}

export interface FlightSegment {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  aircraft?: string;
}

// Used in useFlights.ts
export interface FlightSearchParams {
  to: string;
  date: string;
  people?: number;
}

// Used in constants.ts
export interface Destination {
  code: string;
  label: string;
  country: string;
}
