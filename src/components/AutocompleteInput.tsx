import React, { useState, useRef, useMemo } from 'react';

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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Finde den besten Vorschlag basierend auf der aktuellen Eingabe
  const suggestion = useMemo(() => {
    if (!value || value.length === 0) return null;

    const normalizedValue = normalizeForMatching(value);

    // Finde Vorschläge die mit dem eingegebenen Text beginnen (priorisiert)
    const startsWithMatch = suggestions.find(s =>
      normalizeForMatching(s).startsWith(normalizedValue) &&
      normalizeForMatching(s) !== normalizedValue
    );

    if (startsWithMatch) return startsWithMatch;

    // Falls kein "startsWith"-Match, suche nach "includes"-Match
    const includesMatch = suggestions.find(s =>
      normalizeForMatching(s).includes(normalizedValue) &&
      normalizeForMatching(s) !== normalizedValue
    );

    return includesMatch || null;
  }, [value, suggestions]);

  // Der angezeigte Vorschlagstext (grau, nach dem eingegebenen Text)
  const suggestionSuffix = useMemo(() => {
    if (!suggestion || !value) return '';

    // Finde wo der eingegebene Text im Vorschlag vorkommt
    const normalizedValue = normalizeForMatching(value);
    const normalizedSuggestion = normalizeForMatching(suggestion);
    const index = normalizedSuggestion.indexOf(normalizedValue);

    if (index === 0) {
      // Vorschlag beginnt mit der Eingabe - zeige den Rest
      return suggestion.slice(value.length);
    }

    return '';
  }, [suggestion, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab oder Pfeil-Rechts übernimmt den Vorschlag
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestionSuffix) {
      // Nur wenn Cursor am Ende des Inputs ist
      if (inputRef.current && inputRef.current.selectionStart === value.length) {
        e.preventDefault();
        onChange(value + suggestionSuffix);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      {/* Unsichtbarer Layer für den Vorschlag */}
      <div
        className={`absolute inset-0 pointer-events-none flex items-center ${className}`}
        style={{
          background: 'transparent',
          border: 'transparent',
          color: 'transparent'
        }}
      >
        <span className="invisible">{value}</span>
        {isFocused && suggestionSuffix && (
          <span className="text-white/30">{suggestionSuffix}</span>
        )}
      </div>

      {/* Eigentliches Input-Feld */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`${className} bg-transparent relative`}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        autoComplete="off"
      />
    </div>
  );
};

export default AutocompleteInput;
