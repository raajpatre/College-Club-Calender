import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import NotificationPanel from './NotificationPanel'

export const CATEGORY_CONFIG = {
    tech: { label: 'Tech & Coding', color: 'var(--club-tech)', emoji: '💻' },
    photography: { label: 'Photography & Videography', color: 'var(--club-cultural)', emoji: '📸' },
    sports: { label: 'Sports & Gaming', color: 'var(--club-sports)', emoji: '⚽' },
    entrepreneurship: { label: 'Entrepreneurship', color: 'var(--club-arts)', emoji: '🚀' },
    cultural: { label: 'Cultural commitee', color: '#E056FD', emoji: '🎨' },
    robotics: { label: 'Robotics Club', color: '#48DBFB', emoji: '🤖' },
    sports_club: { label: 'Sports club', color: '#FF9F43', emoji: '🏀' },
}

export default function TopBar({ notifications = [], unreadCount = 0, onMarkRead, onMarkAllRead }) {
    const { club, isAdmin, user, signOut } = useAuth()
    const navigate = useNavigate()
    const [panelOpen, setPanelOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const initials = isAdmin
        ? 'AD'
        : club?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CL'

    const catConfig = club ? CATEGORY_CONFIG[club.category] : null

    const handleBellClick = () => {
        setPanelOpen(p => !p)
    }

    return (
        <header className="topbar">
            <div className="topbar-brand">
                <div className="topbar-logo">
                    <img src="/nst_logo.png" alt="NST Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 7 }} />
                </div>
                <span className="topbar-title">NST Club Calendar</span>
            </div>

            <div className="topbar-right">
                {club?.tech_tag && (
                    <span style={{
                        marginTop: 2,
                        marginRight: 8,
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        background: club.tech_tag === 'Tech' ? 'rgba(72,219,251,0.1)' : 'rgba(255,159,67,0.1)',
                        color: club.tech_tag === 'Tech' ? '#48DBFB' : '#FF9F43',
                        border: `1px solid ${club.tech_tag === 'Tech' ? 'rgba(72,219,251,0.3)' : 'rgba(255,159,67,0.3)'}`
                    }}>
                        {club.tech_tag}
                    </span>
                )}
                {catConfig && (
                    <span className="cat-pill" style={{
                        background: `${catConfig.color}15`,
                        color: catConfig.color,
                        border: `1px solid ${catConfig.color}40`
                    }}>
                        {catConfig.emoji} {catConfig.label}
                    </span>
                )}
                {isAdmin && (
                    <span className="cat-pill" style={{
                        background: 'var(--brand-blue-glow)',
                        color: 'var(--brand-blue)',
                        border: '1px solid rgba(66,133,244,0.4)',
                        cursor: 'pointer',
                    }} onClick={() => navigate('/admin')}>
                        🔑 Admin Panel
                    </span>
                )}

                {/* Bell icon — only shown to logged-in presidents (not admin) */}
                {!isAdmin && club && (
                    <div className="notif-bell-wrap">
                        <button
                            className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                            onClick={handleBellClick}
                            title="Notifications"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>

                        <AnimatePresence>
                            {panelOpen && (
                                <NotificationPanel
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    onMarkRead={(id) => onMarkRead?.(id)}
                                    onMarkAllRead={() => onMarkAllRead?.()}
                                    onClose={() => setPanelOpen(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <div className="user-chip">
                    <div className="user-avatar">{initials}</div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {isAdmin ? 'Admin' : (club?.name || user?.email)}
                    </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign Out</button>
            </div>
        </header>
    )
}
