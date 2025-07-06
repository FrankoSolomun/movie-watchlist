import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { comments, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// GET /api/comments?movieId=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      )
    }

    const result = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        userName: users.name,
        userImage: users.image,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.movieId, parseInt(movieId)))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json({ comments: result })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { movieId, content } = await request.json()

    if (!movieId || !content) {
      return NextResponse.json(
        { error: 'Movie ID and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be less than 1000 characters' },
        { status: 400 }
      )
    }

    const commentId = nanoid()
    const now = new Date()

    const insertData = {
      id: commentId,
      userId: session.user.id,
      movieId: parseInt(movieId),
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    }

    try {
      const result = await db.insert(comments).values(insertData)
      console.log('Insert result:', result)
    } catch (insertError) {
      console.error('Insert error details:', insertError)
      throw insertError
    }

    // Return a simplified response first to isolate the issue
    return NextResponse.json(
      {
        comment: {
          id: commentId,
          content: content.trim(),
          createdAt: now.getTime(),
          updatedAt: now.getTime(),
          userId: session.user.id,
          userName: session.user.name,
          userImage: session.user.image,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating comment:', error)
    console.error('Error stack:', (error as Error)?.stack)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
