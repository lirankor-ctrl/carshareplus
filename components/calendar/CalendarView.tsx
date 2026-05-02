'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Plus, CalendarDays, LayoutGrid } from 'lucide-react';
import WeekView from './WeekView';
import MonthView from './MonthView';
import BookingModal from './BookingModal';
import BookingDetailsModal from './BookingDetailsModal';
import { Booking, CalendarView } from '@/types';
import {
  addWeeks, subWeeks, addMonths, subMonths,
  formatMonthYearHebrew, HEBREW_MONTHS, toDateString,
} from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  bookings: Booking[];
  currentUserId: string;
}

export default function CalendarViewComponent({ bookings, currentUserId }: CalendarViewProps) {
  const [view, setView] = useState<CalendarView>('week');
  // Initialise to null on server; set to real Date in effect to avoid SSR/CSR mismatch
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  useEffect(() => { setCurrentDate(d => d ?? new Date()); }, []);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [createModal, setCreateModal] = useState<{
    open: boolean;
    date?: string;
    start?: string;
    end?: string;
  }>({ open: false });

  const navigate = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const base = prev ?? new Date();
      if (view === 'week') return dir === 'next' ? addWeeks(base, 1) : subWeeks(base, 1);
      return dir === 'next' ? addMonths(base, 1) : subMonths(base, 1);
    });
  };

  const goToday = () => setCurrentDate(new Date());

  const getTitle = () => {
    const d = currentDate ?? new Date();
    if (view === 'week') {
      const today = new Date();
      const sameWeekAsToday = Math.abs(d.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000;
      if (sameWeekAsToday) return 'השבוע הנוכחי';
      return `${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    return formatMonthYearHebrew(d);
  };

  const openCreate = (date?: Date, start?: string, end?: string) => {
    setCreateModal({
      open: true,
      date: date ? toDateString(date) : undefined,
      start,
      end,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-white shrink-0">
        {/* Navigation */}
        <button
          onClick={() => navigate('next')}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="הקודם"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate('prev')}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="הבא"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Title + Today */}
        <button
          onClick={goToday}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-brand-50 transition-colors"
        >
          <span className="text-sm font-bold text-gray-800">{getTitle()}</span>
        </button>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
          <button
            onClick={() => setView('week')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === 'week'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:block">שבועי</span>
          </button>
          <button
            onClick={() => setView('month')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === 'month'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:block">חודשי</span>
          </button>
        </div>

        {/* Add button (desktop) */}
        <button
          onClick={() => openCreate()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          הוסף בקשה
        </button>
      </div>

      {/* Calendar body — defer rendering until currentDate is set on the client */}
      <div className="flex-1 overflow-hidden">
        {currentDate && view === 'week' && (
          <WeekView
            currentDate={currentDate}
            bookings={bookings}
            currentUserId={currentUserId}
            onBookingClick={setSelectedBooking}
            onSlotClick={(date, start, end) => openCreate(date, start, end)}
          />
        )}
        {currentDate && view === 'month' && (
          <MonthView
            currentDate={currentDate}
            bookings={bookings}
            onDayClick={date => openCreate(date)}
          />
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => openCreate()}
        className="sm:hidden fixed bottom-20 left-4 z-40 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all"
        aria-label="הוסף בקשה"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <BookingModal
        open={createModal.open}
        onClose={() => setCreateModal({ open: false })}
        prefillDate={createModal.date}
        prefillStart={createModal.start}
        prefillEnd={createModal.end}
      />

      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
