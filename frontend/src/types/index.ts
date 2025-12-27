export interface CsvRow {
  [key: string]: string;
}

export interface CsvData {
  success: boolean;
  message: string;
  data: CsvRow[];
  totalRows: number;
}

