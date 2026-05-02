import { cn } from '@/lib/utils';
import { lightenColor } from '@/lib/colors';

interface AvatarProps {
  emoji: string;
  color: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: { outer: 'w-7 h-7', text: 'text-sm', ring: 'ring-2' },
  sm: { outer: 'w-9 h-9', text: 'text-base', ring: 'ring-2' },
  md: { outer: 'w-11 h-11', text: 'text-xl', ring: 'ring-2' },
  lg: { outer: 'w-14 h-14', text: 'text-2xl', ring: 'ring-2' },
  xl: { outer: 'w-20 h-20', text: 'text-4xl', ring: 'ring-[3px]' },
};

export default function Avatar({ emoji, color, name, size = 'md', showName, className }: AvatarProps) {
  const { outer, text, ring } = SIZE_MAP[size];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center shrink-0 select-none',
          outer, ring
        )}
        style={{
          backgroundColor: lightenColor(color, 0.82),
          boxShadow: `0 0 0 2px ${color}`,
        }}
      >
        <span className={text}>{emoji}</span>
      </div>
      {showName && name && (
        <span className="text-xs font-medium text-gray-600 text-center max-w-[60px] truncate">
          {name}
        </span>
      )}
    </div>
  );
}
