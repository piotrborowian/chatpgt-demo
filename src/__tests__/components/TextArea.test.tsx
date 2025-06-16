import { render, screen, fireEvent } from '../test-utils'
import { TextArea } from '@/components/ui/TextArea'

describe('TextArea', () => {
  it('renders textarea with placeholder', () => {
    render(<TextArea placeholder="Type your message..." />)
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<TextArea value="" onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object))
  })

  it('handles disabled state', () => {
    render(<TextArea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('applies resize classes correctly', () => {
    render(<TextArea resize="none" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('resize-none')
  })

  it('handles auto-resize when autoResize is true', () => {
    render(<TextArea autoResize />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveStyle('overflow-y: hidden')
  })
})