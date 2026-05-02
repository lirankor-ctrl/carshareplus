'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, isLoading, refreshAll } = useApp();
  const { toast } = useToast();
  const [email,    setEmail   ] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw  ] = useState(false);
  const [loading,  setLoading ] = useState(false);
  const [errors,   setErrors  ] = useState<{ email?: string; password?: string; general?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace(currentUser.groupId ? '/dashboard' : '/setup');
    }
  }, [currentUser, isLoading, router]);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())    e.email    = 'יש להזין כתובת אימייל';
    if (!password)        e.password = 'יש להזין סיסמה';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, error } = await authService.login(email.trim(), password);
      if (error || !user) {
        setErrors({ general: error ?? 'שגיאה בכניסה' });
        return;
      }
      // Load full context data before navigating
      await refreshAll();
      toast(`ברוך הבא, ${user.name}! 👋`, 'success');
      router.replace(user.groupId ? '/dashboard' : '/setup');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-50">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">CarShare Family</h1>
          <p className="text-sm text-gray-500 mt-1">לוח הזמנים המשותף לרכב</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">כניסה לחשבון</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="אימייל"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              inputMode="email"
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">סיסמה</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="הסיסמה שלך"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <p className="text-sm text-red-600 font-medium">{errors.general}</p>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>כניסה</Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          אין לך חשבון?{' '}
          <Link href="/auth/signup" className="text-brand-600 font-semibold hover:underline">הרשמה</Link>
        </p>
      </div>
    </div>
  );
}
