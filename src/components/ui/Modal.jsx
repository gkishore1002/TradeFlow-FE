// src/components/ui/Modal.jsx

'use client';

import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4',
    };

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Modal Content */}
            <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden my-4`}>
                {/* Header */}
                <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-600 hover:text-slate-900 transition"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
