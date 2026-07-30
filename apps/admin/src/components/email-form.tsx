'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToneSelector } from '@/components/tone-selector'
import { generateEmail } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export function EmailForm() {
  const { session } = useAuth()
  const [emailContent, setEmailContent] = useState('')
  const [tone, setTone] = useState('')
  const [rawReply, setRawReply] = useState('')
  const [generatedReply, setGeneratedReply] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!emailContent.trim()) return
    setLoading(true)
    try {
      const { reply } = await generateEmail(
        { emailContent, tone: tone || undefined, rawReply: rawReply || undefined },
        session?.access_token,
      )
      setGeneratedReply(reply)
      toast.success('Reply generated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate reply')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReply)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Original Email Content</label>
        <Textarea
          rows={8}
          placeholder="Paste the email you want to reply to..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        />
      </div>

      <ToneSelector value={tone} onChange={setTone} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Reply (Optional)</label>
        <Textarea
          rows={4}
          placeholder="Type your raw draft reply here..."
          value={rawReply}
          onChange={(e) => setRawReply(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading || !emailContent.trim()} className="w-full">
        {loading ? 'Generating...' : 'Generate Reply'}
      </Button>

      {generatedReply && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold">Generated Reply</h3>
          <Textarea rows={9} value={generatedReply} readOnly />
          <Button variant="outline" onClick={copyToClipboard}>
            Copy Response
          </Button>
        </div>
      )}
    </div>
  )
}
