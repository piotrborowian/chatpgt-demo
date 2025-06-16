'use client'

import React from 'react'

export const AppErrorFallback: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-600 p-8">
        <h1 className="text-2xl font-bold mb-4">Application Error</h1>
        <p className="text-lg mb-4">
          The chat application encountered an unexpected error.
        </p>
        <p className="text-sm text-gray-500">
          Please refresh the page to try again.
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}