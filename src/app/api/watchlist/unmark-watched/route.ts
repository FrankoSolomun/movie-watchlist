import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
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
    const { movieId } = body

    // Validate required fields
    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      )
    }

    // Update the watchlist entry to unmark as watched
    await db
      .update(watchlist)
      .set({
        watched: false,
        dateWatched: null,
      })
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, Number(movieId))
        )
      )

    return NextResponse.json(
      { message: 'Movie unmarked as watched successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error unmarking movie as watched:', error)
    return NextResponse.json(
      { error: 'Failed to unmark movie as watched' },
      { status: 500 }
    )
  }
}