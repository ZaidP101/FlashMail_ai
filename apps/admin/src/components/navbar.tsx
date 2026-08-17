'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/contexts/auth-context'

export function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          FlashMail.ai
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/generate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Generate
          </Link>
          <Link href="/formats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Formats
          </Link>
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Profile
          </Link>
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
              <Button size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
