import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ImportRecord } from '../../lib/api'
import ImportBusy from './ImportBusy'

export interface VbarCredentials {
  username: string
  password: string
  description?: string
}

interface VbarCredentialsFormProps {
  submitLabel: string
  showDescription?: boolean
  onSubmit: (creds: VbarCredentials) => Promise<ImportRecord>
  onDone: (record: ImportRecord) => void
  onCancel: () => void
}

export default function VbarCredentialsForm({
  submitLabel,
  showDescription = false,
  onSubmit,
  onDone,
  onCancel,
}: VbarCredentialsFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      onSubmit({
        username,
        password,
        description: showDescription && description.trim() ? description.trim() : undefined,
      }),
    onSuccess: onDone,
  })

  if (mutation.isPending) {
    return (
      <ImportBusy message="Contacting VBar Cloud and downloading your flights — this can take a few minutes." />
    )
  }

  const canSubmit = username.trim().length > 0 && password.length > 0

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) mutation.mutate()
      }}
    >
      {mutation.error && (
        <Alert variant="destructive">
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div>
            <Label htmlFor="vbar-username">vstabi.info username</Label>
            <Input
              id="vbar-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="vbar-password">Password</Label>
            <Input
              id="vbar-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {showDescription && (
            <div>
              <Label htmlFor="vbar-description">Description (optional)</Label>
              <Input
                id="vbar-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Your credentials are sent once to vstabi.info to download your flights and are not
            stored.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="tracking-widest uppercase text-xs"
          disabled={!canSubmit}
        >
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
