'use client';
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteModal({
  open,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 mx-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 text-sm sm:text-base disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base disabled:opacity-60"
            >
              {loading ? 'Deleting...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
