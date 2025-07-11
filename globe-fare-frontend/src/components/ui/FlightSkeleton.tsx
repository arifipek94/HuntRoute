export default function FlightSkeleton() {
  return (
    <div className='mb-4 rounded-2xl border border-gray-700 bg-[#1e1e1e] p-6 shadow-xl shadow-black/20'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='animate-pulse'>
            <div className='mb-3 h-6 w-32 rounded-lg bg-gray-700'></div>
            <div className='mb-2 h-4 w-48 rounded-lg bg-gray-700'></div>
            <div className='h-4 w-40 rounded-lg bg-gray-700'></div>
          </div>
        </div>
        <div className='text-right'>
          <div className='animate-pulse'>
            <div className='mb-2 h-8 w-20 rounded-lg bg-gray-700'></div>
            <div className='h-4 w-16 rounded-lg bg-gray-700'></div>
          </div>
        </div>
      </div>

      {/* Shimmer effect */}
      <div className='absolute inset-0 -skew-x-12 opacity-30'>
        <div className='animate-shimmer h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent'></div>
      </div>
    </div>
  );
}
