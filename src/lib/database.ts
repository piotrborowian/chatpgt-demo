import { supabase } from './supabase'
import type { Conversation, Message, CreateConversationParams, CreateMessageParams } from '@/types/database'

export async function createConversation(params: CreateConversationParams = {}): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ title: params.title || 'New Conversation' }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('message_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createMessage(params: CreateMessageParams): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert([params])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id)

  if (error) throw error
}