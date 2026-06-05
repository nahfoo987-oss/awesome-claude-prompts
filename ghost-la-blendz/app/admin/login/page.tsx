'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { cn } from '@/lib/utils'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (authError) {
        setError('Invalid email or password.')
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase font-medium text-text-primary mb-1">
            Ghost LA Blendz
          </p>
          <p className="text-[10px] text-stone-400 tracking-wider">Admin</p>
        </div>

        <div className="bg-white border border-border rounded-sm p-8">
          <h1 className="font-serif text-2xl text-text-primary mb-6">Sign In</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={cn(
                  'w-full px-4 py-3 border text-sm bg-background rounded-sm focus:outline-none focus:border-stone-400 transition-colors',
                  errors.email ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className={cn(
                  'w-full px-4 py-3 border text-sm bg-background rounded-sm focus:outline-none focus:border-stone-400 transition-colors',
                  errors.password ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.password && <p className="text-red-400 text-[11px] mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-sm">
                <p className="text-red-600 text-[12px]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3.5 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors',
                loading
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-text-primary text-background hover:bg-stone-800'
              )}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
