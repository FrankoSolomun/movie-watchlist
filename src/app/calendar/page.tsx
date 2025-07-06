'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, Check, Clock, X } from 'lucide-react'
import { toast } from 'sonner'

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

export default function CalendarPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const highlightDateParam = searchParams.get('highlightDate')

  // Initialize selected date from URL parameter or default to today
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const paramToUse = highlightDateParam || dateParam
    if (paramToUse) {
      const date = new Date(paramToUse + 'T00:00:00')
      return isNaN(date.getTime()) ? new Date() : date
    }
    return new Date()
  })
  const [movies, setMovies] = useState<WatchlistMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [markingWatched, setMarkingWatched] = useState<Set<number>>(new Set())
  const [unmarkingWatched, setUnmarkingWatched] = useState<Set<number>>(
    new Set()
  )
  const [watchedDates, setWatchedDates] = useState<Set<string>>(new Set())
  const [selectedDateMovies, setSelectedDateMovies] = useState<
    WatchlistMovie[]
  >([])
  const [filter, setFilter] = useState<
    'all' | 'toWatch' | 'upcoming' | 'watched'
  >('all')
  const [plannedWatchDates, setPlannedWatchDates] = useState<Map<number, Date>>(
    new Map()
  )

  const formatSelectedDate = (date: Date | undefined) => {
    if (!date) return 'No date selected'
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Helper function to normalize dates for comparison (YYYY-MM-DD format) using local time
  const formatDateForComparison = (date: Date) => {
    // Use toLocaleDateString with en-CA format to get YYYY-MM-DD in local time
    return date.toLocaleDateString('en-CA')
  }

  // Get watched movies for the selected date
  const getWatchedMoviesForDate = useCallback(
    (date: Date | undefined) => {
      if (!date) return []
      const dateStr = formatDateForComparison(date)
      return movies.filter(movie => {
        if (!movie.watched || !movie.dateWatched) return false
        const watchedDateStr = formatDateForComparison(
          new Date(movie.dateWatched!)
        )
        return watchedDateStr === dateStr
      })
    },
    [movies]
  )

  // Update watched dates set when movies change
  const updateWatchedDates = useCallback((movieList: WatchlistMovie[]) => {
    const dates = new Set<string>()
    movieList.forEach(movie => {
      if (movie.watched && movie.dateWatched) {
        const dateStr = formatDateForComparison(new Date(movie.dateWatched!))
        dates.add(dateStr)
      }
    })
    setWatchedDates(dates)
  }, [])

  // Update selected date movies when selected date or movies change
  const updateSelectedDateMovies = useCallback(() => {
    const watchedMovies = getWatchedMoviesForDate(selectedDate)
    setSelectedDateMovies(watchedMovies)
  }, [selectedDate, movies, getWatchedMoviesForDate])

  // Navigate to a specific date on the calendar
  const navigateToDate = (date: Date) => {
    setSelectedDate(date)
    // Scroll to calendar area
    setTimeout(() => {
      const calendarElement = document.querySelector('[data-calendar-section]')
      if (calendarElement) {
        calendarElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 100)
  }

  // Get the next upcoming movie (planned for future dates)
  const getUpcomingMovie = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day

    let nextDate: Date | null = null
    let nextMovie: WatchlistMovie | null = null

    // Check planned watch dates
    for (const [movieId, plannedDate] of plannedWatchDates.entries()) {
      if (plannedDate > today) {
        if (!nextDate || plannedDate < nextDate) {
          nextDate = plannedDate
          nextMovie = movies.find(m => m.movieId === movieId) || null
        }
      }
    }

    // Check movies with future watch dates
    movies.forEach(movie => {
      if (movie.watched && movie.dateWatched) {
        const watchedDate = new Date(movie.dateWatched!)
        watchedDate.setHours(0, 0, 0, 0)
        if (watchedDate > today) {
          if (!nextDate || watchedDate < nextDate) {
            nextDate = watchedDate
            nextMovie = movie
          }
        }
      }
    })

    return nextMovie && nextDate ? { movie: nextMovie, date: nextDate } : null
  }

  // Fetch user's watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/watchlist')
        if (!response.ok) return

        const data = await response.json()
        setMovies(data.movies)
        updateWatchedDates(data.movies)

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
      } catch (error) {
        console.error('Failed to fetch watchlist:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [session, updateWatchedDates])

  // Update selected date movies when selectedDate or movies change
  useEffect(() => {
    updateSelectedDateMovies()
  }, [updateSelectedDateMovies])

  // Handle highlight date from URL params
  useEffect(() => {
    const highlightDate = highlightDateParam || dateParam
    if (highlightDate && session) {
      const date = new Date(highlightDate + 'T00:00:00')
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        // Scroll to calendar area
        setTimeout(() => {
          const calendarElement = document.querySelector(
            '[data-calendar-section]'
          )
          if (calendarElement) {
            calendarElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
          }
        }, 100)
      }
    }
  }, [highlightDateParam, dateParam, session])

  // Mark movie as watched or schedule for future date
  const handleMarkAsWatched = async (movie: WatchlistMovie) => {
    if (!selectedDate) {
      toast.error('Please select a date first')
      return
    }

    if (markingWatched.has(movie.movieId)) {
      return
    }

    setMarkingWatched(prev => new Set(prev).add(movie.movieId))

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDateTime = new Date(selectedDate)
      selectedDateTime.setHours(0, 0, 0, 0)

      const isFutureDate = selectedDateTime > today

      // Use different API endpoints for watched vs scheduled
      const apiEndpoint = isFutureDate
        ? '/api/watchlist/schedule'
        : '/api/watchlist/mark-watched'
      const bodyKey = isFutureDate ? 'scheduledDate' : 'watchedDate'

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.movieId,
          [bodyKey]: selectedDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error ||
            `Failed to ${isFutureDate ? 'schedule' : 'mark'} movie`
        )
      }

      // Update local state
      const updatedMovies = movies.map(m =>
        m.movieId === movie.movieId
          ? { ...m, watched: true, dateWatched: selectedDate.getTime() }
          : m
      )
      setMovies(updatedMovies)
      updateWatchedDates(updatedMovies)

      const actionText = isFutureDate ? 'scheduled for' : 'marked as watched on'
      toast.success(
        `"${movie.title}" ${actionText} ${formatSelectedDate(selectedDate)}`
      )
    } catch (error) {
      console.error('Error updating movie:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update movie'
      )
    } finally {
      setMarkingWatched(prev => {
        const newSet = new Set(prev)
        newSet.delete(movie.movieId)
        return newSet
      })
    }
  }

  // Unmark movie as watched (remove from specific date)
  const handleUnmarkAsWatched = async (movie: WatchlistMovie) => {
    if (unmarkingWatched.has(movie.movieId)) {
      return
    }

    setUnmarkingWatched(prev => new Set(prev).add(movie.movieId))

    try {
      const response = await fetch('/api/watchlist/unmark-watched', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.movieId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unmark movie as watched')
      }

      // Update local state
      const updatedMovies = movies.map(m =>
        m.movieId === movie.movieId
          ? { ...m, watched: false, dateWatched: null }
          : m
      )
      setMovies(updatedMovies)
      updateWatchedDates(updatedMovies)

      toast.success(`"${movie.title}" removed from watched movies`)
    } catch (error) {
      console.error('Error unmarking as watched:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to unmark movie as watched'
      )
    } finally {
      setUnmarkingWatched(prev => {
        const newSet = new Set(prev)
        newSet.delete(movie.movieId)
        return newSet
      })
    }
  }

  return (
    <div className="container mx-auto py-4 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-[1920px]">
        <div className="mb-4 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            Watch Calendar
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track when you watched your movies
          </p>
        </div>

        {/* Upcoming Movie Section */}
        {(() => {
          const upcoming = getUpcomingMovie()

          if (!upcoming) {
            return (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming movies planned. Select a future date and mark
                      a movie as planned to see it here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          }

          const daysUntil = Math.ceil(
            (upcoming.date.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )

          return (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-center gap-4 px-6">
                <div className="flex-1 text-left">
                  <h2 className="mb-1 text-lg font-bold text-blue-900 sm:text-xl">
                    Upcoming Movie on Your Watch Calendar
                  </h2>
                  <p className="mb-1 text-base font-semibold text-blue-800 sm:text-lg">
                    {upcoming.movie.title}
                  </p>
                  <p className="text-sm text-blue-700">
                    Planned for{' '}
                    {upcoming.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    {daysUntil === 1
                      ? 'Tomorrow!'
                      : `${daysUntil} days from now`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href={`/movies/${upcoming.movie.movieId}`}
                    className="block transition-opacity hover:opacity-80"
                  >
                    <img
                      src={upcoming.movie.posterUrl || '/movie-placeholder.svg'}
                      alt={upcoming.movie.title}
                      className="max-w-24 rounded-md object-cover shadow-md"
                    />
                  </Link>
                </div>
              </div>
            </Card>
          )
        })()}

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                  Movie Calendar
                </CardTitle>
              </CardHeader>
              <CardContent
                className="flex justify-center overflow-hidden p-2 sm:p-6"
                data-calendar-section
              >
                {/* Mobile/Tablet Calendar - Single Month */}
                <div className="xl:hidden">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    numberOfMonths={1}
                    className="w-full rounded-md border text-sm shadow-md sm:text-lg"
                    modifiers={{
                      watched: Array.from(watchedDates)
                        .filter(dateStr => {
                          // Exclude the selected date from watched modifier if it's selected
                          if (!selectedDate) return true
                          return (
                            dateStr !== formatDateForComparison(selectedDate)
                          )
                        })
                        .map(dateStr => {
                          // Create date in local time to avoid timezone issues
                          const [year, month, day] = dateStr
                            .split('-')
                            .map(Number)
                          return new Date(year, month - 1, day) // month is 0-indexed
                        }),
                      selectedAndWatched:
                        selectedDate &&
                        watchedDates.has(formatDateForComparison(selectedDate))
                          ? [selectedDate]
                          : [],
                      selectedOnly:
                        selectedDate &&
                        !watchedDates.has(formatDateForComparison(selectedDate))
                          ? [selectedDate]
                          : [],
                    }}
                    modifiersClassNames={{
                      watched:
                        'bg-blue-100 text-blue-900 hover:bg-blue-200 font-semibold relative rounded-md after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full',
                      selectedAndWatched:
                        'bg-blue-800 text-white hover:bg-blue-900 focus:bg-blue-900 font-semibold relative rounded-md after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full',
                    }}
                    classNames={{
                      months:
                        'flex flex-col  space-y-4 sm:space-x-4 sm:space-y-0',
                      month: 'space-y-2 sm:space-y-4',
                      caption:
                        'flex justify-between pt-1 items-center text-lg sm:text-xl font-semibold w-full',
                      caption_label: 'text-lg sm:text-xl font-semibold',
                      nav: 'flex items-center justify-between',
                      nav_button:
                        'h-8 w-8 sm:h-9 sm:w-9 bg-transparent p-0 opacity-50 hover:opacity-100 text-base sm:text-lg',
                      nav_button_previous: '',
                      nav_button_next: '',
                      table: 'w-full border-collapse space-y-1',
                      head_row: 'flex justify-center',
                      head_cell:
                        'text-muted-foreground rounded-md w-8 h-8 sm:w-12 sm:h-12 font-semibold text-xs sm:text-base flex items-center justify-center',
                      row: 'flex w-full mt-1 sm:mt-2',
                      cell: 'h-10 w-10 sm:h-12 sm:w-12 text-center text-xs sm:text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                      day: 'h-10 w-10 sm:h-12 sm:w-12 p-0 font-normal text-xs sm:text-base hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground aria-selected:opacity-100 rounded-md',
                      day_range_end: 'day-range-end',
                      day_today:
                        'bg-accent text-accent-foreground font-semibold rounded-md',
                      day_outside:
                        'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                      day_disabled: 'text-muted-foreground opacity-50',
                      day_range_middle:
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      day_hidden: 'invisible',
                    }}
                  />
                </div>

                {/* Desktop Calendar - Dual Month */}
                <div className="hidden xl:block">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    numberOfMonths={2}
                    className="w-full max-w-[900px] rounded-md border text-lg shadow-md"
                    modifiers={{
                      watched: Array.from(watchedDates)
                        .filter(dateStr => {
                          // Exclude the selected date from watched modifier if it's selected
                          if (!selectedDate) return true
                          return (
                            dateStr !== formatDateForComparison(selectedDate)
                          )
                        })
                        .map(dateStr => {
                          // Create date in local time to avoid timezone issues
                          const [year, month, day] = dateStr
                            .split('-')
                            .map(Number)
                          return new Date(year, month - 1, day) // month is 0-indexed
                        }),
                      selectedAndWatched:
                        selectedDate &&
                        watchedDates.has(formatDateForComparison(selectedDate))
                          ? [selectedDate]
                          : [],
                      selectedOnly:
                        selectedDate &&
                        !watchedDates.has(formatDateForComparison(selectedDate))
                          ? [selectedDate]
                          : [],
                    }}
                    modifiersClassNames={{
                      watched:
                        'bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 font-semibold relative after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full',
                    }}
                    classNames={{
                      month: 'space-y-4',
                      caption_label: 'text-xl font-semibold text-center',
                      day: 'h-12 w-12 p-0 font-normal text-base hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground aria-selected:opacity-100 rounded-md',
                      day_today:
                        'bg-accent text-accent-foreground font-semibold rounded-md',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unwatched Movies List */}
          <div className="space-y-4 lg:space-y-6">
            <Card className="h-fit">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Movies to Watch
                </CardTitle>
                <p className="mb-1 text-xs text-muted-foreground">
                  Add movie to{' '}
                  {selectedDate
                    ? formatSelectedDate(selectedDate)
                    : 'selected date'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    movies.filter(
                      movie =>
                        !movie.watched && !plannedWatchDates.has(movie.movieId)
                    ).length
                  }{' '}
                  movies available to watch
                </p>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto p-3 sm:p-6">
                {(() => {
                  const unwatchedMovies = movies.filter(
                    movie =>
                      !movie.watched && !plannedWatchDates.has(movie.movieId)
                  )

                  if (loading) {
                    return (
                      <div className="space-y-2 sm:space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 rounded-md border bg-card p-2 sm:space-x-3"
                          >
                            <Skeleton className="h-12 w-10 rounded-sm sm:h-16 sm:w-12" />
                            <div className="min-w-0 flex-1 space-y-1">
                              <Skeleton className="h-3 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                          </div>
                        ))}
                      </div>
                    )
                  }

                  if (unwatchedMovies.length === 0) {
                    return (
                      <div className="p-2 text-center sm:p-4">
                        <Check className="mx-auto mb-2 h-6 w-6 text-green-500 sm:h-8 sm:w-8" />
                        <p className="mb-1 text-xs leading-tight text-muted-foreground sm:text-sm">
                          All movies watched!
                        </p>
                        <p className="text-xs leading-tight text-muted-foreground">
                          Add more movies to your watchlist to continue tracking
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2 sm:space-y-3">
                      {unwatchedMovies.map(movie => (
                        <div
                          key={movie.id}
                          onClick={() => {
                            if (
                              !markingWatched.has(movie.movieId) &&
                              selectedDate
                            ) {
                              handleMarkAsWatched(movie)
                            }
                          }}
                          className={`group flex items-center space-x-2 rounded-md border bg-card p-2 transition-colors sm:space-x-3 ${
                            markingWatched.has(movie.movieId) || !selectedDate
                              ? 'cursor-not-allowed opacity-50'
                              : 'cursor-pointer hover:bg-accent/50'
                          }`}
                        >
                          <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100 sm:h-16 sm:w-12">
                            <img
                              src={movie.posterUrl || '/movie-placeholder.svg'}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-medium leading-tight sm:text-sm">
                              {movie.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {movie.releaseDate
                                ? new Date(movie.releaseDate).getFullYear()
                                : 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="pointer-events-none h-auto flex-shrink-0 px-2 py-1 text-xs"
                            disabled={
                              markingWatched.has(movie.movieId) || !selectedDate
                            }
                          >
                            {markingWatched.has(movie.movieId) ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Date and Movies Watched - Below Calendar */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Selected Date Info */}
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                Selected Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-2 text-center sm:p-4">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                <p className="mb-1 text-sm font-semibold leading-tight sm:mb-2 sm:text-lg">
                  {formatSelectedDate(selectedDate)}
                </p>
                <p className="text-xs leading-tight text-muted-foreground sm:text-sm">
                  {selectedDate
                    ? 'Click a different date to change selection'
                    : 'Select a date from the calendar'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Movies Watched on Selected Date */}
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                Movies Watched
              </CardTitle>
              {selectedDate && selectedDateMovies.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDateMovies.length} movie
                  {selectedDateMovies.length !== 1 ? 's' : ''} watched on{' '}
                  {selectedDate.toLocaleDateString()}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {selectedDateMovies.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {selectedDateMovies.map(movie => (
                    <div
                      key={movie.id}
                      className="group flex items-center space-x-2 rounded-md border bg-card p-2 sm:space-x-3"
                    >
                      <Link
                        href={`/movies/${movie.movieId}`}
                        className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100 transition-opacity hover:opacity-80 sm:h-16 sm:w-12"
                      >
                        <img
                          src={movie.posterUrl || '/movie-placeholder.svg'}
                          alt={movie.title}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-medium leading-tight sm:text-sm">
                          {movie.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {movie.releaseDate
                            ? new Date(movie.releaseDate).getFullYear()
                            : 'N/A'}
                        </p>
                        <p className="text-xs font-medium text-blue-600">
                          Watched{' '}
                          {movie.dateWatched
                            ? new Date(movie.dateWatched!).toLocaleDateString()
                            : ''}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleUnmarkAsWatched(movie)}
                        variant="ghost"
                        size="sm"
                        className="h-auto flex-shrink-0 p-1 text-muted-foreground opacity-100 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                        disabled={unmarkingWatched.has(movie.movieId)}
                        title="Remove from this date"
                      >
                        {unmarkingWatched.has(movie.movieId) ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center sm:p-4">
                  <CalendarDays className="mx-auto mb-2 h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                  <p className="mb-1 text-xs leading-tight text-muted-foreground sm:text-sm">
                    {selectedDate
                      ? 'No movies watched on this date'
                      : 'Select a date to see watched movies'}
                  </p>
                  {selectedDate && watchedDates.size > 0 && (
                    <p className="text-xs leading-tight text-muted-foreground">
                      Try selecting a highlighted date (blue background) to see
                      watched movies
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Watchlist Section */}
        {session &&
          (() => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const unwatchedMovies = movies.filter(
              movie => !movie.watched && !plannedWatchDates.has(movie.movieId)
            )
            const upcomingMovies = movies.filter(movie => {
              if (plannedWatchDates.has(movie.movieId)) return true
              if (movie.watched && movie.dateWatched) {
                const watchedDate = new Date(movie.dateWatched!)
                watchedDate.setHours(0, 0, 0, 0)
                return watchedDate > today
              }
              return false
            })
            const watchedMovies = movies.filter(movie => {
              if (!movie.watched || !movie.dateWatched) return false
              const watchedDate = new Date(movie.dateWatched!)
              watchedDate.setHours(0, 0, 0, 0)
              return watchedDate <= today
            })

            const filteredMovies = (() => {
              if (filter === 'toWatch') return unwatchedMovies
              if (filter === 'upcoming') return upcomingMovies
              if (filter === 'watched') return watchedMovies
              return movies
            })()

            return (
              <div className="mt-6 space-y-4 sm:mt-12 sm:space-y-6">
                {/* Filter Toggle */}
                <div className="flex justify-center px-2">
                  {/* Desktop Filter Buttons */}
                  <div className="hidden gap-2 rounded-lg bg-muted p-1 sm:flex">
                    <Button
                      variant={filter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="px-4 text-sm"
                    >
                      All ({movies.length})
                    </Button>
                    <Button
                      variant={filter === 'toWatch' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('toWatch')}
                      className="px-4 text-sm"
                    >
                      To Watch ({unwatchedMovies.length})
                    </Button>
                    <Button
                      variant={filter === 'upcoming' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('upcoming')}
                      className="px-4 text-sm"
                    >
                      Upcoming ({upcomingMovies.length})
                    </Button>
                    <Button
                      variant={filter === 'watched' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('watched')}
                      className="px-4 text-sm"
                    >
                      Watched ({watchedMovies.length})
                    </Button>
                  </div>

                  {/* Mobile Filter Dropdown */}
                  <div className="w-full sm:hidden">
                    <select
                      value={filter}
                      onChange={e =>
                        setFilter(
                          e.target.value as
                            | 'all'
                            | 'toWatch'
                            | 'upcoming'
                            | 'watched'
                        )
                      }
                      className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="all">All ({movies.length})</option>
                      <option value="toWatch">
                        To Watch ({unwatchedMovies.length})
                      </option>
                      <option value="upcoming">
                        Upcoming ({upcomingMovies.length})
                      </option>
                      <option value="watched">
                        Watched ({watchedMovies.length})
                      </option>
                    </select>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base leading-tight sm:text-lg">
                      {filter === 'all'
                        ? 'Your Watchlist - Mark Movies as Watched'
                        : filter === 'toWatch'
                          ? 'Movies To Mark as Watched'
                          : filter === 'upcoming'
                            ? 'Upcoming Movies'
                            : 'Already Watched Movies'}
                    </CardTitle>
                    <p className="text-xs leading-tight text-muted-foreground sm:text-sm">
                      {filter === 'all'
                        ? 'Select a date above, then click "Mark as Watched" to record when you watched each movie'
                        : filter === 'toWatch'
                          ? 'Select a date above, then click "Mark as Watched" to record when you watched each movie'
                          : filter === 'upcoming'
                            ? 'Movies scheduled for future dates - click to view or modify dates'
                            : "Movies you've already marked as watched on various dates"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                          <Card key={index} className="flex flex-col">
                            <CardContent className="p-4">
                              <Skeleton className="mb-3 aspect-[2/3] rounded-md" />
                              <Skeleton className="mb-2 h-4 w-3/4" />
                              <Skeleton className="h-8 w-full" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : filteredMovies.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {filteredMovies.map(movie => (
                          <Card
                            key={movie.id}
                            className="flex flex-col transition-shadow hover:shadow-lg"
                          >
                            <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
                              <Link
                                href={`/movies/${movie.movieId}`}
                                className="mb-3 aspect-[2/3] overflow-hidden rounded-md bg-gray-100 transition-opacity hover:opacity-80 sm:mb-3"
                              >
                                <img
                                  src={movie.posterUrl || '/movie-placeholder.svg'}
                                  alt={movie.title}
                                  className="h-full w-full object-cover"
                                />
                              </Link>
                              <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-semibold leading-tight sm:mb-2 sm:text-sm">
                                {movie.title}
                              </h3>
                              <p className="mb-3 text-sm text-muted-foreground sm:mb-3 sm:text-xs">
                                {movie.releaseDate
                                  ? new Date(movie.releaseDate).getFullYear()
                                  : 'N/A'}
                              </p>

                              {(() => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0) // Reset time to start of day

                                // Check if movie has a watched date
                                if (movie.watched && movie.dateWatched) {
                                  const watchedDate = new Date(
                                    movie.dateWatched
                                  )
                                  watchedDate.setHours(0, 0, 0, 0)

                                  // If the watched date is in the future, treat it as "upcoming"
                                  if (watchedDate > today) {
                                    return (
                                      <Button
                                        onClick={() =>
                                          navigateToDate(
                                            new Date(movie.dateWatched!)
                                          )
                                        }
                                        className="h-auto min-h-[36px] w-full whitespace-normal border-blue-200 bg-blue-100 px-3 py-2 text-center text-blue-800 hover:bg-blue-200 sm:min-h-[32px] sm:px-3 sm:py-2"
                                        variant="outline"
                                        size="sm"
                                      >
                                        <div className="flex flex-wrap items-center justify-center gap-1">
                                          <CalendarDays className="h-4 w-4 flex-shrink-0 sm:h-3 sm:w-3" />
                                          <span className="text-sm leading-tight sm:text-xs">
                                            Upcoming{' '}
                                            {new Date(
                                              movie.dateWatched
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </Button>
                                    )
                                  } else {
                                    // Actually watched (past date)
                                    return (
                                      <Button
                                        onClick={() =>
                                          navigateToDate(
                                            new Date(movie.dateWatched!)
                                          )
                                        }
                                        className="h-auto min-h-[36px] w-full whitespace-normal px-3 py-2 text-center sm:min-h-[32px] sm:px-3 sm:py-2"
                                        variant="default"
                                        size="sm"
                                      >
                                        <div className="flex flex-wrap items-center justify-center gap-1">
                                          <Check className="h-4 w-4 flex-shrink-0 sm:h-3 sm:w-3" />
                                          <span className="text-sm leading-tight sm:text-xs">
                                            Watched{' '}
                                            {new Date(
                                              movie.dateWatched
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </Button>
                                    )
                                  }
                                }

                                // Check if movie has a planned watch date (from plannedWatchDates map)
                                const plannedDate = plannedWatchDates.get(
                                  movie.movieId
                                )
                                if (plannedDate) {
                                  return (
                                    <Button
                                      onClick={() =>
                                        navigateToDate(plannedDate)
                                      }
                                      className="h-auto min-h-[36px] w-full whitespace-normal border-blue-200 bg-blue-100 px-3 py-2 text-center text-blue-800 hover:bg-blue-200 sm:min-h-[32px] sm:px-3 sm:py-2"
                                      variant="outline"
                                      size="sm"
                                    >
                                      <div className="flex flex-wrap items-center justify-center gap-1">
                                        <CalendarDays className="h-4 w-4 flex-shrink-0 sm:h-3 sm:w-3" />
                                        <span className="text-sm leading-tight sm:text-xs">
                                          Upcoming{' '}
                                          {plannedDate.toLocaleDateString()}
                                        </span>
                                      </div>
                                    </Button>
                                  )
                                }

                                // Default state - mark as watched on selected date
                                const isSelectedDateFuture =
                                  selectedDate && selectedDate > today

                                return (
                                  <Button
                                    onClick={() => handleMarkAsWatched(movie)}
                                    className="h-auto min-h-[36px] w-full whitespace-normal px-3 py-2 text-center sm:min-h-[32px] sm:px-3 sm:py-2"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      markingWatched.has(movie.movieId) ||
                                      !selectedDate
                                    }
                                  >
                                    {markingWatched.has(movie.movieId) ? (
                                      <div className="flex flex-wrap items-center justify-center gap-1">
                                        <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 sm:h-3 sm:w-3"></div>
                                        <span className="text-sm leading-tight sm:text-xs">
                                          {isSelectedDateFuture
                                            ? 'Scheduling...'
                                            : 'Marking...'}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap items-center justify-center gap-1">
                                        <Clock className="h-4 w-4 flex-shrink-0 sm:h-3 sm:w-3" />
                                        <span className="text-sm leading-tight sm:text-xs">
                                          {selectedDate
                                            ? isSelectedDateFuture
                                              ? `Schedule ${selectedDate.toLocaleDateString()}`
                                              : `Mark Watched ${selectedDate.toLocaleDateString()}`
                                            : 'Select Date'}
                                        </span>
                                      </div>
                                    )}
                                  </Button>
                                )
                              })()}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : movies.length === 0 ? (
                      <div className="py-12 text-center">
                        <CalendarDays className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                          No movies in watchlist
                        </h3>
                        <p className="mb-4 text-muted-foreground">
                          Add movies to your watchlist from the search page to
                          mark them as watched here
                        </p>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        {filter === 'toWatch' ? (
                          <>
                            <Check className="mx-auto mb-4 h-16 w-16 text-green-500" />
                            <h3 className="mb-2 text-lg font-semibold">
                              All movies scheduled or watched!
                            </h3>
                            <p className="mb-4 text-muted-foreground">
                              You&apos;ve scheduled or watched all your movies.
                              Add more movies to your watchlist to continue
                              tracking.
                            </p>
                          </>
                        ) : filter === 'upcoming' ? (
                          <>
                            <CalendarDays className="mx-auto mb-4 h-16 w-16 text-blue-500" />
                            <h3 className="mb-2 text-lg font-semibold">
                              No upcoming movies
                            </h3>
                            <p className="mb-4 text-muted-foreground">
                              Schedule movies for future dates by selecting a
                              future date and marking movies.
                            </p>
                          </>
                        ) : (
                          <>
                            <Clock className="mx-auto mb-4 h-16 w-16 text-orange-500" />
                            <h3 className="mb-2 text-lg font-semibold">
                              No watched movies yet
                            </h3>
                            <p className="mb-4 text-muted-foreground">
                              Select a date and mark movies as watched to see
                              them here.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })()}
      </div>
    </div>
  )
}
