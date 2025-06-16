'use client'

import React, { useState, KeyboardEvent } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  loading = false,
  placeholder = 'Type your message...'
}) => {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled && !loading) {
      onSend(trimmedMessage)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = disabled || loading
  const isEmpty = !message.trim()

  return (
    <div className="flex items-end space-x-2 p-4 border-t border-gray-200 bg-white">
      <div className="flex-1">
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          autoResize
          rows={1}
          className="min-h-[40px] max-h-32"
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={isDisabled || isEmpty}
        variant="primary"
        size="md"
        className="h-10 px-3"
      >
        {loading ? (
          'Sending...'
        ) : (
          <>
            <PaperAirplaneIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </>
        )}
      </Button>
    </div>
  )
}