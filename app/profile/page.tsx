'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Save } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { authService } from '@/services/authService';
import { groupService } from '@/services/groupService';
import { PROFILE_EMOJIS, USER_COLORS, COLOR_NAMES } from '@/lib/colors';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, group, isLoading, refreshAll } = useApp();
  const { toast } = useToast();
  const [name,         setName        ] = useState('');
  const [emoji,        setEmoji       ] = useState('');
  const [color,        setColor       ] = useState('');
  const [saving,       setSaving      ] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) router.replace('/auth/login');
      else {
        setName(currentUser.name);
        setEmoji(currentUser.profileEmoji);
        setColor(currentUser.color);
      }
    }
  }, [currentUser, isLoading, router]);

  const handleSave = async () => {
    if (!currentUser || !name.trim()) return;
    setSaving(true);
    try {
      const { error } = await authService.updateUser(currentUser.id, {
        name:         name.trim(),
        profileEmoji: emoji,
        color,
      });
      if (error) { toast(error, 'error'); return; }
      await refreshAll();
      toast('הפרופיל עודכן בהצלחה ✓', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    // AppContext SIGNED_OUT handler clears state automatically
    toast('התנתקת בהצלחה', 'info');
    router.replace('/auth/login');
  };

  const handleLeaveGroup = async () => {
    if (!currentUser?.groupId) return;
    await groupService.leaveGroup(currentUser.id, currentUser.groupId);
    await refreshAll();
    toast('עזבת את הקבוצה', 'info');
    router.replace('/setup');
  };

  const isDirty = currentUser && (
    name  !== currentUser.name         ||
    emoji !== currentUser.profileEmoji ||
    color !== currentUser.color
  );

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-50">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-brand-50 pb-24 md:pb-6">
      <Header title="פרופיל" />

      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Avatar preview */}
        <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-3 shadow-sm border border-gray-100">
          <Avatar emoji={emoji} color={color} size="xl" />
          <div className="text-center">
            <p className="font-black text-gray-900 text-lg">{name || currentUser.name}</p>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <h2 className="font-bold text-gray-800">עריכת פרופיל</h2>

          <Input label="שם" value={name} onChange={e => setName(e.target.value)} placeholder="השם שלך" />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">אייקון</p>
            <div className="grid grid-cols-8 gap-1.5">
              {PROFILE_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={cn(
                    'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                    emoji === e ? 'bg-brand-100 ring-2 ring-brand-500 scale-110' : 'hover:bg-gray-100'
                  )}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">צבע</p>
            <div className="flex flex-wrap gap-2">
              {USER_COLORS.map(c => (
                <button key={c} type="button" title={COLOR_NAMES[c]} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all hover:scale-105"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                    transform: color === c ? 'scale(1.1)' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!isDirty} className="gap-2">
            <Save className="w-4 h-4" />שמור שינויים
          </Button>
        </div>

        {/* Group info */}
        {group && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-3">הקבוצה שלי</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">{group.carName}</p>
                <p className="text-xs text-gray-500 mt-0.5">קוד: {group.joinCode}</p>
              </div>
              <button onClick={() => setConfirmLeave(true)}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                עזוב קבוצה
              </button>
            </div>

            {confirmLeave && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col gap-2">
                <p className="text-sm text-red-700 font-medium">לעזוב את הקבוצה?</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1 text-gray-600" onClick={() => setConfirmLeave(false)}>ביטול</Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={handleLeaveGroup}>כן, עזוב</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-red-200 text-red-500 hover:bg-red-50 font-semibold text-sm transition-colors">
          <LogOut className="w-4 h-4" />התנתקות
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
