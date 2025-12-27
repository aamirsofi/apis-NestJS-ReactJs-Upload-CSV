import { useEffect, useState } from 'react';
import { UploadHistoryResponse, UploadRecord, UploadStatus, CsvRow } from '../types';
import { getUploadHistory, getUploadData } from '../services/api';

interface UploadHistoryProps {
  onUploadClick?: (upload: UploadRecord) => void;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ onUploadClick }) => {
  const [history, setHistory] = useState<UploadHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<UploadStatus | 'all'>('all');
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);
  const [uploadData, setUploadData] = useState<CsvRow[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    loadHistory();
    // Refresh every 5 seconds to update processing status
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const data = await getUploadHistory(status);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: UploadStatus) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-semibold';
    switch (status) {
      case UploadStatus.SUCCESS:
        return `${baseClasses} bg-green-100 text-green-800`;
      case UploadStatus.FAILED:
        return `${baseClasses} bg-red-100 text-red-800`;
      case UploadStatus.PROCESSING:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleViewData = async (upload: UploadRecord, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (upload.status === UploadStatus.SUCCESS) {
      setSelectedUpload(upload);
      setLoadingData(true);
      try {
        const data = await getUploadData(upload.id);
        setUploadData(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV data');
        setUploadData(null);
      } finally {
        setLoadingData(false);
      }
    }
  };

  const closeModal = () => {
    setSelectedUpload(null);
    setUploadData(null);
  };

  if (loading && !history) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload History</h2>
          {history && (
            <p className="text-gray-600 mt-1">
              Total: {history.total} | Success: {history.success} | Failed: {history.failed} | Processing: {history.processing}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter(UploadStatus.SUCCESS)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === UploadStatus.SUCCESS
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setFilter(UploadStatus.FAILED)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === UploadStatus.FAILED
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Failed
          </button>
          <button
            onClick={() => setFilter(UploadStatus.PROCESSING)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === UploadStatus.PROCESSING
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Processing
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {history && history.uploads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No uploads found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rows
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history?.uploads.map((upload) => (
                <tr
                  key={upload.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {upload.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(upload.status)}>
                      {upload.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(upload.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.totalRows ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(upload.uploadedAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {upload.message || '-'}
                    </div>
                    {upload.errors && upload.errors.length > 0 && (
                      <div className="text-red-600 text-xs mt-1">
                        {upload.errors.length} error(s)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {upload.status === UploadStatus.SUCCESS && (
                      <button
                        onClick={(e) => handleViewData(upload, e)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        View Data
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for viewing CSV data */}
      {selectedUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  CSV Data: {selectedUpload.fileName}
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedUpload.totalRows} row{selectedUpload.totalRows !== 1 ? 's' : ''} imported
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingData ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : uploadData && uploadData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(uploadData[0]).map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHistory;

