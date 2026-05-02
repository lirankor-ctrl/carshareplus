'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Plus, Users } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import Avatar from '@/components/ui/Avatar';

export default function SetupPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) router.replace('/auth/login');
      else if (currentUser.groupId) router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-50">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Avatar emoji={currentUser.profileEmoji} color={currentUser.color} size="xl" className="mb-3" />
          <h1 className="text-xl font-black text-gray-900">שלום, {currentUser.name}!</h1>
          <p className="text-sm text-gray-500 mt-1">
            טרם הצטרפת לקבוצת רכב. מה תרצה לעשות?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Create group */}
          <button
            onClick={() => router.push('/group/create')}
            className="group relative bg-white border-2 border-brand-200 hover:border-brand-500 rounded-3xl p-6 text-right transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-100 group-hover:bg-brand-200 rounded-2xl flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">צור קבוצה חדשה</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  פתח קבוצה לרכב המשפחתי ושלח קוד לבני המשפחה
                </p>
              </div>
            </div>
          </button>

          {/* Join group */}
          <button
            onClick={() => router.push('/group/join')}
            className="group relative bg-white border-2 border-gray-200 hover:border-brand-300 rounded-3xl p-6 text-right transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-brand-50 rounded-2xl flex items-center justify-center transition-colors">
                <Users className="w-6 h-6 text-gray-500 group-hover:text-brand-600 transition-colors" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">הצטרף לקבוצה קיימת</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  יש לך קוד הצטרפות? הכנס אותו כאן
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Car illustration */}
        <div className="flex justify-center mt-10">
          <Car className="w-16 h-16 text-brand-200" />
        </div>
      </div>
    </div>
  );
}
