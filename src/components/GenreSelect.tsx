"use client"

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { TMDBGenre } from '@/lib/tmdb'

interface GenreSelectProps {
  value?: string
  onValueChange: (value: string) => void
}

export function GenreSelect({ value, onValueChange }: GenreSelectProps) {
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/movies/genres')
        if (response.ok) {
          const data = await response.json()
          setGenres(data.genres)
        }
      } catch (error) {
        console.error('Failed to fetch genres:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGenres()
  }, [])

  const selectedGenre = genres.find(genre => genre.id.toString() === value)
  const displayText = selectedGenre ? selectedGenre.name : "All Genres"

  if (loading) {
    return (
      <Button variant="outline" className="w-[180px] justify-between" disabled>
        <span>Loading genres...</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between">
          <span>{displayText}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[180px]">
        <DropdownMenuItem onClick={() => onValueChange("")}>
          All Genres
        </DropdownMenuItem>
        {genres.map((genre) => (
          <DropdownMenuItem 
            key={genre.id} 
            onClick={() => onValueChange(genre.id.toString())}
          >
            {genre.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}