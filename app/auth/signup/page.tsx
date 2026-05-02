'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { USER_COLORS, PROFILE_EMOJIS, COLOR_NAMES } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface FormState {
  name: string; email: string; password: string;
  emoji: string; color: string;
}
interface FormErrors {
  name?: string; email?: string; password?: string; general?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { refreshAll } = useApp();
  const { toast } = useToast();
  const [showPw,  setShowPw ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm   ] = useState<FormState>({
    name: '', email: '', password: '',
    emoji: PROFILE_EMOJIS[0], color: USER_COLORS[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (key: keyof FormState) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())  e.name = 'יש להזין שם';
    if (!form.email.trim()) e.email = 'יש להזין אימייל';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'כתובת אימייל לא תקינה';
    if (!form.password)          e.password = 'יש להזין סיסמה';
    else if (form.password.length < 4) e.password = 'הסיסמה חייבת להכיל לפחות 4 תווים';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, error } = await authService.signup({
        name:         form.name.trim(),
        email:        form.email.trim(),
        password:     form.password,
        profileEmoji: form.emoji,
        color:        form.color,
      });
      if (error || !user) {
        setErrors({ general: error ?? 'שגיאה בהרשמה' });
        return;
      }
      await refreshAll();
      toast(`ברוך הבא, ${user.name}! 🎉`, 'success');
      router.replace('/setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">הרשמה חדשה</h1>
          <p className="text-xs text-gray-500 mt-1">הצטרף לניהול הרכב המשפחתי</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Emoji picker */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">בחר/י אייקון</p>
              <div className="grid grid-cols-8 gap-1.5">
                {PROFILE_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => set('emoji')(e)}
                    className={cn(
                      'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                      form.emoji === e ? 'bg-brand-100 ring-2 ring-brand-500 scale-110' : 'hover:bg-gray-100'
                    )}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">בחר/י צבע</p>
              <div className="flex flex-wrap gap-2">
                {USER_COLORS.map(c => (
                  <button key={c} type="button" title={COLOR_NAMES[c]}
                    onClick={() => set('color')(c)}
                    className="w-8 h-8 rounded-full transition-all hover:scale-105"
                    style={{
                      backgroundColor: c,
                      boxShadow: form.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                      transform: form.color === c ? 'scale(1.1)' : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            <Input label="שם מלא" type="text" placeholder="השם שלך"
              value={form.name} onChange={e => set('name')(e.target.value)}
              error={errors.name} autoComplete="name" />

            <Input label="אימייל" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => set('email')(e.target.value)}
              error={errors.email} autoComplete="email" inputMode="email" />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">סיסמה</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password')(e.target.value)}
                  placeholder="לפחות 4 תווים" autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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

            <Button type="submit" fullWidth size="lg" loading={loading}>הרשמה</Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          יש לך כבר חשבון?{' '}
          <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">כניסה</Link>
        </p>
      </div>
    </div>
  );
}
