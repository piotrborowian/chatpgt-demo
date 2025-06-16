'use client'

import React, { useState, useEffect } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Message as MessageType, Conversation } from '@/types/database'
import { createMessage, createConversation } from '@/lib/database'

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

  // Load messages for conversation if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId)
      // TODO: Load messages from database for this conversation
      // This will be implemented when we add the message loading functionality
    }
  }, [conversationId])

  const handleSendMessage = async (content: string) => {
    try {
      setLoading(true)

      // Create conversation if this is the first message
      let convId = currentConversationId
      if (!convId) {
        const newConversation = await createConversation({
          title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
        })
        convId = newConversation.id
        setCurrentConversationId(convId)
        onConversationCreate?.(newConversation)
      }

      // Add user message
      const userMessage: MessageType = {
        id: `temp-${Date.now()}`, // Temporary ID
        conversation_id: convId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        message_order: messages.length + 1,
      }

      setMessages(prev => [...prev, userMessage])

      // Save user message to database
      await createMessage({
        conversation_id: convId,
        role: 'user',
        content,
        message_order: messages.length + 1,
      })

      // Simulate AI response (TODO: Replace with actual OpenAI API call)
      setTimeout(async () => {
        const assistantMessage: MessageType = {
          id: `temp-${Date.now()}-assistant`,
          conversation_id: convId!,
          role: 'assistant',
          content: `I received your message: "${content}". This is a placeholder response until OpenAI integration is complete.`,
          created_at: new Date().toISOString(),
          message_order: messages.length + 2,
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Save assistant message to database
        await createMessage({
          conversation_id: convId!,
          role: 'assistant',
          content: assistantMessage.content,
          message_order: messages.length + 2,
        })

        setLoading(false)
      }, 1000)

    } catch (error) {
      console.error('Error sending message:', error)
      setLoading(false)
    }
  }

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
      <MessageList
        messages={messages}
        loading={loading}
        showTimestamps={false}
        autoScroll={true}
      />

      {/* Input */}
      <div className="flex-none">
        <MessageInput
          onSend={handleSendMessage}
          disabled={loading}
          loading={loading}
        />
      </div>
    </div>
  )
}