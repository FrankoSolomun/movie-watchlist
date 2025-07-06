import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Movies',
  description: 'Search and discover movies by title, genre, or year. Add movies to your watchlist and explore detailed information about each film.',
  keywords: ['movie search', 'find movies', 'movie database', 'film search', 'discover movies'],
  openGraph: {
    title: 'Search Movies | Movie Watchlist',
    description: 'Search and discover movies by title, genre, or year. Add movies to your watchlist.',
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}