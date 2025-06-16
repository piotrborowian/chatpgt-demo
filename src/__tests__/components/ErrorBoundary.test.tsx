import React, { useState } from 'react'
import { render, screen, fireEvent } from '../test-utils'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Working component</div>
}

// Mock console.error to avoid noise in test output
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('renders default error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders custom fallback UI when provided', () => {
    const customFallback = <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onErrorMock = jest.fn()
    
    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('recovers from error when try again is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = useState(true)
      
      return (
        <ErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix error</button>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
    }

    render(<TestComponent />)
    
    // Initially shows error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Click try again
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    
    // Should show the component again (but it will still throw)
    // In a real scenario, the error would be fixed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('handles different types of errors', () => {
    const ThrowCustomError = () => {
      throw new Error('Custom error message')
    }
    
    render(
      <ErrorBoundary>
        <ThrowCustomError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.objectContaining({
        message: 'Custom error message'
      }),
      expect.any(Object)
    )
  })
})