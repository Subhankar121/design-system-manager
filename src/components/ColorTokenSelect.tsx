import { useState, useRef, useEffect } from 'react';
import { Token } from '@/types';

interface ColorTokenSelectProps {
  value: string;
  onChange: (tokenKey: string) => void;
  options: Token[];
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function ColorTokenSelect({
  value,
  onChange,
  options,
  placeholder = 'Choose token…',
  className = '',
  error = false,
}: ColorTokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = options.find((opt) => opt.key === value);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev < options.length - 1 ? prev + 1 : 0;
            optionsRef.current[next]?.scrollIntoView({ block: 'nearest' });
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : options.length - 1;
            optionsRef.current[next]?.scrollIntoView({ block: 'nearest' });
            return next;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex].key);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, options]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex((opt) => opt.key === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, options, value]);

  const handleSelect = (tokenKey: string) => {
    onChange(tokenKey);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const getColorValue = (token: Token): string | null => {
    if (token.type !== 'color') return null;
    const val = token.value;
    if (val.startsWith('#') || val.startsWith('rgb')) return val;
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
        } hover:border-gray-400 transition-colors`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="color-token-listbox"
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {getColorValue(selectedOption) && (
                <span
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: getColorValue(selectedOption) || undefined }}
                  aria-hidden="true"
                />
              )}
              <span className="truncate">
                {selectedOption.key}
                <span className="text-gray-500 ml-1">({selectedOption.value})</span>
              </span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="color-token-listbox"
          role="listbox"
          aria-label="Color token options"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-[300px] overflow-y-auto"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            options.map((option, index) => {
              const colorValue = getColorValue(option);
              const isSelected = option.key === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.key}
                  ref={(el) => {
                    optionsRef.current[index] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.key)}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900'
                      : isHighlighted
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {colorValue && (
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: colorValue }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{option.key}</span>
                    <span className="text-gray-500 ml-1">({option.value})</span>
                  </span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-indigo-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


