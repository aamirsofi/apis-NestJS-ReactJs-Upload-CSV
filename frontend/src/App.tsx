import { useState } from 'react'
import CsvUploader from './components/CsvUploader'
import CsvPreview from './components/CsvPreview'
import UploadHistory from './components/UploadHistory'
import StatisticsDashboard from './components/StatisticsDashboard'
import AuditLogs from './components/AuditLogs'
import Login from './components/Login'
import Register from './components/Register'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CsvData, UploadRecord } from './types'

function AppContent() {
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [showAuditLogs, setShowAuditLogs] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showLogin, setShowLogin] = useState(true)
  const { user, isAuthenticated, isLoading, logout } = useAuth()

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
    setShowStatistics(false)
    setShowAuditLogs(false)
  }

  const handleUploadClick = (upload: UploadRecord) => {
    // Could navigate to upload details or show more info
    console.log('Upload clicked:', upload);
  }

  // Show login/register if not authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <ToastProvider darkMode={darkMode}>
        <div className={`min-h-screen transition-smooth flex items-center justify-center ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
        }`}>
          <div className="container mx-auto px-4 py-8">
            {showLogin ? (
              <Login 
                darkMode={darkMode} 
                onSwitchToRegister={() => setShowLogin(false)}
                onLoginSuccess={() => {}}
              />
            ) : (
              <Register 
                darkMode={darkMode} 
                onSwitchToLogin={() => setShowLogin(true)}
                onRegisterSuccess={() => setShowLogin(true)}
              />
            )}
          </div>
        </div>
      </ToastProvider>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <ToastProvider darkMode={darkMode}>
        <div className={`min-h-screen transition-smooth flex items-center justify-center ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
        }`}>
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto ${
              darkMode ? 'border-indigo-500/30 border-t-indigo-400' : 'border-indigo-200 border-t-indigo-600'
            }`}></div>
            <p className={`mt-4 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading...
            </p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider darkMode={darkMode}>
      <div className={`min-h-screen transition-smooth ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
      }`}>
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Dark Mode Toggle and User Info */}
          <header className="text-center mb-8 relative">
            <div className="absolute top-0 right-0 flex items-center gap-3">
              {/* User Info */}
              {user && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 shadow-md'
                }`}>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {user.firstName || user.email.split('@')[0]}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.email}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-indigo-600' : 'bg-indigo-100'
                  }`}>
                    <span className={`text-sm font-semibold ${
                      darkMode ? 'text-white' : 'text-indigo-700'
                    }`}>
                      {(user.firstName || user.email)[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Logout Button */}
              {user && (
                <button
                  onClick={logout}
                  className={`p-3 rounded-full transition-smooth hover-lift ${
                    darkMode 
                      ? 'bg-gray-700 text-red-400 hover:bg-gray-600' 
                      : 'bg-white text-red-600 hover:bg-red-50 shadow-lg'
                  }`}
                  aria-label="Logout"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
              
              {/* Dark Mode Toggle */}
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
                  <svg className="w-6 h-6 transition-transform duration-300 hover:rotate-180" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 transition-transform duration-300 hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
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
          <div className="mb-6 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowHistory(false);
                setShowStatistics(false);
                setShowAuditLogs(false);
                setCsvData(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
                !showHistory && !showStatistics && !showAuditLogs && !csvData
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
                setShowStatistics(false);
                setShowAuditLogs(false);
                setCsvData(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
                showHistory && !showStatistics && !showAuditLogs
                  ? darkMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              Data Imports
            </button>
            <button
              onClick={() => {
                setShowStatistics(true);
                setShowHistory(false);
                setShowAuditLogs(false);
                setCsvData(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
                showStatistics && !showHistory && !showAuditLogs
                  ? darkMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => {
                setShowAuditLogs(true);
                setShowHistory(false);
                setShowStatistics(false);
                setCsvData(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-smooth hover-lift ${
                showAuditLogs && !showHistory && !showStatistics
                  ? darkMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              Audit Logs
            </button>
          </div>

          {/* Main Content */}
          {showAuditLogs ? (
            <AuditLogs darkMode={darkMode} />
          ) : showStatistics ? (
            <StatisticsDashboard darkMode={darkMode} />
          ) : showHistory ? (
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
    </ToastProvider>
  )
}

function App() {
  return (
    <AuthProvider darkMode={false}>
      <AppContent />
    </AuthProvider>
  )
}

export default App

