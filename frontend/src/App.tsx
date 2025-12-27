import { useState } from 'react'
import CsvUploader from './components/CsvUploader'
import CsvPreview from './components/CsvPreview'
import UploadHistory from './components/UploadHistory'
import { CsvData, UploadRecord } from './types'

function App() {
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const handleUploadSuccess = (data: CsvData) => {
    setCsvData(data)
    setError(null)
    setShowHistory(false)
  }

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage)
    setCsvData(null)
  }

  const handleLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading)
  }

  const handleReset = () => {
    setCsvData(null)
    setError(null)
    setShowHistory(false)
  }

  const handleUploadClick = (upload: UploadRecord) => {
    // Could navigate to upload details or show more info
    console.log('Upload clicked:', upload);
  }

  return (
    <div className={`min-h-screen transition-smooth ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Dark Mode Toggle */}
          <header className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-full transition-smooth hover-lift ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                    : 'bg-white text-gray-800 hover:bg-gray-100 shadow-lg'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
            <h1 className={`text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 ${
              darkMode ? 'from-indigo-400 via-purple-400 to-pink-400' : ''
            }`}>
              CSV Import Tool
            </h1>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Upload and preview your CSV files instantly
            </p>
          </header>

          {/* Navigation Buttons */}
          <div className="mb-6 flex justify-center gap-3">
            <button
              onClick={() => {
                setShowHistory(false);
                setCsvData(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
                !showHistory && !csvData
                  ? darkMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              Upload CSV
            </button>
            <button
              onClick={() => {
                setShowHistory(true);
                setCsvData(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
                showHistory
                  ? darkMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              Upload History
            </button>
          </div>

          {/* Main Content */}
          {showHistory ? (
            <UploadHistory onUploadClick={handleUploadClick} darkMode={darkMode} />
          ) : !csvData ? (
            <>
              <CsvUploader
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                onLoadingChange={handleLoadingChange}
                loading={loading}
                darkMode={darkMode}
              />
              {error && (
                <div className={`mt-4 card-modern${darkMode ? '-dark' : ''} p-4 rounded-xl border-l-4 border-red-500 animate-pulse-slow`}>
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
              )}
            </>
          ) : (
            <CsvPreview
              data={csvData}
              onReset={handleReset}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App

