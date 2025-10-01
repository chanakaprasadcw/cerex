import React from 'react';
import { Button } from './Button';
// FIX: Changed to a value import to ensure global type declarations from types.ts are loaded.
import {} from '../../types';

interface ModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  const iconName = variant === 'danger' ? 'warning-outline' : 'help-circle-outline';
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-yellow-400';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-start space-x-4">
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${variant === 'danger' ? 'bg-red-900/50' : 'bg-yellow-900/50'} sm:mx-0 sm:h-10 sm:w-10`}>
             <ion-icon name={iconName} className={`h-6 w-6 ${iconColor}`}></ion-icon>
          </div>
          <div className="flex-1">
            <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-400">{message}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse space-y-2 sm:space-y-0 sm:space-x-reverse sm:space-x-3">
          <Button onClick={onConfirm} variant={variant}>
            {confirmText}
          </Button>
          <Button onClick={onCancel} variant="secondary">
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};
