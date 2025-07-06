import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { watchlist } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(request: NextRequest) {
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

    // Delete movie from user's watchlist
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.movieId, Number(movieId))
        )
      )

    return NextResponse.json(
      { message: 'Movie removed from watchlist successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove movie from watchlist' },
      { status: 500 }
    )
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return DELETE(request)
}