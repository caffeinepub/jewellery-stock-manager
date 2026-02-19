export interface ParsedItem {
  code: string;
  grossWeight: number | null;
  stoneWeight: number | null;
  netWeight: number | null;
  pieces: number | null;
  status: 'VALID' | 'MISTAKE' | 'INVALID';
  error?: string;
}

/**
 * STEP 1: Extract CODE
 * Find first alphabet character [A-Z], everything from there to end = CODE
 */
function extractCode(input: string): { code: string; codeStartIndex: number } | null {
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (/[A-Za-z]/.test(char)) {
      return {
        code: input.substring(i),
        codeStartIndex: i,
      };
    }
  }
  return null;
}

/**
 * STEP 2: Robust PCS detection
 * Scan backwards from just before CODE until finding first numeric digit
 * Ignore spaces, dots, and symbols
 */
function extractPcs(input: string, codeStartIndex: number): { pcs: number; pcsIndex: number } | null {
  for (let i = codeStartIndex - 1; i >= 0; i--) {
    const char = input[i];
    if (/[0-9]/.test(char)) {
      return {
        pcs: parseInt(char, 10),
        pcsIndex: i,
      };
    }
    // Skip spaces, dots, and other symbols - continue scanning
  }
  return null;
}

/**
 * STEP 3: Clean weightBlock
 * 1. Remove spaces
 * 2. Replace multiple dots with single dot
 * 3. Remove any character except digits and dot
 * 4. If decimal starts with ., convert to 0.
 */
function cleanWeightBlock(raw: string): string {
  // 1. Remove spaces
  let cleaned = raw.replace(/\s/g, '');
  
  // 2. Replace multiple dots with single dot (iterative to handle any number of consecutive dots)
  while (cleaned.includes('..')) {
    cleaned = cleaned.replace(/\.{2,}/g, '.');
  }
  
  // 3. Remove any character except digits and dot
  cleaned = cleaned.replace(/[^0-9.]/g, '');
  
  // 4. If decimal starts with ., convert to 0.
  if (cleaned.startsWith('.')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}

/**
 * Check if a string is a valid decimal number with 1-3 decimal places
 */
function isValidDecimal(s: string): boolean {
  if (!s || s === '') return false;
  
  // Must have exactly one dot
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount !== 1) return false;
  
  const parts = s.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Integer part must be digits only (can be empty for cases like "0.123")
  if (integerPart !== '' && !/^\d+$/.test(integerPart)) return false;
  
  // Decimal part must exist, be digits only, and have 1-3 digits
  if (!decimalPart || !/^\d+$/.test(decimalPart)) return false;
  if (decimalPart.length < 1 || decimalPart.length > 3) return false;
  
  return true;
}

/**
 * Convert decimal string to integer representation (multiply by 1000)
 * This allows exact comparison without floating point errors
 */
function decimalToInt(s: string): number {
  const parts = s.split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1] || '0';
  
  // Pad decimal part to 3 digits
  const paddedDecimal = decimalPart.padEnd(3, '0');
  
  return parseInt(integerPart) * 1000 + parseInt(paddedDecimal);
}

/**
 * Convert integer representation back to float
 */
function intToDecimal(n: number): number {
  return n / 1000;
}

interface Partition {
  gw: string;
  sw: string | null;
  nw: string;
  gwInt: number;
  swInt: number;
  nwInt: number;
}

/**
 * STEP 4: Mathematical split logic
 * Generate all possible 2-part and 3-part splits
 * Validate using exact decimal math (integer arithmetic)
 */
function generatePartitions(cleaned: string): Partition[] {
  const partitions: Partition[] = [];
  const n = cleaned.length;
  
  // Generate 3-part splits: GW, SW, NW
  for (let i = 1; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const gw = cleaned.substring(0, i);
      const sw = cleaned.substring(i, j);
      const nw = cleaned.substring(j);
      
      if (isValidDecimal(gw) && isValidDecimal(sw) && isValidDecimal(nw)) {
        try {
          const gwInt = decimalToInt(gw);
          const swInt = decimalToInt(sw);
          const nwInt = decimalToInt(nw);
          
          partitions.push({ gw, sw, nw, gwInt, swInt, nwInt });
        } catch (e) {
          // Skip invalid conversions
        }
      }
    }
  }
  
  // Generate 2-part splits: GW, NW (SW = 0)
  for (let i = 1; i < n; i++) {
    const gw = cleaned.substring(0, i);
    const nw = cleaned.substring(i);
    
    if (isValidDecimal(gw) && isValidDecimal(nw)) {
      try {
        const gwInt = decimalToInt(gw);
        const nwInt = decimalToInt(nw);
        
        partitions.push({ gw, sw: null, nw, gwInt, swInt: 0, nwInt });
      } catch (e) {
        // Skip invalid conversions
      }
    }
  }
  
  return partitions;
}

/**
 * Validate partition using exact integer arithmetic
 * CASE A (3 numbers): GW = SW + NW
 * CASE B (2 numbers): GW = NW, SW = 0
 */
function validatePartition(partition: Partition): boolean {
  if (partition.sw !== null) {
    // CASE A: 3 numbers - check GW = SW + NW
    return partition.gwInt === partition.swInt + partition.nwInt;
  } else {
    // CASE B: 2 numbers - check GW = NW
    return partition.gwInt === partition.nwInt;
  }
}

/**
 * STEP 5: STATUS determination
 * VALID: structure found AND equation satisfied
 * MISTAKE: structure found BUT equation fails
 * INVALID: structure cannot be parsed
 */
export function parseScannerString(scannerString: string): ParsedItem {
  const result: ParsedItem = {
    code: '',
    grossWeight: null,
    stoneWeight: null,
    netWeight: null,
    pieces: null,
    status: 'INVALID',
  };

  try {
    if (!scannerString || scannerString.trim() === '') {
      result.error = 'Empty scanner string';
      return result;
    }

    const input = scannerString.trim();
    
    // STEP 1: Extract CODE
    const codeResult = extractCode(input);
    if (!codeResult) {
      result.error = 'No alphabetic character found for CODE';
      return result;
    }
    
    result.code = codeResult.code;
    
    // STEP 2: Extract PCS
    const pcsResult = extractPcs(input, codeResult.codeStartIndex);
    if (!pcsResult) {
      result.error = 'No digit found for PCS';
      return result;
    }
    
    result.pieces = pcsResult.pcs;
    
    // STEP 3: Extract and clean weightBlock
    const rawWeightBlock = input.substring(0, pcsResult.pcsIndex);
    const cleanedWeightBlock = cleanWeightBlock(rawWeightBlock);
    
    if (cleanedWeightBlock === '' || cleanedWeightBlock === '.') {
      result.error = 'No weight data found';
      return result;
    }
    
    // STEP 4: Generate all partitions
    const partitions = generatePartitions(cleanedWeightBlock);
    
    // Try to find a valid partition (exact match)
    for (const partition of partitions) {
      if (validatePartition(partition)) {
        // Found exact match!
        result.grossWeight = intToDecimal(partition.gwInt);
        result.stoneWeight = intToDecimal(partition.swInt);
        result.netWeight = intToDecimal(partition.nwInt);
        result.status = 'VALID';
        return result;
      }
    }
    
    // STEP 5: Determine STATUS
    if (partitions.length > 0) {
      // Valid decimal structure exists but equation not satisfied
      result.status = 'MISTAKE';
      result.error = 'Valid decimal structure found but weight equation not satisfied';
    } else {
      // No valid decimal structure found
      result.status = 'INVALID';
      result.error = 'No valid decimal structure found';
    }
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Failed to parse scanner string';
    result.status = 'INVALID';
    return result;
  }
}

export function parseScannerStrings(scannerStrings: string[]): ParsedItem[] {
  return scannerStrings.map(parseScannerString);
}
