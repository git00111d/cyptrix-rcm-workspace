// Import the configured Supabase client
export { supabase } from '@/integrations/supabase/client'

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return true // Since we have the integrated client, it's always configured
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'PROVIDER' | 'EMPLOYEE' | 'AUDITOR' | 'ADMIN'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'PROVIDER' | 'EMPLOYEE' | 'AUDITOR' | 'ADMIN'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'PROVIDER' | 'EMPLOYEE' | 'AUDITOR' | 'ADMIN'
          active?: boolean
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          provider_id: string
          filename: string
          file_path: string
          page_count: number
          file_size: number
          uploaded_at: string
          status: 'UPLOADED' | 'ASSIGNED' | 'CODING_IN_PROGRESS' | 'CODING_COMPLETE' | 'UNDER_AUDIT' | 'APPROVED' | 'REJECTED'
        }
        Insert: {
          id?: string
          provider_id: string
          filename: string
          file_path: string
          page_count: number
          file_size: number
          uploaded_at?: string
          status?: 'UPLOADED' | 'ASSIGNED' | 'CODING_IN_PROGRESS' | 'CODING_COMPLETE' | 'UNDER_AUDIT' | 'APPROVED' | 'REJECTED'
        }
        Update: {
          id?: string
          provider_id?: string
          filename?: string
          file_path?: string
          page_count?: number
          file_size?: number
          status?: 'UPLOADED' | 'ASSIGNED' | 'CODING_IN_PROGRESS' | 'CODING_COMPLETE' | 'UNDER_AUDIT' | 'APPROVED' | 'REJECTED'
        }
      }
      document_codes: {
        Row: {
          id: string
          document_id: string
          employee_id: string
          page_number: number
          icd10_codes: string[]
          cpt_codes: string[]
          notes: string
          coded_at: string
        }
        Insert: {
          id?: string
          document_id: string
          employee_id: string
          page_number: number
          icd10_codes: string[]
          cpt_codes: string[]
          notes?: string
          coded_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          employee_id?: string
          page_number?: number
          icd10_codes?: string[]
          cpt_codes?: string[]
          notes?: string
        }
      }
    }
  }
}