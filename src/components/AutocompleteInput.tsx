import React, { useState, useRef, useEffect } from 'react';

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
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vorschläge filtern basierend auf Eingabe
  useEffect(() => {
    if (value.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        suggestion.toLowerCase() !== value.toLowerCase()
      );
      setFilteredSuggestions(filtered.slice(0, 5)); // Max 5 Vorschläge
    } else {
      // Bei leerem Input die häufigsten Vorschläge zeigen
      setFilteredSuggestions(suggestions.slice(0, 5));
    }
    setHighlightedIndex(-1);
  }, [value, suggestions]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
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
    setShowSuggestions(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={className}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-purple-500/30 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-purple-500/30 text-white'
                  : 'text-white/80 hover:bg-purple-500/20'
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
