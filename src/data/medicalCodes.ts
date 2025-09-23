// Medical coding data for autocomplete functionality

export interface MedicalCode {
  code: string;
  description: string;
  category?: string;
}

// Common ICD-10 codes for autocomplete
export const commonICD10Codes: MedicalCode[] = [
  { code: 'A00.0', description: 'Cholera due to Vibrio cholerae 01, biovar cholerae', category: 'Infectious' },
  { code: 'A09.9', description: 'Gastroenteritis and colitis of unspecified origin', category: 'Infectious' },
  { code: 'B34.9', description: 'Viral infection, unspecified', category: 'Infectious' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', category: 'Mental' },
  { code: 'G93.1', description: 'Anoxic brain damage, not elsewhere classified', category: 'Nervous' },
  { code: 'H10.9', description: 'Unspecified conjunctivitis', category: 'Eye' },
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Circulatory' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', category: 'Respiratory' },
  { code: 'K59.0', description: 'Constipation', category: 'Digestive' },
  { code: 'L30.9', description: 'Dermatitis, unspecified', category: 'Skin' },
  { code: 'M79.3', description: 'Panniculitis, unspecified', category: 'Musculoskeletal' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', category: 'Genitourinary' },
  { code: 'O80', description: 'Encounter for full-term uncomplicated delivery', category: 'Pregnancy' },
  { code: 'R50.9', description: 'Fever, unspecified', category: 'Symptoms' },
  { code: 'S72.001A', description: 'Fracture of unspecified part of neck of right femur, initial encounter', category: 'Injury' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', category: 'Factors' }
];

// Common CPT codes for autocomplete  
export const commonCPTCodes: MedicalCode[] = [
  { code: '99213', description: 'Office/outpatient visit, established patient, level 3', category: 'E&M' },
  { code: '99214', description: 'Office/outpatient visit, established patient, level 4', category: 'E&M' },
  { code: '99215', description: 'Office/outpatient visit, established patient, level 5', category: 'E&M' },
  { code: '99202', description: 'Office/outpatient visit, new patient, level 2', category: 'E&M' },
  { code: '99203', description: 'Office/outpatient visit, new patient, level 3', category: 'E&M' },
  { code: '99204', description: 'Office/outpatient visit, new patient, level 4', category: 'E&M' },
  { code: '99211', description: 'Office/outpatient visit, established patient, minimal', category: 'E&M' },
  { code: '99212', description: 'Office/outpatient visit, established patient, level 2', category: 'E&M' },
  { code: '36415', description: 'Collection of venous blood by venipuncture', category: 'Laboratory' },
  { code: '85025', description: 'Blood count; complete (CBC), automated', category: 'Laboratory' },
  { code: '80053', description: 'Comprehensive metabolic panel', category: 'Laboratory' },
  { code: '93000', description: 'Electrocardiogram, routine ECG with at least 12 leads', category: 'Cardiology' },
  { code: '71020', description: 'Radiologic examination, chest, 2 views, frontal and lateral', category: 'Radiology' },
  { code: '73060', description: 'Radiologic examination; knee, 1 or 2 views', category: 'Radiology' },
  { code: '12001', description: 'Simple repair of superficial wounds of scalp, neck', category: 'Surgery' },
  { code: '90471', description: 'Immunization administration', category: 'Immunization' }
];

// Common HCPCS codes for autocomplete
export const commonHCPCSCodes: MedicalCode[] = [
  { code: 'A0425', description: 'Ground mileage, per statute mile', category: 'Ambulance' },
  { code: 'E0110', description: 'Crutches, forearm, includes crutches of various materials', category: 'DME' },
  { code: 'E0143', description: 'Walker, folding, wheeled, adjustable or fixed height', category: 'DME' },
  { code: 'J0585', description: 'Injection, onabotulinumtoxinA, 1 unit', category: 'Drugs' },
  { code: 'J1100', description: 'Injection, dexamethasone sodium phosphate, 1 mg', category: 'Drugs' },
  { code: 'L3806', description: 'Wrist hand finger orthosis', category: 'Orthotics' },
  { code: 'Q4081', description: 'Injection, epoetin alfa, 100 units', category: 'Biologicals' },
  { code: 'V2020', description: 'Frames, purchases', category: 'Vision' },
  { code: 'G0463', description: 'Hospital outpatient clinic visit', category: 'Procedures' }
];

// Function to search codes by text input
export const searchCodes = (query: string, codeType: 'ICD10' | 'CPT' | 'HCPCS'): MedicalCode[] => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  let codes: MedicalCode[];
  
  switch (codeType) {
    case 'ICD10':
      codes = commonICD10Codes;
      break;
    case 'CPT':
      codes = commonCPTCodes;
      break;
    case 'HCPCS':
      codes = commonHCPCSCodes;
      break;
    default:
      return [];
  }
  
  return codes.filter(code => 
    code.code.toLowerCase().includes(lowerQuery) ||
    code.description.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Limit to 10 results
};