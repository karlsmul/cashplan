import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

/**
 * Normalisiert einen String für Fuzzy-Matching:
 * - Kleinschreibung
 * - Entfernt Akzente (é → e, ä → a, etc.)
 */
const normalizeForMatching = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  maxLength,
  required,
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtere Vorschläge basierend auf Eingabe mit Fuzzy-Matching
  const filteredSuggestions = useMemo(() => {
    if (value.length > 0) {
      const normalizedValue = normalizeForMatching(value);
      const filtered = suggestions.filter(suggestion =>
        normalizeForMatching(suggestion).includes(normalizedValue) &&
        normalizeForMatching(suggestion) !== normalizedValue
      );
      return filtered.slice(0, 6);
    } else {
      return suggestions.slice(0, 6);
    }
  }, [value, suggestions]);

  // Position des Dropdowns berechnen (Viewport-Koordinaten für Portal)
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Klick außerhalb schließt Vorschläge
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position bei Scroll/Resize aktualisieren
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
      const handlePositionUpdate = () => updateDropdownPosition();
      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);
      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (highlightedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    updateDropdownPosition();
    setShowSuggestions(true);
  };

  // Dropdown als Portal rendern (außerhalb des DOM-Baums)
  const dropdown = showSuggestions && filteredSuggestions.length > 0 && ReactDOM.createPortal(
    <ul
      className="fixed z-[99999] bg-slate-800 border border-purple-500/50 rounded-lg shadow-xl shadow-purple-900/30 max-h-60 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        minWidth: '200px'
      }}
    >
      {filteredSuggestions.map((suggestion, index) => (
        <li
          key={suggestion}
          onMouseDown={(e) => {
            e.preventDefault();
            handleSuggestionClick(suggestion);
          }}
          className={`px-4 py-2.5 cursor-pointer transition-colors text-sm ${
            index === highlightedIndex
              ? 'bg-purple-600 text-white'
              : 'text-white/90 hover:bg-purple-500/30'
          }`}
        >
          {suggestion}
        </li>
      ))}
    </ul>,
    document.body
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        className={className}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
};

export default AutocompleteInput;
