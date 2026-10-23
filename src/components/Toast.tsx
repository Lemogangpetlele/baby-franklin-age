import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3200,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-amber-200 shrink-0" />,
  };

  const borders = {
    success: 'border-amber-700/60 bg-[#191612]',
    error: 'border-red-900/60 bg-[#1a1212]',
    info: 'border-[#2d2820] bg-[#161411]',
  };

  return (
    <div
      role="status"
      className={`fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 p-3.5 rounded-lg border shadow-xl flex items-center justify-between gap-3 text-sm text-[#f5f2eb] ${borders[type]} animate-fade-in`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        {icons[type]}
        <span className="truncate lowercase text-xs sm:text-sm font-medium tracking-tight">
          {message}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-[#787163] hover:text-[#f5f2eb] transition-colors rounded"
        aria-label="close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
