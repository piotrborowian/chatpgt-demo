'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Message as MessageType, Conversation } from '@/types/database'
import { createMessage, createConversation, getMessages } from '@/lib/database'
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
      
      // Load existing messages
      const loadMessages = async () => {
        try {
          const existingMessages = await getMessages(conversationId)
          if (isMountedRef.current) {
            setMessages(existingMessages)
          }
        } catch (error) {
          console.error('Failed to load conversation messages:', error)
        }
      }
      
      loadMessages()
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

  const generateAIResponse = useCallback(async (
    conversationId: string,
    userMessage: string,
    abortController: AbortController,
    requestId: number
  ) => {
    try {
      // Call streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      // Check if request was aborted before processing stream
      if (abortController.signal.aborted || !isMountedRef.current || currentRequestIdRef.current !== requestId) {
        return
      }

      // Create assistant message placeholder for streaming
      const assistantTimestamp = Date.now()
      const assistantMessageId = `assistant-${requestId}-${assistantTimestamp}`
      
      const assistantMessage: MessageType = {
        id: assistantMessageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        message_order: 0, // Will be set properly when saved to database
      }

      // Add empty assistant message to state
      if (isMountedRef.current && !abortController.signal.aborted && currentRequestIdRef.current === requestId) {
        setMessages(prev => [...prev, assistantMessage])
      }

      // Process streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        try {
          while (true) {
            // Check for abort before each chunk
            if (abortController.signal.aborted || !isMountedRef.current || currentRequestIdRef.current !== requestId) {
              break
            }

            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            fullContent += chunk

            // Update message content with streaming text
            if (isMountedRef.current && !abortController.signal.aborted && currentRequestIdRef.current === requestId) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: fullContent }
                    : msg
                )
              )
            }
          }
        } finally {
          reader.releaseLock()
        }
      }

      // Final check before completing
      if (abortController.signal.aborted || !isMountedRef.current || currentRequestIdRef.current !== requestId) {
        return
      }

    } catch (error) {
      if (abortController.signal.aborted) {
        return // Don't handle errors for aborted requests
      }

      if (isMountedRef.current && currentRequestIdRef.current === requestId) {
        console.error('Error generating AI response:', error)
        
        // Show error message in chat
        const errorTimestamp = Date.now()
        const errorMessage: MessageType = {
          id: `error-${requestId}-${errorTimestamp}`,
          conversation_id: conversationId,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          created_at: new Date().toISOString(),
          message_order: 0, // Error messages don't need proper ordering
        }
        
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      // Clear loading state
      if (isMountedRef.current && !abortController.signal.aborted && currentRequestIdRef.current === requestId) {
        setLoading(false)
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

      // Generate unique message IDs 
      const timestamp = Date.now()
      const userMessageId = `user-${requestId}-${timestamp}`
      
      const userMessage: MessageType = {
        id: userMessageId,
        conversation_id: convId,
        role: 'user',
        content: sanitizedContent,
        created_at: new Date().toISOString(),
        message_order: 0, // Will be set properly when saved to database
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
        })
      }

      // Generate AI response with streaming
      await generateAIResponse(convId, sanitizedContent, abortController, requestId)

    } catch (error) {
      if (isMountedRef.current && !abortController.signal.aborted) {
        console.error('Error sending message:', error)
        setLoading(false)
      }
    }
  }, [loading, currentConversationId, onConversationCreate, generateAIResponse])

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