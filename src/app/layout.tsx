import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/Footer'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | Movie Watchlist',
    default: 'Movie Watchlist - Track Your Favorite Movies',
  },
  description:
    'Track your favorite movies, schedule when to watch them, and keep a personalized watchlist. Discover new movies and manage your viewing calendar.',
  keywords: [
    'movies',
    'watchlist',
    'movie tracker',
    'film calendar',
    'movie recommendations',
    'watch later',
  ],
  authors: [{ name: 'Movie Watchlist' }],
  creator: 'Movie Watchlist',
  publisher: 'Movie Watchlist',
  openGraph: {
    title: 'Movie Watchlist - Track Your Favorite Movies',
    description:
      'Track your favorite movies, schedule when to watch them, and keep a personalized watchlist.',
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://movie-watchlist.com',
    siteName: 'Movie Watchlist',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Movie Watchlist - Track Your Favorite Movies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movie Watchlist - Track Your Favorite Movies',
    description:
      'Track your favorite movies, schedule when to watch them, and keep a personalized watchlist.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Movie Watchlist',
    description:
      'Track your favorite movies, schedule when to watch them, and keep a personalized watchlist.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://movie-watchlist.com',
    applicationCategory: 'Entertainment',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Create personal movie watchlists',
      'Schedule movies to watch on specific dates',
      'Rate and review movies',
      'Track viewing history with calendar',
      'Discover new movies by genre',
      'Search extensive movie database',
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link
          rel="canonical"
          href={
            process.env.NEXT_PUBLIC_APP_URL || 'https://movie-watchlist.com'
          }
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Providers>
          <Header />
          <main className="container mx-auto flex-1 px-3 py-8 sm:px-4">
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
