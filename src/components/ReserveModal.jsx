import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, getDay, isBefore, isToday, startOfDay, parseISO
} from 'date-fns'
import { useAuth } from '../hooks/useAuth'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ReserveModal({
    initialDate,
    isReschedule,
    existingReservation,
    reservedDates,
    allReservations = [], // Ensure it defaults to array
    onClose,
    onSubmit,
    currentDate,
}) {
    const { club } = useAuth()
    const [title, setTitle] = useState(existingReservation?.event_title || '')
    const [startTime, setStartTime] = useState(existingReservation?.start_time?.slice(0, 5) || '09:00')
    const [endTime, setEndTime] = useState(existingReservation?.end_time?.slice(0, 5) || '17:00')
    const [description, setDescription] = useState(existingReservation?.description || '')
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [pickerMonth, setPickerMonth] = useState(isReschedule ? currentDate : currentDate)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const today = startOfDay(new Date())
    const firstDay = startOfMonth(pickerMonth)
    const lastDay = endOfMonth(pickerMonth)
    const days = eachDayOfInterval({ start: firstDay, end: lastDay })
    const startOffset = (getDay(firstDay) + 6) % 7

    // We no longer completely block dates that have reservations, 
    // unless maybe we want to block them if they have 24 hours of events, 
    // but for simplicity we allow selection and validate times on submit.
    // We will still block `initialDate` if rescheduling to force a new date if needed,
    // though the user might want to just change the time.
    // For now, let's just make `blockedDates` empty to allow same-day selection.
    const blockedDates = new Set()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!selectedDate) { setError('Please select a date.'); return }

        // If it's a reschedule, they must change either the date or the time.
        // If they change nothing, it's not useful, but we let the backend handle generic updates 
        // or check overlap below.

        if (endTime <= startTime) { setError('End time must be after start time.'); return }

        // Local overlap check
        const dayReservations = allReservations.filter(r => r.reserved_date === selectedDate)
        const hasOverlap = dayReservations.some(r => {
            // If rescheduling, ignore the current reservation we are editing
            if (isReschedule && r.id === existingReservation?.id) return false;

            // Tech vs Non-Tech Advanced Overlap Logic
            // If the tags match EXACTLY, they are allowed to overlap! (Tech overlapping with Tech, etc.)
            // If they are different, or missing, we fall through to the time check over below.
            if (r.clubs?.tech_tag && club?.tech_tag && r.clubs.tech_tag === club.tech_tag) {
                return false;
            }

            return (
                (startTime >= r.start_time && startTime < r.end_time) ||
                (endTime > r.start_time && endTime <= r.end_time) ||
                (startTime <= r.start_time && endTime >= r.end_time)
            );
        });

        if (hasOverlap) {
            setError('Time slot overlaps with an existing reservation on this day.');
            return;
        }

        setLoading(true)
        try {
            await onSubmit({ date: selectedDate, title, startTime, endTime, description })
        } catch (err) {
            setError(err.message || 'Something went wrong.')
            setLoading(false)
        }
    }

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <motion.div
                className="modal-box"
                style={{ maxWidth: 580 }}
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
                <div className="modal-header">
                    <h2>{isReschedule ? '📆 Reschedule Event' : '📅 Reserve a Day'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Date picker mini-calendar */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Select Date
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button type="button" onClick={() => setPickerMonth(m => subMonths(m, 1))} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}>‹</button>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: 110, textAlign: 'center' }}>{format(pickerMonth, 'MMMM yyyy')}</span>
                                <button type="button" onClick={() => setPickerMonth(m => addMonths(m, 1))} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }}>›</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                            {DAYS.map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-subtle)', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
                            ))}
                            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
                            {days.map(day => {
                                const ds = format(day, 'yyyy-MM-dd')
                                const isPast = isBefore(startOfDay(day), today)
                                const isBlocked = blockedDates.has(ds)
                                const isSelected = ds === selectedDate
                                const isOriginal = isReschedule && ds === initialDate

                                let bg = 'transparent'; let color = 'var(--text-primary)'; let border = '1.5px solid transparent'
                                let cursor = 'pointer'; let opacity = 1

                                if (isPast || isBlocked) { opacity = 0.35; cursor = 'not-allowed' }
                                if (isSelected) { bg = 'var(--brand-blue)'; color = '#fff'; border = '1.5px solid var(--brand-blue)' }
                                else if (isOriginal) { border = '1.5px dashed var(--status-locked)'; color = 'var(--status-locked)' }
                                else if (isToday(day)) { border = '1.5px solid var(--brand-blue)'; color = 'var(--brand-blue)' }

                                return (
                                    <button
                                        key={ds}
                                        type="button"
                                        disabled={isPast || (isBlocked && !isOriginal)}
                                        onClick={() => !isPast && !isBlocked && setSelectedDate(ds)}
                                        style={{
                                            background: bg, color, border, cursor, opacity,
                                            borderRadius: 6, padding: '6px 0',
                                            fontSize: '0.78rem', fontWeight: isSelected ? 700 : 400,
                                            transition: 'all 0.12s',
                                        }}
                                    >{format(day, 'd')}</button>
                                )
                            })}
                        </div>
                        {selectedDate && (
                            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--brand-blue)', fontWeight: 600 }}>
                                Selected: {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                            </div>
                        )}
                    </div>

                    {/* Event fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="field">
                            <label>Event Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Annual Tech Fest"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="field">
                                <label>Start Time *</label>
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                            </div>
                            <div className="field">
                                <label>End Time *</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                            </div>
                        </div>

                        <div className="field">
                            <label>Description</label>
                            <textarea
                                placeholder="Briefly describe the event, venue, activities…"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving…' : isReschedule ? '📆 Reschedule Event' : '🔒 Reserve This Day'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div >
    )
}
