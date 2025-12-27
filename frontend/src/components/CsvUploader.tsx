import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadCsv } from '../services/api';
import { CsvData } from '../types';

interface CsvUploaderProps {
  onUploadSuccess: (data: CsvData) => void;
  onUploadError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  loading: boolean;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  onLoadingChange,
  loading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        onUploadError('Please upload a CSV file');
        return;
      }

      setIsUploading(true);
      onLoadingChange(true);
      try {
        const result = await uploadCsv(file);
        onUploadSuccess(result);
      } catch (error) {
        onUploadError(
          error instanceof Error ? error.message : 'Failed to upload CSV file'
        );
      } finally {
        setIsUploading(false);
        onLoadingChange(false);
      }
    },
    [onUploadSuccess, onUploadError, onLoadingChange, isUploading, loading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: loading || isUploading,
    noClick: loading || isUploading,
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center
          transition-all duration-200
          ${
            loading || isUploading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }
          ${
            isDragActive || dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
        onDragEnter={() => !loading && !isUploading && setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {loading || isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-600">Uploading and processing CSV...</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {isDragActive
                  ? 'Drop your CSV file here'
                  : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-gray-500 mb-4">or</p>
              <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <span>Browse Files</span>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Only CSV files are supported
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvUploader;

