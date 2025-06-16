import { OpenAIClient, OpenAIError, TokenLimitError } from '@/lib/openai-client'
import type { Message } from '@/types/database'

// Mock the openai module
jest.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}))

describe('OpenAIClient', () => {
  let client: OpenAIClient
  let mockCreate: jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    client = new OpenAIClient()
    
    // Get the mocked create function
    const openaiModule = require('@/lib/openai')
    mockCreate = openaiModule.openai.chat.completions.create
  })

  describe('generateResponse', () => {
    const mockMessages: Message[] = [
      {
        id: '1',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'Hello',
        created_at: '2023-01-01T00:00:00Z',
        message_order: 1,
      },
    ]

    it('should generate streaming response successfully', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: { content: 'Hello' },
              finish_reason: null,
            }],
          }
          yield {
            choices: [{
              delta: { content: ' there!' },
              finish_reason: 'stop',
            }],
          }
        },
      }
      
      mockCreate.mockResolvedValue(mockStream)

      const result = client.generateResponse(mockMessages, 'New message')
      const chunks: string[] = []
      
      for await (const chunk of result) {
        chunks.push(chunk)
      }
      
      expect(chunks).toEqual(['Hello', ' there!'])
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'user', content: 'New message' },
        ],
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      })
    })

    it('should handle OpenAI API errors', async () => {
      mockCreate.mockRejectedValue(
        new Error('API Error')
      )

      const result = client.generateResponse(mockMessages, 'New message')
      
      await expect(async () => {
        for await (const chunk of result) {
          // Should throw before yielding any chunks
        }
      }).rejects.toThrow(OpenAIError)
    })

    it('should handle rate limit errors specifically', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as any).code = 'rate_limit_exceeded'
      
      mockCreate.mockRejectedValue(rateLimitError)

      const result = client.generateResponse(mockMessages, 'New message')
      
      await expect(async () => {
        for await (const chunk of result) {
          // Should throw before yielding any chunks
        }
      }).rejects.toThrow('Rate limit exceeded. Please try again later.')
    })

    it('should limit conversation context', async () => {
      // Create a conversation with many messages
      const longConversation: Message[] = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        conversation_id: 'conv-1',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`.repeat(50), // Make messages long
        created_at: new Date(Date.now() - (50 - i) * 1000).toISOString(),
        message_order: i,
      }))
      
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: { content: 'Response' },
              finish_reason: 'stop',
            }],
          }
        },
      }
      mockCreate.mockResolvedValue(mockStream)

      const result = client.generateResponse(longConversation, 'New message')
      
      // Consume the stream
      for await (const chunk of result) {
        // Just consume
      }
      
      // Should limit the messages sent to OpenAI
      const call = mockCreate.mock.calls[0][0]
      expect(call.messages.length).toBeLessThanOrEqual(21) // 20 + new message
    })

    it('should handle empty message content gracefully', async () => {
      await expect(async () => {
        for await (const chunk of client.generateResponse(mockMessages, '')) {
          // Should not yield any chunks
        }
      }).rejects.toThrow('Message content cannot be empty')
    })

    it('should preserve message order when limiting context', async () => {
      const conversation: Message[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'user',
          content: 'First message',
          created_at: '2023-01-01T00:00:00Z',
          message_order: 1,
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'First response',
          created_at: '2023-01-01T00:01:00Z',
          message_order: 2,
        },
        {
          id: '3',
          conversation_id: 'conv-1',
          role: 'user',
          content: 'Second message',
          created_at: '2023-01-01T00:02:00Z',
          message_order: 3,
        },
      ]
      
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: { content: 'Response' },
              finish_reason: 'stop',
            }],
          }
        },
      }
      mockCreate.mockResolvedValue(mockStream)

      const result = client.generateResponse(conversation, 'New message')
      
      // Consume the stream
      for await (const chunk of result) {
        // Just consume
      }
      
      const call = mockCreate.mock.calls[0][0]
      expect(call.messages).toEqual([
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second message' },
        { role: 'user', content: 'New message' },
      ])
    })
  })

  describe('estimateTokens', () => {
    it('should estimate tokens for text', () => {
      const text = 'Hello world'
      const estimate = client.estimateTokens(text)
      
      expect(estimate).toBeGreaterThan(0)
      expect(typeof estimate).toBe('number')
    })

    it('should return 0 for empty text', () => {
      expect(client.estimateTokens('')).toBe(0)
    })

    it('should handle null/undefined gracefully', () => {
      expect(client.estimateTokens(null as any)).toBe(0)
      expect(client.estimateTokens(undefined as any)).toBe(0)
    })
  })
})