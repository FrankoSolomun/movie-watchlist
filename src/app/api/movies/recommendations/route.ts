import { NextRequest, NextResponse } from 'next/server'
import { getTopRatedMovies } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const excludeParam = searchParams.get('exclude')
    const excludeIds = excludeParam ? excludeParam.split(',').map(id => parseInt(id)) : []

    const results = await getTopRatedMovies()
    
    // Filter out movies that are already in the user's watchlist
    const filteredMovies = results.results.filter(movie => !excludeIds.includes(movie.id))
    
    // Limit to 6 recommendations
    const recommendations = filteredMovies.slice(0, 6)
    
    return NextResponse.json({
      results: recommendations,
      total_results: recommendations.length
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}