'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { Loader2, ArrowLeft, CircleCheck } from 'lucide-react'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/nueva-password`,
    })

    if (error) {
      setError('No pudimos enviar el email. Verificá la dirección e intentá de nuevo.')
      setIsLoading(false)
      return
    }

    setSent(true)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <Link href="/" className="inline-block mb-4">
              <h1 className="text-2xl font-bold">QRPago</h1>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
              <CardDescription>
                {sent
                  ? 'Revisá tu bandeja de entrada'
                  : 'Ingresá tu email y te enviamos un link para resetear tu contraseña'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CircleCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Si <span className="font-medium text-foreground">{email}</span> tiene una cuenta, vas a recibir un email con el link para crear una nueva contraseña.
                  </p>
                  <Link href="/auth/login" className="text-sm text-primary underline underline-offset-4">
                    Volver al login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        {error}
                      </p>
                    )}
                    <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim()}>
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                      ) : (
                        'Enviar link de recuperación'
                      )}
                    </Button>
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="h-3 w-3" />
                      Volver al login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
