import { supabase } from './supabase'
import type { Conversation, Message, CreateConversationParams, CreateMessageParams } from '@/types/database'

export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

function handleDatabaseError(error: any): never {
  const message = error?.message || 'Unknown database error'
  const code = error?.code
  const details = error?.details
  
  console.error('Database error:', { message, code, details })
  throw new DatabaseError(message, code, details)
}

export async function createConversation(params: CreateConversationParams = {}): Promise<Conversation> {
  try {
    if (params.title && typeof params.title !== 'string') {
      throw new DatabaseError('Title must be a string')
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ title: params.title || 'New Conversation' }])
      .select()
      .single()

    if (error) handleDatabaseError(error)
    if (!data) throw new DatabaseError('No data returned from conversation creation')
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) handleDatabaseError(error)
    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    if (!id || typeof id !== 'string') {
      throw new DatabaseError('Conversation ID is required and must be a string')
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      handleDatabaseError(error)
    }
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    if (!conversationId || typeof conversationId !== 'string') {
      throw new DatabaseError('Conversation ID is required and must be a string')
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_order', { ascending: true })

    if (error) handleDatabaseError(error)
    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function createMessage(params: CreateMessageParams): Promise<Message> {
  try {
    if (!params.conversation_id || typeof params.conversation_id !== 'string') {
      throw new DatabaseError('Conversation ID is required and must be a string')
    }
    if (!params.role || !['user', 'assistant'].includes(params.role)) {
      throw new DatabaseError('Role must be either "user" or "assistant"')
    }
    if (!params.content || typeof params.content !== 'string') {
      throw new DatabaseError('Content is required and must be a string')
    }
    if (params.message_order !== undefined && typeof params.message_order !== 'number') {
      throw new DatabaseError('Message order must be a number')
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([params])
      .select()
      .single()

    if (error) handleDatabaseError(error)
    if (!data) throw new DatabaseError('No data returned from message creation')
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function deleteConversation(id: string): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new DatabaseError('Conversation ID is required and must be a string')
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) handleDatabaseError(error)
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new DatabaseError('Conversation ID is required and must be a string')
    }
    if (!title || typeof title !== 'string') {
      throw new DatabaseError('Title is required and must be a string')
    }

    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)

    if (error) handleDatabaseError(error)
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error)
  }
}