import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { watchlist } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { movieId, watchedDate } = body

    // Validate required fields
    if (!movieId || !watchedDate) {
      return NextResponse.json(
        { error: 'Movie ID and watched date are required' },
        { status: 400 }
      )
    }

    // Update the watchlist entry to mark as watched with date
    await db
      .update(watchlist)
      .set({
        watched: true,
        dateWatched: new Date(watchedDate),
      })
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, Number(movieId))
        )
      )

    return NextResponse.json(
      { message: 'Movie marked as watched successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error marking movie as watched:', error)
    return NextResponse.json(
      { error: 'Failed to mark movie as watched' },
      { status: 500 }
    )
  }
}
