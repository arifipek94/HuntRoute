import type { Flight } from '@/types/flight';
import Image from 'next/image';

// FlightCard component - Google Flights style without photos
export default function FlightCard({ flight }: { flight: Flight }) {
  // Calculate duration in hours and minutes
  let durationDisplay = flight.duration;
  if (typeof flight.duration === 'number') {
    const hours = Math.floor(flight.duration / 60);
    const minutes = flight.duration % 60;
    durationDisplay = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }

  // Handle enriched flight data (added by dataUtils)
  const enrichedFlight = flight as Flight & Record<string, unknown>;

  // Safe access to stops with default value
  const stops = flight.stops ?? 0;

  return (
    <div className='animate-in rounded-xl border border-gray-800 bg-[#1e1e1e] shadow-xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/30'>
      {/* Flight details */}
      <div className='p-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-5'>
          {/* Airline info */}
          <div className='flex flex-col justify-center'>
            <div className='flex items-center space-x-3'>
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-700'>
                <Image
                  src={`https://images.kiwi.com/airlines/64/${flight.airline}.png`}
                  alt={flight.airline}
                  width={32}
                  height={32}
                  className='object-contain'
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/40x40/374151/ffffff?text=' +
                      flight.airline;
                  }}
                />
              </div>
              <div>
                <p className='font-medium text-white'>
                  {enrichedFlight.airlineName || `${flight.airline} Airlines`}
                </p>
                <p className='text-sm text-gray-400'>{flight.airline}</p>
              </div>
            </div>
          </div>

          {/* Route info */}
          <div className='flex flex-col justify-center'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-white'>
                {enrichedFlight.originCity || flight.from}
              </p>
              <p className='text-sm text-gray-400'>{flight.from}</p>
            </div>
          </div>

          {/* Flight details */}
          <div className='flex flex-col items-center justify-center'>
            <div className='mb-2 flex items-center space-x-2'>
              <div className='h-3 w-3 rounded-full bg-blue-500'></div>
              <div className='relative h-0.5 flex-1 bg-gray-600'>
                {stops > 0 && (
                  <div className='absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-yellow-500'></div>
                )}
              </div>
              <div className='h-3 w-3 rounded-full bg-green-500'></div>
            </div>
            <p className='text-sm text-gray-400'>{durationDisplay}</p>
            <p className='text-xs text-gray-500'>
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Destination info */}
          <div className='flex flex-col justify-center'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-white'>
                {enrichedFlight.destinationCity || flight.to}
              </p>
              <p className='text-sm text-gray-400'>{flight.to}</p>
            </div>
          </div>

          {/* Price info */}
          <div className='flex flex-col items-end justify-center'>
            <p className='text-3xl font-bold text-green-400'>${flight.price}</p>
            <p className='text-sm text-gray-400'>per person</p>
            <button className='mt-3 rounded-lg border border-gray-600 px-6 py-2 font-medium text-white transition-all duration-200 hover:border-gray-400 hover:bg-gray-800'>
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
