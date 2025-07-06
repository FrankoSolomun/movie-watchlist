'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number | null
  onRatingChange?: (rating: number | null) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showClearButton?: boolean
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showClearButton = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const handleStarClick = (starRating: number) => {
    if (readonly || !onRatingChange) return
    
    // If clicking the same star that's already selected, clear the rating
    if (rating === starRating) {
      onRatingChange(null)
    } else {
      onRatingChange(starRating)
    }
  }

  const handleClearRating = () => {
    if (readonly || !onRatingChange) return
    onRatingChange(null)
  }

  const displayRating = hoverRating ?? rating ?? 0

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= displayRating
          const isInteractive = !readonly && onRatingChange

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => isInteractive && setHoverRating(star)}
              onMouseLeave={() => isInteractive && setHoverRating(null)}
              disabled={readonly || !onRatingChange}
              className={cn(
                'transition-colors',
                isInteractive && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  sizes[size],
                  'transition-colors',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-gray-300 hover:text-yellow-400'
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Clear rating button */}
      {!readonly &&
        onRatingChange &&
        showClearButton &&
        rating !== null &&
        rating > 0 && (
          <button
            type="button"
            onClick={handleClearRating}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}

      {/* Rating text */}
      {rating !== null && rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating}/5
        </span>
      )}
    </div>
  )
}