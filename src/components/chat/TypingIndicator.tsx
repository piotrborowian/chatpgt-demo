import React from 'react'

interface TypingIndicatorProps {
  visible: boolean
  message?: string
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  visible, 
  message = 'Assistant is typing...' 
}) => {
  if (!visible) return null

  return (
    <div className="flex justify-start mb-4" data-testid="typing-indicator">
      <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
        {/* Role label */}
        <div className="text-xs font-medium mb-1 text-gray-500">
          Assistant
        </div>
        
        {/* Typing message and animated dots */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{message}</span>
          <div className="flex space-x-1" data-testid="typing-dots">
            <div 
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}