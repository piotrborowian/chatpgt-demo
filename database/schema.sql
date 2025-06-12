-- Chat Application Database Schema
-- Conversations and Messages tables for ChatGPT clone

-- Conversations table: stores chat sessions
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  title text not null default 'New Conversation',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Messages table: stores individual chat messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  message_order integer not null,
  created_at timestamptz default now() not null
);

-- Create indexes for better query performance
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at);
create index messages_conversation_order_idx on public.messages(conversation_id, message_order);
create index conversations_updated_at_idx on public.conversations(updated_at);

-- Enable Row Level Security (RLS) for tables
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Create public access policies for development (no auth required)
-- These policies will be updated when authentication is added in Phase 6

-- Conversations policies - allow all operations for development
create policy "Allow all operations on conversations during development"
  on public.conversations
  for all
  using (true)
  with check (true);

-- Messages policies - allow all operations for development  
create policy "Allow all operations on messages during development"
  on public.messages
  for all
  using (true)
  with check (true);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at on conversations
create trigger conversations_update_updated_at
  before update on public.conversations
  for each row
  execute function public.update_updated_at_column();