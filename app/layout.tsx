import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/layout/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'CarShare Family — לוח שנה משותף לרכב המשפחתי',
  description: 'ניהול תורים לרכב המשותף של המשפחה בצורה פשוטה ונוחה',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning prevents false positives from browser extensions
    // that inject attributes onto <html> / <body> after SSR.
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
