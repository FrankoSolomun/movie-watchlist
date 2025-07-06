'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Plus,
  Check,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Comments } from '@/components/Comments'
import { StarRating } from '@/components/StarRating'
import { toast } from 'sonner'
import { TMDBMovieDetails, getImageUrl } from '@/lib/tmdb'

export default function MovieDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const movieId = params.id as string

  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [addingToWatchlist, setAddingToWatchlist] = useState(false)
  const [removingFromWatchlist, setRemovingFromWatchlist] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [updatingRating, setUpdatingRating] = useState(false)
  const [watchedDate, setWatchedDate] = useState<number | null>(null)

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch movie details')
        }
        const movieData = await response.json()
        setMovie(movieData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movie')
      } finally {
        setLoading(false)
      }
    }

    const checkWatchlistStatus = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/watchlist')
        if (response.ok) {
          const data = await response.json()
          const movieInWatchlist = data.movies.find(
            (m: { movieId: number; watched?: boolean; rating?: number; dateWatched?: number }) => m.movieId === parseInt(movieId)
          )
          setIsInWatchlist(!!movieInWatchlist)
          setIsWatched(movieInWatchlist?.watched || false)
          setUserRating(movieInWatchlist?.rating || null)
          setWatchedDate(movieInWatchlist?.dateWatched || null)
        }
      } catch (error) {
        console.error('Failed to check watchlist status:', error)
      }
    }

    fetchMovieDetails()
    checkWatchlistStatus()
  }, [movieId, session])

  const handleAddToWatchlist = async () => {
    if (!session || !movie) {
      toast.error('Please sign in to add movies to your watchlist')
      return
    }

    setAddingToWatchlist(true)
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

      setIsInWatchlist(true)
      toast.success(`"${movie.title}" added to your watchlist!`)
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add movie to watchlist'
      )
    } finally {
      setAddingToWatchlist(false)
    }
  }

  const handleRemoveFromWatchlist = async () => {
    if (!movie) return

    setRemovingFromWatchlist(true)
    try {
      const response = await fetch('/api/watchlist/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove movie')
      }

      setIsInWatchlist(false)
      setIsWatched(false)
      setUserRating(null)
      setWatchedDate(null)
      toast.success(`"${movie.title}" removed from your watchlist`)
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to remove movie from watchlist'
      )
    } finally {
      setRemovingFromWatchlist(false)
    }
  }

  const handleRatingChange = async (rating: number | null) => {
    if (!session || !movie || updatingRating) {
      if (!session) {
        toast.error('Please sign in to rate movies')
      }
      return
    }

    setUpdatingRating(true)

    try {
      const response = await fetch('/api/watchlist/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId: movie.id, rating }),
      })

      if (response.ok) {
        setUserRating(rating)
        toast.success(
          rating
            ? `Rated ${rating} star${rating !== 1 ? 's' : ''}`
            : 'Rating removed'
        )
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update rating')
      }
    } catch (error) {
      console.error('Error updating rating:', error)
      toast.error('Failed to update rating')
    } finally {
      setUpdatingRating(false)
    }
  }

  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-6 h-8 w-32" />
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            </div>
            <div className="space-y-4 md:col-span-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-2xl font-bold">Movie Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            {error || 'The requested movie could not be found.'}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Link>

        {/* Movie Details */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-gray-100">
              <img
                src={getImageUrl(movie.poster_path, 'w500')}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6 md:col-span-2">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{movie.title}</h1>
              {movie.tagline && (
                <p className="mb-4 text-lg italic text-muted-foreground">
                  {movie.tagline}
                </p>
              )}

              <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(movie.release_date).getFullYear()}
                </div>
                {movie.runtime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatRuntime(movie.runtime)}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {movie.vote_average.toFixed(1)}/10 TMDB
                </div>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span
                      key={genre.id}
                      className="rounded-md bg-muted px-2 py-1 text-xs font-medium"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-xl font-semibold">Overview</h2>
              <p className="leading-relaxed text-muted-foreground">
                {movie.overview}
              </p>
            </div>

            {/* Action Buttons */}
            {session && (
              <div className="flex gap-4">
                {!isInWatchlist ? (
                  <Button
                    onClick={handleAddToWatchlist}
                    disabled={addingToWatchlist}
                    className="flex items-center gap-2"
                  >
                    {addingToWatchlist ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {addingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
                  </Button>
                ) : (
                  <>
                    {/* Check if movie is scheduled for future or actually watched */}
                    {isWatched ? (
                      (() => {
                        // Check if this is a future scheduled date
                        const isScheduled = watchedDate && new Date(watchedDate) > new Date()
                        return (
                          <Button disabled className="flex items-center gap-2">
                            {isScheduled ? (
                              <>
                                <Calendar className="h-4 w-4" />
                                Scheduled
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Watched
                              </>
                            )}
                          </Button>
                        )
                      })()
                    ) : (
                      <Link href="/calendar">
                        <Button className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Mark as Watched
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="destructive"
                      onClick={handleRemoveFromWatchlist}
                      disabled={removingFromWatchlist}
                      className="flex items-center gap-2"
                    >
                      {removingFromWatchlist ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {removingFromWatchlist ? 'Removing...' : 'Remove'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Personal Rating Section */}
        {session && isInWatchlist && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Your Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {updatingRating && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    )}
                    <StarRating
                      rating={userRating}
                      onRatingChange={handleRatingChange}
                      readonly={updatingRating}
                      size="lg"
                    />
                  </div>
                  {userRating ? (
                    <span className="text-lg font-semibold text-yellow-600">
                      {userRating}/5 stars
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Rate this movie
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your personal rating helps track your movie preferences
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!session && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 text-muted-foreground">
                  Want to rate this movie?
                </p>
                <p className="text-sm text-muted-foreground">
                  Sign in to add your personal rating and track your movie
                  preferences
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{movie.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span>{movie.original_language.toUpperCase()}</span>
                </div>
                {movie.budget > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span>{formatCurrency(movie.budget)}</span>
                  </div>
                )}
                {movie.revenue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span>{formatCurrency(movie.revenue)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {movie.production_companies &&
            movie.production_companies.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">
                    Production Companies
                  </h3>
                  <div className="space-y-2">
                    {movie.production_companies.slice(0, 5).map(company => (
                      <div key={company.id} className="text-sm">
                        {company.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <Comments movieId={movie.id} />
        </div>
      </div>
    </div>
  )
}
