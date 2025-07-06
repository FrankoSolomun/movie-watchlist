'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Star, Calendar, MessageCircle, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/StarRating'
import { toast } from 'sonner'

interface WatchedMovie {
  id: string
  movieId: number
  title: string
  posterUrl: string | null
  releaseDate: string | null
  watched: boolean
  dateWatched: number | null
  rating: number | null
}

interface MovieComment {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

export default function RatingsPage() {
  const { data: session, status } = useSession()
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([])
  const [movieComments, setMovieComments] = useState<
    Record<number, MovieComment>
  >({})
  const [loading, setLoading] = useState(true)
  const [updatingRating, setUpdatingRating] = useState<Set<number>>(new Set())

  const fetchWatchedMovies = useCallback(async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        // Only include movies that are actually watched (not scheduled for the future)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today
        
        const watched = data.movies.filter(
          (movie: WatchedMovie) => {
            if (!movie.watched || !movie.dateWatched) return false
            const watchedDate = new Date(movie.dateWatched)
            // Only include if the date is today or in the past
            return watchedDate <= today
          }
        )
        setWatchedMovies(watched)

        // Fetch comments for each watched movie
        const commentPromises = watched.map((movie: WatchedMovie) =>
          fetchMovieComments(movie.movieId)
        )
        await Promise.all(commentPromises)
      }
    } catch (error) {
      console.error('Failed to fetch watched movies:', error)
      toast.error('Failed to load watched movies')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      setLoading(false)
      return
    }

    fetchWatchedMovies()
  }, [session, status, fetchWatchedMovies])

  const fetchMovieComments = async (movieId: number) => {
    try {
      const response = await fetch(`/api/comments?movieId=${movieId}`)
      if (response.ok) {
        const data = await response.json()
        // Find the user's comment for this movie
        const userComment = data.comments.find(
          (comment: { userId: string }) => comment.userId === session?.user?.id
        )
        if (userComment) {
          setMovieComments(prev => ({
            ...prev,
            [movieId]: userComment,
          }))
        }
      }
    } catch (error) {
      console.error(`Failed to fetch comments for movie ${movieId}:`, error)
    }
  }

  const handleRatingChange = async (movieId: number, rating: number | null) => {
    if (updatingRating.has(movieId)) return

    setUpdatingRating(prev => new Set(prev).add(movieId))

    try {
      const response = await fetch('/api/watchlist/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId, rating }),
      })

      if (response.ok) {
        setWatchedMovies(prev =>
          prev.map(movie =>
            movie.movieId === movieId ? { ...movie, rating } : movie
          )
        )
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
      setUpdatingRating(prev => {
        const newSet = new Set(prev)
        newSet.delete(movieId)
        return newSet
      })
    }
  }

  const formatWatchedDate = (timestamp: number | null) => {
    if (!timestamp) return 'Date unknown'
    const date = new Date(timestamp)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const movieDate = new Date(timestamp)
    movieDate.setHours(0, 0, 0, 0)
    
    const isScheduled = movieDate > today
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    return isScheduled ? `Scheduled for ${formattedDate}` : `Watched on ${formattedDate}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl text-center">
          <Star className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Sign In to Rate Movies</h1>
          <p className="text-muted-foreground">
            Please sign in to view and rate your watched movies
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Link>
          <h1 className="mb-2 text-3xl font-bold">Rate Your Movies</h1>
          <p className="text-muted-foreground">
            Rate and review the movies you&apos;ve watched
          </p>
        </div>

        {/* Summary Stats */}
        {watchedMovies.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Movie Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {watchedMovies.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Movies Watched
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {watchedMovies.filter(m => m.rating !== null).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Movies Rated
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    {Object.keys(movieComments).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Movies Commented
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {
                      watchedMovies.filter(m => m.rating && m.rating >= 4)
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    4+ Star Movies
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Watched Movies List */}
        {watchedMovies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">
                No watched movies yet
              </h3>
              <p className="mb-4 text-muted-foreground">
                Mark movies as watched from your{' '}
                <Link href="/calendar" className="text-primary hover:underline">
                  calendar page
                </Link>{' '}
                to rate them here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {watchedMovies.map(movie => {
              const comment = movieComments[movie.movieId]
              const isUpdating = updatingRating.has(movie.movieId)

              return (
                <Card
                  key={movie.id}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardContent className="p-4">
                    {/* Mobile Layout - Poster above content */}
                    <div className="sm:hidden">
                      <div className="mb-4 flex justify-center">
                        <Link href={`/movies/${movie.movieId}`}>
                          <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-gray-100 transition-opacity hover:opacity-80">
                            <img
                              src={movie.posterUrl || '/movie-placeholder.svg'}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </Link>
                      </div>
                      
                      {/* Movie Details - Mobile */}
                      <div>
                        {/* Title and Date */}
                        <div className="mb-3">
                          <Link
                            href={`/movies/${movie.movieId}`}
                            className="hover:underline"
                          >
                            <h3 className="mb-1 text-lg font-semibold leading-tight">
                              {movie.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatWatchedDate(movie.dateWatched)}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-4">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Your Rating:
                            </span>
                            {isUpdating && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                            )}
                          </div>
                          <StarRating
                            rating={movie.rating}
                            onRatingChange={rating =>
                              handleRatingChange(movie.movieId, rating)
                            }
                            readonly={isUpdating}
                            size="md"
                          />
                        </div>

                        {/* Comment */}
                        {comment && (
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Your Comment:
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {comment.updatedAt !== comment.createdAt
                                ? `Updated ${new Date(comment.updatedAt).toLocaleDateString()}`
                                : `Posted ${new Date(comment.createdAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        )}

                        {!comment && (
                          <div className="text-sm text-muted-foreground">
                            <Link
                              href={`/movies/${movie.movieId}`}
                              className="text-primary hover:underline"
                            >
                              Add a comment →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout - Side by side */}
                    <div className="hidden sm:flex gap-4">
                      <Link href={`/movies/${movie.movieId}`}>
                        <div className="h-24 w-16 overflow-hidden rounded-md bg-gray-100 transition-opacity hover:opacity-80">
                          <img
                            src={movie.posterUrl || '/movie-placeholder.svg'}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </Link>
                      
                      {/* Movie Details - Desktop */}
                      <div className="flex-1">
                        {/* Title and Date */}
                        <div className="mb-3">
                          <Link
                            href={`/movies/${movie.movieId}`}
                            className="hover:underline"
                          >
                            <h3 className="mb-1 text-lg font-semibold leading-tight">
                              {movie.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatWatchedDate(movie.dateWatched)}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-4">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Your Rating:
                            </span>
                            {isUpdating && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                            )}
                          </div>
                          <StarRating
                            rating={movie.rating}
                            onRatingChange={rating =>
                              handleRatingChange(movie.movieId, rating)
                            }
                            readonly={isUpdating}
                            size="md"
                          />
                        </div>

                        {/* Comment */}
                        {comment && (
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Your Comment:
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {comment.updatedAt !== comment.createdAt
                                ? `Updated ${new Date(comment.updatedAt).toLocaleDateString()}`
                                : `Posted ${new Date(comment.createdAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        )}

                        {!comment && (
                          <div className="text-sm text-muted-foreground">
                            <Link
                              href={`/movies/${movie.movieId}`}
                              className="text-primary hover:underline"
                            >
                              Add a comment →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
