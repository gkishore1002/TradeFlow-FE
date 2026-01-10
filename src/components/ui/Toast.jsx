// src/components/ui/Toast.jsx

'use client';

export default function Toast({ toasts = [] }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[10000] space-y-2 p-3 sm:p-0">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg border-l-4 animate-fade-in text-xs sm:text-sm font-medium ${toast.type === 'success'
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : toast.type === 'info'
                                ? 'bg-blue-50 border-blue-500 text-blue-800'
                                : toast.type === 'warning'
                                    ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                                    : 'bg-red-50 border-red-500 text-red-800'
                        }`}
                >
                    <div className="flex items-center space-x-2">
                        {toast.type === 'success' && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        {toast.type === 'error' && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        <span>{toast.message}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
