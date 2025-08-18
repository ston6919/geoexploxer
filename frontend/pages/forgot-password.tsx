import React, { useState } from 'react'
import axios from 'axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await axios.post('/api/auth/password-reset/', { email })
      setStatus('If the email exists, a reset link has been sent.')
    } catch {
      setStatus('If the email exists, a reset link has been sent.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button disabled={loading} className="w-full bg-black text-white rounded px-3 py-2">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
        {status && <p className="text-sm text-gray-700">{status}</p>}
      </form>
    </div>
  )
}


