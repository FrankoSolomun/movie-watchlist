import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { comments, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

// PUT /api/comments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
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

    // Check if comment exists and belongs to the user
    const existingComment = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, params.id), eq(comments.userId, session.user.id)))
      .limit(1)

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found or not authorized' },
        { status: 404 }
      )
    }

    // Update the comment
    await db
      .update(comments)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, params.id))

    // Fetch the updated comment with user info
    const updatedComment = await db
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
      .where(eq(comments.id, params.id))
      .limit(1)

    return NextResponse.json({ comment: updatedComment[0] })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if comment exists and belongs to the user
    const existingComment = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, params.id), eq(comments.userId, session.user.id)))
      .limit(1)

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found or not authorized' },
        { status: 404 }
      )
    }

    // Delete the comment
    await db.delete(comments).where(eq(comments.id, params.id))

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}