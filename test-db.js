const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('conversations').select('count', { count: 'exact' })
    
    if (error) {
      console.error('Connection test failed:', error.message)
      console.log('This likely means the tables do not exist yet.')
      console.log('Please run the SQL schema in database/schema.sql through the Supabase dashboard.')
    } else {
      console.log('✅ Connection successful!')
      console.log('Conversations count:', data)
    }
  } catch (err) {
    console.error('Test failed:', err)
  }
}

testConnection()