import FlightSkeleton from './FlightSkeleton';

export default function LoadingState() {
  return (
    <div className='mt-8 flex w-full justify-center'>
      <div className='w-full max-w-4xl px-4'>
        <div className='animate-in mb-8 text-center'>
          <div className='mb-3 text-xl font-semibold text-white'>
            Searching for flights...
          </div>
          <div className='mb-6 text-gray-400'>
            Finding the best options for your trip
          </div>

          <div className='mb-6 flex items-center justify-center gap-1'>
            <div className='h-2 w-2 animate-bounce rounded-full bg-blue-500'></div>
            <div className='h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.1s]'></div>
            <div className='h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.2s]'></div>
          </div>

          <div className='mx-auto h-1 w-16 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-500'></div>
        </div>

        <div className='space-y-4'>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className='animate-in'
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <FlightSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
