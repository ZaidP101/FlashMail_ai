'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'

export default function ProfilePage() {
  const { user, session } = useAuth()

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-medium text-sm font-mono">{user?.id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Last Sign In</p>
              <p className="font-medium">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Session Expires</p>
              <p className="font-medium">{session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
