'use client';

import { Booking } from '@/types';
import {
  HEBREW_DAYS_SHORT, HEBREW_MONTHS, getMonthGrid,
  toDateString, isSameMonth, isToday,
} from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  bookings: Booking[];
  onDayClick: (date: Date) => void;
}

export default function MonthView({ currentDate, bookings, onDayClick }: MonthViewProps) {
  const grid = getMonthGrid(currentDate);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Month heading */}
      <div className="text-center py-2 text-sm font-bold text-brand-700 border-b border-gray-100">
        {HEBREW_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>

      {/* Day-name row */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {HEBREW_DAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 grid grid-rows-6 divide-y divide-gray-100">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-100 rtl:divide-x-reverse">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="bg-gray-50/50" />;

              const dateStr = toDateString(day);
              const dayBookings = bookings.filter(b => b.date === dateStr);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <button
                  key={di}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'flex flex-col items-center py-1 px-0.5 gap-0.5 hover:bg-brand-50 transition-colors min-h-0',
                    !inMonth && 'opacity-40',
                    today && 'bg-brand-50'
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold',
                    today ? 'bg-brand-600 text-white' : 'text-gray-700'
                  )}>
                    {day.getDate()}
                  </span>
                  {/* Booking color dots */}
                  {dayBookings.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 w-full px-0.5">
                      {dayBookings.slice(0, 3).map((b, idx) => (
                        <span
                          key={idx}
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: b.userColor }}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[8px] text-gray-400 font-medium leading-none">
                          +{dayBookings.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
