/**
 * Generates a .ics calendar file from a reservation and triggers a download.
 */
export function downloadIcs(reservation) {
    const { event_title, reserved_date, start_time, end_time, description, clubs } = reservation

    // Build DTSTART / DTEND in UTC format (yyyyMMddTHHmmssZ)
    // Times are stored as HH:MM:SS — parse into Date on the reserved date
    const [startH, startM] = (start_time || '09:00').split(':').map(Number)
    const [endH, endM] = (end_time || '17:00').split(':').map(Number)

    const [year, month, day] = reserved_date.split('-').map(Number)
    const dtStart = new Date(Date.UTC(year, month - 1, day, startH, startM, 0))
    const dtEnd = new Date(Date.UTC(year, month - 1, day, endH, endM, 0))

    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace('.000', '')

    const uid = `${reserved_date}-${clubs?.name || 'event'}@nstcal`.replace(/\s/g, '-').toLowerCase()
    const summary = event_title || 'NST Club Event'
    const desc = description ? description.replace(/\n/g, '\\n') : ''
    const organizer = clubs?.name || 'NST Club'

    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NST Club Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(dtStart)}`,
        `DTEND:${fmt(dtEnd)}`,
        `SUMMARY:${summary} — ${organizer}`,
        desc ? `DESCRIPTION:${desc}` : '',
        `LOCATION:NST Campus`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${summary.replace(/[^a-z0-9]/gi, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
}
