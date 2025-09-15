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
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await fetchUserProfile(session.user, session)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session?.user)
      
      if (session?.user) {
        await fetchUserProfile(session.user, session)
      } else {
        setUser(null)
      }
      
      // Always set loading to false after auth state change
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser: User, authSession?: any) => {
    console.log('fetchUserProfile called with user:', authUser.id)
    console.log('supabase client exists:', !!supabase)
    
    if (!supabase) {
      console.error('No supabase client available')
      return
    }
    
    // Set user immediately from auth metadata to unblock login
    const userData = authUser.user_metadata || {}
    console.log('Auth user metadata:', userData)
    
    setUser({
      userId: authUser.id,
      name: userData.name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      role: (userData.role as AuthUser['role']) || 'PROVIDER',
      active: true,
      createdAt: authUser.created_at || new Date().toISOString(),
      token: authSession?.access_token || ''
    })
    
    console.log('User set immediately from auth data')
    
    // Try to fetch/create profile in background (don't block login)
    try {
      console.log('Fetching profile for user:', authUser.id)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      console.log('Profile fetch completed:', { profile, error })

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (profile) {
        console.log('Updating user from profile:', profile)
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
        console.log('No profile found, attempting to create one...')
        
        // Try to create profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            name: userData.name || authUser.email?.split('@')[0] || 'User',
            role: userData.role || 'PROVIDER'
          })
          
        if (insertError) {
          console.log('Profile creation failed (user may already exist):', insertError.message)
        } else {
          console.log('Profile created successfully')
        }
      }
    } catch (error) {
      console.error('Exception in profile operations (this is OK, user is still logged in):', error)
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
        console.error('Login error:', error.message)
        return false
      }

      if (data.user && data.session) {
        console.log('Login successful, user:', data.user.id)
        
        // Set user immediately and stop loading
        await fetchUserProfile(data.user, data.session)
        setIsLoading(false)
        
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