// src/hooks/useToast.js

import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for toast notifications
 * Manages toast state and provides show/hide functionality
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + toastIdRef.current++;
    
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return { 
    toasts, 
    showToast, 
    removeToast, 
    clearAllToasts 
  };
}
