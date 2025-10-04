
// FIX: Add a side-effect import to ensure global JSX types are loaded.
import '../../types';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden transition duration-300 ease-in-out hover:border-gray-600/80 ${className}`}>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
