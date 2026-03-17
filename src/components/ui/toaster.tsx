'use client';

import * as React from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

type ToastVariant = 'default' | 'destructive';

interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  toasts: ToastMessage[];
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...message, id }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <ToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant} onOpenChange={(open) => !open && dismiss(t.id)}>
            <div className="grid gap-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

// Simple Toaster component for root layout (no children required)
export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    // Listen for toast events
    const handleToast = (e: CustomEvent<ToastMessage>) => {
      setToasts((prev) => [...prev, e.detail]);
    };
    
    window.addEventListener('toast' as any, handleToast);
    return () => window.removeEventListener('toast' as any, handleToast);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} onOpenChange={(open) => !open && dismiss(t.id)}>
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Return a fallback that uses window events
    return {
      toasts: [],
      toast: (message: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        window.dispatchEvent(new CustomEvent('toast', { detail: { ...message, id } }));
      },
      dismiss: () => {},
    };
  }
  return context;
}