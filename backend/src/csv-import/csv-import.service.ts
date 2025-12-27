/**
 * csv-import.service.ts - CSV Import Service
 *
 * This service contains the business logic for parsing CSV files.
 * It handles the actual work of converting CSV file content into structured data.
 *
 * Responsibilities:
 * - Parse CSV files into JavaScript objects
 * - Validate CSV data structure
 * - Handle parsing errors
 */

import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

/**
 * CsvRow Interface
 * Represents a single row of CSV data as a key-value object
 * Example: { name: "John", email: "john@example.com", age: "30" }
 */
export interface CsvRow {
  [key: string]: string; // Dynamic keys (column names) with string values
}

@Injectable() // Makes this service available for dependency injection
export class CsvImportService {
  /**
   * parseCsv - Parses a CSV file buffer into structured data
   *
   * @param fileBuffer - The CSV file content as a Buffer (binary data)
   * @returns Array of objects, where each object represents a CSV row
   *
   * Process:
   * 1. Convert buffer to UTF-8 string
   * 2. Parse CSV using csv-parse library
   * 3. Convert to array of objects (first row becomes keys)
   * 4. Return parsed data
   */
  async parseCsv(fileBuffer: Buffer): Promise<{
    data: CsvRow[];
    errors: Array<{ row: number; message: string }>;
  }> {
    try {
      const csvContent = fileBuffer.toString('utf-8');
      const errors: Array<{ row: number; message: string }> = [];

      // Parse CSV file
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
        on_record: (record, context) => {
          // Track row numbers (context.lines is 0-indexed, add 2 for header row)
          const rowNumber = context.lines + 2;
          
          // Check for empty rows
          const values = Object.values(record);
          if (values.every((val) => !val || String(val).trim() === '')) {
            errors.push({
              row: rowNumber,
              message: 'Row contains only empty values',
            });
          }
        },
      });

      // Validation: Check if parsing resulted in any data
      if (!records || records.length === 0) {
        throw new Error('CSV file is empty or has no valid data');
      }

      return { data: records, errors };
    } catch (error) {
      // Enhanced error message with row context if available
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`CSV parsing failed: ${errorMessage}`);
    }
  }

  /**
   * validateCsvData - Validates parsed CSV data
   *
   * @param data - Array of CSV rows (objects)
   * @returns Validation result with errors array
   *
   * This method can be extended to add custom validation rules:
   * - Check for required columns
   * - Validate data types
   * - Check data ranges
   * - etc.
   */
  async validateCsvData(
    data: CsvRow[],
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation: Check if data exists
    if (data.length === 0) {
      errors.push('CSV file contains no data rows');
    }

    // Add custom validation logic here
    // Example: Check for required columns
    // const requiredColumns = ['name', 'email'];
    // const firstRow = data[0];
    // requiredColumns.forEach(col => {
    //   if (!firstRow[col]) {
    //     errors.push(`Missing required column: ${col}`);
    //   }
    // });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
