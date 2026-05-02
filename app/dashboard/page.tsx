'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Car, CheckCircle2, XCircle, Plus, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import JoinCodeDisplay from '@/components/group/JoinCodeDisplay';
import Avatar from '@/components/ui/Avatar';
import { useApp } from '@/contexts/AppContext';
import { HEBREW_MONTHS } from '@/lib/dateUtils';
import { timeToMinutes } from '@/lib/utils';
import { lightenColor } from '@/lib/colors';

function useCarStatus(bookings: ReturnType<typeof useApp>['bookings']) {
  return useMemo(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const active = bookings.filter(b =>
      b.date === dateStr &&
      timeToMinutes(b.startTime) <= timeToMinutes(timeStr) &&
      timeToMinutes(b.endTime) > timeToMinutes(timeStr)
    );
    return active;
  }, [bookings]);
}

function formatUpcoming(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff === -1) return 'אתמול';
  return `${d} ב${HEBREW_MONTHS[m - 1]}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, group, members, bookings, isLoading } = useApp();
  const activeBookings = useCarStatus(bookings);
  const carBusy = activeBookings.length > 0;

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) router.replace('/auth/login');
      else if (!currentUser.groupId) router.replace('/setup');
    }
  }, [currentUser, isLoading, router]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
    return bookings
      .filter(b => b.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [bookings]);

  if (isLoading || !currentUser || !group) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-50">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-brand-50 pb-20 md:pb-0">
      <Header title={group.carName} />

      <main className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-5">

        {/* Car status card */}
        <div className={`rounded-3xl p-5 flex items-center gap-4 shadow-sm border transition-colors ${
          carBusy
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-brand-200'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            carBusy ? 'bg-red-100' : 'bg-brand-100'
          }`}>
            <Car className={`w-7 h-7 ${carBusy ? 'text-red-500' : 'text-brand-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {carBusy ? (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
              )}
              <span className={`font-black text-base ${carBusy ? 'text-red-700' : 'text-brand-700'}`}>
                {carBusy ? 'הרכב תפוס עכשיו' : 'הרכב פנוי עכשיו'}
              </span>
            </div>
            {carBusy && activeBookings[0] && (
              <p className="text-sm text-red-600">
                {activeBookings[0].userEmoji} {activeBookings[0].userName} — עד {activeBookings[0].endTime}
              </p>
            )}
            {!carBusy && (
              <p className="text-sm text-gray-500">אין הזמנות פעילות כרגע</p>
            )}
          </div>
        </div>

        {/* Group members */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <h2 className="font-bold text-gray-800 text-sm">חברי הקבוצה</h2>
              <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
                {members.length}/9
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Avatar emoji={m.profileEmoji} color={m.color} size="sm" />
                  {m.id === currentUser.id && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-brand-600 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-[10px] text-gray-500 font-medium max-w-[48px] truncate text-center">
                  {m.id === currentUser.id ? 'אני' : m.name.split(' ')[0]}
                </span>
              </div>
            ))}
            {members.length < 9 && (
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-[10px] text-gray-400">הזמן</span>
              </div>
            )}
          </div>
        </div>

        {/* Join code */}
        <JoinCodeDisplay group={group} />

        {/* Upcoming bookings */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-600" />
              <h2 className="font-bold text-gray-800 text-sm">בקשות קרובות</h2>
            </div>
            <Link href="/calendar" className="text-xs text-brand-600 font-semibold hover:underline">
              כל הלוח
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center gap-2">
              <CalendarDays className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-400 font-medium">אין בקשות קרובות</p>
              <Link
                href="/calendar"
                className="text-xs text-brand-600 font-semibold hover:underline mt-1"
              >
                הוסף בקשה ראשונה
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {upcomingBookings.map(b => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: b.userColor }}
                  />
                  <span className="text-base leading-none">{b.userEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.userName}</p>
                    {b.note && (
                      <p className="text-xs text-gray-400 truncate">{b.note}</p>
                    )}
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-xs font-bold text-gray-600">{formatUpcoming(b.date)}</p>
                    <p className="text-xs text-gray-400">{b.startTime}–{b.endTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick add CTA */}
        <Link
          href="/calendar"
          className="flex items-center justify-center gap-2 w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-sm hover:bg-brand-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          הוסף בקשה חדשה לרכב
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
