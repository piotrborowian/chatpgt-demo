import React, { useEffect, useRef } from 'react'
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
    const textareaRef = ref || internalRef

    useEffect(() => {
      if (!autoResize || typeof textareaRef !== 'object' || !textareaRef?.current) {
        return
      }

      const textarea = textareaRef.current
      const adjustHeight = () => {
        // Check if textarea is still valid before accessing properties
        if (textarea && textarea.style && textarea.scrollHeight !== undefined) {
          textarea.style.height = 'auto'
          textarea.style.height = `${textarea.scrollHeight}px`
        }
      }
      
      textarea.addEventListener('input', adjustHeight)
      adjustHeight() // Initial adjustment
      
      return () => {
        // Ensure textarea is still valid before removing event listener
        if (textarea && textarea.removeEventListener) {
          textarea.removeEventListener('input', adjustHeight)
        }
      }
    }, [autoResize, textareaRef])

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