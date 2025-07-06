import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { watchlist } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { movieId, scheduledDate } = await request.json()

    if (!movieId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Movie ID and scheduled date are required' },
        { status: 400 }
      )
    }

    // Parse the scheduled date to ensure it's valid
    const scheduledDateTime = new Date(scheduledDate)
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Check if the movie exists in user's watchlist
    const existingMovie = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, movieId)
        )
      )
      .limit(1)

    if (existingMovie.length === 0) {
      return NextResponse.json(
        { error: 'Movie not found in watchlist' },
        { status: 404 }
      )
    }

    // Update the movie with the scheduled date
    // We use dateWatched for both actual watched dates and scheduled dates
    // Frontend logic distinguishes between them based on whether the date is in the future
    await db
      .update(watchlist)
      .set({
        watched: true, // Set to true to indicate it has a date (even if future)
        dateWatched: scheduledDateTime, // Use Date object directly, not getTime()
      })
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, movieId)
        )
      )

    return NextResponse.json({
      success: true,
      message: 'Movie scheduled successfully',
      scheduledDate: scheduledDateTime.toISOString(),
    })
  } catch (error) {
    console.error('Error scheduling movie:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
