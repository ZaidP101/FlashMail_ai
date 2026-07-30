'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Mail, Chrome } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">FlashMail.ai</h1>
        <p className="text-xl text-muted-foreground">AI-powered email reply assistant</p>
      </div>

      {!loading && !user && (
        <div className="flex gap-4 mb-16">
          <Link href="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg">Sign Up</Button>
          </Link>
        </div>
      )}

      {!loading && user && (
        <div className="flex gap-4 mb-16">
          <Link href="/generate">
            <Button size="lg">Generate a Reply</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 text-primary mb-2" />
            <CardTitle>AI-Powered</CardTitle>
            <CardDescription>Generates contextual, professional email replies using Hugging Face's Qwen model.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Mail className="h-8 w-8 text-primary mb-2" />
            <CardTitle>14 Tone Options</CardTitle>
            <CardDescription>From Professional to Humorous — choose the tone that fits your message.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Chrome className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Gmail Extension</CardTitle>
            <CardDescription>Use directly from Gmail with our Chrome extension. AI reply button in the compose toolbar.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  )
}
