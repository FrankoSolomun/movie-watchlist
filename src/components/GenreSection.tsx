'use client'

import Link from 'next/link'
import { TMDBMovie, getImageUrl } from '@/lib/tmdb'
import { Card, CardContent } from '@/components/ui/card'

interface GenreSectionProps {
  title: string
  movies: TMDBMovie[]
}

export function GenreSection({ title, movies }: GenreSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {movies.slice(0, 8).map(movie => (
          <Link key={movie.id} href={`/movies/${movie.id}`}>
            <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    src={getImageUrl(movie.poster_path, 'w342')}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="p-2 text-center text-white">
                      <p className="text-sm font-medium">
                        ★ {movie.vote_average.toFixed(1)} TMDB
                      </p>
                    </div>
                  </div>
                  {/* Always visible rating badge */}
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-xs font-medium text-white">
                    <span className="text-yellow-400">★</span>
                    {movie.vote_average.toFixed(1)}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
