'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { groupService } from '@/services/groupService';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

export default function JoinGroupPage() {
  const router = useRouter();
  const { currentUser, isLoading, refreshAll } = useApp();
  const { toast } = useToast();
  const [code,    setCode   ] = useState('');
  const [error,   setError  ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser)             router.replace('/auth/login');
      else if (currentUser.groupId) router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!code.trim()) { setError('יש להזין קוד הצטרפות'); return; }
    if (!currentUser) return;
    setLoading(true);
    try {
      const { group, error: err } = await groupService.joinGroup(code.trim(), currentUser.id);
      if (err || !group) { setError(err ?? 'שגיאה בהצטרפות'); return; }
      await refreshAll();
      toast(`הצטרפת לקבוצה "${group.carName}" 🎉`, 'success');
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
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">הצטרף לקבוצה</h1>
          <p className="text-sm text-gray-500 mt-1">הזן את קוד ההצטרפות שקיבלת</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">קוד הצטרפות</label>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="XXXXXX"
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                className={cn(
                  'w-full rounded-xl border bg-white px-4 py-3 text-2xl font-black tracking-[0.3em] text-center text-brand-700 font-mono uppercase',
                  'focus:outline-none focus:ring-2 focus:ring-brand-400',
                  error ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} disabled={code.length < 3}>
              הצטרף לקבוצה
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
