'use client'

import React, { useEffect, useRef, memo, useMemo } from 'react'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { Message as MessageType } from '@/types/database'

interface MessageListProps {
  messages: MessageType[]
  loading?: boolean
  showTimestamps?: boolean
  autoScroll?: boolean
}

const MessageListComponent: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  showTimestamps = false,
  autoScroll = true,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Memoize rendered messages to prevent unnecessary re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message) => (
      <Message
        key={message.id}
        message={message}
        showTimestamp={showTimestamps}
      />
    ))
  }, [messages, showTimestamps])

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, autoScroll])

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4"
      data-testid="message-list"
    >
      {messages.length === 0 && !loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No messages yet</div>
            <div className="text-sm">Start a conversation by typing a message below.</div>
          </div>
        </div>
      ) : (
        <>
          {renderedMessages}
          
          {loading && (
            <TypingIndicator visible={true} />
          )}
          
          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  )
}

// Memoize MessageList component to prevent unnecessary re-renders
export const MessageList = memo(MessageListComponent, (prevProps, nextProps) => {
  // Only re-render if props have actually changed
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.messages.every((msg, index) => 
      msg.id === nextProps.messages[index]?.id &&
      msg.content === nextProps.messages[index]?.content
    ) &&
    prevProps.loading === nextProps.loading &&
    prevProps.showTimestamps === nextProps.showTimestamps &&
    prevProps.autoScroll === nextProps.autoScroll
  )
})