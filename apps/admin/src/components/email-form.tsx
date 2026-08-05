'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToneSelector } from '@/components/tone-selector'
import { FormatPicker } from '@/components/format-picker'
import { CustomInputs } from '@/components/custom-inputs'
import { generateEmail, getFormats } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export function EmailForm() {
  const { session } = useAuth()
  const [formats, setFormats] = useState<{ id: string; name: string; mode: 'email' | 'reply'; tone: string }[]>([])
  const [formatId, setFormatId] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [tone, setTone] = useState('')
  const [customInputs, setCustomInputs] = useState('')
  const [rawReply, setRawReply] = useState('')
  const [generatedReply, setGeneratedReply] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    getFormats(session.access_token)
      .then(setFormats)
      .catch(() => setFormats([]))
  }, [session])

  const handleFormatChange = (id: string) => {
    setFormatId(id)
    const selected = formats.find((f) => f.id === id)
    setTone(selected?.tone ?? '')
  }

  const handleSubmit = async () => {
    if (!emailContent.trim()) return
    setLoading(true)
    try {
      const payload = {
        emailContent,
        tone: tone || undefined,
        rawReply: rawReply || undefined,
        formatId: formatId || undefined,
        customInputs: customInputs || undefined,
        senderName:
          session?.user?.user_metadata?.full_name ||
          session?.user?.user_metadata?.name ||
          session?.user?.email ||
          undefined,
      }
      const { reply } = await generateEmail(payload, session?.access_token)
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
      {formats.length > 0 && (
        <FormatPicker formats={formats} value={formatId} onChange={handleFormatChange} />
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Original Email Content</label>
        <Textarea
          rows={8}
          placeholder="Paste the email you want to reply to..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        />
      </div>

      {formatId && <CustomInputs value={customInputs} onChange={setCustomInputs} />}

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
