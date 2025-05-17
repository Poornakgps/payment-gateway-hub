import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  icon = null 
}) => {
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'outline':
        return 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500';
      case 'ghost':
        return 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'medium':
        return 'px-4 py-2';
      case 'large':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;