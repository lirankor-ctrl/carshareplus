'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import CalendarView from '@/components/calendar/CalendarView';
import { useApp } from '@/contexts/AppContext';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  const router = useRouter();
  const { currentUser, group, bookings, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) router.replace('/auth/login');
      else if (!currentUser.groupId) router.replace('/setup');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser || !group) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-50">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    // Empty state overlay — still show calendar but with a hint
  }

  return (
    <div className="h-dvh flex flex-col bg-white overflow-hidden">
      <Header title="לוח שנה" />

      {/* Calendar takes all remaining height */}
      <div className="flex-1 overflow-hidden pb-16 md:pb-0">
        <CalendarView
          bookings={bookings}
          currentUserId={currentUser.id}
        />
      </div>

      {/* Empty state hint */}
      {bookings.length === 0 && (
        <div className="absolute inset-x-0 bottom-20 md:bottom-4 pointer-events-none flex justify-center">
          <div className="bg-white/90 backdrop-blur rounded-2xl px-5 py-3 shadow-lg border border-brand-100 flex items-center gap-2 pointer-events-auto">
            <CalendarDays className="w-4 h-4 text-brand-500 shrink-0" />
            <p className="text-sm text-gray-600 font-medium">
              לוח הזמנים ריק — לחץ + כדי להוסיף בקשה ראשונה
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
