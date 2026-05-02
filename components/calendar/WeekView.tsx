'use client';

import React, { useRef, useEffect } from 'react';
import { Booking } from '@/types';
import { bookingService } from '@/services/bookingService';
import { HEBREW_DAYS_SHORT, getWeekDays, toDateString, isToday } from '@/lib/dateUtils';
import { lightenColor } from '@/lib/colors';
import { timeToMinutes, cn } from '@/lib/utils';

const HOUR_HEIGHT = 64;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const TOTAL_HEIGHT = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

function getTopPx(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const clampedH = Math.max(START_HOUR, Math.min(END_HOUR, h));
  return ((clampedH - START_HOUR) + m / 60) * HOUR_HEIGHT;
}

function getHeightPx(start: string, end: string): number {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max((diff / 60) * HOUR_HEIGHT, 24);
}

function getNowOffset(): number | null {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  if (h < START_HOUR || h > END_HOUR) return null;
  return ((h - START_HOUR) + m / 60) * HOUR_HEIGHT;
}

interface WeekViewProps {
  currentDate: Date;
  bookings: Booking[];
  currentUserId: string;
  onBookingClick: (booking: Booking) => void;
  onSlotClick: (date: Date, startTime?: string, endTime?: string) => void;
}

export default function WeekView({
  currentDate, bookings, currentUserId, onBookingClick, onSlotClick,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = getWeekDays(currentDate);

  useEffect(() => {
    if (scrollRef.current) {
      const offset = getNowOffset();
      scrollRef.current.scrollTop = offset !== null ? Math.max(0, offset - 140) : 0;
    }
  }, []);

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    if ((e.target as HTMLElement).closest('button[data-booking]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    const y = e.clientY - rect.top + scrollTop;
    const totalMins = START_HOUR * 60 + (y / HOUR_HEIGHT) * 60;
    const h = Math.floor(totalMins / 60);
    const m = Math.round((totalMins % 60) / 15) * 15;
    const normM = m >= 60 ? 0 : m;
    const normH = m >= 60 ? h + 1 : h;
    const cH = Math.max(START_HOUR, Math.min(END_HOUR - 1, normH));
    const startTime = `${cH.toString().padStart(2, '0')}:${normM.toString().padStart(2, '0')}`;
    const endH = Math.min(END_HOUR, cH + 1);
    const endTime = `${endH.toString().padStart(2, '0')}:${normM.toString().padStart(2, '0')}`;
    onSlotClick(day, startTime, endTime);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Day headers */}
      <div className="flex border-b border-gray-100 shrink-0">
        <div className="w-11 shrink-0" />
        {days.map((day, i) => {
          const dateStr = toDateString(day);
          const today = isToday(day);
          const dots = bookings.filter(b => b.date === dateStr);
          return (
            <button
              key={i}
              onClick={() => onSlotClick(day)}
              className={cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 hover:bg-brand-50 transition-colors',
                today && 'bg-brand-50/60'
              )}
            >
              <span className="text-[11px] text-gray-400 font-medium">
                {HEBREW_DAYS_SHORT[day.getDay()]}
              </span>
              <span className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors',
                today ? 'bg-brand-600 text-white' : 'text-gray-700'
              )}>
                {day.getDate()}
              </span>
              <div className="flex gap-0.5 h-2 items-center">
                {dots.slice(0, 4).map((b, idx) => (
                  <span
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: b.userColor }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: TOTAL_HEIGHT }}>
          {/* Time labels */}
          <div className="w-11 shrink-0 relative select-none">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 8 }}
              >
                <span className="text-[10px] text-gray-400 font-medium leading-none">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const dateStr = toDateString(day);
            const today = isToday(day);
            const dayBookings = bookings.filter(b => b.date === dateStr);
            const laid = bookingService.layoutBookingsForDay(dayBookings);
            const nowOffset = today ? getNowOffset() : null;

            return (
              <div
                key={dayIdx}
                className={cn(
                  'flex-1 relative border-r border-gray-100 last:border-r-0 cursor-pointer',
                  today && 'bg-brand-50/20'
                )}
                style={{ height: TOTAL_HEIGHT }}
                onClick={e => handleColumnClick(e, day)}
              >
                {/* Grid lines */}
                {HOURS.map(hour => (
                  <React.Fragment key={hour}>
                    <div
                      className="absolute w-full border-t border-gray-100 pointer-events-none"
                      style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                    />
                    <div
                      className="absolute w-full border-t border-gray-50 pointer-events-none"
                      style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  </React.Fragment>
                ))}

                {/* Current time indicator */}
                {nowOffset !== null && (
                  <div
                    className="absolute w-full z-20 pointer-events-none"
                    style={{ top: nowOffset }}
                  >
                    <div className="relative flex items-center">
                      <div
                        className="absolute w-2.5 h-2.5 rounded-full bg-brand-500 z-10"
                        style={{ right: -1 }}
                      />
                      <div className="w-full h-0.5 bg-brand-500 opacity-70" />
                    </div>
                  </div>
                )}

                {/* Booking blocks */}
                {laid.map(({ booking, col, totalCols }) => {
                  const top = getTopPx(booking.startTime);
                  const height = getHeightPx(booking.startTime, booking.endTime);
                  const pct = 100 / totalCols;
                  // use right-based positioning for natural RTL overlap rendering
                  const rightPct = col * pct;

                  return (
                    <button
                      key={booking.id}
                      data-booking="true"
                      onClick={e => { e.stopPropagation(); onBookingClick(booking); }}
                      className="absolute rounded-lg overflow-hidden transition-all hover:brightness-95 active:scale-[0.98] focus:outline-none text-right"
                      style={{
                        top: top + 1,
                        height: height - 2,
                        right: `calc(${rightPct}% + 1px)`,
                        width: `calc(${pct}% - 2px)`,
                        backgroundColor: lightenColor(booking.userColor, 0.82),
                        borderRight: `3px solid ${booking.userColor}`,
                      }}
                    >
                      <div className="p-1 h-full overflow-hidden">
                        <div className="flex items-center gap-0.5 leading-tight">
                          <span className="text-xs leading-none">{booking.userEmoji}</span>
                          <span
                            className="text-[11px] font-bold truncate"
                            style={{ color: booking.userColor }}
                          >
                            {booking.userName}
                          </span>
                        </div>
                        {height > 40 && (
                          <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            {booking.startTime}–{booking.endTime}
                          </div>
                        )}
                        {height > 64 && booking.note && (
                          <div className="text-[10px] text-gray-500 truncate leading-tight">
                            {booking.note}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
