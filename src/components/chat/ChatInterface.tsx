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
  const messageOrderRef = useRef(0)

  // Load messages for conversation if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId)
      // TODO: Load messages from database for this conversation
      // This will be implemented when we add the message loading functionality
    }
  }, [conversationId])

  // Sync message order counter with current messages
  useEffect(() => {
    messageOrderRef.current = messages.length
  }, [messages.length])

  const handleSendMessage = useCallback(async (content: string) => {
    // Prevent multiple simultaneous sends
    if (loading) return

    try {
      setLoading(true)

      // Sanitize user input to prevent XSS and other attacks
      const sanitizedContent = sanitizeUserInput(content)
      
      // Validate sanitized content
      if (!sanitizedContent.trim()) {
        setLoading(false)
        return
      }

      // Create conversation if this is the first message
      let convId = currentConversationId
      if (!convId) {
        const newConversation = await createConversation({
          title: sanitizedContent.slice(0, 50) + (sanitizedContent.length > 50 ? '...' : '')
        })
        convId = newConversation.id
        setCurrentConversationId(convId)
        onConversationCreate?.(newConversation)
      }

      // Use atomic counter for message ordering to prevent race conditions
      const userOrder = ++messageOrderRef.current
      const userMessage: MessageType = {
        id: `temp-${Date.now()}`, // Temporary ID
        conversation_id: convId,
        role: 'user',
        content: sanitizedContent,
        created_at: new Date().toISOString(),
        message_order: userOrder,
      }

      // Atomic state update
      setMessages(prev => [...prev, userMessage])

      // Save user message to database
      await createMessage({
        conversation_id: convId,
        role: 'user',
        content: sanitizedContent,
        message_order: userMessage.message_order,
      })

      // Simulate AI response (TODO: Replace with actual OpenAI API call)
      setTimeout(async () => {
        try {
          // Use atomic counter for assistant message ordering
          const assistantOrder = ++messageOrderRef.current
          const assistantMessage: MessageType = {
            id: `temp-${Date.now()}-assistant`,
            conversation_id: convId!,
            role: 'assistant',
            content: `I received your message: "${sanitizedContent}". This is a placeholder response until OpenAI integration is complete.`,
            created_at: new Date().toISOString(),
            message_order: assistantOrder,
          }
          
          // Atomic state update
          setMessages(prev => [...prev, assistantMessage])
          
          // Save assistant message to database
          await createMessage({
            conversation_id: convId!,
            role: 'assistant',
            content: assistantMessage.content,
            message_order: assistantMessage.message_order,
          })
        } catch (error) {
          console.error('Error creating assistant message:', error)
        } finally {
          setLoading(false)
        }
      }, 1000)

    } catch (error) {
      console.error('Error sending message:', error)
      setLoading(false)
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