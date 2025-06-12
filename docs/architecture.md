# ChatGPT Clone - System Architecture

## Overview
A modern web application that replicates ChatGPT's core functionality with conversation management, built using Next.js, Supabase, and OpenAI's GPT-4o API.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Next.js App   │    │   Supabase DB   │
│                 │◄──►│                 │◄──►│                 │
│  - React UI     │    │  - API Routes   │    │  - PostgreSQL   │
│  - State Mgmt   │    │  - Auth         │    │  - Auth         │
│  - WebSocket    │    │  - Middleware   │    │  - RLS          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │                 │
                       │  - GPT-4o       │
                       │  - Streaming    │
                       │  - Completions  │
                       └─────────────────┘
```

## System Components

### 1. Frontend (Next.js 14+)

#### Core Pages
- `/` - Landing/Login page
- `/chat` - Main chat interface
- `/chat/[id]` - Specific conversation view

#### Key Components
```
src/
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx     # Main chat container
│   │   ├── MessageList.tsx       # Message display
│   │   ├── MessageInput.tsx      # User input area
│   │   └── TypingIndicator.tsx   # Loading states
│   ├── sidebar/
│   │   ├── ConversationList.tsx  # Conversation history
│   │   └── ConversationItem.tsx  # Individual conversation
│   ├── auth/
│   │   ├── LoginForm.tsx         # Authentication
│   │   └── SignupForm.tsx        # User registration
│   └── ui/                       # Reusable UI components
├── hooks/
│   ├── useAuth.ts               # Authentication logic
│   ├── useConversations.ts      # Conversation management
│   └── useChat.ts               # Chat functionality
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── openai.ts                # OpenAI client
│   └── utils.ts                 # Utility functions
└── types/
    └── index.ts                 # TypeScript definitions
```

#### State Management
- **React Context** for global app state
- **Custom hooks** for feature-specific logic
- **Local storage** for temporary data persistence

### 2. Backend API (Next.js API Routes)

#### API Endpoints
```
/api/
├── auth/
│   ├── login.ts                 # User authentication
│   └── signup.ts                # User registration
├── conversations/
│   ├── index.ts                 # GET/POST conversations
│   ├── [id].ts                  # GET/PUT/DELETE specific conversation
│   └── [id]/messages.ts         # GET/POST messages for conversation
├── chat/
│   └── stream.ts                # POST - Stream chat completions
└── health.ts                    # Application health check
```

#### Middleware
- **Authentication middleware** - Verify user sessions
- **Rate limiting** - Prevent API abuse
- **CORS handling** - Cross-origin requests
- **Error handling** - Consistent error responses

### 3. Database Schema (Supabase/PostgreSQL)

#### Tables

##### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Indexes
```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### Row Level Security (RLS)
```sql
-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only access messages from their conversations
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

### 4. External Services

#### OpenAI API Integration
- **Model**: GPT-4o
- **Streaming**: Server-sent events for real-time responses
- **Context Management**: Maintain conversation history
- **Error Handling**: Fallback strategies for API failures

#### Supabase Services
- **Authentication**: User management and sessions
- **Database**: PostgreSQL with real-time subscriptions
- **Storage**: File uploads (future feature)
- **Edge Functions**: Server-side processing (if needed)

## Data Flow

### 1. User Authentication
```
User → Login Form → Supabase Auth → JWT Token → Protected Routes
```

### 2. Starting a Conversation
```
User Input → MessageInput → API Route → OpenAI API → Stream Response → UI Update → Supabase Storage
```

### 3. Loading Conversation History
```
Page Load → useConversations Hook → Supabase Query → ConversationList Component → UI Render
```

## Security Considerations

### Authentication
- JWT tokens with proper expiration
- Secure HTTP-only cookies
- CSRF protection via Supabase Auth helpers

### API Security
- Rate limiting on chat endpoints
- Input validation and sanitization
- Environment variable protection
- Row Level Security in database

### Data Protection
- Encrypted data transmission (HTTPS)
- Sensitive data in environment variables
- No API keys exposed to client-side

## Performance Optimizations

### Frontend
- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Client-side caching with React Query/SWR
- Lazy loading for conversation history

### Backend
- Connection pooling for database
- API response caching where appropriate
- Efficient database queries with proper indexing
- Streaming responses to reduce perceived latency

### Database
- Optimized queries with proper indexes
- Connection pooling via Supabase
- Pagination for large datasets
- Real-time subscriptions for live updates

## Monitoring & Observability

### Logging
- Application logs via console/file
- API request/response logging
- Error tracking with proper stack traces

### Metrics
- Response times for API endpoints
- Database query performance
- OpenAI API usage and costs
- User engagement metrics

### Health Checks
- Database connectivity
- External API availability
- Application startup checks

## Deployment Architecture

### Vercel Deployment
```
GitHub → Vercel Build → Edge Functions → CDN Distribution
```

### Environment Configuration
- **Development**: Local .env.local
- **Preview**: Vercel preview deployments
- **Production**: Vercel environment variables

### CI/CD Pipeline
- GitHub Actions for testing
- Automatic deployments on merge to main
- Environment-specific configurations

---
*Last updated: 2025-06-12*