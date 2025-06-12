# 📝 Logging Guide

This ChatGPT clone includes comprehensive logging to help with debugging and sharing logs.

## 🚀 Quick Start

### Option 1: Development Server with File Logging
```bash
npm run dev:logs
```
This will:
- Start the development server normally
- Save all terminal output to `logs/dev-TIMESTAMP.log`
- Show output in terminal as usual

### Option 2: Regular Development Server
```bash
npm run dev
```
Use the in-app debug panel for frontend logs.

## 📂 Frontend Logs

### In-App Debug Panel
1. Look for the small debug panel in the bottom-right corner of the app
2. Use the **Log Management** section:
   - **Download**: Download all frontend logs as a `.txt` file
   - **Clear**: Clear all stored logs
   - **Show Recent Logs**: Display last 20 logs in browser console

### What's Logged (Frontend)
- User message sending
- Conversation creation
- Message loading
- API calls and responses
- Error details with context
- Supabase operations

## 🖥️ Backend Logs

### Terminal Output
- API route calls
- Database operations
- OpenAI API interactions
- Error details with stack traces

### File Logging
When using `npm run dev:logs`, all terminal output is saved to:
```
logs/dev-YYYY-MM-DDTHH-MM-SS.log
```

## 🔍 Log Levels

Both frontend and backend use these log levels:
- **INFO**: Normal operations, API calls, successful actions
- **WARN**: Warnings, missing data, recoverable issues
- **ERROR**: Errors, failures, exceptions
- **DEBUG**: Detailed debugging information

## 📤 Sharing Logs

### With Support/Development Team

**Frontend Logs:**
1. Use the debug panel "Download" button
2. Attach the downloaded `.txt` file

**Backend Logs:**
1. If using `npm run dev:logs`, share the file from `logs/` directory
2. If using regular `npm run dev`, copy/paste terminal output

**Combined Approach:**
```bash
# Start with file logging
npm run dev:logs

# Reproduce the issue
# Then share both:
# 1. The file from logs/ directory (backend)
# 2. Downloaded file from debug panel (frontend)
```

### Browser Console Method
1. Open browser console (F12)
2. Reproduce the issue
3. Right-click in console → "Save as..." or copy/paste

## 🧹 Log Management

### Cleanup
```bash
# Remove old log files
rm -rf logs/

# Clear frontend logs
# Use the "Clear" button in debug panel or:
localStorage.removeItem('chatgpt-clone-logs');
```

### File Sizes
- Frontend logs: Limited to 1000 entries in memory
- Backend logs: Unlimited (will grow with usage)

## 🛠️ Technical Details

### Frontend Logger (`lib/logger.ts`)
- Stores logs in localStorage
- Automatic trimming to prevent memory issues
- Export functionality for sharing
- Timestamped entries with location context

### Backend Logging
- Enhanced console.log statements
- Structured error logging
- Request/response tracking
- Database operation monitoring

### Log Format
```
[2024-01-15T10:30:45.123Z] [INFO] [FRONTEND] User sending message | Data: {"message":"Hello","conversationId":"abc123"}
[2024-01-15T10:30:45.456Z] [INFO] [BACKEND] Chat API called | Data: {"message":"Hello","conversationId":"abc123"}
``` 