'use client';

import { FlightListing } from '@/components/FlightListing';
import FlightSelector from '@/components/FlightSelector';
import { useFlights } from '@/hooks/useFlights';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const FLIGHT_TAGLINES = [
  'Pick a place. We’ll show you how to get there — from cheapest.',
  'One city in mind. A world of ways to reach it.',
  'Bangkok tomorrow? Let’s find the wildcard route.',
  'Search a destination. Let the deals surprise you.',
  'Where you’re going matters. How you get there? We optimize.',
  'Type a city. We’ll map the cheapest ways in.',
  'Start with a dream. End with a deal.',
  'Fly into your destination. Reroute your whole trip.',
  'Your destination has options. We reveal them.',
  'Point to a place. We’ll find the path.',
  "Travel isn't just where — it's how. Start here.",
  'Enter a city. Let flight prices do the talking.',
  'The world flies to your city. Who does it cheapest?',
  'Plot your trip backward — start at the end.',
  'Reverse-search your adventure. Cheapest routes in.',
  "Destination set. Now let's hack the journey.",
  "Your city, your rules. We'll find the flights.",
  "Arrivals matter. We'll optimize your landing.",
  "Dream big. We'll handle the flight math.",
  "Type a place. We'll show every way in.",
  'Your arrival city, our flight puzzle.',
  "Start at the finish line. We'll fill in the rest.",
  "Every destination has a secret route. We'll find it.",
  'Where you end up is just the beginning.',
  'Let the world come to your city — for less.',
  'Your destination, our obsession: cheap flights.',
  "Choose a city. We'll do the rest.",
  'Arrive smarter. Search backwards.',
  "Destination in mind? We'll map the deals.",
  "The best way in isn't always the obvious one.",
];

function PageContent() {
  const searchParams = useSearchParams();

  // Memoize flight parameters to prevent unnecessary re-renders
  const flightParams = useMemo(() => {
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const people = searchParams.get('people');

    if (!to || !date) return null;

    return {
      destination: to.toUpperCase(),
      date,
      people: parseInt(people || '1'),
    };
  }, [searchParams]);

  // CRITICAL: Only call API when params exist and are stable
  const {
    data: flightResponse,
    isLoading,
    isError,
    error,
  } = useFlights(flightParams);

  // Memoize flights to prevent processing on every render
  const flights = useMemo(
    () => flightResponse?.data || [],
    [flightResponse?.data]
  );
  const meta = useMemo(() => flightResponse?.meta, [flightResponse?.meta]);

  const showResults = Boolean(flightParams);

  // Log for debugging - should only appear once per search (CLIENT SIDE ONLY)
  useEffect(() => {
    if (typeof window !== 'undefined' && flightParams) {
      console.log('🔍 [CLIENT] Search params changed:', flightParams);
    }
  }, [flightParams]);

  // Animated tagline state
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIdx(idx => (idx + 1) % FLIGHT_TAGLINES.length);
        setFade(true);
      }, 350); // fade out duration
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='min-h-screen bg-[#181A20]'>
      {/* Header (no tagline here) */}
      <div className='flex w-full flex-col items-center pt-16'>
        <style jsx global>{`
          @keyframes gradient-x {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      </div>

      {/* FlightSelector Card + Tagline */}
      <div
        className='flex w-full flex-col items-center'
        style={{ marginTop: '80px' }}
      >
        {/* Tagline just above search bar, now 70px daha aşağıda */}
        <div
          className='mb-2'
          style={{
            width: 'calc(900px + 20px)',
            maxWidth: 'calc(98vw - 20px)',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '70px',
            marginBottom: '0px',
          }}
        >
          <h1
            className={`animate-gradient-x bg-gradient-to-r from-[#C0C0C0] via-gray-400 to-gray-600 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent transition-opacity duration-300 lg:text-3xl`}
            style={{
              backgroundSize: '200% 200%',
              animation: 'gradient-x 3s ease-in-out infinite',
              minHeight: '2.5em',
              opacity: fade ? 1 : 0,
              transition: 'opacity 0.35s cubic-bezier(.4,0,.2,1)',
              willChange: 'opacity',
            }}
          >
            {FLIGHT_TAGLINES[taglineIdx]}
          </h1>
        </div>
        <FlightSelector />
      </div>

      {/* Results Section */}
      {showResults && (
        <div className='bg-[#181A20] px-4 py-8'>
          <div className='flex w-full justify-center'>
            <div className='w-full max-w-7xl'>
              {isLoading && (
                <div className='py-12 text-center'>
                  <p className='text-lg text-gray-300'>
                    Searching for flights...
                  </p>
                </div>
              )}

              {isError && (
                <div className='py-12 text-center'>
                  <div className='text-lg text-red-400'>
                    Error loading flights
                  </div>
                  <div className='mt-2 text-sm text-gray-400'>
                    {error?.message || 'Please try again later'}
                  </div>
                </div>
              )}

              {!isLoading && !isError && flights && flights.length > 0 && (
                <FlightListing flights={flights} meta={meta} />
              )}

              {!isLoading && !isError && flights && flights.length === 0 && (
                <div className='py-12 text-center'>
                  <div className='text-lg text-gray-300'>No flights found</div>
                  <div className='mt-2 text-sm text-gray-400'>
                    Try different dates or destinations
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CLIENT-ONLY PAGE - NO SERVER SIDE RENDERING
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-black'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
