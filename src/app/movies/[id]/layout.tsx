import type { Metadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id

  try {
    // Fetch movie details for metadata
    const movie = await fetch(
      `${process.env.TMDB_BASE_URL}/movie/${id}?api_key=${process.env.TMDB_API_KEY}`
    )
      .then(res => res.json())
      .catch(() => null)

    if (movie && !movie.error) {
      return {
        title: `${movie.title} (${new Date(movie.release_date).getFullYear()})`,
        description:
          movie.overview ||
          `Details about ${movie.title}. Add to your watchlist, rate, and track when you watch this movie.`,
        keywords: [
          movie.title,
          'movie details',
          'film information',
          'movie review',
          'watch movie',
          ...(movie.genres?.map((g: { name: string }) => g.name) || []),
        ],
        openGraph: {
          title: `${movie.title} | Movie Watchlist`,
          description: movie.overview || `Details about ${movie.title}`,
          images: movie.poster_path
            ? [
                {
                  url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                  width: 500,
                  height: 750,
                  alt: `${movie.title} poster`,
                },
              ]
            : undefined,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${movie.title} | Movie Watchlist`,
          description: movie.overview || `Details about ${movie.title}`,
          images: movie.poster_path
            ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`]
            : undefined,
        },
      }
    }
  } catch (error) {
    console.error('Error generating movie metadata:', error)
  }

  // Fallback metadata
  return {
    title: 'Movie Details',
    description:
      'View movie details, add to your watchlist, and track your viewing history.',
  }
}

export default function MovieLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
