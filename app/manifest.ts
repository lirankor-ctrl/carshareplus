import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CarShare Family — לוח שנה משותף לרכב המשפחתי',
    short_name: 'CarShare',
    description: 'ניהול תורים לרכב המשותף של המשפחה בצורה פשוטה ונוחה',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    dir: 'rtl',
    lang: 'he',
    icons: [
      {
        src: '/logo.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
    ],
  };
}
