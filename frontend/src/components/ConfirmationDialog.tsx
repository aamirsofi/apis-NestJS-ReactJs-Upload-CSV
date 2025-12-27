import { useEffect } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningMessage?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  warningMessage,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  darkMode = false,
  variant = 'danger',
  isLoading = false,
}) => {
  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: darkMode ? 'bg-red-500/20' : 'bg-red-100',
          iconColor: darkMode ? 'text-red-400' : 'text-red-600',
          borderColor: darkMode ? 'border-red-500/30' : 'border-red-200',
          buttonBg: darkMode
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50'
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          warningBg: darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200',
          warningText: darkMode ? 'text-red-300' : 'text-red-800',
        };
      case 'warning':
        return {
          iconBg: darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100',
          iconColor: darkMode ? 'text-yellow-400' : 'text-yellow-600',
          borderColor: darkMode ? 'border-yellow-500/30' : 'border-yellow-200',
          buttonBg: darkMode
            ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500/50'
            : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          warningBg: darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200',
          warningText: darkMode ? 'text-yellow-300' : 'text-yellow-800',
        };
      default:
        return {
          iconBg: darkMode ? 'bg-blue-500/20' : 'bg-blue-100',
          iconColor: darkMode ? 'text-blue-400' : 'text-blue-600',
          borderColor: darkMode ? 'border-blue-500/30' : 'border-blue-200',
          buttonBg: darkMode
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/50'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          warningBg: darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200',
          warningText: darkMode ? 'text-blue-300' : 'text-blue-800',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click handler */}
      <div
        className="absolute inset-0"
        onClick={isLoading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`relative card-modern${darkMode ? '-dark' : ''} rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 ${styles.borderColor} animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${styles.iconBg}`}>
          {variant === 'danger' ? (
            <svg
              className={`w-8 h-8 ${styles.iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : variant === 'warning' ? (
            <svg
              className={`w-8 h-8 ${styles.iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className={`w-8 h-8 ${styles.iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h3
          className={`text-xl font-bold text-center mb-3 ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          className={`text-center mb-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {message}
        </p>

        {/* Warning Message */}
        {warningMessage && (
          <div
            className={`p-4 rounded-xl border mb-6 ${styles.warningBg} ${styles.warningText}`}
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-medium">{warningMessage}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-smooth ${
              isLoading
                ? 'cursor-not-allowed opacity-50'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-smooth ${
              isLoading
                ? `${styles.buttonBg} cursor-not-allowed opacity-70`
                : `${styles.buttonBg} shadow-lg hover:shadow-xl hover:scale-105`
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

