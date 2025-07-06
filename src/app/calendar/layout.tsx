import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Watch Calendar',
  description: 'Track when you watched movies on an interactive calendar. Schedule movies for future dates and view your watching history.',
  keywords: ['movie calendar', 'watch history', 'schedule movies', 'movie tracking', 'film calendar'],
  openGraph: {
    title: 'Watch Calendar | Movie Watchlist',
    description: 'Track when you watched movies and schedule future viewing dates on an interactive calendar.',
  },
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}