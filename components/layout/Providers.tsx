'use client';

import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>
        {children}
        <ToastContainer />
      </AppProvider>
    </ToastProvider>
  );
}
