'use client';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center">
                <LoadingSpinner size="xl" />
                <p className="mt-4 text-slate-600 text-sm sm:text-base">Loading...</p>
            </div>
        </div>
    );
}
