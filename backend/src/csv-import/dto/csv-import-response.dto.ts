export class CsvImportResponseDto {
  success: boolean;
  message: string;
  data: any[];
  totalRows: number;
  uploadId?: string;
}

