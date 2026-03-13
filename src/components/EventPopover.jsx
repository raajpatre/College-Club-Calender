import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { CATEGORY_CONFIG } from './TopBar'
import { downloadIcs } from '../utils/icsExport'

export default function EventPopover({ reservation, anchorRect, onClose, onRelease, onReschedule, onRequestSwap, readOnly = false }) {
    const { club } = useAuth()
    const ref = useRef(null)
    const isOwn = reservation.club_id === club?.id

    const catCfg = CATEGORY_CONFIG[reservation.clubs?.category] || CATEGORY_CONFIG.tech
    const dateLabel = format(parseISO(reservation.reserved_date), 'EEEE, MMMM d, yyyy')

    const [style, setStyle] = useState({ top: 0, left: 0 })
    useEffect(() => {
        if (!anchorRect || !ref.current) return
        const pop = ref.current.getBoundingClientRect()
        let top = anchorRect.bottom + 8
        let left = anchorRect.left
        if (top + pop.height > window.innerHeight - 20) top = anchorRect.top - pop.height - 8
        if (left + pop.width > window.innerWidth - 20) left = window.innerWidth - pop.width - 20
        setStyle({ top, left })
    }, [anchorRect])

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        setTimeout(() => document.addEventListener('mousedown', handler), 50)
        return () => document.removeEventListener('mousedown', handler)
    }, [onClose])

    return (
        <AnimatePresence>
            <motion.div
                ref={ref}
                className="popover"
                style={{ position: 'fixed', ...style }}
                initial={{ opacity: 0, scale: 0.85, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
                {/* Club color accent bar */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    borderRadius: '12px 12px 0 0',
                    background: catCfg.color,
                }} />

                <div style={{ marginTop: 8 }}>
                    <div className="popover-title">{reservation.event_title}</div>
                    <div className="popover-club">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: reservation.clubs?.tech_tag ? 6 : 0 }}>
                            <span style={{ color: catCfg.color }}>{catCfg.emoji}</span>
                            <span>{reservation.clubs?.name}</span>
                            {isOwn && (
                                <span style={{
                                    background: 'var(--status-locked-bg)',
                                    color: 'var(--status-locked)',
                                    fontSize: '0.65rem', fontWeight: 700,
                                    padding: '1px 6px', borderRadius: 4,
                                }}>YOUR EVENT</span>
                            )}
                        </div>
                        {reservation.clubs?.tech_tag && (
                            <div style={{ marginLeft: 22 }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    background: reservation.clubs.tech_tag === 'Tech' ? 'rgba(72,219,251,0.1)' : 'rgba(255,159,67,0.1)',
                                    color: reservation.clubs.tech_tag === 'Tech' ? '#48DBFB' : '#FF9F43',
                                    border: `1px solid ${reservation.clubs.tech_tag === 'Tech' ? 'rgba(72,219,251,0.3)' : 'rgba(255,159,67,0.3)'}`
                                }}>
                                    {reservation.clubs.tech_tag}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="popover-row">
                        <span className="icon">📅</span>
                        <span style={{ color: 'var(--text-muted)' }}>{dateLabel}</span>
                    </div>
                    <div className="popover-row">
                        <span className="icon">🕐</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                            {reservation.start_time?.slice(0, 5)} – {reservation.end_time?.slice(0, 5)}
                        </span>
                    </div>
                    {reservation.description && (
                        <div className="popover-row">
                            <span className="icon">📝</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{reservation.description}</span>
                        </div>
                    )}
                </div>

                {/* Add to Calendar — always visible */}
                <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => downloadIcs(reservation)}
                    >
                        📥 Add to Calendar
                    </button>
                </div>

                {/* Owner actions (not in read-only mode) */}
                {!readOnly && isOwn && (
                    <div className="popover-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); onReschedule(reservation) }}>
                            📆 Reschedule
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { onClose(); onRelease(reservation) }}>
                            🗑 Release
                        </button>
                    </div>
                )}

                {/* Request Swap — for other clubs' events, logged-in presidents only */}
                {!readOnly && !isOwn && club && (
                    <div className="popover-actions">
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--brand-blue)', borderColor: 'rgba(66,133,244,0.4)' }}
                            onClick={() => { onRequestSwap?.(reservation); onClose() }}
                        >
                            🔄 Request Swap
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}
