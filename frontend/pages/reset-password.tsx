import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uid, setUid] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUid(params.get('uid') || '')
    setToken(params.get('token') || '')
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setStatus('Passwords do not match')
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      await axios.post('/api/auth/password-reset-confirm/', { uid, token, password })
      setStatus('Password reset successfully. You can now log in.')
    } catch (e: any) {
      setStatus(e?.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button disabled={loading} className="w-full bg-black text-white rounded px-3 py-2">
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
        {status && <p className="text-sm text-gray-700">{status}</p>}
      </form>
    </div>
  )
}


