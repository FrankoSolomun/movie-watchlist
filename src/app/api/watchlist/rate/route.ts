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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { movieId, rating } = await request.json()

    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      )
    }

    if (
      rating !== null &&
      (rating < 1 || rating > 5 || !Number.isInteger(rating))
    ) {
      return NextResponse.json(
        {
          error:
            'Rating must be an integer between 1 and 5, or null to remove rating',
        },
        { status: 400 }
      )
    }

    // Check if movie exists in user's watchlist and is watched
    const existingEntry = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, movieId),
          eq(watchlist.watched, true)
        )
      )
      .limit(1)

    if (existingEntry.length === 0) {
      return NextResponse.json(
        { error: 'Movie not found in watchlist or not marked as watched' },
        { status: 404 }
      )
    }

    // Update the rating
    await db
      .update(watchlist)
      .set({ rating })
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, movieId)
        )
      )

    return NextResponse.json(
      { message: 'Rating updated successfully', rating },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating rating:', error)
    return NextResponse.json(
      { error: 'Failed to update rating' },
      { status: 500 }
    )
  }
}
