import { ChatInterface } from '@/components/chat/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="h-screen max-w-4xl mx-auto bg-white shadow-lg">
        <ChatInterface />
      </div>
    </main>
  )
}