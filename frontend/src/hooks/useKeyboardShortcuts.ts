import { useEffect, useRef } from 'react';

interface KeyboardShortcutsConfig {
  onUpload?: () => void;
  onCloseModal?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * 
 * Shortcuts:
 * - Ctrl+U / Cmd+U: Trigger file upload
 * - Esc: Close modals or cancel actions
 */
export const useKeyboardShortcuts = ({
  onUpload,
  onCloseModal,
  onEscape,
  disabled = false,
}: KeyboardShortcutsConfig) => {
  const handlersRef = useRef({ onUpload, onCloseModal, onEscape });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = { onUpload, onCloseModal, onEscape };
  }, [onUpload, onCloseModal, onEscape]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Ctrl+U or Cmd+U: Trigger upload
      if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        // Don't prevent default if user is in an input (they might want to underline text)
        if (!isInputFocused) {
          event.preventDefault();
          handlersRef.current.onUpload?.();
        }
      }

      // Esc: Close modal or cancel action
      if (event.key === 'Escape') {
        // Always allow Esc, even in inputs (common UX pattern)
        handlersRef.current.onCloseModal?.();
        handlersRef.current.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled]);
};

