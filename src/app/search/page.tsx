'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { debounce, type TMDBMovie, getImageUrl } from '@/lib/tmdb'
import { GenreSelect } from '@/components/GenreSelect'

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [addingMovies, setAddingMovies] = useState<Set<number>>(new Set())
  const [watchlistMovies, setWatchlistMovies] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [hasMore, setHasMore] = useState(true)
  const [addedMovies, setAddedMovies] = useState<Set<number>>(new Set()) // eslint-disable-line @typescript-eslint/no-unused-vars
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Fetch user's existing watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!session) return

    try {
      const response = await fetch('/api/watchlist')

      if (!response.ok) return

      const data = await response.json()
      const movieIds = new Set<number>(
        data.movies.map((movie: { movieId: number }) => movie.movieId)
      )
      setWatchlistMovies(movieIds)
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    }
  }, [session])

  // Fetch watchlist when session is available
  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  // Initialize query and genre from URL parameters and load initial data
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const urlGenre = searchParams.get('genre') || ''
    setQuery(urlQuery)
    setSelectedGenre(urlGenre)

    const loadInitialData = async () => {
      setLoading(true)
      setError(null)
      setCurrentPage(1)

      try {
        const params = new URLSearchParams()
        if (urlQuery.trim()) params.set('q', urlQuery)
        if (urlGenre) params.set('genre', urlGenre)
        params.set('page', '1')

        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Search failed')
        }
        const data = await response.json()
        setMovies(data.results)
        setTotalPages(data.total_pages)
        setHasMore(data.page < data.total_pages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movies')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [searchParams])

  // Update URL with search query and genre
  const updateURL = useCallback(
    (searchQuery: string, genre?: string) => {
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.set('q', searchQuery)
      }
      if (genre) {
        params.set('genre', genre)
      }
      const newUrl = params.toString()
        ? `/search?${params.toString()}`
        : '/search'
      router.replace(newUrl, { scroll: false })
    },
    [router]
  )

  // Load more movies for infinite scroll
  const loadMoreMovies = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query)
      if (selectedGenre) params.set('genre', selectedGenre)
      params.set('page', nextPage.toString())

      const response = await fetch(`/api/search?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load more movies')
      }
      const data = await response.json()

      setMovies(prev => [...prev, ...data.results])
      setCurrentPage(nextPage)
      setHasMore(nextPage < data.total_pages)
    } catch (err) {
      console.error('Error loading more movies:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [currentPage, hasMore, loadingMore, query, selectedGenre])

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string, genre?: string) => {
      setIsSearching(true)
      setError(null)
      setCurrentPage(1)

      try {
        const params = new URLSearchParams()
        if (searchQuery.trim()) params.set('q', searchQuery)
        if (genre) params.set('genre', genre)
        params.set('page', '1')

        const response = await fetch(`/api/search?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Search failed')
        }
        const data = await response.json()
        setMovies(data.results)
        setTotalPages(data.total_pages)
        setHasMore(data.page < data.total_pages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreMovies()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loading, loadMoreMovies])

  // Create debounced versions of search and URL update
  const debouncedSearch = useCallback(
    debounce((...args: unknown[]) => {
      const searchQuery = args[0] as string
      performSearch(searchQuery, selectedGenre)
    }, 500),
    [performSearch, selectedGenre]
  )

  const debouncedUpdateURL = useCallback(
    debounce((...args: unknown[]) => {
      const searchQuery = args[0] as string
      updateURL(searchQuery, selectedGenre)
    }, 300),
    [updateURL, selectedGenre]
  )

  // Handle input change with debounced search and URL update
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
    debouncedUpdateURL(value)
  }

  // Handle genre change
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre)
    updateURL(query, genre)
    performSearch(query, genre)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    updateURL(query, selectedGenre)
    performSearch(query, selectedGenre)
  }

  const handleAddToWatchlist = async (movie: TMDBMovie) => {
    if (!session) {
      toast.error('Please sign in to add movies to your watchlist')
      return
    }

    if (watchlistMovies.has(movie.id) || addingMovies.has(movie.id)) {
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
          setAddedMovies((prev: Set<number>) => new Set(prev).add(movie.id))
          setWatchlistMovies(prev => new Set(prev).add(movie.id))
        } else {
          throw new Error(errorData.error || 'Failed to add movie')
        }
        return
      }

      setAddedMovies((prev: Set<number>) => new Set(prev).add(movie.id))
      setWatchlistMovies(prev => new Set(prev).add(movie.id))
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

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">
            {query
              ? 'Search Results'
              : selectedGenre
                ? 'Genre Movies'
                : 'Popular Movies'}
          </h1>
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-2">
              {/* Desktop Layout */}
              <div className="hidden gap-2 sm:flex">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search for movies..."
                    value={query}
                    onChange={handleInputChange}
                    className="w-full pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={loading || isSearching}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>

              {/* Mobile Layout */}
              <div className="space-y-2 sm:hidden">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search for movies..."
                    value={query}
                    onChange={handleInputChange}
                    className="w-full pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading || isSearching}
                  className="w-full"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </form>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter by genre:</span>
              <GenreSelect
                value={selectedGenre}
                onValueChange={handleGenreChange}
              />
            </div>
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
            {Array.from({ length: 20 }).map((_, index) => (
              <MovieSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Movie results */}
        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {movies.map((movie, index) => (
              <Card
                key={`${movie.id}-${index}`}
                className="flex flex-col transition-shadow hover:shadow-lg"
              >
                <CardHeader className="pb-2">
                  <Link href={`/movies/${movie.id}`}>
                    <div className="mb-3 aspect-[2/3] cursor-pointer overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={getImageUrl(movie.poster_path)}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        onError={e => {
                          const target = e.target as HTMLImageElement
                          target.src = '/movie-placeholder.svg'
                        }}
                      />
                    </div>
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
                    className="w-full"
                    variant={
                      watchlistMovies.has(movie.id) ? 'ghost' : 'outline'
                    }
                    size="sm"
                    disabled={
                      addingMovies.has(movie.id) ||
                      watchlistMovies.has(movie.id)
                    }
                  >
                    {addingMovies.has(movie.id) ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        Adding...
                      </>
                    ) : watchlistMovies.has(movie.id) ? (
                      <>Added to Watchlist</>
                    ) : (
                      <>Add to Watchlist</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Infinite scroll loading indicator */}
        {!loading && movies.length > 0 && hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more movies...</span>
              </div>
            )}
          </div>
        )}

        {/* End of results indicator */}
        {!loading && movies.length > 0 && !hasMore && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              You&apos;ve reached the end of the results
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {movies.length} movies found
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !isSearching && movies.length === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {query ? `No movies found for "${query}"` : 'No movies found'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {query
                ? 'Try searching with different keywords'
                : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
