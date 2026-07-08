'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Eye, EyeOff, CircleCheck } from 'lucide-react'

export default function NuevaPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('No pudimos actualizar la contraseña. El link puede haber expirado.')
      setIsLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/panel'), 2000)
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
              <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
              <CardDescription>
                {done ? 'Contraseña actualizada' : 'Elegí una nueva contraseña para tu cuenta'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CircleCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Tu contraseña fue actualizada. Redirigiendo al panel...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoFocus
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(null) }}
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmar contraseña</Label>
                      <Input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                        className="h-11"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        {error}
                      </p>
                    )}
                    <Button type="submit" className="w-full h-11" disabled={isLoading || !password || !confirm}>
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                      ) : (
                        'Guardar nueva contraseña'
                      )}
                    </Button>
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
