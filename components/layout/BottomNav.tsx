'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'בית', icon: Home },
  { href: '/calendar', label: 'לוח שנה', icon: CalendarDays },
  { href: '/profile', label: 'פרופיל', icon: User2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-brand-100 safe-area-bottom md:hidden">
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors no-select',
                active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium', active && 'font-bold')}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
