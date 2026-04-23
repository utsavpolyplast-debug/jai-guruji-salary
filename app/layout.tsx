import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jai Guru Ji — Salary Sheet',
  description: 'Salary Manager',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  )
}
