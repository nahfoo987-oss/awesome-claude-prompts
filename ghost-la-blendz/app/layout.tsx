import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ghost LA Blendz — Premium Barber · Los Angeles',
  description: 'Clean. Consistent. Precision. Premium barber in Los Angeles. Any cut $30. Book online.',
  keywords: ['barber', 'los angeles', 'fades', 'tapers', 'lineups', 'ghost la blendz'],
  openGraph: {
    title: 'Ghost LA Blendz',
    description: 'Clean. Consistent. Precision. Any cut $30.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="font-sans bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
