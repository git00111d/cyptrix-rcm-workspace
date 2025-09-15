import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { AuthUser, LoginCredentials } from '@/types/user'

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only proceed if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user, session)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user, session)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser: User, authSession?: any) => {
    if (!supabase) return
    
    try {
      console.log('Fetching profile for user:', authUser.id)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      console.log('Profile fetch result:', { profile, error })

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      if (profile) {
        console.log('Setting user from profile:', profile)
        setUser({
          userId: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as AuthUser['role'],
          active: profile.active,
          createdAt: profile.created_at,
          token: authSession?.access_token || ''
        })
      } else {
        console.log('No profile found, creating from auth user data')
        // If no profile exists, create one from the auth user metadata
        const userData = authUser.user_metadata || {}
        
        // Try to create the profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            name: userData.name || authUser.email?.split('@')[0] || 'User',
            role: userData.role || 'PROVIDER'
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        }
        
        // Always set user from auth data if no profile exists
        console.log('Setting user from auth metadata:', userData)
        setUser({
          userId: authUser.id,
          name: userData.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: (userData.role as AuthUser['role']) || 'PROVIDER',
          active: true,
          createdAt: authUser.created_at || new Date().toISOString(),
          token: authSession?.access_token || ''
        })
      }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error)
      // Fallback: set user from auth data even if profile operations fail
      const userData = authUser.user_metadata || {}
      setUser({
        userId: authUser.id,
        name: userData.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: (userData.role as AuthUser['role']) || 'PROVIDER',
        active: true,
        createdAt: authUser.created_at || new Date().toISOString(),
        token: authSession?.access_token || ''
      })
    }
  }

  const login = async (credentials: LoginCredentials) => {
    if (!supabase) return false
    
    try {
      console.log('Attempting login with:', credentials.email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      console.log('Login result:', { data, error })

      if (error) {
        console.error('Login error:', error)
        return false
      }

      if (data.user) {
        console.log('Login successful, user:', data.user.id)
        // Wait a bit for the auth state change to trigger and profile to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        return true
      }

      return false
    } catch (error) {
      console.error('Login exception:', error)
      return false
    }
  }

  const logout = async () => {
    if (!supabase) return
    
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, login, logout, isLoading }
}