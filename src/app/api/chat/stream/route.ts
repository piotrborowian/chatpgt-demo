import { NextRequest, NextResponse } from 'next/server'
import { OpenAIClient, OpenAIError } from '@/lib/openai-client'
import { getMessages, createMessage } from '@/lib/database'
import { sanitizeUserInput } from '@/lib/sanitize'

const openaiClient = new OpenAIClient()

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { message, conversationId } = body

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Sanitize and validate message content
    const sanitizedMessage = sanitizeUserInput(message)
    if (!sanitizedMessage.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Get conversation history
    const conversationHistory = await getMessages(conversationId)

    // Create streaming response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate streaming response
          for await (const chunk of openaiClient.generateResponse(
            conversationHistory,
            sanitizedMessage
          )) {
            fullResponse += chunk
            controller.enqueue(encoder.encode(chunk))
          }

          // Save the complete response to database
          try {
            await createMessage({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
            })
          } catch (dbError) {
            // Log database error but don't fail the response
            console.error('Failed to save message to database:', dbError)
          }

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          
          // Send error message to client
          const errorMessage = error instanceof OpenAIError 
            ? error.message 
            : 'An error occurred while generating the response'
          
          controller.enqueue(encoder.encode(`\n\nError: ${errorMessage}`))
          controller.close()
        }
      },
    })

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API route error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}