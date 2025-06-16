import React, { useEffect, useRef, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const textAreaVariants = cva(
  'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      resize: {
        both: 'resize',
        horizontal: 'resize-x',
        vertical: 'resize-y',
        none: 'resize-none',
      },
    },
    defaultVariants: {
      resize: 'vertical',
    },
  }
)

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textAreaVariants> {
  autoResize?: boolean
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, resize, autoResize = false, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)
    const isMountedRef = useRef<boolean>(true)
    const adjustHeightRef = useRef<(() => void) | null>(null)
    
    // Use the passed ref or internal ref
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    // Memoized adjust height function to prevent recreation
    const createAdjustHeight = useCallback((textarea: HTMLTextAreaElement) => {
      return () => {
        // Triple check: component mounted, textarea exists, and has required properties
        if (
          isMountedRef.current && 
          textarea && 
          textarea.style && 
          typeof textarea.scrollHeight === 'number' &&
          textarea.parentNode // Ensure textarea is still in DOM
        ) {
          try {
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight}px`
          } catch (error) {
            // Silently handle any DOM manipulation errors
            console.warn('TextArea height adjustment failed:', error)
          }
        }
      }
    }, [])

    useEffect(() => {
      // Set mounted state
      isMountedRef.current = true
      
      // Early return if auto-resize is disabled
      if (!autoResize) {
        return
      }

      // Get textarea element with proper type checking
      const getTextarea = (): HTMLTextAreaElement | null => {
        if (textareaRef && 'current' in textareaRef) {
          return textareaRef.current
        }
        return null
      }

      const textarea = getTextarea()
      if (!textarea) {
        return
      }

      // Create the adjust height function and store reference
      const adjustHeight = createAdjustHeight(textarea)
      adjustHeightRef.current = adjustHeight
      
      // Add event listener with passive option for better performance
      textarea.addEventListener('input', adjustHeight, { passive: true })
      
      // Initial height adjustment
      adjustHeight()
      
      // Cleanup function
      return () => {
        isMountedRef.current = false
        
        // Remove event listener with the same function reference
        if (textarea && adjustHeightRef.current) {
          try {
            textarea.removeEventListener('input', adjustHeightRef.current)
          } catch (error) {
            // Handle case where textarea is already removed from DOM
            console.warn('TextArea event listener cleanup failed:', error)
          }
        }
        
        // Clear function reference
        adjustHeightRef.current = null
      }
    }, [autoResize, createAdjustHeight, textareaRef])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        isMountedRef.current = false
      }
    }, [])

    const style = autoResize ? { overflowY: 'hidden' as const } : {}

    return (
      <textarea
        className={textAreaVariants({ resize, className })}
        ref={textareaRef}
        style={style}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'TextArea'