'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { AppErrorFallback } from '@/components/ui/AppErrorFallback'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="h-screen max-w-4xl mx-auto bg-white shadow-lg">
        <ErrorBoundary
          fallback={<AppErrorFallback />}
          onError={(error, errorInfo) => {
            // Log to external service in production
            console.error('Application error:', error, errorInfo)
          }}
        >
          <ChatInterface />
        </ErrorBoundary>
      </div>
    </main>
  )
}