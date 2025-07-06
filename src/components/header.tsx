'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { Film, Calendar, Search, User, Menu, X, Star } from 'lucide-react'

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-x-6">
          <Link href="/" className="flex h-10 items-center gap-2">
            <Film className="h-6 w-6" />
            <span className="text-xl font-bold">Movie Watchlist</span>
          </Link>

          {/* Desktop Navigation */}
          {session && (
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="flex h-10 items-center gap-x-3">
                <NavigationMenuItem className="flex">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/search"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className="flex">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/watchlist"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    >
                      <Film className="mr-2 h-4 w-4" />
                      Watchlist
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className="flex">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/calendar"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Calendar
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className="flex">
                  <NavigationMenuLink asChild>
                    <Link
                      href="/ratings"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Ratings
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        <div className="flex h-10 items-center gap-x-4">
          {/* Mobile Menu Button */}
          {session && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user?.image || ''}
                      alt={session.user?.name || ''}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="text-sm font-medium">
                    {session.user?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.user?.email}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/signin">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {session && mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto space-y-2 px-4 py-4">
            <Link
              href="/search"
              className="flex items-center space-x-3 rounded-md p-3 transition-colors hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="h-5 w-5" />
              <span className="text-base font-medium">Search Movies</span>
            </Link>
            <Link
              href="/watchlist"
              className="flex items-center space-x-3 rounded-md p-3 transition-colors hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Film className="h-5 w-5" />
              <span className="text-base font-medium">My Watchlist</span>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center space-x-3 rounded-md p-3 transition-colors hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-base font-medium">Watch Calendar</span>
            </Link>
            <Link
              href="/ratings"
              className="flex items-center space-x-3 rounded-md p-3 transition-colors hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Star className="h-5 w-5" />
              <span className="text-base font-medium">Rate Movies</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
