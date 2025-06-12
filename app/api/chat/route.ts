import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getMessages } from '../../../lib/database';
import { logger } from '../../../lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  logger.info('Chat API called');
  
  try {
    const { message, conversationId } = await request.json();
    logger.info('Request data received', { message: message?.substring(0, 100), conversationId });

    if (!message) {
      logger.warn('No message provided in request');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get conversation history if conversationId is provided
    let conversationHistory: any[] = [];
    if (conversationId) {
      logger.info('Fetching conversation history', { conversationId });
      try {
        const messages = await getMessages(conversationId);
        conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        logger.info('Conversation history loaded', { messageCount: conversationHistory.length });
      } catch (error) {
        logger.error('Error fetching conversation history', { error, conversationId });
        // Continue without history if there's an error
      }
    } else {
      logger.info('No conversation ID provided, starting fresh conversation');
    }

    // Build messages array for OpenAI
    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: message,
      },
    ];
    logger.info('Sending request to OpenAI', { messageCount: messages.length });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';
    logger.info('OpenAI response received', { responseLength: response.length });

    return NextResponse.json({ response });
  } catch (error) {
    logger.error('Chat API error', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name
    });
    
    return NextResponse.json(
      { error: 'Failed to generate response', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 