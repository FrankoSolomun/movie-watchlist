import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { watchlist } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user's watchlist movies
    const userWatchlist = await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, session.user.id))
      .orderBy(desc(watchlist.createdAt))

    // Convert Date objects to timestamps for frontend compatibility
    const moviesWithTimestamps = userWatchlist.map(movie => ({
      ...movie,
      dateWatched: movie.dateWatched ? movie.dateWatched.getTime() : null,
      createdAt: movie.createdAt.getTime()
    }))

    return NextResponse.json({ movies: moviesWithTimestamps })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}