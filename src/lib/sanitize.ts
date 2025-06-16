import DOMPurify from 'dompurify'

// Configure DOMPurify for safe HTML sanitization
const sanitizeConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - The content to sanitize
 * @returns Sanitized content safe for rendering
 */
export function sanitizeHtml(content: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return plain text for now
    // In production, you might want to use a server-side HTML sanitizer
    return content.replace(/<[^>]*>/g, '')
  }

  return DOMPurify.sanitize(content, sanitizeConfig)
}

/**
 * Sanitizes user input to prevent malicious content
 * @param input - The user input to sanitize
 * @returns Sanitized input
 */
export function sanitizeUserInput(input: string): string {
  // Remove potentially dangerous characters and patterns
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except tab, newline, and carriage return
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length to prevent DoS
    .slice(0, 4000)
}

/**
 * Escapes HTML special characters in plain text
 * @param text - Plain text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}