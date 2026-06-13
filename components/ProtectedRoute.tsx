'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F0F14', color: '#A7A29A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading…</p>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
