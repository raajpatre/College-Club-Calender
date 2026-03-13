import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useAuth } from './useAuth'

export function useReservations(currentDate) {
    const { club } = useAuth()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)

    // ── Notifications ────────────────────────────────────────────
    const [notifications, setNotifications] = useState([])
    const unreadCount = notifications.filter(n => !n.read).length

    const fetchNotifications = useCallback(async () => {
        if (!club) return
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_club_id', club.id)
            .order('created_at', { ascending: false })
            .limit(30)
        setNotifications(data || [])
    }, [club])

    const markRead = async (id) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllRead = async () => {
        if (!club) return
        await supabase.from('notifications').update({ read: true })
            .eq('recipient_club_id', club.id).eq('read', false)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    // ── Reservations ─────────────────────────────────────────────
    const fetchReservations = useCallback(async () => {
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
        setLoading(true)
        const { data, error } = await supabase
            .from('reservations')
            .select('*, clubs!inner(id, name, category, president_id, is_active, tech_tag)')
            .gte('reserved_date', start)
            .lte('reserved_date', end)
            .eq('clubs.is_active', true)
        if (!error) setReservations(data || [])
        setLoading(false)
    }, [currentDate])

    useEffect(() => {
        fetchReservations()
        fetchNotifications()

        const resvChannel = supabase
            .channel('reservations-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchReservations)
            .subscribe()

        const notifChannel = club
            ? supabase
                .channel(`notifications-${club.id}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'notifications',
                    filter: `recipient_club_id=eq.${club.id}`,
                }, (payload) => setNotifications(prev => [payload.new, ...prev]))
                .subscribe()
            : null

        return () => {
            supabase.removeChannel(resvChannel)
            if (notifChannel) supabase.removeChannel(notifChannel)
        }
    }, [fetchReservations, fetchNotifications, club])

    // ── Reservation CRUD ─────────────────────────────────────────
    const reserveDay = async (date, payload) => {
        if (!club) throw new Error('No club found')
        const today = format(new Date(), 'yyyy-MM-dd')
        const { count, error: countErr } = await supabase
            .from('reservations').select('id', { count: 'exact', head: true })
            .eq('club_id', club.id).gte('reserved_date', today)
        if (countErr) throw countErr
        if (count >= 2) throw new Error(
            'Reservation limit reached. You can hold at most 2 upcoming events at a time. ' +
            'Wait for an existing event to pass or release one before booking again.'
        )
        const { error } = await supabase.from('reservations').insert({
            club_id: club.id, reserved_date: date,
            event_title: payload.title, start_time: payload.startTime,
            end_time: payload.endTime, description: payload.description,
        })
        if (error) throw error
        await fetchReservations()
    }

    const releaseDay = async (reservationId) => {
        const { error } = await supabase.from('reservations').delete().eq('id', reservationId)
        if (error) throw error
        await fetchReservations()
    }

    const rescheduleDay = async (reservationId, newDate, payload) => {
        const { error } = await supabase.from('reservations').update({
            reserved_date: newDate, event_title: payload.title,
            start_time: payload.startTime, end_time: payload.endTime,
            description: payload.description,
        }).eq('id', reservationId)
        if (error) throw error
        await fetchReservations()
    }

    // ── Swap Requests ─────────────────────────────────────────────
    const requestSwap = async (targetReservationId) => {
        if (!club) throw new Error('No club found')
        const { error } = await supabase.from('swap_requests').insert({
            requester_club_id: club.id,
            target_reservation_id: targetReservationId,
        })
        if (error) throw error
    }

    const acceptSwap = async (swapId) => {
        const { error } = await supabase.rpc('accept_swap', { swap_id: swapId })
        if (error) throw error
        await fetchReservations()
        await fetchNotifications()
    }

    const rejectSwap = async (swapId) => {
        const { error } = await supabase.rpc('reject_swap', { swap_id: swapId })
        if (error) throw error
        await fetchNotifications()
    }

    const getReservationsForDate = (dateStr) =>
        reservations.filter(r => r.reserved_date === dateStr)

    return {
        reservations, loading,
        reserveDay, releaseDay, rescheduleDay, getReservationsForDate,
        notifications, unreadCount, markRead, markAllRead,
        requestSwap, acceptSwap, rejectSwap,
    }
}
