'use client';

import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const CONFIG = {
  success: {
    icon: CheckCircle2,
    border: 'border-green-200',
    icon_cls: 'text-green-600',
    bg: 'bg-white',
  },
  error: {
    icon: XCircle,
    border: 'border-red-200',
    icon_cls: 'text-red-500',
    bg: 'bg-white',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-200',
    icon_cls: 'text-amber-500',
    bg: 'bg-white',
  },
  info: {
    icon: Info,
    border: 'border-blue-200',
    icon_cls: 'text-blue-500',
    bg: 'bg-white',
  },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-24 left-4 z-[200] flex flex-col gap-2 pointer-events-none md:bottom-6 md:left-6"
      aria-live="polite"
    >
      {toasts.map(t => {
        const { icon: Icon, border, icon_cls, bg } = CONFIG[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'toast-enter flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg border pointer-events-auto max-w-xs',
              bg, border
            )}
          >
            <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', icon_cls)} />
            <p className="text-sm font-medium text-gray-800 flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
