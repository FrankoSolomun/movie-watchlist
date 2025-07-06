'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Film,
  Calendar,
  Trash2,
  Plus,
  Check,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { TMDBMovie, getImageUrl } from '@/lib/tmdb'

interface WatchlistMovie {
  id: string
  movieId: number
  title: string
  posterUrl: string | null
  releaseDate: string | null
  watched: boolean
  note: string | null
  dateWatched: number | null
  createdAt: number
}

export default function WatchlistPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [movies, setMovies] = useState<WatchlistMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingMovies, setRemovingMovies] = useState<Set<number>>(new Set())
  const [recommendations, setRecommendations] = useState<TMDBMovie[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [addingMovies, setAddingMovies] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<
    'all' | 'unwatched' | 'upcoming' | 'watched'
  >('all')
  const [plannedWatchDates, setPlannedWatchDates] = useState<Map<number, Date>>(
    new Map()
  )

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/watchlist')
        if (!response.ok) {
          throw new Error('Failed to fetch watchlist')
        }
        const data = await response.json()
        setMovies(data.movies)

        // Extract planned watch dates from database
        // Movies with future dates in dateWatched are considered planned/scheduled
        const plannedDates = new Map<number, Date>()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        data.movies.forEach((movie: WatchlistMovie) => {
          if (movie.watched && movie.dateWatched) {
            const movieDate = new Date(movie.dateWatched!)
            movieDate.setHours(0, 0, 0, 0)
            // If the date is in the future, it's a planned date
            if (movieDate > today) {
              plannedDates.set(movie.movieId, movieDate)
            }
          }
        })
        setPlannedWatchDates(plannedDates)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load watchlist'
        )
        toast.error('Failed to load your watchlist')
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [session])

  // Fetch recommendations when watchlist is initially loaded
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session || movies.length === 0) return

      // Only fetch if we don't have recommendations yet
      if (recommendations.length > 0) return

      setLoadingRecommendations(true)
      try {
        const excludeIds = movies.map(movie => movie.movieId).join(',')
        const response = await fetch(
          `/api/movies/recommendations?exclude=${excludeIds}`
        )
        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.results)
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [session, movies.length, recommendations.length, movies])

  // Navigate to calendar with specific date
  const navigateToCalendarDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD format
    router.push(`/calendar?highlightDate=${dateStr}`)
  }

  // Navigate to calendar for marking as watched (today's date)
  const navigateToMarkAsWatched = () => {
    router.push('/calendar')
  }


  const handleAddToWatchlist = async (movie: TMDBMovie) => {
    if (!session) {
      toast.error('Please sign in to add movies to your watchlist')
      return
    }

    if (addingMovies.has(movie.id)) {
      return
    }

    setAddingMovies(prev => new Set(prev).add(movie.id))

    try {
      const response = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
          title: movie.title,
          posterUrl: getImageUrl(movie.poster_path),
          releaseDate: movie.release_date,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          toast.warning('Movie is already in your watchlist')
        } else {
          throw new Error(errorData.error || 'Failed to add movie')
        }
        return
      }

      // Remove from recommendations locally (no re-fetch needed)
      setRecommendations(prev => prev.filter(rec => rec.id !== movie.id))

      // Add to local watchlist state optimistically
      const newWatchlistItem: WatchlistMovie = {
        id: Date.now().toString(), // Temporary ID
        movieId: movie.id,
        title: movie.title,
        posterUrl: getImageUrl(movie.poster_path),
        releaseDate: movie.release_date,
        watched: false,
        note: null,
        dateWatched: null,
        createdAt: Date.now(),
      }
      setMovies(prev => [newWatchlistItem, ...prev])

      toast.success(`"${movie.title}" added to your watchlist!`)
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add movie to watchlist'
      )
    } finally {
      setAddingMovies(prev => {
        const newSet = new Set(prev)
        newSet.delete(movie.id)
        return newSet
      })
    }
  }

  const handleRemoveFromWatchlist = async (movie: WatchlistMovie) => {
    if (removingMovies.has(movie.movieId)) {
      return
    }

    setRemovingMovies(prev => new Set(prev).add(movie.movieId))

    try {
      const response = await fetch('/api/watchlist/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.movieId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove movie')
      }

      // Optimistically update the UI
      setMovies(prev => prev.filter(m => m.movieId !== movie.movieId))
      toast.success(`"${movie.title}" removed from your watchlist`)
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to remove movie from watchlist'
      )
    } finally {
      setRemovingMovies(prev => {
        const newSet = new Set(prev)
        newSet.delete(movie.movieId)
        return newSet
      })
    }
  }

  const MovieSkeleton = () => (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <Skeleton className="mb-3 aspect-[2/3] rounded-md" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <Skeleton className="mb-2 h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <div className="py-12 text-center">
          <Film className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-semibold">
            Sign in to view your watchlist
          </h1>
          <p className="mb-4 text-muted-foreground">
            Track your favorite movies and create your personal watchlist
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">My Watchlist</h1>
          <p className="mb-4 text-muted-foreground">
            Movies you&apos;ve saved to watch later
          </p>

          {/* Filter Toggle */}
          {/* Desktop Filter Buttons */}
          <div className="hidden sm:flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({movies.length})
            </Button>
            <Button
              variant={filter === 'unwatched' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unwatched')}
            >
              To Watch (
              {
                movies.filter(
                  m => !m.watched && !plannedWatchDates.has(m.movieId)
                ).length
              }
              )
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('upcoming')}
            >
              Upcoming (
              {(() => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return movies.filter(m => {
                  if (plannedWatchDates.has(m.movieId)) return true
                  if (m.watched && m.dateWatched) {
                    const watchedDate = new Date(m.dateWatched!)
                    watchedDate.setHours(0, 0, 0, 0)
                    return watchedDate > today
                  }
                  return false
                }).length
              })()}
              )
            </Button>
            <Button
              variant={filter === 'watched' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('watched')}
            >
              Watched (
              {(() => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return movies.filter(m => {
                  if (!m.watched || !m.dateWatched) return false
                  const watchedDate = new Date(m.dateWatched!)
                  watchedDate.setHours(0, 0, 0, 0)
                  return watchedDate <= today
                }).length
              })()}
              )
            </Button>
          </div>

          {/* Mobile Filter Dropdown */}
          <div className="sm:hidden w-full">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unwatched' | 'upcoming' | 'watched')}
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All ({movies.length})</option>
              <option value="unwatched">
                To Watch ({movies.filter(m => !m.watched && !plannedWatchDates.has(m.movieId)).length})
              </option>
              <option value="upcoming">
                Upcoming ({(() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return movies.filter(m => {
                    if (plannedWatchDates.has(m.movieId)) return true
                    if (m.watched && m.dateWatched) {
                      const watchedDate = new Date(m.dateWatched!)
                      watchedDate.setHours(0, 0, 0, 0)
                      return watchedDate > today
                    }
                    return false
                  }).length
                })()})
              </option>
              <option value="watched">
                Watched ({(() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return movies.filter(m => {
                    if (!m.watched || !m.dateWatched) return false
                    const watchedDate = new Date(m.dateWatched!)
                    watchedDate.setHours(0, 0, 0, 0)
                    return watchedDate <= today
                  }).length
                })()})
              </option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <MovieSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Movie results */}
        {!loading &&
          movies.length > 0 &&
          (() => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const filteredMovies = movies.filter(movie => {
              if (filter === 'unwatched') {
                return !movie.watched && !plannedWatchDates.has(movie.movieId)
              }
              if (filter === 'upcoming') {
                if (plannedWatchDates.has(movie.movieId)) return true
                if (movie.watched && movie.dateWatched) {
                  const watchedDate = new Date(movie.dateWatched!)
                  watchedDate.setHours(0, 0, 0, 0)
                  return watchedDate > today
                }
                return false
              }
              if (filter === 'watched') {
                if (!movie.watched || !movie.dateWatched) return false
                const watchedDate = new Date(movie.dateWatched!)
                watchedDate.setHours(0, 0, 0, 0)
                return watchedDate <= today
              }
              return true
            })

            const unwatchedMovies = filteredMovies.filter(
              m => !m.watched && !plannedWatchDates.has(m.movieId)
            )
            const upcomingMovies = filteredMovies.filter(m => {
              if (plannedWatchDates.has(m.movieId)) return true
              if (m.watched && m.dateWatched) {
                const watchedDate = new Date(m.dateWatched!)
                watchedDate.setHours(0, 0, 0, 0)
                return watchedDate > today
              }
              return false
            })
            const watchedMovies = filteredMovies.filter(m => {
              if (!m.watched || !m.dateWatched) return false
              const watchedDate = new Date(m.dateWatched!)
              watchedDate.setHours(0, 0, 0, 0)
              return watchedDate <= today
            })

            return (
              <div className="space-y-8">
                {/* To Watch Section */}
                {(filter === 'all' || filter === 'unwatched') &&
                  unwatchedMovies.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <h2 className="mb-4 text-xl font-semibold">To Watch</h2>
                      )}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {unwatchedMovies.map(movie => (
                          <Card
                            key={movie.id}
                            className="flex flex-col transition-shadow hover:shadow-lg"
                          >
                            <CardHeader className="pb-2">
                              <Link
                                href={`/movies/${movie.movieId}`}
                                className="mb-3 aspect-[2/3] overflow-hidden rounded-md bg-gray-100 block transition-opacity hover:opacity-80"
                              >
                                <img
                                  src={movie.posterUrl || '/movie-placeholder.svg'}
                                  alt={movie.title}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              </Link>
                              <CardTitle className="line-clamp-2 text-sm leading-tight">
                                {movie.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pt-0">
                              <p className="mb-2 text-xs text-muted-foreground">
                                {movie.releaseDate
                                  ? new Date(movie.releaseDate).getFullYear()
                                  : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Added{' '}
                                {new Date(movie.createdAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 pt-0">
                              {(() => {
                                // Check if movie has a planned watch date
                                const plannedDate = plannedWatchDates.get(
                                  movie.movieId
                                )
                                if (plannedDate) {
                                  return (
                                    <Button
                                      onClick={() =>
                                        navigateToCalendarDate(plannedDate)
                                      }
                                      className="w-full border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                      variant="outline"
                                      size="sm"
                                    >
                                      <CalendarDays className="mr-2 h-3 w-3" />
                                      Upcoming{' '}
                                      {plannedDate.toLocaleDateString()}
                                    </Button>
                                  )
                                }

                                // Default state - unwatched movie, just add to calendar
                                return (
                                  <Button
                                    onClick={navigateToMarkAsWatched}
                                    className="w-full"
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Calendar className="mr-2 h-3 w-3" />
                                    Add to Calendar
                                  </Button>
                                )
                              })()}
                              <Button
                                onClick={() => handleRemoveFromWatchlist(movie)}
                                className="border-px w-full border"
                                variant="ghost"
                                size="sm"
                                disabled={removingMovies.has(movie.movieId)}
                              >
                                {removingMovies.has(movie.movieId) ? (
                                  <>
                                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Upcoming Section */}
                {(filter === 'all' || filter === 'upcoming') &&
                  upcomingMovies.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <h2 className="mb-4 text-xl font-semibold">Upcoming</h2>
                      )}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {upcomingMovies.map(movie => (
                          <Card
                            key={movie.id}
                            className="flex flex-col border-blue-200 bg-blue-50/30 transition-shadow hover:shadow-lg"
                          >
                            <CardHeader className="pb-2">
                              <Link
                                href={`/movies/${movie.movieId}`}
                                className="mb-3 aspect-[2/3] overflow-hidden rounded-md bg-gray-100 block transition-opacity hover:opacity-80"
                              >
                                <img
                                  src={movie.posterUrl || '/movie-placeholder.svg'}
                                  alt={movie.title}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              </Link>
                              <CardTitle className="line-clamp-2 text-sm leading-tight">
                                {movie.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pt-0">
                              <p className="mb-2 text-xs text-muted-foreground">
                                {movie.releaseDate
                                  ? new Date(movie.releaseDate).getFullYear()
                                  : 'N/A'}
                              </p>
                              {(() => {
                                const plannedDate = plannedWatchDates.get(
                                  movie.movieId
                                )
                                if (plannedDate) {
                                  return (
                                    <p className="text-xs font-medium text-blue-600">
                                      Planned {plannedDate.toLocaleDateString()}
                                    </p>
                                  )
                                }
                                if (movie.dateWatched) {
                                  return (
                                    <p className="text-xs font-medium text-blue-600">
                                      Upcoming{' '}
                                      {new Date(
                                        movie.dateWatched
                                      ).toLocaleDateString()}
                                    </p>
                                  )
                                }
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    No date set
                                  </p>
                                )
                              })()}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 pt-0">
                              {(() => {
                                const plannedDate = plannedWatchDates.get(
                                  movie.movieId
                                )
                                if (plannedDate) {
                                  return (
                                    <Button
                                      onClick={() =>
                                        navigateToCalendarDate(plannedDate)
                                      }
                                      className="w-full border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                      variant="outline"
                                      size="sm"
                                    >
                                      <CalendarDays className="mr-2 h-3 w-3" />
                                      View Planned Date
                                    </Button>
                                  )
                                }
                                if (movie.dateWatched) {
                                  return (
                                    <Button
                                      onClick={() =>
                                        navigateToCalendarDate(
                                          new Date(movie.dateWatched!)
                                        )
                                      }
                                      className="w-full border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                      variant="outline"
                                      size="sm"
                                    >
                                      <CalendarDays className="mr-2 h-3 w-3" />
                                      View Upcoming Date
                                    </Button>
                                  )
                                }
                                return (
                                  <Button
                                    onClick={navigateToMarkAsWatched}
                                    className="w-full"
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Calendar className="mr-2 h-3 w-3" />
                                    Add to Calendar
                                  </Button>
                                )
                              })()}
                              <Button
                                onClick={() => handleRemoveFromWatchlist(movie)}
                                className="border-px w-full border"
                                variant="ghost"
                                size="sm"
                                disabled={removingMovies.has(movie.movieId)}
                              >
                                {removingMovies.has(movie.movieId) ? (
                                  <>
                                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Watched Section */}
                {(filter === 'all' || filter === 'watched') &&
                  watchedMovies.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <h2 className="mb-4 text-xl font-semibold">Watched</h2>
                      )}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {watchedMovies.map(movie => (
                          <Card
                            key={movie.id}
                            className="flex flex-col transition-shadow hover:shadow-lg"
                          >
                            <CardHeader className="pb-2">
                              <Link
                                href={`/movies/${movie.movieId}`}
                                className="mb-3 aspect-[2/3] overflow-hidden rounded-md bg-gray-100 block transition-opacity hover:opacity-80"
                              >
                                <img
                                  src={movie.posterUrl || '/movie-placeholder.svg'}
                                  alt={movie.title}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              </Link>
                              <CardTitle className="line-clamp-2 text-sm leading-tight">
                                {movie.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 pt-0">
                              <p className="mb-2 text-xs text-muted-foreground">
                                {movie.releaseDate
                                  ? new Date(movie.releaseDate).getFullYear()
                                  : 'N/A'}
                              </p>
                              {(() => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                if (movie.dateWatched) {
                                  const watchedDate = new Date(
                                    movie.dateWatched
                                  )
                                  watchedDate.setHours(0, 0, 0, 0)

                                  if (watchedDate > today) {
                                    // Future date - upcoming
                                    return (
                                      <p className="text-xs font-medium text-blue-600">
                                        Upcoming{' '}
                                        {new Date(
                                          movie.dateWatched
                                        ).toLocaleDateString()}
                                      </p>
                                    )
                                  } else {
                                    // Past date - actually watched
                                    return (
                                      <p className="text-xs font-medium text-green-600">
                                        Watched{' '}
                                        {new Date(
                                          movie.dateWatched
                                        ).toLocaleDateString()}
                                      </p>
                                    )
                                  }
                                }

                                return (
                                  <p className="text-xs text-muted-foreground">
                                    No date recorded
                                  </p>
                                )
                              })()}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 pt-0">
                              {(() => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                if (movie.dateWatched) {
                                  const watchedDate = new Date(
                                    movie.dateWatched
                                  )
                                  watchedDate.setHours(0, 0, 0, 0)

                                  if (watchedDate > today) {
                                    // Future date - upcoming movie
                                    return (
                                      <Button
                                        onClick={() =>
                                          navigateToCalendarDate(
                                            new Date(movie.dateWatched!)
                                          )
                                        }
                                        className="w-full border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                        variant="outline"
                                        size="sm"
                                      >
                                        <CalendarDays className="mr-2 h-3 w-3" />
                                        View Upcoming Date
                                      </Button>
                                    )
                                  } else {
                                    // Past date - actually watched
                                    return (
                                      <Button
                                        onClick={() =>
                                          navigateToCalendarDate(
                                            new Date(movie.dateWatched!)
                                          )
                                        }
                                        className="w-full"
                                        variant="default"
                                        size="sm"
                                      >
                                        <Check className="mr-2 h-3 w-3" />
                                        View Watch Date
                                      </Button>
                                    )
                                  }
                                }

                                return (
                                  <Button
                                    onClick={navigateToMarkAsWatched}
                                    className="w-full"
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Calendar className="mr-2 h-3 w-3" />
                                    Add to Calendar
                                  </Button>
                                )
                              })()}
                              <Button
                                onClick={() => handleRemoveFromWatchlist(movie)}
                                className="border-px w-full border"
                                variant="ghost"
                                size="sm"
                                disabled={removingMovies.has(movie.movieId)}
                              >
                                {removingMovies.has(movie.movieId) ? (
                                  <>
                                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Empty state for filtered results */}
                {filteredMovies.length === 0 && (
                  <div className="py-12 text-center">
                    <Film className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h2 className="mb-2 text-2xl font-semibold">
                      No{' '}
                      {filter === 'watched'
                        ? 'watched'
                        : filter === 'unwatched'
                          ? 'unwatched'
                          : filter === 'upcoming'
                            ? 'upcoming'
                            : ''}{' '}
                      movies
                    </h2>
                    <p className="mb-6 text-muted-foreground">
                      {filter === 'watched'
                        ? 'Mark movies as watched from the calendar page'
                        : filter === 'unwatched'
                          ? 'All your movies have been scheduled or watched!'
                          : filter === 'upcoming'
                            ? 'No movies scheduled for future dates yet'
                            : 'Your watchlist is empty'}
                    </p>
                    {(filter === 'unwatched' || filter === 'upcoming') && (
                      <Link href="/calendar">
                        <Button>Add Movies to Calendar</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

        {/* Empty state */}
        {!loading && movies.length === 0 && (
          <div className="py-12 text-center">
            <Film className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-semibold">
              Your watchlist is empty
            </h2>
            <p className="mb-6 text-muted-foreground">
              Start by searching for movies to add to your watchlist
            </p>
            <Link href="/search">
              <Button>Browse Movies</Button>
            </Link>
          </div>
        )}

        {/* Recommended Movies Section */}
        {session && movies.length > 0 && (
          <div className="mt-16">
            <div className="border-t pt-12">
              <div className="mb-8">
                <h2 className="mb-2 text-2xl font-bold">Recommended for You</h2>
                <p className="text-muted-foreground">
                  Discover new movies you might enjoy
                </p>
              </div>

              {loadingRecommendations ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="aspect-[2/3] w-full rounded-md" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {recommendations.map(movie => (
                      <Card
                        key={movie.id}
                        className="flex flex-col opacity-100 transition-all duration-200 hover:shadow-lg"
                      >
                        <CardHeader className="pb-2">
                          <Link
                            href={`/movies/${movie.id}`}
                            className="mb-3 aspect-[2/3] overflow-hidden rounded-md bg-gray-100 block transition-opacity hover:opacity-80"
                          >
                            <img
                              src={getImageUrl(movie.poster_path)}
                              alt={movie.title}
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                            />
                          </Link>
                          <CardTitle className="line-clamp-2 text-sm leading-tight">
                            {movie.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <p className="mb-2 text-xs text-muted-foreground">
                            {movie.release_date
                              ? new Date(movie.release_date).getFullYear()
                              : 'N/A'}
                          </p>
                          {movie.vote_average > 0 && (
                            <p className="text-xs">
                              ⭐ {movie.vote_average.toFixed(1)}/10
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button
                            onClick={() => handleAddToWatchlist(movie)}
                            className="flex w-full items-center justify-center gap-1 px-3 py-2 text-sm"
                            variant="outline"
                            size="sm"
                            disabled={addingMovies.has(movie.id)}
                          >
                            {addingMovies.has(movie.id) ? (
                              <>
                                <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                <span>Adding...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 flex-shrink-0" />
                                <span>Add to Watchlist</span>
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  {/* See More Button */}
                  <div className="mt-8 text-center">
                    <Link href="/search">
                      <Button variant="outline" size="lg">
                        See More Movies
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Film className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No recommendations available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
