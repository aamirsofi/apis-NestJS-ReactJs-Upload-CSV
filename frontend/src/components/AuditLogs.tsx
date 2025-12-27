import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { AuditLog, AuditLogsResponse, AuditLogFilters } from '../services/api';
import { getAuditLogs } from '../services/api';
import CustomDropdown from './CustomDropdown';
import CustomDatePicker from './CustomDatePicker';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../contexts/ToastContext';

interface AuditLogsProps {
  darkMode?: boolean;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ darkMode = false }) => {
  const [logs, setLogs] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [uploadIdFilter, setUploadIdFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  
  const { showError } = useToast();
  const debouncedUploadId = useDebounce(uploadIdFilter, 500);
  const hasShownErrorRef = useRef<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      hasShownErrorRef.current = null; // Reset error tracking
      
      const filters: AuditLogFilters = {
        page: currentPage,
        limit: pageSize,
      };
      
      if (actionFilter !== 'all') {
        filters.action = actionFilter;
      }
      
      if (debouncedUploadId.trim()) {
        filters.uploadId = debouncedUploadId.trim();
      }
      
      if (startDate) {
        filters.startDate = new Date(startDate).toISOString();
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.endDate = endDateTime.toISOString();
      }
      
      const data = await getAuditLogs(filters);
      setLogs(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      
      // Only show toast if we haven't shown this exact error message before
      if (hasShownErrorRef.current !== errorMessage) {
        hasShownErrorRef.current = errorMessage;
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter, debouncedUploadId, startDate, endDate, currentPage, pageSize, showError]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [actionFilter, debouncedUploadId, startDate, endDate]);

  const clearFilters = () => {
    setActionFilter('all');
    setUploadIdFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = actionFilter !== 'all' || uploadIdFilter.trim() || startDate || endDate;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatAction = (action: string): string => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'export':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'delete':
      case 'bulk_delete':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'view_data':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'download_original':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-xl text-xs font-semibold';
    return status === 'success' ? (
      darkMode
        ? `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`
        : `${baseClasses} bg-green-100 text-green-800 border border-green-200`
    ) : (
      darkMode
        ? `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`
        : `${baseClasses} bg-red-100 text-red-800 border border-red-200`
    );
  };

  if (loading && !logs) {
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
            Loading audit logs...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-modern${darkMode ? '-dark' : ''} p-4 rounded-xl border-l-4 border-red-500`}>
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={`font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Error:</p>
            <p className={darkMode ? 'text-red-300' : 'text-red-600'}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Audit Logs
        </h2>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Track all user actions and system events
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        {/* Action Filter */}
        <CustomDropdown
          options={[
            { value: 'all', label: 'All Actions' },
            { value: 'upload', label: 'Upload' },
            { value: 'export', label: 'Export' },
            { value: 'delete', label: 'Delete' },
            { value: 'bulk_delete', label: 'Bulk Delete' },
            { value: 'view_data', label: 'View Data' },
            { value: 'download_original', label: 'Download Original' },
          ]}
          value={actionFilter}
          onChange={setActionFilter}
          darkMode={darkMode}
          className="w-full sm:w-auto min-w-[150px]"
        />

        {/* Upload ID Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by Upload ID..."
            value={uploadIdFilter}
            onChange={(e) => setUploadIdFilter(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border transition-smooth focus:ring-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                : 'bg-white border-gray-300 text-gray-800 focus:ring-indigo-300 focus:border-indigo-300'
            }`}
          />
          <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <CustomDatePicker
            selectedDate={startDate}
            onDateChange={setStartDate}
            placeholder="Start Date"
            darkMode={darkMode}
          />
          <CustomDatePicker
            selectedDate={endDate}
            onDateChange={setEndDate}
            placeholder="End Date"
            darkMode={darkMode}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`px-4 py-2 rounded-xl font-semibold transition-smooth hover-lift flex items-center gap-2 ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Logs Table */}
      {logs && logs.logs.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border overflow-hidden mb-6">
            <table className={`min-w-full divide-y ${
              darkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Action
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    File Name
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    User
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upload ID
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    IP Address
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
              }`}>
                {logs.logs.map((log) => (
                  <tr
                    key={log.id}
                    className={`transition-smooth ${
                      darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium">{formatAction(log.action)}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {log.fileName ? (
                        <div className="flex flex-col">
                          <span>{log.fileName}</span>
                          {log.details?.fileNames && Array.isArray(log.details.fileNames) && log.details.fileNames.length > 1 && (
                            <span className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              +{log.details.fileNames.length - 1} more
                            </span>
                          )}
                        </div>
                      ) : log.details?.fileNames && Array.isArray(log.details.fileNames) && log.details.fileNames.length > 0 ? (
                        <div className="flex flex-col">
                          <span>{log.details.fileNames[0]}</span>
                          {log.details.fileNames.length > 1 && (
                            <span className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              +{log.details.fileNames.length - 1} more file{log.details.fileNames.length - 1 !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {log.userName || log.userEmail ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{log.userName || log.userEmail}</span>
                          {log.userEmail && log.userName && (
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {log.userEmail}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {log.uploadId ? (
                        <span className="text-xs" title={log.uploadId}>{log.uploadId.substring(0, 8)}...</span>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(log.status)}>
                        {log.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {log.userIp || <span className="opacity-50">-</span>}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.totalPages > 1 && (
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, logs.total)} of {logs.total} result{logs.total !== 1 ? 's' : ''}
                </span>
                <span className="mx-2">|</span>
                <span>Page {currentPage} of {logs.totalPages}</span>
              </div>

              <div className="flex items-center gap-3">
                <label className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Per page:
                </label>
                <CustomDropdown
                  options={[
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                    { value: 200, label: '200' },
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

              <div className="flex items-center gap-1.5">
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

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, logs.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (logs.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= logs.totalPages - 3) {
                      pageNum = logs.totalPages - 6 + i;
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

                <button
                  onClick={() => setCurrentPage(prev => Math.min(logs.totalPages, prev + 1))}
                  disabled={currentPage === logs.totalPages}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                    currentPage < logs.totalPages
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
            </div>
          )}
        </>
      ) : (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="text-lg">No audit logs found.</p>
          <p className="text-sm mt-1">Audit logs will appear here as actions are performed.</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;


