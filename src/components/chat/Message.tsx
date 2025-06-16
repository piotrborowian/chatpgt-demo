import React from 'react'
import { Message as MessageType } from '@/types/database'

interface MessageProps {
  message: MessageType
  showTimestamp?: boolean
}

export const Message: React.FC<MessageProps> = ({ message, showTimestamp = false }) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        {/* Role label */}
        <div className={`text-xs font-medium mb-1 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {isUser ? 'You' : 'Assistant'}
        </div>
        
        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        
        {/* Timestamp */}
        {showTimestamp && (
          <div className={`text-xs mt-1 ${
            isUser ? 'text-blue-200' : 'text-gray-400'
          }`}>
            {formatTime(message.created_at)}
          </div>
        )}
      </div>
    </div>
  )
}