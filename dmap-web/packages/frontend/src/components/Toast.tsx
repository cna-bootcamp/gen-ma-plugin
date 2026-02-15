import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore.js';

export function Toast() {
  const { toastMessage, clearToast } = useAppStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => clearToast(), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/80 border border-amber-200 dark:border-amber-700 rounded-xl shadow-lg max-w-md">
        <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </span>
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {toastMessage}
        </span>
        <button
          onClick={clearToast}
          className="ml-2 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
