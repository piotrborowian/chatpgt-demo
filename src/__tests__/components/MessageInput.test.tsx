import { render, screen, fireEvent, waitFor } from '../test-utils'
import { MessageInput } from '@/components/chat/MessageInput'

describe('MessageInput', () => {
  const mockOnSend = jest.fn()

  beforeEach(() => {
    mockOnSend.mockClear()
  })

  it('renders input field and send button', () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('handles text input changes', () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Hello world' } })
    
    expect(input).toHaveValue('Hello world')
  })

  it('sends message when send button is clicked', async () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message')
    })
  })

  it('sends message when Enter is pressed', async () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message')
    })
  })

  it('does not send empty messages', () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)
    
    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('clears input after sending message', async () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('disables send button when disabled prop is true', () => {
    render(<MessageInput onSend={mockOnSend} disabled />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('shows loading state when loading prop is true', () => {
    render(<MessageInput onSend={mockOnSend} loading />)
    
    const sendButton = screen.getByRole('button')
    expect(sendButton).toBeDisabled()
    expect(sendButton).toHaveTextContent('Sending...')
  })

  it('allows multiline input with Shift+Enter', () => {
    render(<MessageInput onSend={mockOnSend} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    fireEvent.change(input, { target: { value: 'Line 1' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    
    // Should not send the message
    expect(mockOnSend).not.toHaveBeenCalled()
  })
})