import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { searchCodes, MedicalCode } from '@/data/medicalCodes';
import { validateICD10Code, validateCPTCode, validateHCPCSCode } from '@/utils/codeValidation';

interface CodeAutocompleteProps {
  codeType: 'ICD10' | 'CPT' | 'HCPCS';
  placeholder: string;
  onAddCode: (code: string) => void;
  existingCodes: string[];
  disabled?: boolean;
}

export const CodeAutocomplete: React.FC<CodeAutocompleteProps> = ({
  codeType,
  placeholder,
  onAddCode,
  existingCodes,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<MedicalCode[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (inputValue.length >= 2) {
      const results = searchCodes(inputValue, codeType);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [inputValue, codeType]);

  const validateCode = (code: string): string => {
    switch (codeType) {
      case 'ICD10':
        const icdResult = validateICD10Code(code);
        return icdResult.isValid ? '' : icdResult.message || 'Invalid ICD-10 code';
      case 'CPT':
        const cptResult = validateCPTCode(code);
        return cptResult.isValid ? '' : cptResult.message || 'Invalid CPT code';
      case 'HCPCS':
        const hcpcsResult = validateHCPCSCode(code);
        return hcpcsResult.isValid ? '' : hcpcsResult.message || 'Invalid HCPCS code';
      default:
        return '';
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Real-time validation
    if (value.trim()) {
      const error = validateCode(value);
      setValidationError(error);
    } else {
      setValidationError('');
    }
  };

  const handleAddCode = (code?: string) => {
    const codeToAdd = code || inputValue.trim();
    if (!codeToAdd) return;

    // Validate the code
    const error = validateCode(codeToAdd);
    if (error) {
      setValidationError(error);
      return;
    }

    // Check for duplicates
    if (existingCodes.includes(codeToAdd)) {
      setValidationError('Code already exists');
      return;
    }

    onAddCode(codeToAdd);
    setInputValue('');
    setValidationError('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCode();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleAddCode(suggestions[selectedIndex].code);
        } else {
          handleAddCode();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (code: string) => {
    handleAddCode(code);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={disabled}
            className={validationError ? 'border-destructive' : ''}
          />
          
          {validationError && (
            <p className="text-xs text-destructive mt-1">{validationError}</p>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.code}-${index}`}
                    ref={el => suggestionRefs.current[index] = el}
                    className={`p-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSuggestionClick(suggestion.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-medium">
                          {suggestion.code}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.description}
                        </div>
                      </div>
                      {suggestion.category && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <Button
          onClick={() => handleAddCode()}
          size="sm"
          variant="outline"
          disabled={disabled || !inputValue.trim() || !!validationError}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};