import { render, screen } from '../test-utils'
import { Message } from '@/components/chat/Message'

const mockMessage = {
  id: '1',
  conversation_id: 'conv-1',
  role: 'user' as const,
  content: 'Hello, how are you?',
  created_at: '2023-06-16T10:00:00Z',
  message_order: 1,
}

const mockAssistantMessage = {
  id: '2',
  conversation_id: 'conv-1',
  role: 'assistant' as const,
  content: 'I am doing well, thank you for asking!',
  created_at: '2023-06-16T10:01:00Z',
  message_order: 2,
}

describe('Message', () => {
  it('renders user message correctly', () => {
    render(<Message message={mockMessage} />)
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    render(<Message message={mockAssistantMessage} />)
    
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument()
    expect(screen.getByText('Assistant')).toBeInTheDocument()
  })

  it('applies correct styling for user messages', () => {
    render(<Message message={mockMessage} />)
    
    const messageContainer = screen.getByText('Hello, how are you?').closest('div')?.parentElement
    expect(messageContainer).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies correct styling for assistant messages', () => {
    render(<Message message={mockAssistantMessage} />)
    
    const messageContainer = screen.getByText('I am doing well, thank you for asking!').closest('div')?.parentElement
    expect(messageContainer).toHaveClass('bg-gray-100', 'text-gray-900')
  })

  it('displays timestamp when showTimestamp is true', () => {
    render(<Message message={mockMessage} showTimestamp />)
    
    // Should show some form of timestamp (12:00 PM in local timezone)
    expect(screen.getByText(/12:00/)).toBeInTheDocument()
  })

  it('does not display timestamp by default', () => {
    render(<Message message={mockMessage} />)
    
    // Should not show timestamp by default
    expect(screen.queryByText(/12:00/)).not.toBeInTheDocument()
  })
})