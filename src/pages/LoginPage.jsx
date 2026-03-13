import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signIn(username.trim(), password)
            navigate('/')
        } catch (err) {
            setError('Invalid username or password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <img src="/nst_logo.png" alt="NST Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h1>NST Club Calendar</h1>
                        <p>Reservation Portal</p>
                    </div>
                </div>

                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-subtitle">Sign in with your club president credentials</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                            autoFocus
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ marginTop: 8, padding: '13px 20px', fontSize: '0.95rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign In →'}
                    </button>
                </form>

                <p style={{ marginTop: 28, fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                    Don't have credentials? Contact your college admin.
                </p>
                <p style={{ marginTop: 10, fontSize: '0.78rem', textAlign: 'center' }}>
                    <a href="/public" style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontWeight: 500 }}>
                        👁 View Public Calendar →
                    </a>
                </p>
            </motion.div>
        </div>
    )
}
