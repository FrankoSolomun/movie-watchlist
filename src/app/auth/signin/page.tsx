'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Film, Chrome, Loader2, Calendar, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }
    checkSession()
  }, [callbackUrl, router])

  useEffect(() => {
    // Handle errors from the URL
    if (error) {
      switch (error) {
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
        case 'EmailCreateAccount':
        case 'Callback':
          toast.error('Error occurred during authentication. Please try again.')
          break
        case 'OAuthAccountNotLinked':
          toast.error(
            'Account is not linked. Please try signing in with a different provider.'
          )
          break
        case 'EmailSignin':
          toast.error('Error sending verification email.')
          break
        case 'CredentialsSignin':
          toast.error('Invalid credentials.')
          break
        case 'SessionRequired':
          toast.error('Please sign in to access this page.')
          break
        default:
          toast.error('An error occurred during authentication.')
      }
    }
  }, [error])

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signIn('google', {
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Failed to sign in. Please try again.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Film className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Movie Watchlist</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Track, schedule, and rate your favorite movies
          </p>
        </div>

        {/* Sign In Card */}
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to access your movie watchlist and continue tracking your
              favorite films
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="h-12 w-full text-base"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-5 w-5" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By signing in, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="underline hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-12 w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-semibold">
              Why use Movie Watchlist?
            </h2>
            <p className="text-muted-foreground">
              Discover what makes our platform special
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-white/50 p-6 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Film className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Track Movies</h3>
              <p className="text-sm text-muted-foreground">
                Keep track of movies you want to watch and mark them as watched
                when you&apos;re done
              </p>
            </div>

            <div className="rounded-lg border bg-white/50 p-6 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Schedule Viewing</h3>
              <p className="text-sm text-muted-foreground">
                Plan when to watch movies with our calendar feature and never
                miss a movie night
              </p>
            </div>

            <div className="rounded-lg border bg-white/50 p-6 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Rate & Review</h3>
              <p className="text-sm text-muted-foreground">
                Rate movies you&apos;ve watched and leave personal notes to
                remember your thoughts
              </p>
            </div>
          </div>
        </div>

        {/* Guest Options */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Want to explore first?
          </p>
          <Link href="/">
            <Button variant="outline" size="sm">
              Browse as Guest
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
