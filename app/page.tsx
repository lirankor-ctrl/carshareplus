'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Car } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const IS_DEV = process.env.NODE_ENV === 'development';

export default function RootPage() {
  const router = useRouter();
  const { currentUser, isLoading, loadStatus, loadError } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      router.replace('/auth/login');
    } else if (!currentUser.groupId) {
      router.replace('/setup');
    } else {
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  if (loadError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-brand-50 gap-3 p-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <Car className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-sm text-red-600 font-semibold text-center">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 text-sm text-brand-600 font-medium underline"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-brand-50 gap-4">
      <Image
        src="/logo.jpg"
        alt="CarShare Family"
        width={64}
        height={64}
        priority
        className="w-16 h-16 rounded-2xl object-cover shadow-lg"
      />
      <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      {IS_DEV && (
        <p className="text-xs text-gray-400 font-mono mt-1">{loadStatus}</p>
      )}
    </div>
  );
}
