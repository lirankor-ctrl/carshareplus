'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { authService } from '@/services/authService';
import Avatar from '@/components/ui/Avatar';

interface HeaderProps {
  title?: string;
  backHref?: string;
}

export default function Header({ title, backHref }: HeaderProps) {
  const { currentUser } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    // AppContext SIGNED_OUT handler clears state automatically
    router.replace('/auth/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-brand-100 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shrink-0">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-brand-700 text-base hidden sm:block">
              CarShare Family
            </span>
          </Link>
          {title && (
            <>
              <span className="text-gray-300 hidden sm:block">/</span>
              <span className="font-semibold text-gray-700 truncate text-sm sm:text-base">
                {title}
              </span>
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <>
              <Link href="/profile">
                <Avatar
                  emoji={currentUser.profileEmoji}
                  color={currentUser.color}
                  size="sm"
                  className="cursor-pointer hover:scale-105 transition-transform"
                />
              </Link>
              <button
                onClick={handleLogout}
                title="התנתקות"
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
