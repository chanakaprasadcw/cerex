// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../../types';
import React from 'react';
import { Button } from './Button';

interface ModalProps {
  title: string;
  message?: string;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({
  title,
  message,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  const iconName = variant === 'danger' ? 'warning-outline' : 'help-circle-outline';
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-yellow-400';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700 animate-scale-up">
        <div className="p-6">
            <div className="flex items-start space-x-4">
              {message && (
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${variant === 'danger' ? 'bg-red-900/50' : 'bg-yellow-900/50'} sm:mx-0 sm:h-10 sm:w-10`}>
                  {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                  <ion-icon name={iconName} className={`h-6 w-6 ${iconColor}`}></ion-icon>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">{title}</h3>
                {message && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-400">{message}</p>
                    </div>
                )}
              </div>
            </div>
            {children && <div className="mt-4">{children}</div>}
        </div>

        {confirmText && (
            <div className="bg-gray-750/50 px-6 py-4 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3 rounded-b-lg">
              <Button onClick={onConfirm} variant={variant}>
                {confirmText}
              </Button>
              <Button onClick={onCancel} variant="secondary">
                {cancelText}
              </Button>
            </div>
        )}
      </div>
    </div>
  );
};