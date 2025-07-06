import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Movie Ratings',
  description: 'Rate and review movies you\'ve watched. View your rating history and discover your favorite films.',
  keywords: ['movie ratings', 'film reviews', 'rate movies', 'movie scores', 'film ratings'],
  openGraph: {
    title: 'Movie Ratings | Movie Watchlist',
    description: 'Rate and review movies you\'ve watched. Track your favorite films and rating history.',
  },
}

export default function RatingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}