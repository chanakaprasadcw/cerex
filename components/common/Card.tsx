

import React from 'react';
// FIX: Add a side-effect import to ensure global JSX types are loaded.
import {} from '../../types';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
