import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Huwelijkscursus',
  description: 'Ontdek samen wat God bedoelt met liefde, eenheid en trouw.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="h-full">
      <body className={`${inter.className} min-h-full bg-stone-50 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
