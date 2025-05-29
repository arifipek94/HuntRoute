'use client';

import { DESTINATIONS } from '@/lib/constants';
import { preloadData } from '@/lib/dataUtils';
import { Combobox, Listbox, Transition } from '@headlessui/react';
import {
  CalendarIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/20/solid';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/flight-selector.css';

// People selector options
const peopleOptions = [
  { id: 1, name: '1 Adult', value: 1 },
  { id: 2, name: '2 Adults', value: 2 },
  { id: 3, name: '3 Adults', value: 3 },
  { id: 4, name: '4 Adults', value: 4 },
  { id: 5, name: '5 Adults', value: 5 },
];

// Main FlightSelector component
export default function FlightSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<
    (typeof DESTINATIONS)[0] | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<
    (typeof peopleOptions)[0] | null
  >(peopleOptions[0] || null);
  const [isSearching, setIsSearching] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'none' | 'date' | 'people'>(
    'none'
  );
  const [isChangingDropdown, setIsChangingDropdown] = useState(false);
  const [destinationInputFocused, setDestinationInputFocused] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const peopleRef = useRef<HTMLDivElement>(null);

  const currentTo = searchParams.get('to');
  const currentDate = searchParams.get('date');

  // Initialize from URL params - ONE TIME ONLY
  useEffect(() => {
    if (currentTo) {
      const dest = DESTINATIONS.find(d => d.code === currentTo);
      if (dest) {
        setSelectedDestination(dest);
        setQuery('');
      }
    }
    if (currentDate) {
      try {
        setSelectedDate(new Date(currentDate));
      } catch {
        console.warn('Invalid date from URL:', currentDate);
      }
    }
  }, [currentDate, currentTo]); // Include dependencies for React hooks

  // Preload airport/airline data on component mount
  useEffect(() => {
    preloadData().catch(console.warn);
  }, []);

  // Filter destinations based on query
  const filteredDestinations =
    query === ''
      ? DESTINATIONS.slice(0, 6)
      : DESTINATIONS.filter(
          dest =>
            dest.label.toLowerCase().includes(query.toLowerCase()) ||
            dest.country.toLowerCase().includes(query.toLowerCase()) ||
            dest.code.toLowerCase().includes(query.toLowerCase())
        );

  // Manual search function - ONLY triggered by button click
  const handleSearch = useCallback(async () => {
    if (!selectedDestination || !selectedDate || isSearching) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      params.set('to', selectedDestination.code);
      // Fix: Use local date string instead of ISO string to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      if (!dateString) {
        console.error('Invalid date selected');
        return;
      }
      params.set('date', dateString);
      params.set('people', (selectedPeople?.value ?? 1).toString());
      router.push(`/?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setTimeout(() => setIsSearching(false), 1000);
    }
  }, [selectedDestination, selectedDate, selectedPeople, router, isSearching]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (openDropdown === 'none') return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        openDropdown === 'date' &&
        datePickerRef.current &&
        !datePickerRef.current.contains(target)
      ) {
        // Don't close if clicking on people selector
        if (peopleRef.current && peopleRef.current.contains(target)) {
          return;
        }
        setOpenDropdown('none');
      }

      if (
        openDropdown === 'people' &&
        peopleRef.current &&
        !peopleRef.current.contains(target)
      ) {
        // Don't close if clicking on date picker
        if (datePickerRef.current && datePickerRef.current.contains(target)) {
          return;
        }
        setOpenDropdown('none');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  return (
    <>
      {/* Homepage Button - fixed to top right, always visible */}
      <button
        onClick={() => (window.location.href = '/')}
        className='fixed top-6 right-8 z-[9999] rounded-lg bg-gray-800 px-5 py-2 text-base font-medium text-white shadow transition-colors hover:bg-gray-700'
        style={{ position: 'fixed' }}
      >
        Homepage
      </button>
      <div className='relative flex w-full justify-center'>
        <div
          className='flight-selector-container flex flex-col justify-center overflow-visible rounded-2xl border border-[#2D3035] bg-[#23252B] shadow-lg'
          style={{ paddingBottom: '10px' }}
        >
          {/* Main Search Form */}
          <div className='px-8 py-0'>
            <div className='flight-selector-grid grid grid-cols-1 items-end gap-8 lg:grid-cols-7'>
              {/* Destination (TO) - longer, with new subtitle and animated cursor */}
              <div className='relative w-full overflow-visible lg:col-span-4'>
                <Combobox
                  value={selectedDestination}
                  onChange={setSelectedDestination}
                >
                  <div className='group relative'>
                    <div className='destination-input-container relative rounded-xl border border-[#2D3035] bg-[#23252B] transition-all hover:border-[#393C43] hover:bg-[#26282F]'>
                      <div className='flex h-[59px] items-center justify-center px-6'>
                        {/* Visually fulfilling placeholder with bigger text */}
                        <div className='relative flex w-full flex-col items-start justify-center'>
                          <Combobox.Input
                            className='destination-input flex h-full w-full items-center border-none bg-transparent px-0 pr-6 text-2xl text-white placeholder-gray-500 outline-none focus:border-none focus:ring-0 focus:outline-none'
                            displayValue={(
                              destination: (typeof DESTINATIONS)[0]
                            ) => destination?.label || ''}
                            onChange={event => setQuery(event.target.value)}
                            placeholder='  Where do you want to go? Bali? Bangkok?'
                            autoComplete='off'
                            onFocus={() => setDestinationInputFocused(true)}
                            onBlur={() => setDestinationInputFocused(false)}
                          />
                          {!destinationInputFocused && !selectedDestination && (
                            <span className='animate-blink cursor-animation pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-white'>
                              |
                            </span>
                          )}
                          {selectedDestination && (
                            <div className='mt-0.5 text-base leading-tight text-gray-400'>
                              {selectedDestination.code} •{' '}
                              {selectedDestination.country}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Remove old absolute alt bilgi */}
                    </div>
                    <Combobox.Button className='absolute top-1/2 right-4 -translate-y-1/2'>
                      <ChevronUpDownIcon className='h-5 w-5 text-gray-400' />
                    </Combobox.Button>
                    <Transition
                      enter='transition duration-200 ease-out'
                      enterFrom='transform scale-95 opacity-0'
                      enterTo='transform scale-100 opacity-100'
                      leave='transition duration-150 ease-in'
                      leaveFrom='transform scale-100 opacity-100'
                      leaveTo='transform scale-95 opacity-0'
                    >
                      <Combobox.Options className='absolute z-[9999] mt-2 max-h-80 w-full overflow-auto rounded-none border border-[#23252B] bg-[#23252B] shadow-none'>
                        <div className='p-0'>
                          {filteredDestinations.length === 0 && query !== '' ? (
                            <div className='px-4 py-8 text-center text-gray-400'>
                              No destinations found.
                            </div>
                          ) : (
                            filteredDestinations.map(destination => (
                              <Combobox.Option
                                key={destination.code}
                                className={({ active }) =>
                                  `cursor-pointer border-b border-[#2D3035] p-4 transition-colors last:border-b-0 ${
                                    active
                                      ? 'bg-[#23252B] text-white'
                                      : 'text-white'
                                  } rounded-none`
                                }
                                value={destination}
                              >
                                <div className='flex flex-col'>
                                  <span className='text-lg font-semibold'>
                                    {destination.label}
                                  </span>
                                  <span className='text-sm text-gray-400'>
                                    {destination.country}
                                  </span>
                                  <span className='mt-1 text-xs text-gray-500'>
                                    {destination.code}
                                  </span>
                                </div>
                              </Combobox.Option>
                            ))
                          )}
                        </div>
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>

              {/* Passengers - same height as destination, but content short */}
              <div className='flex w-full flex-col justify-center lg:col-span-1 lg:translate-x-[50px]'>
                <div className='group relative h-full' ref={peopleRef}>
                  <Listbox
                    value={selectedPeople}
                    onChange={val => {
                      setSelectedPeople(val);
                      setOpenDropdown('none');
                    }}
                  >
                    <Listbox.Button
                      className='relative flex h-full min-h-[70px] w-[150%] items-center rounded-xl border border-[#2D3035] bg-[#23252B] pr-10 transition-all hover:border-[#393C43] hover:bg-[#26282F] focus:ring-0 focus:outline-none'
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isChangingDropdown) return;

                        setIsChangingDropdown(true);
                        console.log(
                          'People button clicked, current dropdown:',
                          openDropdown
                        );
                        setOpenDropdown(
                          openDropdown === 'people' ? 'none' : 'people'
                        );
                        setTimeout(() => setIsChangingDropdown(false), 100);
                      }}
                    >
                      <div className='w-full px-6 py-4 text-left'>
                        <div className='mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400 uppercase'>
                          <UserGroupIcon className='h-4 w-4 text-gray-400' />
                          PASSENGERS
                        </div>
                        <div className='mt-1 text-base font-semibold text-white'>
                          {selectedPeople?.name ?? '1 Adult'}
                        </div>
                      </div>
                      <ChevronUpDownIcon className='pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-gray-400' />
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      show={openDropdown === 'people'}
                      leave='transition ease-in duration-150'
                      leaveFrom='opacity-100'
                      leaveTo='opacity-0'
                    >
                      <Listbox.Options className='absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[#2D3035] bg-[#23252B] shadow-2xl'>
                        <div className='p-2'>
                          {peopleOptions.map(person => (
                            <Listbox.Option
                              key={person.id}
                              className={({ active }) =>
                                `cursor-pointer rounded-lg p-3 transition-colors ${
                                  active
                                    ? 'bg-blue-600 text-white'
                                    : 'text-white hover:bg-gray-700'
                                }`
                              }
                              value={person}
                            >
                              {({ selected }) => (
                                <div className='flex items-center justify-between'>
                                  <span
                                    className={`font-medium ${selected ? 'text-blue-400' : ''}`}
                                  >
                                    {person.name}
                                  </span>
                                  {selected && (
                                    <ChevronUpDownIcon className='h-4 w-4 text-blue-400' />
                                  )}
                                </div>
                              )}
                            </Listbox.Option>
                          ))}
                        </div>
                      </Listbox.Options>
                    </Transition>
                  </Listbox>
                </div>
              </div>
              {/* Departure Date - same height as destination, but content short */}
              <div className='flex w-full flex-col justify-center lg:col-span-1 lg:translate-x-[100px]'>
                <div className='group relative h-full' ref={datePickerRef}>
                  <button
                    type='button'
                    className='relative flex h-full min-h-[70px] w-[150%] items-center rounded-xl border border-[#2D3035] bg-[#23252B] pr-10 text-left transition-all hover:border-[#393C43] hover:bg-[#26282F] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isChangingDropdown) return;

                      setIsChangingDropdown(true);
                      console.log(
                        'Date picker clicked, current dropdown:',
                        openDropdown
                      );
                      setOpenDropdown(
                        openDropdown === 'date' ? 'none' : 'date'
                      );
                      setTimeout(() => setIsChangingDropdown(false), 100);
                    }}
                    aria-haspopup='dialog'
                  >
                    <div className='w-full px-6 py-4'>
                      <div className='mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400 uppercase'>
                        <CalendarIcon className='h-4 w-4' />
                        DEPARTURE
                      </div>
                      <div className='mt-1 text-base font-semibold text-white'>
                        {selectedDate ? (
                          <span>
                            {selectedDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className='text-gray-400'>Select date</span>
                        )}
                      </div>
                      {selectedDate && (
                        <div className='mt-1 text-sm text-gray-400'>
                          {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                          })}
                        </div>
                      )}
                    </div>
                    <ChevronUpDownIcon className='pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-gray-400' />
                  </button>
                  <Transition
                    as={Fragment}
                    show={openDropdown === 'date'}
                    leave='transition ease-in duration-150'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                  >
                    <div className='absolute z-50 mt-2 w-full rounded-xl border border-[#2D3035] bg-[#23252B] shadow-2xl'>
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => {
                          setSelectedDate(date);
                          setOpenDropdown('none');
                        }}
                        minDate={new Date()}
                        inline
                        calendarClassName='shadow-2xl border-0 rounded-2xl bg-[#23252B] text-white'
                        dayClassName={() => 'text-white'}
                      />
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
            {/* Search Button below, centered */}
            <div className='flex justify-center'>
              <button
                onClick={handleSearch}
                disabled={!selectedDestination || !selectedDate || isSearching}
                style={{ marginTop: '20px' }}
                className='w-[320px] rounded-xl bg-blue-600 px-8 py-5 text-2xl font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-[#393C43] disabled:shadow-none'
              >
                {isSearching ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white'></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    <MagnifyingGlassIcon className='h-7 w-7' />
                    <span>Search</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .animate-blink {
          animation: blink-cursor 1.1s steps(1) infinite;
        }
        @keyframes blink-cursor {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
