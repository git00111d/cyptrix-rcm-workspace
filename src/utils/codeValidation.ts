// Medical code validation utilities

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// ICD-10 Code Validation
export const validateICD10Code = (code: string): ValidationResult => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Code cannot be empty' };
  }

  const trimmedCode = code.trim().toUpperCase();
  
  // Basic ICD-10 format: Letter followed by 2 digits, then optional decimal and up to 4 more characters
  const icd10Regex = /^[A-Z][0-9]{2}(\.[A-Z0-9]{1,4})?$/;
  
  if (!icd10Regex.test(trimmedCode)) {
    return { 
      isValid: false, 
      message: 'Invalid ICD-10 format. Expected: A00 or A00.0000' 
    };
  }

  // Check for common invalid prefixes
  const invalidPrefixes = ['U00', 'U01', 'U02', 'U03', 'U04']; // Reserved codes
  const prefix = trimmedCode.substring(0, 3);
  
  if (invalidPrefixes.includes(prefix)) {
    return { 
      isValid: false, 
      message: 'This ICD-10 code prefix is reserved and invalid' 
    };
  }

  return { isValid: true };
};

// CPT Code Validation
export const validateCPTCode = (code: string): ValidationResult => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Code cannot be empty' };
  }

  const trimmedCode = code.trim();
  
  // CPT codes are 5 digits
  const cptRegex = /^[0-9]{5}$/;
  
  if (!cptRegex.test(trimmedCode)) {
    return { 
      isValid: false, 
      message: 'Invalid CPT format. Expected: 5 digits (e.g., 99213)' 
    };
  }

  // Basic range validation
  const codeNum = parseInt(trimmedCode);
  
  // CPT codes typically range from 00100 to 99999
  if (codeNum < 100 || codeNum > 99999) {
    return { 
      isValid: false, 
      message: 'CPT code out of valid range (00100-99999)' 
    };
  }

  return { isValid: true };
};

// HCPCS Code Validation (Level II codes)
export const validateHCPCSCode = (code: string): ValidationResult => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Code cannot be empty' };
  }

  const trimmedCode = code.trim().toUpperCase();
  
  // HCPCS Level II codes: Letter followed by 4 digits
  const hcpcsRegex = /^[A-Z][0-9]{4}$/;
  
  if (!hcpcsRegex.test(trimmedCode)) {
    return { 
      isValid: false, 
      message: 'Invalid HCPCS format. Expected: Letter + 4 digits (e.g., J0585)' 
    };
  }

  return { isValid: true };
};

// Real-time validation with debouncing helper
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};