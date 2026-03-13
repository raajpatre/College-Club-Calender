import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [club, setClub] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchClubAndAdmin = async (userId) => {
        const [{ data: clubData }, { data: adminData }] = await Promise.all([
            supabase.from('clubs').select('*').eq('president_id', userId).eq('is_active', true).single(),
            supabase.from('admins').select('id').eq('id', userId).single(),
        ])
        setClub(clubData || null)
        setIsAdmin(!!adminData)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchClubAndAdmin(session.user.id)
                .finally(() => setLoading(false))
            else setLoading(false)
        })

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchClubAndAdmin(session.user.id)
            } else {
                setClub(null)
                setIsAdmin(false)
            }
        })
        return () => listener.subscription.unsubscribe()
    }, [])

    const signIn = async (username, password) => {
        const email = `${username.toLowerCase()}@nstcal.internal`
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null); setClub(null); setIsAdmin(false)
    }

    return (
        <AuthContext.Provider value={{ user, club, isAdmin, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
