import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import TopBar from '../components/TopBar'
import { CATEGORY_CONFIG } from '../components/TopBar'
import { format, parseISO } from 'date-fns'

export default function AdminPage() {
    const { isAdmin, loading } = useAuth()
    const navigate = useNavigate()
    const [clubs, setClubs] = useState([])
    const [auditLogs, setAuditLogs] = useState([])
    const [form, setForm] = useState({ name: '', category: 'tech', username: '', password: '', email: '', tech_tag: 'Tech' })
    const [creating, setCreating] = useState(false)
    const [deactivating, setDeactivating] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [activeTab, setActiveTab] = useState('presidents') // 'presidents' | 'logs'

    const fetchClubs = async () => {
        const { data } = await supabase.from('clubs').select('*').eq('is_active', true).order('created_at', { ascending: false })
        setClubs(data || [])
    }

    const fetchAuditLogs = async () => {
        const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
        setAuditLogs(data || [])
    }

    useEffect(() => {
        if (!loading && !isAdmin) navigate('/')
        if (!loading && isAdmin) { fetchClubs(); fetchAuditLogs() }
    }, [isAdmin, loading])

    const handleCreate = async (e) => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setCreating(true)
        try {
            const { data, error: fnErr } = await supabase.functions.invoke('create-president', {
                body: {
                    username: form.username.trim(),
                    password: form.password,
                    clubName: form.name.trim(),
                    category: form.category,
                    email: form.email.trim(),
                    tech_tag: form.tech_tag,
                }
            })
            if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error)
            setSuccess(`✅ Account created! Username: ${form.username} — email them their credentials.`)
            setForm({ name: '', category: 'tech', username: '', password: '', email: '', tech_tag: 'Tech' })
            fetchClubs()
            fetchAuditLogs()
        } catch (err) {
            setError(err.message || 'Failed to create account.')
        }
        setCreating(false)
    }

    const handleDeactivate = async (club) => {
        if (!confirm(`Deactivate "${club.name}"? Their account will be hidden everywhere. You can restore it via the database if needed.`)) return
        setDeactivating(club.id)
        const { data, error: fnErr } = await supabase.functions.invoke('create-president', {
            body: { deactivateClubId: club.id }
        })
        if (!fnErr && !data?.error) {
            await fetchClubs()
            await fetchAuditLogs()
        }
        setDeactivating(null)
    }

    if (loading) return null

    const ACTION_ICONS = {
        CREATE_PRESIDENT: '➕',
        DEACTIVATE_PRESIDENT: '🚫',
    }

    return (
        <div className="app-shell">
            <TopBar />
            <div style={{ gridColumn: '1 / -1', overflowY: 'auto', padding: '36px 48px' }}>
                <div className="admin-page">
                    <h1>🔑 Admin Panel</h1>
                    <p className="subtitle">Create and manage club president accounts. Share credentials via email.</p>

                    {/* Create form */}
                    <div className="card" style={{ marginBottom: 36 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>Create President Account</h3>

                        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
                        {success && (
                            <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem', color: 'var(--success)' }}>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleCreate}>
                            <div className="form-grid" style={{ marginBottom: 16 }}>
                                <div className="field">
                                    <label>Club Name *</label>
                                    <input type="text" placeholder="e.g. NST Coding Club" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="field">
                                    <label>Category *</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                        <option value="tech">💻 Tech &amp; Coding</option>
                                        <option value="photography">📸 Photography &amp; Videography</option>
                                        <option value="sports">⚽ Sports &amp; Gaming</option>
                                        <option value="entrepreneurship">🚀 Entrepreneurship</option>
                                        <option value="cultural">🎨 Cultural commitee</option>
                                        <option value="robotics">🤖 Robotics Club</option>
                                        <option value="sports_club">🏀 Sports club</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Tag (Tech/Non-Tech) *</label>
                                    <select value={form.tech_tag} onChange={e => setForm(f => ({ ...f, tech_tag: e.target.value }))}>
                                        <option value="Tech">Tech</option>
                                        <option value="Non-Tech">Non-Tech</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>President's Email (for your records) *</label>
                                    <input type="email" placeholder="president@nst.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                                </div>
                                <div className="field">
                                    <label>Username (they will use this to login) *</label>
                                    <input type="text" placeholder="e.g. coding_raj" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                                </div>
                                <div className="field">
                                    <label>Password (you set this) *</label>
                                    <input type="text" placeholder="Create a strong password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating…' : '+ Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabs */}
                    <div className="card">
                        <div className="admin-tabs">
                            <button
                                className={`admin-tab-btn ${activeTab === 'presidents' ? 'active' : ''}`}
                                onClick={() => setActiveTab('presidents')}
                            >
                                👥 Club Presidents ({clubs.length})
                            </button>
                            <button
                                className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                                onClick={() => setActiveTab('logs')}
                            >
                                📋 Activity Log
                            </button>
                        </div>

                        {activeTab === 'presidents' && (
                            <>
                                {clubs.length === 0 ? (
                                    <p style={{ color: 'var(--text-subtle)', fontSize: '0.88rem', marginTop: 16 }}>No presidents yet. Create one above.</p>
                                ) : (
                                    <table className="admin-table" style={{ tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '18%' }}>Club Name</th>
                                                <th style={{ width: '10%' }}>Tag</th>
                                                <th style={{ width: '15%' }}>Category</th>
                                                <th style={{ width: '18%' }}>Username</th>
                                                <th style={{ width: '20%' }}>Email</th>
                                                <th style={{ width: '11%' }}>Created</th>
                                                <th style={{ width: '8%' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clubs.map(c => {
                                                const cfg = CATEGORY_CONFIG[c.category]
                                                return (
                                                    <tr key={c.id}>
                                                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</td>
                                                        <td>
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontWeight: 800,
                                                                letterSpacing: '0.05em',
                                                                textTransform: 'uppercase',
                                                                background: c.tech_tag === 'Tech' ? 'rgba(72,219,251,0.1)' : 'rgba(255,159,67,0.1)',
                                                                color: c.tech_tag === 'Tech' ? '#48DBFB' : '#FF9F43',
                                                                border: `1px solid ${c.tech_tag === 'Tech' ? 'rgba(72,219,251,0.3)' : 'rgba(255,159,67,0.3)'}`
                                                            }}>
                                                                {c.tech_tag || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="cat-pill" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                                                                {cfg.emoji} {cfg.label}
                                                            </span>
                                                        </td>
                                                        <td style={{ color: 'var(--brand-blue)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.username}</td>
                                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || '—'}</td>
                                                        <td style={{ color: 'var(--text-subtle)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                disabled={deactivating === c.id}
                                                                onClick={() => handleDeactivate(c)}
                                                            >
                                                                {deactivating === c.id ? '…' : 'Deactivate'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}

                        {activeTab === 'logs' && (
                            <div className="audit-log-list">
                                {auditLogs.length === 0 ? (
                                    <p style={{ color: 'var(--text-subtle)', fontSize: '0.88rem', marginTop: 16 }}>No activity yet.</p>
                                ) : (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="audit-log-row">
                                            <div className="audit-log-icon">{ACTION_ICONS[log.action_type] || '📌'}</div>
                                            <div className="audit-log-body">
                                                <div className="audit-log-action">{log.action_type.replace(/_/g, ' ')}</div>
                                                <div className="audit-log-desc">{log.description}</div>
                                            </div>
                                            <div className="audit-log-time">
                                                {format(parseISO(log.created_at), 'dd MMM yyyy, HH:mm')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
