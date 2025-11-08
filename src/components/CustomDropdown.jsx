'use client';
import React, { Fragment, useState, useRef, useEffect } from 'react';
import { Transition } from '@headlessui/react';

export default function CustomDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option...',
  label = '',
  required = false,
  disabled = false,
  searchable = true,
  className = '',
  name = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => String(opt.value) === String(value));

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

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (option) => {
    onChange({
      target: {
        name: name,
        value: option.value
      }
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left bg-white border border-slate-300 rounded-lg shadow-sm font-medium text-slate-900 transition-all duration-200 flex items-center justify-between text-sm ${
            disabled
              ? 'bg-slate-100 cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0'
          } ${isOpen ? 'ring-2 ring-blue-500' : ''}`}
        >
          <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-900'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <Transition
          as={Fragment}
          show={isOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-xl max-h-60 overflow-hidden">
            {searchable && (
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-600 bg-white"
                />
              </div>
            )}

            <div className="overflow-y-auto max-h-56 sm:max-h-72">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-100 flex items-center justify-between ${
                      String(selectedOption?.value) === String(option.value)
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-slate-900 hover:bg-slate-100'
                    } ${index !== filteredOptions.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {String(selectedOption?.value) === String(option.value) && (
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-slate-500 text-sm">No options found</div>
              )}
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}
