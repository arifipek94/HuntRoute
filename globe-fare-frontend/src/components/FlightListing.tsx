'use client';

import type { Flight } from '@/types/flight';
import FlightCard from './FlightCard';

interface FlightListingProps {
  flights: Flight[];
  meta?: {
    source?: string;
    cached?: boolean;
    cache_updated_at?: string;
    last_refresh?: string;
    timestamp?: number;
  };
}

// FlightListing component - only displays flights, no search functionality
export function FlightListing({ flights, meta }: FlightListingProps) {
  // Format update time
  const getUpdateTimeDisplay = () => {
    if (meta?.cache_updated_at) {
      const updateTime = new Date(meta.cache_updated_at);
      const now = new Date();
      const isToday = updateTime.toDateString() === now.toDateString();

      if (isToday) {
        return `Today ${updateTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;
      } else {
        return updateTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    if (meta?.last_refresh) {
      const updateTime = new Date(meta.last_refresh);
      const now = new Date();
      const isToday = updateTime.toDateString() === now.toDateString();

      if (isToday) {
        return `Today ${updateTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;
      } else {
        return updateTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    if (meta?.timestamp) {
      const updateTime = new Date(meta.timestamp);
      const now = new Date();
      const isToday = updateTime.toDateString() === now.toDateString();

      if (isToday) {
        return `Today ${updateTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;
      } else {
        return updateTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    return 'Just now';
  };

  if (flights.length === 0) {
    return (
      <div className='py-12 text-center'>
        <div className='text-lg text-gray-400'>No flights found</div>
        <div className='mt-2 text-sm text-gray-500'>
          Try adjusting your search criteria
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with update time */}
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-white'>
          {flights.length} Flight{flights.length !== 1 ? 's' : ''} Found
        </h2>
        <div className='text-sm text-gray-400 opacity-70'>
          Updated: {getUpdateTimeDisplay()}
        </div>
      </div>

      {/* Flight cards - NO ANIMATION */}
      {flights.map(flight => (
        <div
          key={flight.id}
          className='rounded-xl border border-gray-800 bg-[#1e1e1e] p-6 shadow-xl shadow-black/20 transition-colors hover:border-gray-700'
        >
          <FlightCard flight={flight} />
        </div>
      ))}
    </div>
  );
}
