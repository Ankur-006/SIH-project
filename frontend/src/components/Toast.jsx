/**
 * Toast Notification System
 * Accessible globally via window events or helper methods.
 */

import { useState, useEffect } from 'react';

// Global helper
export const showToast = (message, type = 'info', duration = 4000) => {
  window.dispatchEvent(
    new CustomEvent('mailguard:toast', {
      detail: { id: Date.now() + Math.random(), message, type, duration },
    })
  );
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const toast = e.detail;
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration || 4000);
    };

    window.addEventListener('mailguard:toast', handleToast);
    return () => window.removeEventListener('mailguard:toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{getIcon(t.type)}</span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
