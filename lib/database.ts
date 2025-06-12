import { supabase, Conversation, Message } from './supabase';

// Conversation functions
export async function createConversation(title: string): Promise<Conversation> {
  console.log('Creating conversation with title:', title);
  
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ title }])
    .select()
    .single();

  if (error) {
    console.error('=== SUPABASE CREATE CONVERSATION ERROR ===');
    console.error('Full error object:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('=== END SUPABASE ERROR ===');
    throw error;
  }
  
  console.log('Conversation created successfully:', data);
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Message functions
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message> {
  console.log('Adding message:', { conversationId, role, content: content.substring(0, 100) + '...' });
  
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role,
      content
    }])
    .select()
    .single();

  if (error) {
    console.error('=== SUPABASE ADD MESSAGE ERROR ===');
    console.error('Full error object:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('Conversation ID:', conversationId);
    console.error('Role:', role);
    console.error('Content length:', content.length);
    console.error('=== END SUPABASE ERROR ===');
    throw error;
  }

  // Note: updated_at timestamp is automatically updated by database trigger

  console.log('Message added successfully:', data);
  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Utility function to generate conversation title from first message
export function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(' ');
  if (words.length <= 5) {
    return firstMessage.trim();
  }
  return words.slice(0, 5).join(' ') + '...';
} 