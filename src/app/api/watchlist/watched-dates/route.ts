import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { watchlist } from '@/lib/schema'
import { eq, and, isNotNull } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch all watched movies with dates
    const watchedMovies = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.watched, true),
          isNotNull(watchlist.dateWatched)
        )
      )

    // Extract unique dates in YYYY-MM-DD format
    const watchedDates = new Set<string>()
    
    watchedMovies.forEach(movie => {
      if (movie.dateWatched) {
        const date = new Date(typeof movie.dateWatched === 'number' ? movie.dateWatched : movie.dateWatched)
        const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD format
        watchedDates.add(dateStr)
      }
    })

    return NextResponse.json({
      dates: Array.from(watchedDates)
    })
  } catch (error) {
    console.error('Error fetching watched dates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watched dates' },
      { status: 500 }
    )
  }
}