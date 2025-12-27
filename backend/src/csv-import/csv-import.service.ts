import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

export interface CsvRow {
  [key: string]: string;
}

@Injectable()
export class CsvImportService {
  async parseCsv(fileBuffer: Buffer): Promise<CsvRow[]> {
    try {
      const records = parse(fileBuffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      if (!records || records.length === 0) {
        throw new Error('CSV file is empty or has no valid data');
      }

      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  async validateCsvData(data: CsvRow[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

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

