import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Watchlist',
  description: 'Manage your personal movie watchlist. View movies to watch, upcoming scheduled films, and movies you\'ve already watched.',
  keywords: ['watchlist', 'my movies', 'movie list', 'saved movies', 'watch later'],
  openGraph: {
    title: 'My Watchlist | Movie Watchlist',
    description: 'Manage your personal movie watchlist with movies to watch, upcoming films, and watched movies.',
  },
}

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}