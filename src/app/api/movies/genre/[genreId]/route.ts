import { NextRequest, NextResponse } from 'next/server'
import { getMoviesByGenre } from '@/lib/tmdb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ genreId: string }> }
) {
  try {
    const { genreId: genreIdString } = await params
    const genreId = parseInt(genreIdString)
    
    if (isNaN(genreId)) {
      return NextResponse.json(
        { error: 'Invalid genre ID' },
        { status: 400 }
      )
    }

    const results = await getMoviesByGenre(genreId)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Genre movies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movies by genre' },
      { status: 500 }
    )
  }
}