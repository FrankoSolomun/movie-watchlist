"use client"

import Link from "next/link"
import { Film, Heart } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Film className="h-6 w-6" />
              <span className="text-lg font-bold">Movie Watchlist</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track your movie watching journey with our interactive calendar and discover new films.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  Search Movies
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Watchlist
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-muted-foreground hover:text-foreground transition-colors">
                  Watch Calendar
                </Link>
              </li>
              <li>
                <Link href="/ratings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Rate Movies
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Movie Discovery</li>
              <li>Personal Watchlist</li>
              <li>Watch Calendar</li>
              <li>Movie Ratings</li>
              <li>Genre Filtering</li>
            </ul>
          </div>

          {/* About & Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">About</h3>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline"
              >
                TMDB
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Movie Watchlist. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 fill-current" />
              <span>for movie lovers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}