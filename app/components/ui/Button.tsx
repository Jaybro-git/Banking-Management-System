import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'filter';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  active = false,
  type = 'button',
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 border flex items-center justify-center space-x-2 transform';

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary:
      'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-95',
    secondary:
      'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-200 active:scale-95',
    danger:
      'text-red-600 hover:bg-red-100 border-transparent active:bg-red-200 active:scale-95',
    filter: active
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:text-emerald-600 active:bg-gray-100 active:scale-95',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
