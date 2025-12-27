import { useEffect, useState, useMemo, useCallback } from 'react';
import { UploadHistoryResponse, UploadRecord, UploadStatus, CsvRow } from '../types';
import { getUploadHistory, getUploadData, UploadHistoryFilters, downloadOriginalFile, bulkDeleteUploads, exportCsvData } from '../services/api';
import CustomDropdown from './CustomDropdown';
import CustomDatePicker from './CustomDatePicker';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDebounce } from '../hooks/useDebounce';
import { useCache } from '../hooks/useCache';
import { useToast } from '../contexts/ToastContext';

interface UploadHistoryProps {
  onUploadClick?: (upload: UploadRecord) => void;
  darkMode?: boolean;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ onUploadClick, darkMode = false }) => {
  const [history, setHistory] = useState<UploadHistoryResponse | null>(null);
  const [allHistory, setAllHistory] = useState<UploadHistoryResponse | null>(null); // Store all uploads for accurate counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError, showInfo } = useToast();
  const [filter, setFilter] = useState<UploadStatus | 'all'>('all');
  
  // Advanced filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [fileSizeFilter, setFileSizeFilter] = useState<string>('all'); // 'all', 'small', 'medium', 'large'
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Bulk selection and sorting
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Modal data sorting and pagination
  const [modalSortConfig, setModalSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [modalCurrentPage, setModalCurrentPage] = useState<number>(1);
  const [modalPageSize, setModalPageSize] = useState<number>(5); // Default to 5 so pagination shows more often
  const [exportingModal, setExportingModal] = useState(false);
  
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);
  const [uploadData, setUploadData] = useState<CsvRow[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Performance optimizations: Debouncing and Caching
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const cache = useCache<UploadHistoryResponse>({ ttl: 2 * 60 * 1000 }); // 2 minutes cache

  // Load all history (no filter) to get accurate total counts - with caching
  const loadAllHistory = useCallback(async () => {
    const cacheKey = 'all-history';
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      setAllHistory(cached);
      return;
    }

    try {
      const data = await getUploadHistory(undefined); // Get all uploads
      cache.set(cacheKey, data);
      setAllHistory(data);
    } catch (err) {
      // Silently fail - don't show error for this background call
    }
  }, [cache]);

  // Load filtered history for display - with caching and lazy loading
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filters object
      const filters: UploadHistoryFilters = {};
      
      // Status filter
      if (filter !== 'all') {
        filters.status = filter;
      }
      
      // Search filter (use debounced value)
      if (debouncedSearchQuery.trim()) {
        filters.search = debouncedSearchQuery.trim();
      }
      
      // Date range filters
      if (startDate) {
        filters.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        // Set to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.endDate = endDateTime.toISOString();
      }
      
      // File size filters
      if (fileSizeFilter !== 'all') {
        switch (fileSizeFilter) {
          case 'small':
            filters.maxSize = 1024 * 100; // 100 KB
            break;
          case 'medium':
            filters.minSize = 1024 * 100; // 100 KB
            filters.maxSize = 1024 * 1024 * 5; // 5 MB
            break;
          case 'large':
            filters.minSize = 1024 * 1024 * 5; // 5 MB
            break;
        }
      }
      
      // Add pagination
      filters.page = currentPage;
      filters.limit = pageSize;
      
      // Create cache key from filters
      const cacheKey = `history-${JSON.stringify(filters)}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        setHistory(cached);
        setLoading(false);
        return;
      }
      
      // Fetch from API
      const data = await getUploadHistory(filters);
      
      // Cache the result
      cache.set(cacheKey, data);
      
      setHistory(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load upload history';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearchQuery, startDate, endDate, fileSizeFilter, currentPage, pageSize, cache]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, debouncedSearchQuery, startDate, endDate, fileSizeFilter]);

  // Load data when filters or pagination change
  useEffect(() => {
    loadAllHistory(); // Always load all history for accurate counts
    loadHistory(); // Load filtered history for display
    // Refresh every 5 seconds to update processing status
    const interval = setInterval(() => {
      // Clear cache before refresh to get fresh data
      cache.clearExpired();
      loadAllHistory();
      loadHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, [filter, debouncedSearchQuery, startDate, endDate, fileSizeFilter, currentPage, pageSize, loadAllHistory, loadHistory, cache]);

  // Clear all filters
  const clearFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setFileSizeFilter('all');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = filter !== 'all' || searchQuery.trim() || startDate || endDate || fileSizeFilter !== 'all';

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (history?.hasNextPage) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (history?.hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!history) return [];
    const totalPages = history.totalPages;
    const current = currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
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

  const formatStatus = (status: UploadStatus): string => {
    // Capitalize first letter of status
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusBadge = (status: UploadStatus) => {
    const baseClasses = 'px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2';
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

  // Cache for upload data
  const dataCache = useCache<CsvRow[]>({ ttl: 10 * 60 * 1000 }); // 10 minutes cache for data

  const handleViewData = async (upload: UploadRecord, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (upload.status === UploadStatus.SUCCESS) {
      setSelectedUpload(upload);
      
      // Check cache first
      const cacheKey = `upload-data-${upload.id}`;
      const cachedData = dataCache.get(cacheKey);
      
      if (cachedData) {
        setUploadData(cachedData);
        setLoadingData(false);
        return;
      }
      
      // Lazy load data
      setLoadingData(true);
      try {
        const data = await getUploadData(upload.id);
        // Cache the data
        dataCache.set(cacheKey, data.data);
        setUploadData(data.data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load CSV data';
        setError(errorMessage);
        showError(errorMessage);
        setUploadData(null);
      } finally {
        setLoadingData(false);
      }
    }
  };

  const closeModal = () => {
    setSelectedUpload(null);
    setUploadData(null);
    setModalSortConfig(null);
    setModalCurrentPage(1);
    setModalPageSize(10);
  };

  // Keyboard shortcut: Esc to close modal
  useKeyboardShortcuts({
    onCloseModal: () => {
      if (selectedUpload) {
        closeModal();
      }
    },
  });

  // Modal data sorting and pagination
  const sortedModalData = useMemo(() => {
    if (!uploadData || uploadData.length === 0) return [];
    if (!modalSortConfig) return uploadData;
    
    return [...uploadData].sort((a, b) => {
      const aValue = a[modalSortConfig.key] || '';
      const bValue = b[modalSortConfig.key] || '';
      
      if (modalSortConfig.direction === 'asc') {
        return String(aValue).localeCompare(String(bValue));
      } else {
        return String(bValue).localeCompare(String(aValue));
      }
    });
  }, [uploadData, modalSortConfig]);

  const modalTotalPages = Math.ceil(sortedModalData.length / modalPageSize);
  const modalStartIndex = (modalCurrentPage - 1) * modalPageSize;
  const modalEndIndex = modalStartIndex + modalPageSize;
  const paginatedModalData = sortedModalData.slice(modalStartIndex, modalEndIndex);

  const handleModalSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (modalSortConfig && modalSortConfig.key === key && modalSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setModalSortConfig({ key, direction });
    setModalCurrentPage(1);
  };

  const getModalSortIcon = (header: string) => {
    if (!modalSortConfig || modalSortConfig.key !== header) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return modalSortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleModalExport = async () => {
    if (!selectedUpload?.id) return;
    try {
      setExportingModal(true);
      await exportCsvData(selectedUpload.id, selectedUpload.fileName);
      showSuccess(`CSV exported successfully: ${selectedUpload.fileName}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to export CSV');
    } finally {
      setExportingModal(false);
    }
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
      {/* Advanced Filters Section - Single Row */}
      <div className={`mb-6 p-3 rounded-xl ${
        darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search Input - Modern Design */}
          <div className="flex-1 min-w-0">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filename..."
                className={`w-full px-5 py-3 pl-12 pr-12 rounded-xl border-2 text-sm font-bold transition-all duration-300 ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border-indigo-500/50 text-gray-100 placeholder-gray-500 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
                    : 'bg-gradient-to-br from-white to-gray-50/90 backdrop-blur-xl border-indigo-400/60 text-gray-900 placeholder-gray-400 hover:border-indigo-500 hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-[0_4px_15px_rgba(99,102,241,0.15)]'
                }`}
              />
              <svg
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  darkMode ? 'text-indigo-400 group-focus-within:text-indigo-300' : 'text-indigo-600 group-focus-within:text-indigo-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110 ${
                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Start Date - Custom Modern Date Picker */}
          <div className="w-full sm:w-auto">
            <CustomDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start Date"
              darkMode={darkMode}
            />
          </div>

          {/* End Date - Custom Modern Date Picker */}
          <div className="w-full sm:w-auto">
            <CustomDatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="End Date"
              darkMode={darkMode}
            />
          </div>

          {/* File Size Filter - Modern Custom Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[160px]">
            <CustomDropdown
              options={[
                { value: 'all', label: 'All Sizes' },
                { value: 'small', label: 'Small (< 100 KB)' },
                { value: 'medium', label: 'Medium (100 KB - 5 MB)' },
                { value: 'large', label: 'Large (> 5 MB)' },
              ]}
              value={fileSizeFilter}
              onChange={(value) => setFileSizeFilter(value as string)}
              darkMode={darkMode}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`px-3 py-2 rounded-xl transition-smooth hover-lift flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
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
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            Upload History
          </h2>
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
                  return darkMode ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-green-600 text-white shadow-lg shadow-green-500/30';
                }
                if (filterValue === UploadStatus.FAILED) {
                  return darkMode ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' : 'bg-red-600 text-white shadow-lg shadow-red-500/30';
                }
                return darkMode ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/50' : 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/30';
              }
              return darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md';
            };
            
            const getIcon = () => {
              if (filterValue === 'all') {
                return (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                );
              }
              if (filterValue === UploadStatus.SUCCESS) {
                return (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                );
              }
              if (filterValue === UploadStatus.FAILED) {
                return (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                );
              }
              if (filterValue === UploadStatus.PROCESSING) {
                return (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                );
              }
              return null;
            };
            
            const getCount = () => {
              // Use allHistory for accurate counts, fallback to history if allHistory not loaded yet
              const source = allHistory || history;
              if (!source) return 0;
              if (filterValue === 'all') return source.total;
              if (filterValue === UploadStatus.SUCCESS) return source.success;
              if (filterValue === UploadStatus.FAILED) return source.failed;
              if (filterValue === UploadStatus.PROCESSING) return source.processing;
              return 0;
            };
            
            return (
              <button
                key={filterValue}
                onClick={() => setFilter(filterValue)}
                className={`px-4 py-2 rounded-xl font-semibold transition-smooth hover-lift flex items-center gap-2 ${getButtonStyles()}`}
              >
                {getIcon()}
                <span>{filterValue === 'all' ? 'All' : formatStatus(filterValue)}</span>
                {history && (
                  <span className={`px-2 py-0.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? darkMode
                        ? 'bg-white/20 text-white'
                        : 'bg-white/30 text-white'
                      : darkMode
                        ? 'bg-gray-600 text-gray-200'
                        : 'bg-gray-200 text-gray-700'
                  }`}>
                    {getCount()}
                  </span>
                )}
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
        <>
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
                        {/* Modern document icon with rounded style */}
                        <svg className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {upload.fileName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(upload.status)}>
                        {upload.status === UploadStatus.SUCCESS && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {upload.status === UploadStatus.FAILED && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {upload.status === UploadStatus.PROCESSING && (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        {formatStatus(upload.status)}
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
                          className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2.5 overflow-hidden ${
                            darkMode
                              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.8)] hover:scale-110 ring-2 ring-indigo-400/50'
                              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.6)] hover:scale-110 ring-2 ring-indigo-300/50'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <svg className="w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="relative z-10">View Data</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Always show when history exists */}
          {history && history.uploads.length > 0 && (
                <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {/* Page Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, history.total)} of {history.total} result{history.total !== 1 ? 's' : ''}
                    </span>
                    {history.totalPages > 1 && (
                      <>
                        <span className="mx-2">|</span>
                        <span>Page {currentPage} of {history.totalPages}</span>
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
                  {history.totalPages > 1 ? (
                    <div className="flex items-center gap-1.5">
                      {/* Previous Button - Modern pill shape */}
                      <button
                        onClick={goToPreviousPage}
                        disabled={!history.hasPreviousPage}
                        className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                          history.hasPreviousPage
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
                        {getPageNumbers().map((page, index) => {
                          if (page === '...') {
                            return (
                              <span key={`ellipsis-${index}`} className={`px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-medium`}>
                                ...
                              </span>
                            );
                          }
                          const pageNum = page as number;
                          const isActive = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
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
                        onClick={goToNextPage}
                        disabled={!history.hasNextPage}
                        className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                          history.hasNextPage
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
                      All {history.total} result{history.total !== 1 ? 's' : ''} shown
                    </div>
                  )}
                </div>
              )}
        </>
      )}

      {/* Modal for viewing CSV data */}
      {selectedUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-8 pb-4 px-4 animate-fade-in overflow-y-auto">
          <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[85vh] flex flex-col transition-smooth mt-8`}>
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex-1 min-w-0 pr-4">
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold break-words ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} title={selectedUpload.fileName}>
                  <span className="text-sm sm:text-base font-normal opacity-75">CSV Data:</span>{' '}
                  <span className="break-all">{selectedUpload.fileName}</span>
                </h3>
                <p className={`mt-1 text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedUpload.totalRows} row{selectedUpload.totalRows !== 1 ? 's' : ''} imported
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={handleModalExport}
                  disabled={exportingModal}
                  className={`px-3 sm:px-4 py-2 rounded-xl transition-smooth flex items-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                  } ${exportingModal ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {exportingModal ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </>
                  )}
                </button>
                <button
                  onClick={closeModal}
                  title="Close (Esc)"
                  className={`p-2 rounded-xl transition-smooth flex-shrink-0 ${
                    darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
                    <thead className={`sticky top-0 z-10 ${
                      darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'
                    }`}>
                      <tr>
                        {uploadData.length > 0 && Object.keys(uploadData[0]).map((header) => (
                          <th
                            key={header}
                            onClick={() => handleModalSort(header)}
                            className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-opacity-80 transition-smooth ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            } ${modalSortConfig?.key === header ? darkMode ? 'bg-indigo-600/30' : 'bg-indigo-100' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{header}</span>
                              {getModalSortIcon(header)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
                    }`}>
                      {paginatedModalData.map((row, index) => (
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

            {/* Pagination Controls for Modal - Outside scrollable area */}
            {uploadData && uploadData.length > 0 && (
              <div className={`px-6 py-4 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {/* Page Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      Showing {modalStartIndex + 1} to {Math.min(modalEndIndex, sortedModalData.length)} of {sortedModalData.length} results
                    </span>
                    {modalTotalPages > 1 && (
                      <>
                        <span className="mx-2">|</span>
                        <span>Page {modalCurrentPage} of {modalTotalPages}</span>
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
                      value={modalPageSize}
                      onChange={(value) => {
                        setModalPageSize(Number(value));
                        setModalCurrentPage(1);
                      }}
                      darkMode={darkMode}
                      className="w-auto min-w-[100px]"
                    />
                  </div>

                  {/* Pagination Buttons - Modern Trending Design */}
                  {modalTotalPages > 1 ? (
                    <div className="flex items-center gap-1.5">
                      {/* Previous Button - Modern pill shape */}
                      <button
                        onClick={() => setModalCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={modalCurrentPage === 1}
                        className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                          modalCurrentPage > 1
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
                        {Array.from({ length: Math.min(7, modalTotalPages) }, (_, i) => {
                          let pageNum: number;
                          if (modalTotalPages <= 7) {
                            pageNum = i + 1;
                          } else if (modalCurrentPage <= 4) {
                            pageNum = i + 1;
                          } else if (modalCurrentPage >= modalTotalPages - 3) {
                            pageNum = modalTotalPages - 6 + i;
                          } else {
                            pageNum = modalCurrentPage - 3 + i;
                          }
                          
                          const isActive = pageNum === modalCurrentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setModalCurrentPage(pageNum)}
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
                        onClick={() => setModalCurrentPage(prev => Math.min(modalTotalPages, prev + 1))}
                        disabled={modalCurrentPage === modalTotalPages}
                        className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                          modalCurrentPage < modalTotalPages
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
                      All {sortedModalData.length} result{sortedModalData.length !== 1 ? 's' : ''} shown
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHistory;

