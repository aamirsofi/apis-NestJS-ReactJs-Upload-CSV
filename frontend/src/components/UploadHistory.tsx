import { useEffect, useState } from 'react';
import { UploadHistoryResponse, UploadRecord, UploadStatus, CsvRow } from '../types';
import { getUploadHistory, getUploadData } from '../services/api';

interface UploadHistoryProps {
  onUploadClick?: (upload: UploadRecord) => void;
  darkMode?: boolean;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ onUploadClick, darkMode = false }) => {
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
    const baseClasses = 'px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2';
    switch (status) {
      case UploadStatus.SUCCESS:
        return darkMode
          ? `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`
          : `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case UploadStatus.FAILED:
        return darkMode
          ? `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`
          : `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      case UploadStatus.PROCESSING:
        return darkMode
          ? `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse-slow`
          : `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse-slow`;
      default:
        return darkMode
          ? `${baseClasses} bg-gray-700 text-gray-300 border border-gray-600`
          : `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
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
      <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8`}>
        <div className="flex flex-col justify-center items-center py-12">
          <div className="relative">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
              darkMode ? 'border-indigo-500/30 border-t-indigo-400' : 'border-indigo-200 border-t-indigo-600'
            }`}></div>
            <div className={`absolute inset-0 animate-ping rounded-full h-12 w-12 ${
              darkMode ? 'border-2 border-indigo-400/50' : 'border-2 border-indigo-300'
            }`}></div>
          </div>
          <p className={`mt-4 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            Upload History
          </h2>
          {history && (
            <div className={`flex flex-wrap gap-3 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="flex items-center gap-1">
                <span className="font-semibold">Total:</span> {history.total}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-semibold">Success:</span> {history.success}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="font-semibold">Failed:</span> {history.failed}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="font-semibold">Processing:</span> {history.processing}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', UploadStatus.SUCCESS, UploadStatus.FAILED, UploadStatus.PROCESSING] as const).map((filterValue) => {
            const isActive = filter === filterValue;
            const getButtonStyles = () => {
              if (isActive) {
                if (filterValue === 'all') {
                  return darkMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30';
                }
                if (filterValue === UploadStatus.SUCCESS) {
                  return darkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white';
                }
                if (filterValue === UploadStatus.FAILED) {
                  return darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white';
                }
                return darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-600 text-white';
              }
              return darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md';
            };
            return (
              <button
                key={filterValue}
                onClick={() => setFilter(filterValue)}
                className={`px-4 py-2 rounded-xl font-semibold transition-smooth hover-lift ${getButtonStyles()}`}
              >
                {filterValue === 'all' ? 'All' : filterValue.charAt(0).toUpperCase() + filterValue.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className={`mb-4 card-modern${darkMode ? '-dark' : ''} p-4 rounded-xl border-l-4 border-red-500`}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
          </div>
        </div>
      )}

      {history && history.uploads.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No uploads found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border overflow-hidden">
          <table className={`min-w-full divide-y ${
            darkMode ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            <thead className={darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}>
              <tr>
                {['File Name', 'Status', 'Size', 'Rows', 'Uploaded At', 'Message', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
            }`}>
              {history?.uploads.map((upload) => (
                <tr
                  key={upload.id}
                  className={`transition-smooth ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-indigo-50/50'
                  }`}
                >
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {upload.fileName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(upload.status)}>
                      {upload.status === UploadStatus.SUCCESS && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {upload.status === UploadStatus.FAILED && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {upload.status === UploadStatus.PROCESSING && (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      {upload.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatFileSize(upload.fileSize)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {upload.totalRows ?? <span className="opacity-50">-</span>}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(upload.uploadedAt)}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div className="max-w-xs truncate">
                      {upload.message || <span className="opacity-50">-</span>}
                    </div>
                    {upload.errors && upload.errors.length > 0 && (
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        darkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {upload.errors.length} error(s)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {upload.status === UploadStatus.SUCCESS && (
                      <button
                        onClick={(e) => handleViewData(upload, e)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-smooth hover-lift ${
                          darkMode
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg shadow-indigo-500/50'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg shadow-indigo-500/30'
                        }`}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col transition-smooth`}>
            <div className={`flex justify-between items-center p-6 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div>
                <h3 className={`text-2xl font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  CSV Data: {selectedUpload.fileName}
                </h3>
                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedUpload.totalRows} row{selectedUpload.totalRows !== 1 ? 's' : ''} imported
                </p>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition-smooth ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingData ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="relative">
                    <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
                      darkMode ? 'border-indigo-500/30 border-t-indigo-400' : 'border-indigo-200 border-t-indigo-600'
                    }`}></div>
                    <div className={`absolute inset-0 animate-ping rounded-full h-12 w-12 ${
                      darkMode ? 'border-2 border-indigo-400/50' : 'border-2 border-indigo-300'
                    }`}></div>
                  </div>
                  <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Loading data...
                  </p>
                </div>
              ) : uploadData && uploadData.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border overflow-hidden">
                  <table className={`min-w-full divide-y ${
                    darkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    <thead className={`sticky top-0 ${
                      darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'
                    }`}>
                      <tr>
                        {Object.keys(uploadData[0]).map((header) => (
                          <th
                            key={header}
                            className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
                    }`}>
                      {uploadData.map((row, index) => (
                        <tr
                          key={index}
                          className={`transition-smooth ${
                            darkMode ? 'hover:bg-gray-800' : 'hover:bg-indigo-50/50'
                          }`}
                        >
                          {Object.values(row).map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}
                            >
                              {cell || <span className="opacity-50">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg">No data available</p>
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

