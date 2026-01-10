import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Calling Platform',
  description: 'Multi-tenant SaaS AI calling platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

