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
    const { movieId, title, posterUrl, releaseDate } = body

    // Validate required fields
    if (!movieId || !title) {
      return NextResponse.json(
        { error: 'Movie ID and title are required' },
        { status: 400 }
      )
    }

    // Check if movie is already in user's watchlist
    const existingEntry = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, movieId)
        )
      )
      .limit(1)

    if (existingEntry.length > 0) {
      return NextResponse.json(
        { error: 'Movie already in watchlist' },
        { status: 409 }
      )
    }

    // Generate unique ID for watchlist entry
    const watchlistId = `${session.user.id}-${movieId}-${Date.now()}`

    // Add movie to watchlist
    await db.insert(watchlist).values({
      id: watchlistId,
      userId: session.user.id,
      movieId: Number(movieId),
      title,
      posterUrl: posterUrl || null,
      releaseDate: releaseDate || null,
      watched: false,
      createdAt: new Date(),
    })

    return NextResponse.json(
      { message: 'Movie added to watchlist successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to add movie to watchlist' },
      { status: 500 }
    )
  }
}
