import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootErrorBoundary } from '@/components/ui/RootErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description: 'A modern ChatGPT clone built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootErrorBoundary>
          {children}
        </RootErrorBoundary>
      </body>
    </html>
  )
}