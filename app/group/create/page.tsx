'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Car } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { groupService } from '@/services/groupService';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';

export default function CreateGroupPage() {
  const router = useRouter();
  const { currentUser, isLoading, refreshAll } = useApp();
  const { toast } = useToast();
  const [carName,  setCarName ] = useState('');
  const [error,    setError   ] = useState('');
  const [loading,  setLoading ] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser)         router.replace('/auth/login');
      else if (currentUser.groupId) router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!carName.trim()) { setError('יש לתת שם לרכב'); return; }
    if (!currentUser) return;
    setLoading(true);
    try {
      const { group, error: err } = await groupService.createGroup(carName.trim(), currentUser.id);
      if (err || !group) { setError(err ?? 'שגיאה ביצירת הקבוצה'); return; }
      await refreshAll();
      toast(`קבוצה "${group.carName}" נוצרה! 🚗`, 'success');
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/setup" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowRight className="w-4 h-4" />חזרה
        </Link>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">צור קבוצה חדשה</h1>
          <p className="text-sm text-gray-500 mt-1">קבוצה = רכב אחד + כל המשפחה</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="שם הרכב" placeholder="לדוגמה: ג'יפ לבן, פרייוס כחול"
              value={carName}
              onChange={e => { setCarName(e.target.value); setError(''); }}
              error={error} autoFocus />

            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3">
              <p className="text-xs text-brand-700 font-medium">
                לאחר היצירה תקבל קוד הצטרפות לשיתוף עם בני המשפחה.
              </p>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>צור קבוצה</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
