import { useState } from 'react'
import { Link } from 'react-router-dom'
import CalendarGrid from '../components/CalendarGrid'

export default function PublicCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())

    return (
        <div className="app-shell" style={{ gridTemplateColumns: '1fr' }}>
            {/* Minimal public topbar */}
            <header className="topbar">
                <div className="topbar-brand">
                    <div className="topbar-logo">
                        <img src="/nst_logo.png" alt="NST Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 7 }} />
                    </div>
                    <span className="topbar-title">NST Club Calendar</span>
                    <span className="cat-pill" style={{
                        background: 'rgba(66,133,244,0.1)',
                        color: 'var(--brand-blue)',
                        border: '1px solid rgba(66,133,244,0.3)',
                        marginLeft: 8,
                        fontSize: '0.7rem',
                    }}>👁 Public View</span>
                </div>
                <div className="topbar-right">
                    <Link to="/login">
                        <button className="btn btn-primary btn-sm">Sign In →</button>
                    </Link>
                </div>
            </header>

            {/* Full-width calendar — no sidebar */}
            <main className="main-content" style={{ gridColumn: '1 / -1' }}>
                <CalendarGrid
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    readOnly={true}
                />
            </main>
        </div>
    )
}
