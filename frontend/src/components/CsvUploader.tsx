import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadCsv } from '../services/api';
import { CsvData } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useToast } from '../contexts/ToastContext';
import PreviewModal from './PreviewModal';

interface CsvUploaderProps {
  onUploadSuccess: (data: CsvData) => void;
  onUploadError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  loading: boolean;
  darkMode?: boolean;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  onLoadingChange,
  loading,
  darkMode = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { showSuccess, showError } = useToast();

  // Parse CSV file for preview
  const parseCsvPreview = useCallback((file: File): Promise<{ data: Record<string, string>[]; columns: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse header
          const headerLine = lines[0];
          const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          
          // Parse data rows (limit to first 10 rows for preview)
          const previewRows = Math.min(10, lines.length - 1);
          const data: Record<string, string>[] = [];
          
          for (let i = 1; i <= previewRows; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            // Simple CSV parsing (handles quoted values)
            const values: string[] = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.trim()); // Add last value
            
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }
          
          resolve({ data, columns: headers });
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Prevent multiple simultaneous uploads
      if (isUploading || loading) {
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.name.match(/\.(csv)$/i)) {
        showError('Please upload a CSV file');
        onUploadError('Please upload a CSV file');
        return;
      }

      // Parse CSV for preview
      try {
        const { data, columns } = await parseCsvPreview(file);
        setPreviewFile(file);
        setPreviewData(data);
        setPreviewColumns(columns);
        setShowPreview(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
        showError(errorMessage);
        onUploadError(errorMessage);
      }
    },
    [isUploading, loading, parseCsvPreview, showError, onUploadError]
  );

  // Handle confirmed upload
  const handleConfirmUpload = useCallback(async () => {
    if (!previewFile) return;

    setIsUploading(true);
    onLoadingChange(true);
    setShowPreview(false);
    
    try {
      const result = await uploadCsv(previewFile);
      showSuccess(`CSV file "${previewFile.name}" uploaded successfully! ${result.totalRows} rows imported.`);
      onUploadSuccess(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload CSV file';
      showError(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      onLoadingChange(false);
      setPreviewFile(null);
      setPreviewData([]);
      setPreviewColumns([]);
    }
  }, [previewFile, onUploadSuccess, onUploadError, onLoadingChange, showSuccess, showError]);

  // Handle cancel preview
  const handleCancelPreview = useCallback(() => {
    setShowPreview(false);
    setPreviewFile(null);
    setPreviewData([]);
    setPreviewColumns([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: loading || isUploading,
    noClick: loading || isUploading,
  });

  // Keyboard shortcut: Ctrl+U to trigger file upload
  useKeyboardShortcuts({
    onUpload: () => {
      if (!isUploading && !loading) {
        open();
      }
    },
  });

  return (
    <>
      {showPreview && previewFile && (
        <PreviewModal
          fileName={previewFile.name}
          previewData={previewData}
          columns={previewColumns}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelPreview}
          darkMode={darkMode}
        />
      )}
      <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth hover-lift`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-16 text-center
          transition-smooth
          ${
            loading || isUploading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover-lift'
          }
          ${
            isDragActive || dragActive
              ? darkMode
                ? 'border-indigo-400 bg-indigo-900/20 shadow-lg shadow-indigo-500/20'
                : 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-200'
              : darkMode
                ? 'border-gray-600 hover:border-indigo-400 hover:bg-gray-800/50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }
        `}
        onDragEnter={() => !loading && !isUploading && setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          {/* Modern Upload Icon - Trendy 2025 Style */}
          <div className={`mb-6 p-6 rounded-2xl transition-smooth hover:scale-110 ${
            darkMode 
              ? 'bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm' 
              : 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100'
          }`}>
            <svg
              className={`w-16 h-16 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} transition-transform duration-300`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Modern cloud upload icon with rounded style */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          {loading || isUploading ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
                  darkMode ? 'border-indigo-500/30 border-t-indigo-400' : 'border-indigo-200 border-t-indigo-600'
                } mb-4`}></div>
                <div className={`absolute inset-0 animate-ping rounded-full h-12 w-12 ${
                  darkMode ? 'border-2 border-indigo-400/50' : 'border-2 border-indigo-300'
                }`}></div>
              </div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Uploading and processing CSV...
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Please wait
              </p>
            </div>
          ) : (
            <>
              <h3 className={`text-2xl font-bold mb-2 ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {isDragActive
                  ? 'Drop your CSV file here'
                  : 'Drag & drop your CSV file here'}
              </h3>
              <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                or
              </p>
              <button className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
                {/* Modern plus icon with rounded corners */}
                <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Browse Files</span>
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <p className={`text-sm mt-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Only CSV files are supported • Max file size: 10MB
              </p>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Press <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>Ctrl+U</kbd> to upload
              </p>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default CsvUploader;

