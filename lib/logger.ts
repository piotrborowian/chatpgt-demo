// Enhanced logging utility for both frontend and backend
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  location: 'frontend' | 'backend';
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private createLogEntry(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      location: typeof window !== 'undefined' ? 'frontend' : 'backend'
    };
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry('info', message, data);
    this.logs.push(entry);
    console.log(`[${entry.timestamp}] [${entry.location.toUpperCase()}] INFO: ${message}`, data || '');
    this.trimLogs();
    this.saveToLocalStorage();
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry('warn', message, data);
    this.logs.push(entry);
    console.warn(`[${entry.timestamp}] [${entry.location.toUpperCase()}] WARN: ${message}`, data || '');
    this.trimLogs();
    this.saveToLocalStorage();
  }

  error(message: string, data?: any) {
    const entry = this.createLogEntry('error', message, data);
    this.logs.push(entry);
    console.error(`[${entry.timestamp}] [${entry.location.toUpperCase()}] ERROR: ${message}`, data || '');
    this.trimLogs();
    this.saveToLocalStorage();
  }

  debug(message: string, data?: any) {
    const entry = this.createLogEntry('debug', message, data);
    this.logs.push(entry);
    console.debug(`[${entry.timestamp}] [${entry.location.toUpperCase()}] DEBUG: ${message}`, data || '');
    this.trimLogs();
    this.saveToLocalStorage();
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chatgpt-clone-logs', JSON.stringify(this.logs));
      } catch (e) {
        // Storage might be full, remove some old logs
        this.logs = this.logs.slice(-500);
        try {
          localStorage.setItem('chatgpt-clone-logs', JSON.stringify(this.logs));
        } catch (e2) {
          console.warn('Could not save logs to localStorage');
        }
      }
    }
  }

  // Get logs as formatted text for sharing
  exportLogs(): string {
    return this.logs
      .map(log => {
        const dataStr = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
        return `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.location.toUpperCase()}] ${log.message}${dataStr}`;
      })
      .join('\n');
  }

  // Get recent logs (last N entries)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatgpt-clone-logs');
    }
  }

  // Download logs as a file (frontend only)
  downloadLogs() {
    if (typeof window === 'undefined') return;
    
    const logText = this.exportLogs();
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt-clone-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Load existing logs from localStorage
  loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chatgpt-clone-logs');
        if (saved) {
          this.logs = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Could not load logs from localStorage');
      }
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Load existing logs on initialization (frontend only)
if (typeof window !== 'undefined') {
  logger.loadFromLocalStorage();
} 