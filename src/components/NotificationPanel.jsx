import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, parseISO } from 'date-fns'

export default function NotificationPanel({ notifications, unreadCount, onMarkAllRead, onMarkRead, onClose, onAcceptSwap, onRejectSwap }) {
    const panelRef = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [onClose])

    // Detect if a notification is a swap request (contains a swap_request_id)
    const isSwapRequest = (n) => n.message?.startsWith('🔄') && n.swap_request_id

    return (
        <motion.div
            ref={panelRef}
            className="notif-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
        >
            <div className="notif-panel-header">
                <span className="notif-panel-title">🔔 Notifications</span>
                {unreadCount > 0 && (
                    <button className="notif-mark-read-btn" onClick={onMarkAllRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            <motion.div
                className="notif-list"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                    }
                }}
            >
                {notifications.length === 0 ? (
                    <div className="notif-empty">
                        <span>🔕</span>
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <motion.div
                            key={n.id}
                            className={`notif-item ${!n.read ? 'unread' : ''}`}
                            variants={{
                                hidden: { opacity: 0, y: -10 },
                                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
                            }}
                            onClick={() => !n.read && onMarkRead(n.id)}
                        >
                            {!n.read && <span className="notif-unread-dot" />}
                            <div className="notif-content">
                                <p className="notif-message">{n.message}</p>
                                <span className="notif-time">
                                    {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                                </span>

                                {/* Swap request inline actions */}
                                {isSwapRequest(n) && (
                                    <div className="notif-swap-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                            onClick={(e) => { e.stopPropagation(); onAcceptSwap?.(n.swap_request_id) }}
                                        >
                                            ✅ Accept
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                            onClick={(e) => { e.stopPropagation(); onRejectSwap?.(n.swap_request_id) }}
                                        >
                                            ❌ Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </motion.div>
    )
}
