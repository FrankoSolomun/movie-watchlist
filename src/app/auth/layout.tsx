import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Movie Watchlist to track your favorite movies, schedule viewing times, and rate films you&apos;ve watched.',
  openGraph: {
    title: 'Sign In | Movie Watchlist',
    description: 'Sign in to Movie Watchlist to track your favorite movies, schedule viewing times, and rate films you&apos;ve watched.',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}