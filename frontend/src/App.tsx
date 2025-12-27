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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              CSV Import Tool
            </h1>
            <p className="text-gray-600">
              Upload and preview your CSV files instantly
            </p>
          </header>

          <div className="mb-4 flex justify-center gap-4">
            <button
              onClick={() => {
                setShowHistory(false);
                setCsvData(null);
              }}
              className={`px-6 py-2 rounded-lg transition-colors ${
                !showHistory && !csvData
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Upload CSV
            </button>
            <button
              onClick={() => {
                setShowHistory(true);
                setCsvData(null);
              }}
              className={`px-6 py-2 rounded-lg transition-colors ${
                showHistory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Upload History
            </button>
          </div>

          {showHistory ? (
            <UploadHistory onUploadClick={handleUploadClick} />
          ) : !csvData ? (
            <>
              <CsvUploader
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                onLoadingChange={handleLoadingChange}
                loading={loading}
              />
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              )}
            </>
          ) : (
            <CsvPreview
              data={csvData}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App

