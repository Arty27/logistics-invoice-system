'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ActionButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionButtonVariant;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  children: ReactNode;
};

const variantStyles: Record<ActionButtonVariant, string> = {
  primary:
    'bg-[#f14902] text-white shadow-[0_4px_12px_rgba(241,73,2,0.16)] hover:bg-[#d94000] hover:shadow-[0_5px_16px_rgba(241,73,2,0.22)] focus:ring-[#f14902]/15',

  secondary:
    'border border-[#d8d6d4] bg-white text-[#393536] hover:bg-[#f7f7f6] hover:border-[#c5c2c0] focus:ring-[#393536]/10',

  success:
    'bg-[#217346] text-white shadow-[0_4px_12px_rgba(33,115,70,0.16)] hover:bg-[#185c37] hover:shadow-[0_5px_16px_rgba(33,115,70,0.22)] focus:ring-[#217346]/15',

  danger:
    'bg-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.14)] hover:bg-red-700 hover:shadow-[0_5px_16px_rgba(220,38,38,0.20)] focus:ring-red-500/15',
};

export default function ActionButton({
  variant = 'primary',
  loading = false,
  loadingText,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-200 outline-none focus:ring-4 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText ?? 'Loading...'}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
