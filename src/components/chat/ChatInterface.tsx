'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Message as MessageType, Conversation } from '@/types/database'
import { createMessage, createConversation } from '@/lib/database'
import { sanitizeUserInput } from '@/lib/sanitize'

interface ChatInterfaceProps {
  conversationId?: string
  onConversationCreate?: (conversation: Conversation) => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onConversationCreate,
}) => {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationId || null
  )
  
  // Refs for proper race condition and memory leak prevention
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentRequestIdRef = useRef<number>(0)

  // Load messages for conversation if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId)
      // TODO: Load messages from database for this conversation
      // This will be implemented when we add the message loading functionality
    }
  }, [conversationId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleSendMessage = useCallback(async (content: string) => {
    // Prevent multiple simultaneous sends
    if (loading) return

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    const requestId = ++currentRequestIdRef.current

    try {
      setLoading(true)

      // Sanitize user input to prevent XSS and other attacks
      const sanitizedContent = sanitizeUserInput(content)
      
      // Validate sanitized content
      if (!sanitizedContent.trim()) {
        if (isMountedRef.current) {
          setLoading(false)
        }
        return
      }

      // Check if request was aborted
      if (abortController.signal.aborted) return

      // Create conversation if this is the first message
      let convId = currentConversationId
      if (!convId) {
        const newConversation = await createConversation({
          title: sanitizedContent.slice(0, 50) + (sanitizedContent.length > 50 ? '...' : '')
        })
        
        if (abortController.signal.aborted || !isMountedRef.current) return
        
        convId = newConversation.id
        setCurrentConversationId(convId)
        onConversationCreate?.(newConversation)
      }

      // Generate unique message IDs and atomic ordering
      const timestamp = Date.now()
      const userMessageId = `user-${requestId}-${timestamp}`
      
      const userMessage: MessageType = {
        id: userMessageId,
        conversation_id: convId,
        role: 'user',
        content: sanitizedContent,
        created_at: new Date().toISOString(),
        message_order: timestamp, // Use timestamp for unique ordering
      }

      // Atomic state update - only if component is still mounted and request not aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setMessages(prev => [...prev, userMessage])
      }

      // Save user message to database
      if (!abortController.signal.aborted) {
        await createMessage({
          conversation_id: convId,
          role: 'user',
          content: sanitizedContent,
          message_order: userMessage.message_order,
        })
      }

      // Simulate AI response with proper cancellation handling
      const timeoutId = setTimeout(async () => {
        try {
          // Check if this is still the current request
          if (abortController.signal.aborted || !isMountedRef.current || currentRequestIdRef.current !== requestId) {
            return
          }

          const assistantTimestamp = Date.now()
          const assistantMessage: MessageType = {
            id: `assistant-${requestId}-${assistantTimestamp}`,
            conversation_id: convId!,
            role: 'assistant',
            content: `I received your message: "${sanitizedContent}". This is a placeholder response until OpenAI integration is complete.`,
            created_at: new Date().toISOString(),
            message_order: assistantTimestamp,
          }
          
          // Only update state if still mounted and not aborted
          if (isMountedRef.current && !abortController.signal.aborted && currentRequestIdRef.current === requestId) {
            setMessages(prev => [...prev, assistantMessage])
            
            // Save assistant message to database
            await createMessage({
              conversation_id: convId!,
              role: 'assistant',
              content: assistantMessage.content,
              message_order: assistantMessage.message_order,
            })
          }
        } catch (error) {
          if (isMountedRef.current && !abortController.signal.aborted) {
            console.error('Error creating assistant message:', error)
          }
        } finally {
          if (isMountedRef.current && !abortController.signal.aborted && currentRequestIdRef.current === requestId) {
            setLoading(false)
          }
        }
      }, 1000)

      // Register timeout for cleanup
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        if (isMountedRef.current) {
          setLoading(false)
        }
      })

    } catch (error) {
      if (isMountedRef.current && !abortController.signal.aborted) {
        console.error('Error sending message:', error)
        setLoading(false)
      }
    }
  }, [loading, currentConversationId, onConversationCreate])

  return (
    <div 
      className="flex flex-col h-full bg-white"
      data-testid="chat-interface"
    >
      {/* Header */}
      <div className="flex-none bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">
          Chat Assistant
        </h1>
      </div>

      {/* Messages */}
      <ErrorBoundary
        fallback={
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium mb-2">Chat messages unavailable</p>
              <p className="text-sm">There was an error loading the message history.</p>
            </div>
          </div>
        }
      >
        <MessageList
          messages={messages}
          loading={loading}
          showTimestamps={false}
          autoScroll={true}
        />
      </ErrorBoundary>

      {/* Input */}
      <ErrorBoundary
        fallback={
          <div className="flex-none p-4 border-t border-gray-200 bg-red-50">
            <div className="text-center text-red-600">
              <p className="text-sm">Message input is temporarily unavailable</p>
            </div>
          </div>
        }
      >
        <div className="flex-none">
          <MessageInput
            onSend={handleSendMessage}
            disabled={loading}
            loading={loading}
          />
        </div>
      </ErrorBoundary>
    </div>
  )
}