'use client';

import Image from 'next/image';

interface ErrorStateProps {
  error?: string;
}

export default function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className='mt-8 flex w-full justify-center'>
      <div className='w-full max-w-4xl px-4'>
        {/* Red test container for error state */}
        <div className='mb-2 h-4 w-4 rounded-full bg-red-500'></div>

        <div className='rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm'>
          <div className='mb-4 flex items-center justify-center'>
            {/* Orange test container */}
            <div className='mr-3 h-8 w-2 bg-orange-500'></div>
            <Image
              src='/warning-icon.svg'
              alt='Error'
              width={24}
              height={24}
              className='mr-3 flex-shrink-0 opacity-60'
              priority
            />
            <div className='text-lg font-medium text-gray-900'>
              Failed to load flights
            </div>
            {/* Yellow test container */}
            <div className='ml-3 h-8 w-2 bg-yellow-500'></div>
          </div>
          <div className='mb-6 text-gray-600'>
            {error || 'Please check your connection and try again.'}
          </div>

          {/* Purple test container */}
          <div className='mx-auto mb-4 h-6 w-6 rounded bg-purple-500'></div>

          <button
            onClick={() => (window.location.href = '/')}
            className='rounded-lg bg-gray-900 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800'
            aria-label='Try again'
          >
            Try again
          </button>

          {/* Cyan test container */}
          <div className='mx-auto mt-4 h-2 w-8 bg-cyan-500'></div>
        </div>
      </div>
    </div>
  );
}
