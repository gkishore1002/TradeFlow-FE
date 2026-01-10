// src/components/ui/Dropdown.jsx
// Enhanced version of CustomDropdown

'use client';

import { useState, useRef, useEffect } from 'react';

export default function Dropdown({
    name,
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Select an option...',
    searchable = false,
    required = false,
    disabled = false,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = searchable
        ? options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (option) => {
        onChange({ target: { name, value: option.value } });
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Dropdown Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed ${selectedOption ? 'text-slate-900' : 'text-slate-400'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                    <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {searchable && (
                        <div className="p-2 border-b border-slate-200">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    <div className="overflow-y-auto max-h-48">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition ${option.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-900'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center">No options found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
