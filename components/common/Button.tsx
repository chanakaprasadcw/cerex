import React from 'react';
// FIX: Changed to a value import to ensure global type declarations from types.ts are loaded.
import {} from '../../types';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconName?: string;
  className?: string;
}

const baseClasses = 'inline-flex items-center justify-center font-semibold border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent focus:ring-blue-500',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 focus:ring-gray-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500',
  'danger-outline': 'bg-transparent hover:bg-red-500/10 text-red-400 border-red-500/50 hover:border-red-500/80 focus:ring-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  iconName,
  className = '',
  ...props
}) => {
  const iconSizeClass = size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {iconName && <ion-icon name={iconName} className={`${children ? 'mr-2' : ''} ${iconSizeClass}`}></ion-icon>}
      {children}
    </button>
  );
};
