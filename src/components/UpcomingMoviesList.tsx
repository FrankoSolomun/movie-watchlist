"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface UpcomingMovie {
  movie: WatchlistMovie
  scheduledDate: Date
  isPlanned: boolean // true if from plannedWatchDates, false if from future dateWatched
}

export function UpcomingMoviesList() {
  const { data: session } = useSession()
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUpcomingMovies = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/watchlist')
        if (!response.ok) return

        const data = await response.json()
        const movies: WatchlistMovie[] = data.movies

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const upcoming: UpcomingMovie[] = []

        // Extract planned/scheduled movies from database
        // Movies with future dates in dateWatched are considered scheduled

        // Add movies with future watch dates (scheduled movies)
        movies.forEach(movie => {
          if (movie.watched && movie.dateWatched) {
            const watchedDate = new Date(movie.dateWatched!)
            watchedDate.setHours(0, 0, 0, 0)
            if (watchedDate > today) {
              upcoming.push({
                movie,
                scheduledDate: watchedDate,
                isPlanned: true // All future dates are now considered planned/scheduled
              })
            }
          }
        })

        // Sort by date (earliest first)
        upcoming.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())

        setUpcomingMovies(upcoming)
      } catch (error) {
        console.error('Failed to fetch upcoming movies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingMovies()
  }, [session])

  const navigateToCalendar = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD format
    window.location.href = `/calendar?highlightDate=${dateStr}`
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 7) {
        return `${daysDiff} days`
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  if (!session) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          Upcoming Movies on your list
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          // Loading skeletons
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Skeleton className="w-10 h-14 rounded-sm" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : upcomingMovies.length === 0 ? (
          // Empty state
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No upcoming movies scheduled
            </p>
            <Link href="/calendar">
              <Button variant="link" size="sm" className="mt-1">
                Schedule movies
              </Button>
            </Link>
          </div>
        ) : (
          // Upcoming movies list
          upcomingMovies.slice(0, 5).map(({ movie, scheduledDate }) => (
            <div
              key={`${movie.movieId}-${scheduledDate.getTime()}`}
              onClick={() => navigateToCalendar(scheduledDate)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-14 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100">
                <img
                  src={movie.posterUrl || '/movie-placeholder.svg'}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium leading-tight truncate">
                  {movie.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {movie.releaseDate 
                    ? new Date(movie.releaseDate).getFullYear() 
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {formatDate(scheduledDate)}
                </span>
              </div>
            </div>
          ))
        )}
        
        {upcomingMovies.length > 5 && (
          <div className="pt-2 border-t">
            <Link href="/calendar?filter=upcoming">
              <Button variant="link" size="sm" className="w-full">
                View all {upcomingMovies.length} upcoming movies
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}