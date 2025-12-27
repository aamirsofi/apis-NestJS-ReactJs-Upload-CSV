import { useState, useMemo, useEffect } from 'react';
import { CsvData } from "../types";
import { exportCsvData } from '../services/api';
import CustomDropdown from './CustomDropdown';
import VirtualizedTable from './VirtualizedTable';
import { useToast } from '../contexts/ToastContext';

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
  const [useVirtualization, setUseVirtualization] = useState<boolean>(false);
  const { showSuccess, showError } = useToast();
  
  // Use virtualization for datasets larger than 100 rows
  const shouldUseVirtualization = data.data.length > 100;

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
      showSuccess('CSV exported successfully!');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to export CSV');
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
            <div className={`p-3 rounded-xl transition-smooth ${
              darkMode 
                ? 'bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20' 
                : 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100'
            }`}>
              {/* CSV file icon */}
              <svg className={`w-7 h-7 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className={`text-3xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              CSV Data Preview
            </h2>
          </div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.totalRows} row{data.totalRows !== 1 ? "s" : ""} imported
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

      {/* Performance Mode Toggle */}
      {shouldUseVirtualization && (
        <div className={`mb-4 flex items-center justify-end gap-3 p-3 rounded-xl ${
          darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}>
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Performance Mode:
          </span>
          <button
            onClick={() => setUseVirtualization(!useVirtualization)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-smooth ${
              useVirtualization
                ? darkMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-600 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {useVirtualization ? 'Virtual Scrolling' : 'Pagination'}
          </button>
        </div>
      )}

      {/* Data Table */}
      {data.data.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg">No data to display</p>
        </div>
      ) : shouldUseVirtualization && useVirtualization ? (
        /* Virtual Scrolling Table */
        <div className="rounded-xl border overflow-hidden">
          {/* Custom Header with Sort */}
          <div className={`flex items-center border-b-2 font-semibold sticky top-0 z-10 ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-gray-200'
              : 'bg-gray-100 border-gray-300 text-gray-800'
          }`}>
            {headers.map((header) => (
              <div
                key={header}
                onClick={() => handleSort(header)}
                className="px-4 py-3 text-sm cursor-pointer hover:opacity-80 flex items-center gap-2"
                style={{ width: 200, minWidth: 200 }}
              >
                <span>{header}</span>
                {getSortIcon(header)}
              </div>
            ))}
          </div>
          <VirtualizedTable
            data={sortedData}
            columns={headers.map((header) => ({
              key: header,
              header: header,
              width: 200,
            }))}
            height={500}
            rowHeight={50}
            darkMode={darkMode}
          />
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

            {/* Page Size Selector - Modern Design */}
            <div className="flex items-center gap-3">
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Per page:
              </label>
              <CustomDropdown
                options={[
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
                value={pageSize}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
                darkMode={darkMode}
                className="w-auto min-w-[100px]"
              />
            </div>

            {/* Pagination Buttons - Modern Trending Design */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-1.5">
              {/* Previous Button - Modern pill shape */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                  currentPage > 1
                    ? darkMode
                      ? 'bg-gray-800/60 text-gray-200 hover:bg-gray-700 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-700'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-200'
                    : darkMode
                      ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gray-100/50 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Numbers - Modern pill design */}
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
                      className={`min-w-[40px] h-10 rounded-xl transition-all duration-200 text-sm font-semibold ${
                        isActive
                          ? darkMode
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110 ring-2 ring-indigo-400/50'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110 ring-2 ring-indigo-300/50'
                          : darkMode
                            ? 'bg-gray-800/40 text-gray-300 hover:bg-gray-700 hover:scale-105 hover:shadow-md border border-gray-700/50'
                            : 'bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-md border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button - Modern pill shape */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                  currentPage < totalPages
                    ? darkMode
                      ? 'bg-gray-800/60 text-gray-200 hover:bg-gray-700 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-700'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-200'
                    : darkMode
                      ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gray-100/50 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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
