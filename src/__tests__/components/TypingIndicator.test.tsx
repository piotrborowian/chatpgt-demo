import { render, screen } from '../test-utils'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

describe('TypingIndicator', () => {
  it('renders typing indicator when visible', () => {
    render(<TypingIndicator visible />)
    
    expect(screen.getByText('Assistant is typing...')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(<TypingIndicator visible={false} />)
    
    expect(screen.queryByText('Assistant is typing...')).not.toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<TypingIndicator visible message="AI is thinking..." />)
    
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('shows animated dots', () => {
    render(<TypingIndicator visible />)
    
    // Check for animated dots container
    const dotsContainer = screen.getByTestId('typing-dots')
    expect(dotsContainer).toBeInTheDocument()
    
    // Should have 3 dots
    const dots = dotsContainer.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('applies correct styling', () => {
    render(<TypingIndicator visible />)
    
    const container = screen.getByTestId('typing-indicator')
    expect(container).toHaveClass('flex', 'justify-start', 'mb-4')
  })
})