'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface RootErrorBoundaryProps {
  children: React.ReactNode
}

export const RootErrorBoundary: React.FC<RootErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-600 p-8 max-w-md">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Critical Application Error
            </h1>
            <p className="text-lg mb-4">
              The application has encountered a critical error and cannot continue.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This error has been logged. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Application
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log critical errors to external monitoring service
        console.error('Critical application error:', error, errorInfo)
        
        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry, LogRocket, etc.
          // errorReportingService.captureException(error, { extra: errorInfo })
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}