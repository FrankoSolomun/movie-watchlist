'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getImageUrl } from '@/lib/tmdb'

interface WatchedMovie {
  id: string
  movieId: number
  title: string
  posterUrl: string | null
  releaseDate: string | null
  dateWatched: number | null
}

export function MiniCalendarPreview() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [moviesOnDate, setMoviesOnDate] = useState<WatchedMovie[]>([])
  const [watchedDates, setWatchedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  // Generate calendar grid
  const calendarDays = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Fetch watched dates when component mounts or session changes
  useEffect(() => {
    const fetchWatchedDates = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/watchlist/watched-dates')
        if (response.ok) {
          const data = await response.json()
          setWatchedDates(new Set(data.dates))
        }
      } catch (error) {
        console.error('Failed to fetch watched dates:', error)
      }
    }

    fetchWatchedDates()
  }, [session])

  const formatDateForComparison = (date: Date) => {
    return date.toLocaleDateString('en-CA') // YYYY-MM-DD format
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    )
  }

  const isWatched = (day: number | null) => {
    if (!day) return false
    const date = new Date(year, month, day)
    return watchedDates.has(formatDateForComparison(date))
  }

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    )
  }

  const handleDateClick = async (day: number | null) => {
    if (!day || !session) return

    const clickedDate = new Date(year, month, day)
    setSelectedDate(clickedDate)

    // Fetch movies for this date
    setLoading(true)
    try {
      const dateStr = formatDateForComparison(clickedDate)
      const response = await fetch(`/api/watchlist/by-date?date=${dateStr}`)
      if (response.ok) {
        const data = await response.json()
        setMoviesOnDate(data.movies)
      }
    } catch (error) {
      console.error('Failed to fetch movies for date:', error)
      setMoviesOnDate([])
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Watch Calendar
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-center text-sm font-medium">
            {monthNames[month]} {year}
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="py-1 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium transition-colors ${day ? 'cursor-pointer hover:bg-accent' : ''} ${isSelected(day) && isWatched(day) ? 'bg-blue-800 font-semibold text-white' : ''} ${isSelected(day) && !isWatched(day) ? 'bg-primary font-semibold text-primary-foreground' : ''} ${!isSelected(day) && isWatched(day) ? 'bg-blue-100 font-semibold text-blue-900' : ''} ${isToday(day) && !isSelected(day) ? 'bg-accent font-semibold text-accent-foreground' : ''} ${day && !isToday(day) && !isSelected(day) && !isWatched(day) ? 'text-foreground' : ''} `}
              >
                {day}
                {/* Blue dot for watched dates */}
                {isWatched(day) && !isSelected(day) && (
                  <div className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-blue-600"></div>
                )}
                {/* White dot for selected watched dates */}
                {isSelected(day) && isWatched(day) && (
                  <div className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-white"></div>
                )}
              </div>
            ))}
          </div>

          {/* Selected date movies display */}
          {selectedDate && (
            <div className="mt-4 border-t pt-4">
              {loading ? (
                <div className="text-center text-xs text-muted-foreground">
                  Loading...
                </div>
              ) : moviesOnDate.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    {selectedDate < today ? 'Watched on' : 'Upcoming'}{' '}
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {moviesOnDate.map(movie => (
                    <Link
                      key={movie.id}
                      href={`/calendar?highlightDate=${formatDateForComparison(selectedDate!)}`}
                    >
                      <div className="flex cursor-pointer items-center space-x-2 rounded-md border bg-card p-2 transition-colors hover:bg-accent">
                        <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100">
                          <img
                            src={movie.posterUrl || getImageUrl(null)}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-medium">
                            {movie.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {movie.releaseDate
                              ? new Date(movie.releaseDate).getFullYear()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                selectedDate && (
                  <p className="text-center text-xs text-muted-foreground">
                    No movies watched on this date
                  </p>
                )
              )}
            </div>
          )}

          <Link
            href={
              selectedDate
                ? `/calendar?highlightDate=${formatDateForComparison(selectedDate)}`
                : '/calendar'
            }
            className="block"
          >
            <Button variant="outline" size="sm" className="mt-3 w-full">
              {selectedDate
                ? 'View Date on Full Calendar'
                : 'Go to Full Calendar'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
