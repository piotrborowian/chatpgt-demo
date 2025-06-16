import { render, screen, fireEvent, waitFor } from '../test-utils'
import { ChatInterface } from '@/components/chat/ChatInterface'

// Mock the database functions
const mockCreateMessage = jest.fn()
const mockCreateConversation = jest.fn()

jest.mock('@/lib/database', () => ({
  createMessage: (...args: any[]) => mockCreateMessage(...args),
  createConversation: (...args: any[]) => mockCreateConversation(...args),
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    mockCreateMessage.mockClear()
    mockCreateConversation.mockClear()
    mockCreateMessage.mockResolvedValue({ id: 'msg-1' })
    mockCreateConversation.mockResolvedValue({ id: 'conv-1' })
  })

  it('renders empty chat interface', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('renders header with title', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('Chat Assistant')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')
    
    fireEvent.change(input, { target: { value: 'Hello!' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })
  })

  it('shows loading state while sending message', async () => {
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')
    
    fireEvent.change(input, { target: { value: 'Hello!' } })
    fireEvent.click(sendButton)
    
    // Should show typing indicator after message is sent
    await waitFor(() => {
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })
  })

  it('applies correct layout styling', () => {
    render(<ChatInterface />)
    
    const container = screen.getByTestId('chat-interface')
    expect(container).toHaveClass('flex', 'flex-col', 'h-full', 'bg-white')
  })

  it('renders with custom conversation when provided', () => {
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      created_at: '2023-06-16T10:00:00Z',
      updated_at: '2023-06-16T10:00:00Z',
    }

    render(<ChatInterface conversationId="conv-1" />)
    
    // Should render the interface (specific behavior would depend on implementation)
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })

  it('handles conversation creation for first message', async () => {
    render(<ChatInterface />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')
    
    fireEvent.change(input, { target: { value: 'First message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockCreateConversation).toHaveBeenCalled()
    })
  })
})