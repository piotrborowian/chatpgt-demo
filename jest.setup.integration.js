// Jest setup for integration tests
const { config } = require('dotenv')
const { resolve } = require('path')

// Load environment variables from .env.local before any tests run
const envPath = resolve(process.cwd(), '.env.local')
const result = config({ path: envPath })

if (result.error) {
  console.error('Failed to load .env.local:', result.error)
} else {
  console.log('Successfully loaded environment variables from .env.local')
}

// Verify required environment variables
const required = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing)
  process.exit(1)
}