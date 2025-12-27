import { useMemo, useState } from 'react';
import { detectColumnType, getDataTypeLabel, getDataTypeColor } from '../utils/dataTypeDetection';

interface PreviewModalProps {
  fileName: string;
  previewData: Record<string, string>[];
  columns: string[];
  onConfirm: (options?: { 
    detectDuplicates: boolean; 
    duplicateColumns?: string[]; 
    handleDuplicates: 'skip' | 'keep' | 'mark';
    columnMapping?: Record<string, string>;
  }) => void;
  onCancel: () => void;
  darkMode?: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  fileName,
  previewData,
  columns,
  onConfirm,
  onCancel,
  darkMode = false,
}) => {
  const [detectDuplicates, setDetectDuplicates] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [handleDuplicates, setHandleDuplicates] = useState<'skip' | 'keep' | 'mark'>('mark');
  const [enableColumnMapping, setEnableColumnMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Detect column types
  const columnTypes = useMemo(() => {
    const types: Record<string, ReturnType<typeof detectColumnType>> = {};
    
    columns.forEach(column => {
      const values = previewData.map(row => row[column] || '').filter(Boolean);
      types[column] = detectColumnType(values);
    });
    
    return types;
  }, [columns, previewData]);

  const handleConfirm = () => {
    onConfirm({
      detectDuplicates,
      duplicateColumns: detectDuplicates && selectedColumns.length > 0 ? selectedColumns : undefined,
      handleDuplicates,
      columnMapping: enableColumnMapping && Object.keys(columnMapping).length > 0 ? columnMapping : undefined,
    });
  };

  const updateColumnMapping = (sourceColumn: string, targetColumn: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev };
      if (targetColumn.trim() === '' || targetColumn === sourceColumn) {
        // Remove mapping if empty or same as source
        delete newMapping[sourceColumn];
      } else {
        newMapping[sourceColumn] = targetColumn.trim();
      }
      return newMapping;
    });
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Preview CSV Data
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Review the data before importing: <span className="font-medium">{fileName}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-xl transition-smooth ${
              darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Column Information */}
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Detected Columns ({columns.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {columns.map((column) => {
              const typeInfo = columnTypes[column];
              return (
                <div
                  key={column}
                  className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                    getDataTypeColor(typeInfo.type, darkMode)
                  }`}
                  title={`Type: ${getDataTypeLabel(typeInfo.type)} (${Math.round(typeInfo.confidence * 100)}% confidence)`}
                >
                  <span className="font-medium">{column}</span>
                  <span className="text-xs opacity-75">
                    {getDataTypeLabel(typeInfo.type)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Table */}
        <div className="flex-1 overflow-auto mb-6">
          <div className={`rounded-xl border overflow-hidden ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                <thead className={darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span>{column}</span>
                          <span className={`text-xs font-normal opacity-75 ${
                            getDataTypeColor(columnTypes[column]?.type || 'string', darkMode).split(' ')[1]
                          }`}>
                            {getDataTypeLabel(columnTypes[column]?.type || 'string')}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
                }`}>
                  {previewData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`transition-smooth ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-indigo-50/50'
                      }`}
                    >
                      {columns.map((column) => (
                        <td
                          key={column}
                          className={`px-4 py-3 text-sm whitespace-nowrap ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}
                        >
                          {row[column] || <span className="opacity-50">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Duplicate Detection Options */}
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="detectDuplicates"
              checked={detectDuplicates}
              onChange={(e) => setDetectDuplicates(e.target.checked)}
              className={`w-5 h-5 rounded ${
                darkMode ? 'bg-gray-700 border-gray-600 text-indigo-500' : 'border-gray-300 text-indigo-600'
              }`}
            />
            <label
              htmlFor="detectDuplicates"
              className={`text-lg font-semibold cursor-pointer ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
            >
              Detect Duplicates
            </label>
          </div>

          {detectDuplicates && (
            <div className="ml-8 space-y-4">
              {/* Column Selection */}
              <div>
                <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Check duplicates based on:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedColumns([])}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-smooth ${
                      selectedColumns.length === 0
                        ? darkMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    All Columns
                  </button>
                  {columns.map((column) => (
                    <button
                      key={column}
                      onClick={() => toggleColumn(column)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-smooth ${
                        selectedColumns.includes(column)
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {column}
                    </button>
                  ))}
                </div>
                {selectedColumns.length > 0 && (
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Checking {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''}: {selectedColumns.join(', ')}
                  </p>
                )}
              </div>

              {/* Handle Duplicates Option */}
              <div>
                <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  When duplicates are found:
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['skip', 'keep', 'mark'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setHandleDuplicates(option)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth capitalize ${
                        handleDuplicates === option
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {option === 'skip' && 'Skip Duplicates'}
                      {option === 'keep' && 'Keep All'}
                      {option === 'mark' && 'Mark in Warnings'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column Mapping Options */}
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="enableColumnMapping"
              checked={enableColumnMapping}
              onChange={(e) => setEnableColumnMapping(e.target.checked)}
              className={`w-5 h-5 rounded ${
                darkMode ? 'bg-gray-700 border-gray-600 text-indigo-500' : 'border-gray-300 text-indigo-600'
              }`}
            />
            <label
              htmlFor="enableColumnMapping"
              className={`text-lg font-semibold cursor-pointer ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
            >
              Column Mapping
            </label>
          </div>

          {enableColumnMapping && (
            <div className="ml-8 space-y-3">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Map CSV column names to target/database field names. Leave empty to keep original name.
              </p>
              <div className={`rounded-xl border overflow-hidden ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className={`min-w-full divide-y ${
                    darkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          CSV Column (Source)
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Target Column (Database)
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      darkMode ? 'bg-gray-900/50 divide-gray-800' : 'bg-white divide-gray-200'
                    }`}>
                      {columns.map((column) => (
                        <tr
                          key={column}
                          className={`transition-smooth ${
                            darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 text-sm font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {column}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={columnMapping[column] || ''}
                              onChange={(e) => updateColumnMapping(column, e.target.value)}
                              placeholder={column}
                              className={`w-full px-3 py-2 rounded-xl border text-sm transition-smooth ${
                                darkMode
                                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300'
                              }`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {Object.keys(columnMapping).length > 0 && (
                <div className={`mt-3 p-3 rounded-xl ${
                  darkMode ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                    Active Mappings:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(columnMapping).map(([source, target]) => (
                      <span
                        key={source}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          darkMode
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {source} → {target}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {previewData.length} row{previewData.length !== 1 ? 's' : ''} preview
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth ${
                darkMode
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              } hover:scale-105`}
            >
              Confirm Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;

