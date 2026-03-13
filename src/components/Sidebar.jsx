import { useAuth } from '../hooks/useAuth'
import { CATEGORY_CONFIG } from './TopBar'

export default function Sidebar({ reservations, currentDate }) {
    const { club } = useAuth()
    const now = new Date()
    const thisMonth = currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()

    const ownReservations = reservations.filter(r => r.clubs?.president_id === club?.president_id || r.club_id === club?.id)
    const totalBooked = reservations.length
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

    return (
        <aside className="sidebar">
            {/* Stats */}
            <div>
                <div className="sidebar-section-title">This Month</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="mini-stat">
                        <span className="label">Days Booked</span>
                        <span className="value">{totalBooked}</span>
                        <span className="sub">out of {daysInMonth} days</span>
                    </div>
                    <div className="mini-stat">
                        <span className="label">Your Events</span>
                        <span className="value" style={{ color: 'var(--status-locked)' }}>{ownReservations.length}</span>
                        <span className="sub">{club?.name || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div>
                <div className="sidebar-section-title">Club Categories</div>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <div className="legend-item" key={key}>
                        <div className="legend-dot" style={{ background: cfg.color }} />
                        <span>{cfg.emoji} {cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* Status legend */}
            <div>
                <div className="sidebar-section-title">Status Guide</div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--status-locked)' }} />
                    <span>Your Reservation</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--brand-blue)' }} />
                    <span>Today</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'var(--text-subtle)' }} />
                    <span>Past / Inactive</span>
                </div>
            </div>

            {/* Tip */}
            <div style={{
                marginTop: 'auto',
                padding: '14px',
                background: 'var(--brand-blue-glow)',
                border: '1px solid rgba(66,133,244,0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
            }}>
                💡 Click any free future date to reserve it for your club's event.
            </div>
        </aside>
    )
}
