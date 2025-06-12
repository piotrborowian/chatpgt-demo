# ChatGPT Clone

A ChatGPT-like web interface that uses the OpenAI GPT-4o model to generate responses.

## Features

- Clean, modern UI that mimics ChatGPT's interface
- Real-time chat with GPT-4o model
- Responsive design
- Loading states and error handling
- No chat history persistence (as requested)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your OpenAI API key:**
   - Make sure you have your OpenAI API key in the `.env.local` file
   - The key should be stored as: `OPENAI_API_KEY=your_actual_api_key_here`

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Start chatting with the AI!

## Project Structure

- `app/page.tsx` - Main page component
- `app/layout.tsx` - Root layout
- `app/components/ChatInterface.tsx` - Main chat interface component
- `app/api/chat/route.ts` - API route for OpenAI integration
- `app/globals.css` - Global styles

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (GPT-4o)
- Lucide React (for icons)

## Notes

- This implementation doesn't store chat history
- Each message is sent independently to the API
- The interface closely mimics ChatGPT's design and user experience 