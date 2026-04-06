import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Data Analyst Dashboard',
  description: 'Upload CSV files and get AI-powered insights instantly',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
