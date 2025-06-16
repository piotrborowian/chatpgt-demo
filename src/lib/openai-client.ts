import { openai } from './openai'
import type { Message } from '@/types/database'

export class OpenAIError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export class TokenLimitError extends OpenAIError {
  constructor(message: string) {
    super(message, 'token_limit_exceeded')
  }
}

export class OpenAIClient {
  private readonly model = 'gpt-4o'
  private readonly maxTokens = 2000
  private readonly temperature = 0.7
  private readonly maxContextMessages = 20 // Limit conversation context

  /**
   * Generate streaming response from OpenAI
   */
  async *generateResponse(
    conversationHistory: Message[],
    newMessage: string
  ): AsyncIterable<string> {
    if (!newMessage?.trim()) {
      throw new OpenAIError('Message content cannot be empty')
    }

    try {
      // Prepare messages for OpenAI API
      const messages = this.prepareMessages(conversationHistory, newMessage)
      
      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      })

      // Stream the response
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (delta?.content) {
          yield delta.content
        }
        
        // Check for completion
        if (chunk.choices[0]?.finish_reason === 'stop') {
          break
        }
      }
    } catch (error: any) {
      // Handle specific OpenAI errors
      if (error?.code === 'rate_limit_exceeded') {
        throw new OpenAIError('Rate limit exceeded. Please try again later.', 'rate_limit_exceeded')
      }
      
      if (error?.code === 'insufficient_quota') {
        throw new OpenAIError('API quota exceeded. Please check your OpenAI billing.', 'insufficient_quota')
      }
      
      if (error?.code === 'invalid_api_key') {
        throw new OpenAIError('Invalid API key. Please check your OpenAI configuration.', 'invalid_api_key')
      }
      
      // Generic error handling
      throw new OpenAIError(
        error?.message || 'Failed to generate response from OpenAI',
        error?.code
      )
    }
  }

  /**
   * Prepare messages for OpenAI API with context limiting
   */
  private prepareMessages(
    conversationHistory: Message[],
    newMessage: string
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    // Sort messages by order to ensure proper chronological flow
    const sortedHistory = [...conversationHistory].sort(
      (a, b) => a.message_order - b.message_order
    )
    
    // Convert to OpenAI format
    const historyMessages = sortedHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
    
    // Add the new message
    const allMessages = [
      ...historyMessages,
      { role: 'user' as const, content: newMessage },
    ]
    
    // Limit context to prevent token overflow
    // Keep the most recent messages within the limit
    if (allMessages.length > this.maxContextMessages) {
      return allMessages.slice(-this.maxContextMessages)
    }
    
    return allMessages
  }

  /**
   * Estimate token count for text (rough approximation)
   * Used for context management
   */
  estimateTokens(text: string | null | undefined): number {
    if (!text) return 0
    
    // Rough approximation: 1 token ≈ 4 characters for English text
    // This is a simplified version - real tokenization would be more accurate
    return Math.ceil(text.length / 4)
  }

  /**
   * Check if conversation history is approaching token limits
   */
  isApproachingTokenLimit(messages: Message[]): boolean {
    const totalTokens = messages.reduce(
      (sum, msg) => sum + this.estimateTokens(msg.content),
      0
    )
    
    // Consider 75% of max tokens as approaching limit
    const tokenLimit = this.maxTokens * 0.75
    return totalTokens > tokenLimit
  }
}