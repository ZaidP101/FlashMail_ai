import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">FlashMail.ai</h1>
      <p className="text-muted-foreground mb-8">AI-powered email reply assistant</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-input px-4 py-2 hover:bg-accent"
        >
          Sign Up
        </Link>
      </div>
    </main>
  )
}
