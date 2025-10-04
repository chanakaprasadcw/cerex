// hooks/useToast.tsx
import '../types'; // For side effects
import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  icon: string;
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);
  
  const typeClasses = {
    success: 'bg-green-600/90 border-green-500',
    error: 'bg-red-600/90 border-red-500',
    info: 'bg-blue-600/90 border-blue-500',
  };

  return (
    <div className={`flex items-center p-4 rounded-lg shadow-2xl text-white border-l-4 animate-slide-in-right backdrop-blur-sm ${typeClasses[toast.type]}`}>
      {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
      <ion-icon name={toast.icon} className="text-2xl mr-3 flex-shrink-0"></ion-icon>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="ml-4 p-1 rounded-full hover:bg-white/10 flex-shrink-0">
        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
        <ion-icon name="close-outline" className="text-xl"></ion-icon>
      </button>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icons = {
      success: 'checkmark-circle-outline',
      error: 'alert-circle-outline',
      info: 'information-circle-outline'
    };
    const newToast: ToastMessage = {
      id: Date.now(),
      message,
      type,
      icon: icons[type],
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};