import { NextResponse } from 'next/server'
import { getTopRatedMovies } from '@/lib/tmdb'

export async function GET() {
  try {
    const results = await getTopRatedMovies()
    return NextResponse.json(results)
  } catch (error) {
    console.error('Popular movies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular movies' },
      { status: 500 }
    )
  }
}