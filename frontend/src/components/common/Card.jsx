import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  footer, 
  className = '', 
  bodyClassName = '',
  hover = false
}) => {
  return (
    <div className={`bg-white rounded-lg shadow ${hover ? 'card-hover' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={`px-6 py-4 ${bodyClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;