# Claude Code Configuration

## Workflow
**MUST FOLLOW**: @rules/workflow.md

This project follows the Agent Development Workflow for autonomous coding sessions. All development work must adhere to the research-first, test-driven approach outlined in the workflow document.

### Workflow Reminder
**⚠️ CRITICAL: NO FEATURE/ISSUE IS COMPLETE WITHOUT ALL 7 WORKFLOW STAGES (2.1-2.7)**

**Quick Summary:**
1. Session Boot → 2. Research + Planning (**STOP - Get User Approval**) → 3. Test Design & Implementation (**STOP - never start implementation before the tests are created**) → 4. Implementation → 5. Validation (**STOP - Get User Approval**) → 6. Documentation & PR → 7. Close Session

**Git Setup**: Ensure `develop` branch tracks `origin/develop`:
```bash
git branch --set-upstream-to=origin/develop develop
```

## Project Information

### Tech Stack
- **Frontend**: Next.js 14+ with TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4o API
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

### Environment Setup
```bash
# Required environment variables (already configured in .env.local)
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### MCP Server Configuration
Supabase MCP server is configured in `.cursor/mcp.json` for database operations:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "sbp_..."]
    }
  }
}
```

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run build
```

### Testing Commands
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

### Database Commands
```bash
# Generate types from Supabase
npm run generate-types

# Reset local database
npm run db:reset

# Run migrations
npm run db:migrate
```

## Development Guidelines

### Session Workflow
1. Always start by checking `tasks/implementation_plan.md` for next task
2. Create feature branch: `feature/issue-<n>-<slug>`
3. Follow TDD approach: RED → GREEN → REFACTOR
4. Document progress in `tasks/working_session.md`
5. Ensure all tests pass before PR
6. Update implementation plan when tasks are completed

### Code Standards
- Use TypeScript strict mode
- Follow ESLint configuration
- Implement proper error handling
- Add JSDoc comments for complex functions
- Use semantic commit messages

### API Integration
- **OpenAI**: Use streaming completions for real-time responses
- **Supabase**: Leverage RLS for security, use proper indexes
- Handle rate limits and API errors gracefully
- Implement proper loading states

### Testing Requirements
- Unit tests for utility functions
- Integration tests for API routes
- Component tests for React components
- E2E tests for critical user flows
- Visual regression tests for UI components

## Known Issues & Quirks

### Supabase
- RLS policies must be properly configured for user data access
- Real-time subscriptions require proper cleanup
- Type generation should be run after schema changes

### OpenAI API
- Implement proper error handling for rate limits
- Stream responses require server-sent events setup
- Context window management for long conversations

### Next.js
- API routes require proper error handling
- Static generation conflicts with dynamic auth
- Middleware configuration for protected routes

## File Structure

### Key Directories
- `src/components/` - React components organized by feature
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and API clients
- `src/types/` - TypeScript type definitions
- `tasks/` - Project management and session logs
- `docs/` - Architecture and design documentation

### Configuration Files
- `.env.local` - Environment variables (already configured)
- `.cursor/mcp.json` - MCP server configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

## Version Information
- Node.js: 18+
- Next.js: 14+
- React: 18+
- TypeScript: 5+
- Supabase JS: 2+
- OpenAI SDK: 4+

---
*Last updated: 2025-06-12*
*This configuration follows the workflow defined in @rules/workflow.md*