import { useState } from 'react'
import CsvUploader from './components/CsvUploader'
import CsvPreview from './components/CsvPreview'
import { CsvData } from './types'

function App() {
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUploadSuccess = (data: CsvData) => {
    setCsvData(data)
    setError(null)
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              CSV Import Tool
            </h1>
            <p className="text-gray-600">
              Upload and preview your CSV files instantly
            </p>
          </header>

          {!csvData ? (
            <CsvUploader
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onLoadingChange={handleLoadingChange}
              loading={loading}
            />
          ) : (
            <CsvPreview
              data={csvData}
              onReset={handleReset}
            />
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

