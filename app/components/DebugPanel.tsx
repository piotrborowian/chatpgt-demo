'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Download, Trash2, Eye } from 'lucide-react';
import { logger } from '../../lib/logger';

interface DebugInfo {
  supabaseConnected: boolean;
  openaiKeyPresent: boolean;
  lastError: string | null;
  conversationCount: number;
}

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseConnected: false,
    openaiKeyPresent: false,
    lastError: null,
    conversationCount: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    console.log('Debug panel: Checking connections...');
    
    // Check if environment variables are present
    const openaiKeyPresent = !!(process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
                               window.location.search.includes('openai'));
    
    // Test Supabase connection
    let supabaseConnected = false;
    let conversationCount = 0;
    let lastError = null;
    
    try {
      const response = await fetch('/api/test-db');
      const result = await response.json();
      
      if (result.success) {
        supabaseConnected = true;
        console.log('Debug panel: Supabase connection successful');
      } else {
        lastError = result.error;
        console.log('Debug panel: Supabase connection failed:', result.error);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.log('Debug panel: Connection test failed:', error);
    }
    
    setDebugInfo({
      supabaseConnected,
      openaiKeyPresent,
      lastError,
      conversationCount
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full text-xs z-50 opacity-50 hover:opacity-100"
        title="Show debug info"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Debug Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          {debugInfo.supabaseConnected ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span>Supabase: {debugInfo.supabaseConnected ? 'Connected' : 'Failed'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.openaiKeyPresent ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          <span>OpenAI Key: {debugInfo.openaiKeyPresent ? 'Present' : 'Missing'}</span>
        </div>
        
        {debugInfo.lastError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <div className="font-medium text-red-700 text-xs">Last Error:</div>
            <div className="text-red-600 text-xs break-words">{debugInfo.lastError}</div>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Log Management</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => logger.downloadLogs()}
              className="flex items-center gap-1 bg-green-500 text-white py-1 px-2 rounded text-xs hover:bg-green-600"
              title="Download logs as file"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
            <button
              onClick={() => {
                logger.clearLogs();
                alert('Logs cleared!');
              }}
              className="flex items-center gap-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600"
              title="Clear all logs"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <button
            onClick={() => {
              const recentLogs = logger.getRecentLogs(20);
              console.log('=== RECENT LOGS ===');
              recentLogs.forEach(log => {
                console.log(`[${log.timestamp}] [${log.level.toUpperCase()}] [${log.location.toUpperCase()}] ${log.message}`, log.data || '');
              });
              console.log('=== END RECENT LOGS ===');
            }}
            className="flex items-center gap-1 w-full mt-1 bg-purple-500 text-white py-1 px-2 rounded text-xs hover:bg-purple-600"
            title="Show recent logs in console"
          >
            <Eye className="w-3 h-3" />
            Show Recent Logs
          </button>
        </div>
        
        <button
          onClick={checkConnections}
          className="w-full mt-2 bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
} 