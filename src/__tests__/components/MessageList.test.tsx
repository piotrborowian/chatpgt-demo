import { render, screen } from '../test-utils'
import { MessageList } from '@/components/chat/MessageList'
import { Message as MessageType } from '@/types/database'

const mockMessages: MessageType[] = [
  {
    id: '1',
    conversation_id: 'conv-1',
    role: 'user',
    content: 'Hello, how are you?',
    created_at: '2023-06-16T10:00:00Z',
    message_order: 1,
  },
  {
    id: '2',
    conversation_id: 'conv-1',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    created_at: '2023-06-16T10:01:00Z',
    message_order: 2,
  },
  {
    id: '3',
    conversation_id: 'conv-1',
    role: 'user',
    content: 'What can you help me with?',
    created_at: '2023-06-16T10:02:00Z',
    message_order: 3,
  },
]

describe('MessageList', () => {
  it('renders all messages in order', () => {
    render(<MessageList messages={mockMessages} />)
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument()
    expect(screen.getByText('What can you help me with?')).toBeInTheDocument()
  })

  it('renders empty state when no messages', () => {
    render(<MessageList messages={[]} />)
    
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })

  it('renders loading indicator when loading', () => {
    render(<MessageList messages={mockMessages} loading />)
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('does not render loading indicator by default', () => {
    render(<MessageList messages={mockMessages} />)
    
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('applies correct container styling', () => {
    render(<MessageList messages={mockMessages} />)
    
    const container = screen.getByTestId('message-list')
    expect(container).toHaveClass('flex-1', 'overflow-y-auto', 'p-4', 'space-y-4')
  })

  it('shows timestamps when showTimestamps is true', () => {
    render(<MessageList messages={mockMessages} showTimestamps />)
    
    // Should show timestamps for messages
    expect(screen.getByText(/12:00/)).toBeInTheDocument()
  })

  it('scrolls to bottom when autoScroll is enabled', () => {
    const scrollIntoViewMock = jest.spyOn(Element.prototype, 'scrollIntoView')

    render(<MessageList messages={mockMessages} autoScroll />)
    
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })
})