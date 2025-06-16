'use client'

import React, { useState, KeyboardEvent, useCallback, memo, useMemo } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

const MessageInputComponent: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  loading = false,
  placeholder = 'Type your message...'
}) => {
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled && !loading) {
      onSend(trimmedMessage)
      setMessage('')
    }
  }, [message, disabled, loading, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }, [])

  const isDisabled = useMemo(() => disabled || loading, [disabled, loading])
  const isEmpty = useMemo(() => !message.trim(), [message])

  return (
    <div className="flex items-end space-x-2 p-4 border-t border-gray-200 bg-white">
      <div className="flex-1">
        <TextArea
          value={message}
          onChange={handleMessageChange}
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

// Memoize MessageInput component to prevent unnecessary re-renders
export const MessageInput = memo(MessageInputComponent, (prevProps, nextProps) => {
  return (
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.onSend === nextProps.onSend
  )
})