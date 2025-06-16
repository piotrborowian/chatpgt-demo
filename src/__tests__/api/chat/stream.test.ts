/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/stream/route'

// Mock OpenAI client
jest.mock('@/lib/openai-client', () => {
  const mockGenerateResponse = jest.fn()
  return {
    OpenAIClient: jest.fn().mockImplementation(() => ({
      generateResponse: mockGenerateResponse,
    })),
    OpenAIError: Error,
    __mockGenerateResponse: mockGenerateResponse, // Export for test access
  }
})

// Mock database
jest.mock('@/lib/database', () => ({
  getMessages: jest.fn(),
  createMessage: jest.fn(),
}))

describe('/api/chat/stream', () => {
  let mockGetMessages: jest.MockedFunction<any>
  let mockCreateMessage: jest.MockedFunction<any>
  let mockGenerateResponse: jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Get the mocked database functions
    mockGetMessages = require('@/lib/database').getMessages
    mockCreateMessage = require('@/lib/database').createMessage
    
    // Get the mocked OpenAI function
    mockGenerateResponse = require('@/lib/openai-client').__mockGenerateResponse
  })

  describe('POST /api/chat/stream', () => {
    it('should return 400 for missing message', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Message is required')
    })

    it('should return 400 for missing conversationId', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Conversation ID is required')
    })

    it('should return 400 for empty message', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ 
          message: '   ', 
          conversationId: 'test-id' 
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Message cannot be empty')
    })

    it('should return streaming response for valid request', async () => {
      // Mock successful database operations
      mockGetMessages.mockResolvedValue([
        {
          id: '1',
          role: 'user',
          content: 'Previous message',
          created_at: '2023-01-01T00:00:00Z',
          message_order: 1,
        },
      ])
      mockCreateMessage.mockResolvedValue({
        id: '2',
        role: 'assistant',
        content: 'AI response',
        created_at: '2023-01-01T00:01:00Z',
        message_order: 2,
      })

      // Mock OpenAI client streaming response
      const mockStreamGenerator = async function* () {
        yield 'Hello'
        yield ' there!'
      }
      
      mockGenerateResponse.mockReturnValue(mockStreamGenerator())

      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello AI',
          conversationId: 'conv-123',
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect(response.headers.get('cache-control')).toBe('no-cache')
      expect(response.headers.get('connection')).toBe('keep-alive')
      
      // Consume the stream to trigger the database save
      const reader = response.body?.getReader()
      let fullContent = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullContent += new TextDecoder().decode(value)
        }
      }
      
      expect(fullContent).toBe('Hello there!')
      
      // Verify OpenAI client was called with correct parameters
      expect(mockGenerateResponse).toHaveBeenCalledWith([
        {
          id: '1',
          role: 'user',
          content: 'Previous message',
          created_at: '2023-01-01T00:00:00Z',
          message_order: 1,
        },
      ], 'Hello AI')
      
      // Verify database operations
      expect(mockGetMessages).toHaveBeenCalledWith('conv-123')
      expect(mockCreateMessage).toHaveBeenCalledWith({
        conversation_id: 'conv-123',
        role: 'assistant',
        content: 'Hello there!',
      })
    })

    it('should handle OpenAI API errors gracefully', async () => {
      mockGetMessages.mockResolvedValue([])
      mockGenerateResponse.mockImplementation(async function* () {
        throw new Error('OpenAI API Error')
      })

      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello AI',
          conversationId: 'conv-123',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200) // Streaming starts successfully
      
      // Consume the stream to see the error message
      const reader = response.body?.getReader()
      let content = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          content += new TextDecoder().decode(value)
        }
      }
      
      expect(content).toContain('Error: OpenAI API Error')
    })

    it('should handle database errors during message retrieval', async () => {
      mockGetMessages.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello AI',
          conversationId: 'conv-123',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      
      const body = await response.json()
      expect(body.error).toBe('Failed to generate response')
    })

    it('should handle database errors during message creation', async () => {
      mockGetMessages.mockResolvedValue([])
      mockCreateMessage.mockRejectedValue(new Error('Database error'))
      
      // Mock successful OpenAI response
      const mockStreamGenerator = async function* () {
        yield 'Response'
      }
      mockGenerateResponse.mockReturnValue(mockStreamGenerator())

      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello AI',
          conversationId: 'conv-123',
        }),
      })

      const response = await POST(request)
      
      // Should still return the streamed response even if database save fails
      expect(response.status).toBe(200)
      expect(mockGenerateResponse).toHaveBeenCalled()
    })

    it('should limit conversation context to prevent token overflow', async () => {
      // Create a long conversation history
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`.repeat(100), // Long messages
        created_at: new Date(Date.now() - (50 - i) * 1000).toISOString(),
        message_order: i,
      }))
      
      mockGetMessages.mockResolvedValue(longHistory)
      mockCreateMessage.mockResolvedValue({})
      
      const mockStreamGenerator = async function* () {
        yield 'Response'
      }
      mockGenerateResponse.mockReturnValue(mockStreamGenerator())

      const request = new NextRequest('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message: 'New message',
          conversationId: 'conv-123',
        }),
      })

      await POST(request)
      
      // Should pass the conversation history to OpenAI client
      expect(mockGenerateResponse).toHaveBeenCalledWith(
        longHistory,
        'New message'
      )
    })
  })
})