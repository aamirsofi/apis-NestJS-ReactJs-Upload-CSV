import { useState, useMemo, useEffect } from 'react';
import { CsvData } from "../types";
import { exportCsvData } from '../services/api';

interface CsvPreviewProps {
  data: CsvData;
  onReset: () => void;
  darkMode?: boolean;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const CsvPreview: React.FC<CsvPreviewProps> = ({ data, onReset, darkMode = false }) => {
  const headers = data.data.length > 0 ? Object.keys(data.data[0]) : [];
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5); // Default to 5 so pagination shows more often

  const sortedData = useMemo(() => {
    if (!sortConfig) return data.data;
    
    return [...data.data].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [data.data, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset to page 1 when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = async () => {
    if (!data.uploadId) return;
    try {
      setExporting(true);
      await exportCsvData(data.uploadId, 'export.csv');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const getSortIcon = (header: string) => {
    if (!sortConfig || sortConfig.key !== header) {
      return (
        <svg className="w-4 h-4 ml-1 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl transition-smooth hover:scale-110 ${
              darkMode 
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
                : 'bg-gradient-to-br from-green-100 to-emerald-100'
            }`}>
              {/* Modern checkmark icon - filled style for better visibility */}
              <svg className={`w-7 h-7 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className={`text-3xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              CSV Import Successful!
            </h2>
          </div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.totalRows} row{data.totalRows !== 1 ? "s" : ""} imported successfully
          </p>
        </div>
        <div className="flex gap-3">
          {data.uploadId && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift flex items-center gap-2 ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          )}
          <button
            onClick={onReset}
            className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
              darkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg shadow-indigo-500/30'
            }`}
          >
            Upload Another File
          </button>
        </div>
      </div>

      {/* Success Message */}
          <div className={`mb-6 p-5 rounded-xl border-l-4 transition-smooth hover:shadow-lg ${
            darkMode
              ? 'bg-green-500/10 border-green-400'
              : 'bg-green-50 border-green-400'
          }`}>
            <div className="flex items-center gap-3">
              {/* Modern filled checkmark circle icon */}
              <svg className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                {data.message}
              </p>
            </div>
          </div>

      {/* Data Table */}
      {data.data.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg">No data to display</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border overflow-hidden">
            <table className={`min-w-full divide-y ${
              darkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}>
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      onClick={() => handleSort(header)}
                      className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-opacity-80 transition-smooth ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } ${sortConfig?.key === header ? darkMode ? 'bg-indigo-600/30' : 'bg-indigo-100' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{header}</span>
                        {getSortIcon(header)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
              }`}>
                {paginatedData.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={`transition-smooth ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-indigo-50/50'
                    }`}
                  >
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-900'
                        }`}
                      >
                        {row[header] || <span className="opacity-50">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Always show when data exists */}
          <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {/* Page Info */}
            <div className="flex items-center gap-2 text-sm">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} result{sortedData.length !== 1 ? 's' : ''}
              </span>
              {totalPages > 1 && (
                <>
                  <span className="mx-2">|</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </>
              )}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Per page:
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-smooth ${
                  darkMode
                    ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Buttons - Show when multiple pages */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg transition-smooth flex items-center gap-1 text-sm font-medium ${
                  currentPage > 1
                    ? darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                    : darkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-smooth text-sm font-medium ${
                        isActive
                          ? darkMode
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg transition-smooth flex items-center gap-1 text-sm font-medium ${
                  currentPage < totalPages
                    ? darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                    : darkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className={`text-xs px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                All {sortedData.length} result{sortedData.length !== 1 ? 's' : ''} shown
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CsvPreview;
