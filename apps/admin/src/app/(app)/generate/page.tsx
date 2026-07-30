'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailForm } from '@/components/email-form'

export default function GeneratePage() {
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Email Reply Generator</CardTitle>
            <CardDescription>
              Paste an email, choose a tone, and let AI generate a professional reply.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
