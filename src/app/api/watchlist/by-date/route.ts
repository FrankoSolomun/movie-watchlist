import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { watchlist } from '@/lib/schema'
import { eq, and, isNotNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Parse the date and get start/end of day in milliseconds
    const targetDate = new Date(date)
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    ).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1

    // Fetch movies watched on the specific date
    const movies = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.watched, true),
          isNotNull(watchlist.dateWatched)
        )
      )

    // Filter by date in JavaScript since we need date range comparison
    const moviesOnDate = movies.filter(movie => {
      if (!movie.dateWatched) return false
      const watchedTime =
        typeof movie.dateWatched === 'number'
          ? movie.dateWatched
          : new Date(movie.dateWatched).getTime()
      return watchedTime >= startOfDay && watchedTime <= endOfDay
    })

    return NextResponse.json({
      movies: moviesOnDate,
      date: date,
    })
  } catch (error) {
    console.error('Error fetching movies by date:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies for date' },
      { status: 500 }
    )
  }
}
