/**
 * Detects the data type of a value
 */
export function detectDataType(value: string): 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'empty' {
  if (!value || value.trim() === '') {
    return 'empty';
  }

  const trimmed = value.trim();

  // Check for boolean
  if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
    return 'boolean';
  }

  // Check for email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return 'email';
  }

  // Check for URL
  try {
    new URL(trimmed);
    return 'url';
  } catch {
    // Not a URL
  }

  // Check for date (various formats)
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
  ];
  
  if (dateFormats.some(format => format.test(trimmed))) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return 'date';
    }
  }

  // Check for number (including decimals, negative, scientific notation)
  const numberRegex = /^-?\d*\.?\d+([eE][+-]?\d+)?$/;
  if (numberRegex.test(trimmed)) {
    return 'number';
  }

  // Default to string
  return 'string';
}

/**
 * Detects the most common data type for a column
 */
export function detectColumnType(values: string[]): {
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'mixed';
  confidence: number;
  sampleValues: string[];
} {
  if (values.length === 0) {
    return { type: 'string', confidence: 0, sampleValues: [] };
  }

  const typeCounts: Record<string, number> = {};
  const nonEmptyValues = values.filter(v => v && v.trim() !== '');

  if (nonEmptyValues.length === 0) {
    return { type: 'string', confidence: 0, sampleValues: [] };
  }

  // Detect type for each value
  nonEmptyValues.forEach(value => {
    const type = detectDataType(value);
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  // Find the most common type
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonType = sortedTypes[0][0] as 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url';
  const count = sortedTypes[0][1];
  const confidence = count / nonEmptyValues.length;

  // If confidence is less than 80%, consider it mixed
  const finalType = confidence >= 0.8 ? mostCommonType : 'mixed';

  return {
    type: finalType,
    confidence,
    sampleValues: nonEmptyValues.slice(0, 3), // First 3 non-empty values
  };
}

/**
 * Gets a human-readable label for data types
 */
export function getDataTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    string: 'Text',
    number: 'Number',
    date: 'Date',
    boolean: 'Boolean',
    email: 'Email',
    url: 'URL',
    mixed: 'Mixed',
    empty: 'Empty',
  };
  return labels[type] || 'Unknown';
}

/**
 * Gets a color for data type badges
 */
export function getDataTypeColor(type: string, darkMode: boolean = false): string {
  const colors: Record<string, { light: string; dark: string }> = {
    string: { light: 'bg-blue-100 text-blue-800 border-blue-200', dark: 'bg-blue-500/20 text-blue-300 border-blue-400/50' },
    number: { light: 'bg-green-100 text-green-800 border-green-200', dark: 'bg-green-500/20 text-green-300 border-green-400/50' },
    date: { light: 'bg-purple-100 text-purple-800 border-purple-200', dark: 'bg-purple-500/20 text-purple-300 border-purple-400/50' },
    boolean: { light: 'bg-yellow-100 text-yellow-800 border-yellow-200', dark: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50' },
    email: { light: 'bg-indigo-100 text-indigo-800 border-indigo-200', dark: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50' },
    url: { light: 'bg-pink-100 text-pink-800 border-pink-200', dark: 'bg-pink-500/20 text-pink-300 border-pink-400/50' },
    mixed: { light: 'bg-gray-100 text-gray-800 border-gray-200', dark: 'bg-gray-500/20 text-gray-300 border-gray-400/50' },
    empty: { light: 'bg-gray-100 text-gray-500 border-gray-200', dark: 'bg-gray-500/10 text-gray-500 border-gray-400/30' },
  };

  const color = colors[type] || colors.string;
  return darkMode ? color.dark : color.light;
}

