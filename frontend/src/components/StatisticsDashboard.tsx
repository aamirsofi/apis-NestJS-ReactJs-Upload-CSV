import { useEffect, useState, useMemo } from 'react';
import { UploadHistoryResponse, UploadStatus } from '../types';
import { getUploadHistory } from '../services/api';

interface StatisticsDashboardProps {
  darkMode?: boolean;
}

interface Statistics {
  totalUploads: number;
  successCount: number;
  failedCount: number;
  processingCount: number;
  successRate: number;
  totalRows: number;
  totalFileSize: number;
  averageFileSize: number;
  averageRowsPerFile: number;
  uploadsByDate: Array<{ date: string; count: number }>;
  fileSizeDistribution: {
    small: number;
    medium: number;
    large: number;
  };
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ darkMode = false }) => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all uploads without filters (use a large limit to get all uploads for accurate statistics)
      // In production, you might want to add a dedicated statistics endpoint
      const data = await getUploadHistory({ page: 1, limit: 1000 });
      
      // Calculate statistics
      const stats = calculateStatistics(data);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data: UploadHistoryResponse): Statistics => {
    const uploads = data.uploads;
    // Use statistics from API response (more accurate than counting)
    const totalUploads = data.total;
    const successCount = data.success;
    const failedCount = data.failed;
    const processingCount = data.processing;
    
    const successRate = totalUploads > 0 
      ? Math.round((successCount / totalUploads) * 100) 
      : 0;

    // Calculate total rows and file sizes from fetched uploads
    let totalRows = 0;
    let totalFileSize = 0;
    
    uploads.forEach(upload => {
      if (upload.totalRows) {
        totalRows += upload.totalRows;
      }
      totalFileSize += upload.fileSize;
    });

    // Calculate averages (note: these are based on fetched uploads, not all uploads if paginated)
    const averageFileSize = uploads.length > 0 ? totalFileSize / uploads.length : 0;
    const averageRowsPerFile = successCount > 0 ? totalRows / successCount : 0;

    // Group uploads by date
    const uploadsByDateMap = new Map<string, number>();
    uploads.forEach(upload => {
      const date = new Date(upload.uploadedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      uploadsByDateMap.set(date, (uploadsByDateMap.get(date) || 0) + 1);
    });

    const uploadsByDate = Array.from(uploadsByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    // File size distribution
    const fileSizeDistribution = {
      small: uploads.filter(u => u.fileSize < 100 * 1024).length, // < 100 KB
      medium: uploads.filter(u => u.fileSize >= 100 * 1024 && u.fileSize < 5 * 1024 * 1024).length, // 100 KB - 5 MB
      large: uploads.filter(u => u.fileSize >= 5 * 1024 * 1024).length, // >= 5 MB
    };

    return {
      totalUploads,
      successCount,
      failedCount,
      processingCount,
      successRate,
      totalRows,
      totalFileSize,
      averageFileSize,
      averageRowsPerFile,
      uploadsByDate,
      fileSizeDistribution,
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const maxUploads = useMemo(() => {
    if (!statistics?.uploadsByDate.length) return 1;
    return Math.max(...statistics.uploadsByDate.map(d => d.count));
  }, [statistics]);

  if (loading) {
    return (
      <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth`}>
        <div className="flex items-center justify-center py-12">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
            darkMode ? 'border-indigo-500/30 border-t-indigo-400' : 'border-indigo-200 border-t-indigo-600'
          }`}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth`}>
        <div className={`text-center py-12 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold">Failed to load statistics</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 transition-smooth`}>
      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          Statistics Dashboard
        </h2>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Overview of your CSV import activity
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Uploads */}
        <div className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
          darkMode
            ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/50'
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${
              darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Uploads
          </p>
          <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {statistics.totalUploads}
          </p>
        </div>

        {/* Success Rate */}
        <div className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
          darkMode
            ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/50'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${
              darkMode ? 'bg-green-500/20' : 'bg-green-100'
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Success Rate
          </p>
          <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {statistics.successRate}%
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {statistics.successCount} successful
          </p>
        </div>

        {/* Total Rows */}
        <div className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
          darkMode
            ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50'
            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Rows Imported
          </p>
          <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {statistics.totalRows.toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Avg: {Math.round(statistics.averageRowsPerFile).toLocaleString()} per file
          </p>
        </div>

        {/* Average File Size */}
        <div className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
          darkMode
            ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50'
            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${
              darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
            }`}>
              <svg className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>
          <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Average File Size
          </p>
          <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatFileSize(statistics.averageFileSize)}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Total: {formatFileSize(statistics.totalFileSize)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Uploads Over Time */}
        <div className={`p-6 rounded-xl border-2 ${
          darkMode
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            Uploads Over Time (Last 7 Days)
          </h3>
          {statistics.uploadsByDate.length > 0 ? (
            <div className="space-y-3">
              {statistics.uploadsByDate.map((item, index) => {
                const percentage = (item.count / maxUploads) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {item.date}
                      </span>
                      <span className={`text-sm font-bold ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {item.count}
                      </span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          darkMode
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            : 'bg-gradient-to-r from-indigo-400 to-purple-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No uploads in the last 7 days
            </p>
          )}
        </div>

        {/* Status Distribution */}
        <div className={`p-6 rounded-xl border-2 ${
          darkMode
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            Status Distribution
          </h3>
          <div className="space-y-4">
            {/* Success */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    darkMode ? 'bg-green-400' : 'bg-green-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Success
                  </span>
                </div>
                <span className={`text-sm font-bold ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {statistics.successCount} ({statistics.totalUploads > 0 ? Math.round((statistics.successCount / statistics.totalUploads) * 100) : 0}%)
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${statistics.totalUploads > 0 ? (statistics.successCount / statistics.totalUploads) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Failed */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    darkMode ? 'bg-red-400' : 'bg-red-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Failed
                  </span>
                </div>
                <span className={`text-sm font-bold ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {statistics.failedCount} ({statistics.totalUploads > 0 ? Math.round((statistics.failedCount / statistics.totalUploads) * 100) : 0}%)
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-500"
                  style={{ width: `${statistics.totalUploads > 0 ? (statistics.failedCount / statistics.totalUploads) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Processing */}
            {statistics.processingCount > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      darkMode ? 'bg-yellow-400' : 'bg-yellow-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Processing
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {statistics.processingCount} ({statistics.totalUploads > 0 ? Math.round((statistics.processingCount / statistics.totalUploads) * 100) : 0}%)
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${statistics.totalUploads > 0 ? (statistics.processingCount / statistics.totalUploads) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Size Distribution */}
      <div className={`p-6 rounded-xl border-2 ${
        darkMode
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-4 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          File Size Distribution
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Small Files */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Small (&lt; 100 KB)
              </span>
              <span className={`text-lg font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {statistics.fileSizeDistribution.small}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${statistics.totalUploads > 0 ? (statistics.fileSizeDistribution.small / statistics.totalUploads) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium Files */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Medium (100 KB - 5 MB)
              </span>
              <span className={`text-lg font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {statistics.fileSizeDistribution.medium}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${statistics.totalUploads > 0 ? (statistics.fileSizeDistribution.medium / statistics.totalUploads) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Large Files */}
          <div className={`p-4 rounded-xl ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Large (&gt; 5 MB)
              </span>
              <span className={`text-lg font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {statistics.fileSizeDistribution.large}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${statistics.totalUploads > 0 ? (statistics.fileSizeDistribution.large / statistics.totalUploads) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;

