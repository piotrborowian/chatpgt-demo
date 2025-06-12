'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import ConversationSidebar from './ConversationSidebar';
import DebugPanel from './DebugPanel';
import { logger } from '../../lib/logger';
import { Message as DBMessage, Conversation } from '../../lib/supabase';
import { 
  createConversation, 
  getMessages, 
  addMessage, 
  generateConversationTitle,
  updateConversationTitle 
} from '../../lib/database';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      logger.info('Loading conversation messages', { conversationId });
      const dbMessages = await getMessages(conversationId);
      const formattedMessages: Message[] = dbMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
      logger.info('Messages loaded successfully', { count: formattedMessages.length });
    } catch (error) {
      logger.error('Error loading messages', { error, conversationId });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input;
    setInput('');
    setIsLoading(true);

    logger.info('User sending message', { 
      message: messageText.substring(0, 100), 
      conversationId: currentConversationId 
    });

    try {
      // Create new conversation if none exists
      let conversationId = currentConversationId;
      if (!conversationId) {
        logger.info('Creating new conversation');
        const title = generateConversationTitle(messageText);
        logger.info('Generated title', { title });
        
        const newConversation = await createConversation(title);
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
        logger.info('New conversation created', { conversationId });
        
        // Refresh sidebar conversations
        if ((window as any).refreshConversations) {
          (window as any).refreshConversations();
        }
      }

      // Add user message to database
      logger.info('Adding user message to database');
      const userDbMessage = await addMessage(conversationId, 'user', messageText);
      const userMessage: Message = {
        id: userDbMessage.id,
        content: userDbMessage.content,
        role: userDbMessage.role,
        timestamp: new Date(userDbMessage.created_at),
      };
      setMessages(prev => [...prev, userMessage]);
      logger.info('User message added to UI');

      // Call OpenAI API with conversation context
      logger.info('Calling OpenAI API');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          conversationId: conversationId 
        }),
      });
      logger.info('API response received', { status: response.status });

      const data = await response.json();

      if (response.ok) {
        // Add assistant message to database
        const assistantDbMessage = await addMessage(conversationId, 'assistant', data.response);
        const assistantMessage: Message = {
          id: assistantDbMessage.id,
          content: assistantDbMessage.content,
          role: assistantDbMessage.role,
          timestamp: new Date(assistantDbMessage.created_at),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation title if this is the first exchange
        if (messages.length === 0) {
          const newTitle = generateConversationTitle(messageText);
          await updateConversationTitle(conversationId, newTitle);
          if ((window as any).refreshConversations) {
            (window as any).refreshConversations();
          }
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      logger.error('Error sending message', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        conversationId: currentConversationId
      });
      
      // Create detailed error message for user
      let errorText = 'Sorry, I encountered an error. Please check the console for details.';
      
      if (error instanceof Error) {
        // Show the actual error message to help debug
        errorText = `Error: ${error.message}`;
        
        // Add more context based on error type
        if (error.message.includes('fetch')) {
          errorText += ' (Network/API error)';
        } else if (error.message.includes('Supabase') || error.message.includes('database')) {
          errorText += ' (Database error)';
        } else if (error.message.includes('OpenAI')) {
          errorText += ' (OpenAI API error)';
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorText = `Error: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: errorText,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-800">ChatGPT</h1>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                <p>Start a conversation with ChatGPT</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-4 ${
                      message.role === 'assistant' ? 'bg-gray-50 py-6 -mx-4 px-4' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-600 mb-1">
                        {message.role === 'user' ? 'You' : 'ChatGPT'}
                      </div>
                      <div className="text-gray-900 whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-4 bg-gray-50 py-6 -mx-4 px-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-600 mb-1">ChatGPT</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message ChatGPT..."
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[48px] max-h-32 text-gray-900 bg-white placeholder-gray-500"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              ChatGPT can make mistakes. Consider checking important information.
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
} 