import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get conversation history if conversationId is provided
    let conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = []
    
    if (conversationId) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching conversation history:', error)
      } else {
        conversationHistory = messages || []
      }
    }

    // Add the new user message to the conversation history
    conversationHistory.push({ role: 'user', content: message })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversationHistory,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const responseMessage = completion.choices[0]?.message?.content || 'No response received'

    return NextResponse.json({ 
      message: responseMessage,
      conversationId: conversationId 
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
} 