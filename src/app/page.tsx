'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Film, Play } from 'lucide-react'
import { GenreSection } from '@/components/GenreSection'
import { MiniCalendarPreview } from '@/components/MiniCalendarPreview'
import { UpcomingMoviesList } from '@/components/UpcomingMoviesList'
import { TMDBMovie, GENRE_IDS } from '@/lib/tmdb'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { data: session } = useSession()
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([])
  const [genreMovies, setGenreMovies] = useState<Record<string, TMDBMovie[]>>(
    {}
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Fetch popular movies
        const popularResponse = await fetch('/api/movies/popular')
        if (popularResponse.ok) {
          const popularData = await popularResponse.json()
          setPopularMovies(popularData.results)
        }

        // Fetch movies by genre
        const genrePromises = Object.entries(GENRE_IDS).map(
          async ([genreName, genreId]) => {
            const response = await fetch(`/api/movies/genre/${genreId}`)
            if (response.ok) {
              const data = await response.json()
              return [genreName, data.results]
            }
            return [genreName, []]
          }
        )

        const genreResults = await Promise.all(genrePromises)
        const genreMap = Object.fromEntries(genreResults)
        setGenreMovies(genreMap)
      } catch (error) {
        console.error('Failed to fetch movies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  const GenreSectionSkeleton = () => (
    <section className="space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <div className="mb-4 flex items-center justify-center space-x-2">
          <Film className="h-8 w-8 sm:h-12 sm:w-12" />
          <h1 className="text-2xl font-bold sm:text-4xl">Movie Watchlist</h1>
        </div>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-xl">
          Discover popular movies, explore different genres, and track your
          watching journey with our interactive calendar.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-8 lg:grid lg:grid-cols-4">
        {/* Main Content */}
        <div className="space-y-12 lg:col-span-3">
          {/* Popular Movies Section */}
          {loading ? (
            <GenreSectionSkeleton />
          ) : (
            <GenreSection title="Popular Movies" movies={popularMovies} />
          )}

          {/* Genre Sections */}
          {Object.entries({
            horror: 'Horror',
            comedy: 'Comedy',
            romance: 'Romance',
            drama: 'Drama',
            sciFi: 'Sci-Fi',
            action: 'Action',
            family: 'Family',
          }).map(([genreKey, genreTitle]) => (
            <div key={genreKey}>
              {loading ? (
                <GenreSectionSkeleton />
              ) : (
                <GenreSection
                  title={genreTitle}
                  movies={genreMovies[genreKey] || []}
                />
              )}
            </div>
          ))}

          {/* Sign in prompt for non-authenticated users */}
          {!session && (
            <div className="mt-16 space-y-6 text-center">
              <div className="rounded-lg bg-muted/50 p-6 sm:p-8">
                <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground sm:h-16 sm:w-16" />
                <h2 className="mb-2 text-xl font-semibold sm:text-2xl">
                  Track Your Movie Journey
                </h2>
                <p className="mb-4 text-sm text-muted-foreground sm:text-base">
                  Sign in with Google to create your personal watchlist, track
                  watched movies on a calendar, and rate your favorites
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {session ? (
              <>
                <MiniCalendarPreview />
                <UpcomingMoviesList />
              </>
            ) : (
              <div className="rounded-lg bg-muted/30 p-4 text-center sm:p-6">
                <Film className="mx-auto mb-3 h-8 w-8 text-muted-foreground sm:h-12 sm:w-12" />
                <h3 className="mb-2 text-sm font-semibold sm:text-base">
                  Your Personal Hub
                </h3>
                <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                  Sign in to see your watchlist, calendar, and upcoming movies
                  here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
