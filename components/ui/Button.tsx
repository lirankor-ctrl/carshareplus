import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          {
            'bg-brand-600 text-white hover:bg-brand-700 shadow-sm active:scale-[0.98]': variant === 'primary',
            'bg-mint-100 text-brand-700 hover:bg-mint-200 border border-mint-200': variant === 'secondary',
            'bg-transparent text-brand-600 hover:bg-mint-50': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 shadow-sm': variant === 'danger',
            'border border-brand-300 text-brand-700 hover:bg-mint-50 bg-white': variant === 'outline',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
