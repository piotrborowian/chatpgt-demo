# ChatGPT Clone

A modern ChatGPT clone built with Next.js 14, TypeScript, and the OpenAI API.

## Features

- Clean, modern ChatGPT-like interface
- Real-time chat with GPT-4o model
- Responsive design with Tailwind CSS
- TypeScript for better development experience

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

- Type your message in the input field at the bottom
- Press Enter or click the send button to send your message
- Wait for GPT-4o to respond
- Continue the conversation as needed

## Requirements

- Node.js 18 or later
- An OpenAI API key (get one at https://platform.openai.com/api-keys)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: OpenAI GPT-4o
- **Icons**: Lucide React

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API endpoint for chat
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main chat interface
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Note

This is a simple implementation without chat history persistence. Each page refresh will start a new conversation. 