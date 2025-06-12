'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X, Menu } from 'lucide-react';
import { Conversation } from '../../lib/supabase';
import { getConversations, deleteConversation } from '../../lib/database';

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    console.log('Loading conversations...');
    try {
      const data = await getConversations();
      console.log('Conversations loaded:', data.length, 'conversations');
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId);
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          onSelectConversation(null);
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  // Function to refresh conversations (called from parent)
  const refreshConversations = () => {
    loadConversations();
  };

  // Expose refresh function to parent
  useEffect(() => {
    (window as any).refreshConversations = refreshConversations;
    return () => {
      delete (window as any).refreshConversations;
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-gray-900 text-white z-50 flex flex-col md:relative md:w-80">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-700 rounded md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`
                    group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
                    ${currentConversationId === conversation.id 
                      ? 'bg-gray-700' 
                      : 'hover:bg-gray-800'
                    }
                  `}
                >
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 