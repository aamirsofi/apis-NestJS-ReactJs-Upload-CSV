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
  /**
   * detectDuplicates - Identifies duplicate rows in CSV data
   *
   * @param data - Array of CSV rows
   * @param columns - Optional array of column names to check for duplicates (if empty, checks all columns)
   * @returns Object containing duplicate information
   */
  detectDuplicates(
    data: CsvRow[],
    columns?: string[],
  ): {
    duplicates: Array<{
      row: number;
      duplicateOf: number;
      data: CsvRow;
    }>;
    uniqueRows: CsvRow[];
  } {
    const duplicates: Array<{
      row: number;
      duplicateOf: number;
      data: CsvRow;
    }> = [];
    const seen = new Map<string, number>();
    const uniqueRows: CsvRow[] = [];

    // Get columns to check (all columns if not specified)
    const columnsToCheck = columns && columns.length > 0 
      ? columns 
      : data.length > 0 ? Object.keys(data[0]) : [];

    data.forEach((row, index) => {
      // Create a key from the specified columns (or all columns)
      const key = columnsToCheck
        .map((col) => String(row[col] || '').trim().toLowerCase())
        .join('|');

      // Check if this row has been seen before
      if (seen.has(key)) {
        const duplicateOf = seen.get(key)!;
        duplicates.push({
          row: index + 2, // +2 because index is 0-based and we skip header row
          duplicateOf: duplicateOf + 2,
          data: row,
        });
      } else {
        seen.set(key, index);
        uniqueRows.push(row);
      }
    });

    return { duplicates, uniqueRows };
  }

  /**
   * applyColumnMapping - Applies column mapping to CSV data
   *
   * @param data - Array of CSV rows
   * @param columnMapping - Object mapping source column names to target column names
   * @returns Transformed data with mapped column names
   */
  applyColumnMapping(
    data: CsvRow[],
    columnMapping: Record<string, string>,
  ): CsvRow[] {
    if (!columnMapping || Object.keys(columnMapping).length === 0) {
      return data;
    }

    return data.map((row) => {
      const mappedRow: CsvRow = {};
      
      // Apply mapping: if column exists in mapping, use mapped name; otherwise keep original
      Object.keys(row).forEach((sourceColumn) => {
        const targetColumn = columnMapping[sourceColumn] || sourceColumn;
        mappedRow[targetColumn] = row[sourceColumn];
      });
      
      return mappedRow;
    });
  }

  async parseCsv(
    fileBuffer: Buffer,
    options?: {
      detectDuplicates?: boolean;
      duplicateColumns?: string[];
      handleDuplicates?: 'skip' | 'keep' | 'mark';
      columnMapping?: Record<string, string>;
    },
  ): Promise<{
    data: CsvRow[];
    errors: Array<{ row: number; message: string }>;
    duplicates?: Array<{ row: number; duplicateOf: number; data: CsvRow }>;
  }> {
    try {
      const csvContent = fileBuffer.toString('utf-8').trim();
      
      // Check if file is empty
      if (!csvContent || csvContent.length === 0) {
        throw new Error('CSV file is empty');
      }

      const errors: Array<{ row: number; message: string }> = [];
      let validRecords: CsvRow[] = [];

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
          const isEmptyRow = values.every((val) => !val || String(val).trim() === '');
          
          if (isEmptyRow) {
            errors.push({
              row: rowNumber,
              message: 'Row contains only empty values',
            });
            return null; // Skip this row
          }
          
          // Return the record to include it
          return record;
        },
      });

      // Filter out null records (skipped empty rows)
      validRecords = records.filter((record): record is CsvRow => record !== null && record !== undefined);

      // Validation: Check if parsing resulted in any valid data
      if (!validRecords || validRecords.length === 0) {
        // Check if we have a header but no data
        const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 1) {
          throw new Error('CSV file contains only a header row with no data rows');
        }
        throw new Error('CSV file contains no valid data rows (all rows are empty)');
      }

      // Duplicate detection
      let duplicates: Array<{ row: number; duplicateOf: number; data: CsvRow }> | undefined;
      let finalData = validRecords;

      if (options?.detectDuplicates) {
        const duplicateResult = this.detectDuplicates(
          validRecords,
          options.duplicateColumns,
        );

        duplicates = duplicateResult.duplicates;

        // Handle duplicates based on option
        if (options.handleDuplicates === 'skip') {
          // Keep only unique rows
          finalData = duplicateResult.uniqueRows;
        } else if (options.handleDuplicates === 'mark') {
          // Keep all rows but mark duplicates in errors
          duplicateResult.duplicates.forEach((dup) => {
            errors.push({
              row: dup.row,
              message: `Duplicate of row ${dup.duplicateOf}`,
            });
          });
        }
        // If 'keep', do nothing - keep all rows including duplicates
      }

      // Apply column mapping if provided
      if (options?.columnMapping && Object.keys(options.columnMapping).length > 0) {
        finalData = this.applyColumnMapping(finalData, options.columnMapping);
      }

      return { data: finalData, errors, duplicates };
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
