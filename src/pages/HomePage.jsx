import { useState } from 'react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import CalendarGrid from '../components/CalendarGrid'
import { useReservations } from '../hooks/useReservations'

export default function HomePage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const {
        reservations,
        notifications, unreadCount, markRead, markAllRead,
    } = useReservations(currentDate)

    return (
        <div className="app-shell">
            <TopBar
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
            />
            <Sidebar reservations={reservations} currentDate={currentDate} />
            <main className="main-content">
                <CalendarGrid currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </main>
        </div>
    )
}
