export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number | null
  budget: number
  revenue: number
  genres: TMDBGenre[]
  production_companies: ProductionCompany[]
  backdrop_path: string | null
  tagline: string
  status: string
  original_language: string
}

export interface ProductionCompany {
  id: number
  name: string
  logo_path: string | null
}

export interface TMDBSearchResponse {
  results: TMDBMovie[]
  total_pages: number
  total_results: number
  page: number
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[]
}

export async function searchMovies(query: string, page: number = 1, genreId?: number): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB API key not configured')
  }

  let url: string
  if (query.trim()) {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
    if (genreId) {
      url += `&with_genres=${genreId}`
    }
  } else if (genreId) {
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
  } else {
    url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}`
  }
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

export async function getPopularMovies(): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB API key not configured')
  }

  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

let debounceTimer: NodeJS.Timeout | null = null

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => func(...args), delay)
  }
}

export async function getMoviesByGenre(genreId: number): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB API key not configured')
  }

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&page=1`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

export async function getTopRatedMovies(): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB API key not configured')
  }

  const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&page=1`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

export async function getGenres(): Promise<TMDBGenresResponse> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB API key not configured')
  }

  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  const apiKey = process.env.TMDB_API_KEY
  
  if (!apiKey) {
    throw new Error('TMDB API key not configured')
  }

  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  return response.json()
}

// TMDB Genre IDs
export const GENRE_IDS = {
  horror: 27,
  comedy: 35,
  romance: 10749,
  drama: 18,
  sciFi: 878,
  action: 28,
  family: 10751
} as const

export function getImageUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '/movie-placeholder.svg'
  return `https://image.tmdb.org/t/p/${size}${path}`
}