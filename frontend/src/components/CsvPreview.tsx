import { CsvData } from "../types";

interface CsvPreviewProps {
  data: CsvData;
  onReset: () => void;
  darkMode?: boolean;
}

const CsvPreview: React.FC<CsvPreviewProps> = ({ data, onReset, darkMode = false }) => {
  const headers = data.data.length > 0 ? Object.keys(data.data[0]) : [];

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
        <div className="overflow-x-auto rounded-xl border overflow-hidden">
          <table className={`min-w-full divide-y ${
            darkMode ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            <thead className={darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
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
              {data.data.map((row, rowIndex) => (
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
      )}
    </div>
  );
};

export default CsvPreview;
