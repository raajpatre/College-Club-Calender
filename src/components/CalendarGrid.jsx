import { useState, useEffect } from 'react'
import {
    startOfMonth, endOfMonth, eachDayOfInterval,
    getDay, format, isBefore, isToday, startOfDay, addMonths, subMonths
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useReservations } from '../hooks/useReservations'
import EventPopover from './EventPopover'
import ReserveModal from './ReserveModal'
import { CATEGORY_CONFIG } from './TopBar'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getCategoryColor(category) {
    return CATEGORY_CONFIG[category]?.color || 'var(--text-muted)'
}

export default function CalendarGrid({ currentDate, setCurrentDate, readOnly = false }) {
    const { club } = useAuth()
    const { reservations, reserveDay, releaseDay, rescheduleDay, getReservationsForDate, requestSwap } = useReservations(currentDate)

    const [popover, setPopover] = useState(null) // { reservation, anchorRect }
    const [reserveModal, setReserveModal] = useState(null) // { date } or { reservation } for reschedule
    const [toast, setToast] = useState(null)
    const [confirmRelease, setConfirmRelease] = useState(null)
    const [swapToast, setSwapToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    // Build the grid days (Mon-start)
    const firstDay = startOfMonth(currentDate)
    const lastDay = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: firstDay, end: lastDay })

    // Monday offset: Sunday=0 → Mon-start offset
    const startOffset = (getDay(firstDay) + 6) % 7 // 0=Mon, 6=Sun

    const today = startOfDay(new Date())

    const handleDayClick = (day, e) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const isPast = isBefore(startOfDay(day), today)
        if (isPast) return
        if (readOnly) return // In read-only mode, can't reserve

        // Clicking the empty space of the day cell triggers ReserveModal
        // The event badges themselves will have e.stopPropagation() and trigger their own click handler.
        setPopover(null)
        setReserveModal({ date: dateStr, isReschedule: false })
    }

    const handleEventClick = (reservation, e) => {
        e.stopPropagation() // prevent day cell click
        setReserveModal(null)
        const rect = e.currentTarget.getBoundingClientRect()
        setPopover({ reservation, anchorRect: rect })
    }

    const handleRelease = async (reservation) => {
        setConfirmRelease(reservation)
    }

    const doRelease = async () => {
        try {
            await releaseDay(confirmRelease.id)
            showToast(`"${confirmRelease.event_title}" reservation released.`, 'success')
        } catch {
            showToast('Failed to release reservation.', 'error')
        }
        setConfirmRelease(null)
    }

    const handleReschedule = (reservation) => {
        setReserveModal({ date: reservation.reserved_date, isReschedule: true, reservation })
    }

    const handleRequestSwap = async (reservation) => {
        try {
            await requestSwap(reservation.id)
            showToast(`Swap request sent to ${reservation.clubs?.name}! They'll be notified instantly. 🔄`, 'success')
        } catch (err) {
            showToast(err.message || 'Failed to send swap request.', 'error')
        }
    }

    const handleModalSubmit = async (payload) => {
        try {
            if (reserveModal.isReschedule) {
                await rescheduleDay(reserveModal.reservation.id, payload.date, payload)
                showToast('Event rescheduled successfully! 📆', 'success')
            } else {
                await reserveDay(payload.date, payload)
                showToast('Day reserved successfully! 🎉', 'success')
            }
            setReserveModal(null)
        } catch (err) {
            const msg = err.message?.includes('unique')
                ? 'That day is already taken by another club!'
                : err.message || 'Something went wrong.'
            showToast(msg, 'error')
        }
    }

    const monthLabel = format(currentDate, 'MMMM yyyy')

    return (
        <div>
            {/* Month Nav Header */}
            <div className="calendar-header">
                <h2 style={{ letterSpacing: '-0.02em' }}>{monthLabel}</h2>
                <div className="month-nav">
                    <button onClick={() => setCurrentDate(d => subMonths(d, 1))} title="Previous month">‹</button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        style={{ padding: '0 12px', width: 'auto', fontSize: '0.78rem', fontWeight: 600 }}
                        title="Go to today"
                    >Today</button>
                    <button onClick={() => setCurrentDate(d => addMonths(d, 1))} title="Next month">›</button>
                </div>
            </div>

            {/* Grid */}
            <motion.div
                key={currentDate.toISOString()}
                className="calendar-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.02, delayChildren: 0.1 }
                    }
                }}
            >
                {/* Day labels */}
                {DAY_LABELS.map(d => (
                    <div key={d} className="day-label">{d}</div>
                ))}

                {/* Empty cells for offset */}
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="day-cell empty" />
                ))}

                {/* Actual days */}
                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isPast = isBefore(startOfDay(day), today)
                    const isToday_ = isToday(day)
                    const dayReservations = getReservationsForDate(dateStr)

                    let cellClass = 'day-cell'
                    if (isPast) cellClass += ' past'
                    if (isToday_) cellClass += ' today'

                    // Optional styling if the user themselves booked *any* event this day
                    const hasOwnEvent = dayReservations.some(r => r.club_id === club?.id)
                    if (hasOwnEvent) cellClass += ' reserved-own'

                    return (
                        <motion.div
                            key={dateStr}
                            className={cellClass}
                            style={{
                                display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start',
                                cursor: isPast ? 'not-allowed' : 'pointer'
                            }}
                            onClick={(e) => {
                                if (!isPast) handleDayClick(day, e)
                            }}
                            variants={{
                                hidden: { opacity: 0, scale: 0.95 },
                                visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
                            }}
                            whileHover={!isPast ? { scale: 1.02 } : {}}
                            style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}
                        >
                            <span className="day-number" style={{ alignSelf: 'center', marginBottom: '2px' }}>{format(day, 'd')}</span>

                            {dayReservations.map((reservation) => {
                                const isOwn = reservation.club_id === club?.id
                                const catColor = getCategoryColor(reservation.clubs?.category)
                                return (
                                    <motion.span
                                        key={reservation.id}
                                        className="event-badge"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
                                        style={{
                                            background: isPast ? 'rgba(255,255,255,0.03)' : (isOwn ? 'var(--status-locked-bg)' : `${catColor}15`),
                                            color: isPast ? 'var(--text-muted)' : (isOwn ? 'var(--status-locked)' : catColor),
                                            border: `1px solid ${isPast ? 'rgba(255,255,255,0.05)' : (isOwn ? 'rgba(255,71,87,0.3)' : `${catColor}40`)}`,
                                            justifyContent: 'flex-start',
                                            cursor: isPast ? 'not-allowed' : 'pointer',
                                            opacity: isPast ? 0.6 : 1
                                        }}
                                        onClick={(e) => {
                                            if (!isPast) handleEventClick(reservation, e)
                                        }}
                                    >
                                        <span className="dot" style={{ background: isPast ? 'var(--text-muted)' : (isOwn ? 'var(--status-locked)' : catColor), flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {reservation.clubs?.name?.split(' ')[0] || 'Booked'} {reservation.start_time?.slice(0, 5)}
                                        </span>
                                    </motion.span>
                                )
                            })}
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Popover */}
            {popover && (
                <EventPopover
                    reservation={popover.reservation}
                    anchorRect={popover.anchorRect}
                    onClose={() => setPopover(null)}
                    onRelease={handleRelease}
                    onReschedule={handleReschedule}
                    onRequestSwap={handleRequestSwap}
                    readOnly={readOnly}
                />
            )}

            {/* Reserve / Reschedule Modal */}
            <AnimatePresence>
                {reserveModal && (
                    <ReserveModal
                        initialDate={reserveModal.date}
                        isReschedule={reserveModal.isReschedule}
                        existingReservation={reserveModal.reservation}
                        reservedDates={reservations.map(r => r.reserved_date)}
                        allReservations={reservations}
                        onClose={() => setReserveModal(null)}
                        onSubmit={handleModalSubmit}
                        currentDate={currentDate}
                    />
                )}
            </AnimatePresence>

            {/* Confirm Release Dialog */}
            <AnimatePresence>
                {confirmRelease && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-box"
                            style={{ maxWidth: 400 }}
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        >
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Release Reservation?</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
                                This will permanently remove <strong style={{ color: 'var(--text-primary)' }}>"{confirmRelease.event_title}"</strong> from{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>
                                    {format(new Date(confirmRelease.reserved_date + 'T00:00:00'), 'MMMM d, yyyy')}
                                </strong>.
                                Other clubs will be able to book this day again.
                            </p>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost" onClick={() => setConfirmRelease(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={doRelease}>Yes, Release</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <div className="toast-wrapper">
                        <motion.div
                            className={`toast ${toast.type}`}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 60 }}
                        >
                            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
