

import React from 'react';
// FIX: Add a side-effect import to ensure global JSX types are loaded.
import {} from '../../types';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name?: string;
}

export const Input: React.FC<InputProps> = ({ label, name, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3 ${className}`}
        {...props}
      />
    </div>
  );
};
