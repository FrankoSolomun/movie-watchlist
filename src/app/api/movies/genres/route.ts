import { NextResponse } from 'next/server'
import { getGenres } from '@/lib/tmdb'

export async function GET() {
  try {
    const genres = await getGenres()
    return NextResponse.json(genres)
  } catch (error) {
    console.error('Failed to fetch genres:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    )
  }
}