import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Movies',
  description: 'Explore detailed information about movies, add them to your watchlist, rate and review films.',
  keywords: ['movies', 'film details', 'movie information', 'cinema', 'film database'],
  openGraph: {
    title: 'Movies | Movie Watchlist',
    description: 'Explore detailed information about movies and manage your personal watchlist.',
  },
}

export default function MoviesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}