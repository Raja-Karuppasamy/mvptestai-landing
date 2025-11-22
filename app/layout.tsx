'use client'

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
