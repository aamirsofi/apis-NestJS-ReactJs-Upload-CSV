import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Export types for use in other files
export type { Toast };

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
  darkMode?: boolean;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose, darkMode = false }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 5000; // Default 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles = 'relative flex items-center gap-3 p-4 rounded-xl shadow-lg backdrop-blur-md border-2 transition-all duration-300 transform';
    
    if (isExiting) {
      return `${baseStyles} opacity-0 translate-x-full`;
    }
    
    return `${baseStyles} opacity-100 translate-x-0`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return darkMode
          ? 'bg-green-500/20 border-green-400/50 text-green-300'
          : 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return darkMode
          ? 'bg-red-500/20 border-red-400/50 text-red-300'
          : 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return darkMode
          ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return darkMode
          ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
          : 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    const iconClass = 'w-5 h-5 flex-shrink-0';
    
    switch (toast.type) {
      case 'success':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`${getToastStyles()} ${getTypeStyles()}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
          darkMode
            ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
            : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;

