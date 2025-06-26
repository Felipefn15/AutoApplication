export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          created_at: string
          title: string
          company: string
          location: string
          description: string
          url: string
          status: 'pending' | 'applied' | 'rejected' | 'interviewing'
          user_id: string
          source: string
          salary_range?: string
          requirements?: string[]
          benefits?: string[]
          applied_at?: string
          last_status_change?: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          company: string
          location: string
          description: string
          url: string
          status?: 'pending' | 'applied' | 'rejected' | 'interviewing'
          user_id: string
          source: string
          salary_range?: string
          requirements?: string[]
          benefits?: string[]
          applied_at?: string
          last_status_change?: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          company?: string
          location?: string
          description?: string
          url?: string
          status?: 'pending' | 'applied' | 'rejected' | 'interviewing'
          user_id?: string
          source?: string
          salary_range?: string
          requirements?: string[]
          benefits?: string[]
          applied_at?: string
          last_status_change?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name?: string
          resume_url?: string
          job_preferences?: {
            roles?: string[]
            locations?: string[]
            remote?: boolean
            salary_min?: number
            salary_max?: number
            skills?: string[]
          }
          settings?: {
            email_notifications?: boolean
            auto_apply?: boolean
          }
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name?: string
          resume_url?: string
          job_preferences?: {
            roles?: string[]
            locations?: string[]
            remote?: boolean
            salary_min?: number
            salary_max?: number
            skills?: string[]
          }
          settings?: {
            email_notifications?: boolean
            auto_apply?: boolean
          }
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          resume_url?: string
          job_preferences?: {
            roles?: string[]
            locations?: string[]
            remote?: boolean
            salary_min?: number
            salary_max?: number
            skills?: string[]
          }
          settings?: {
            email_notifications?: boolean
            auto_apply?: boolean
          }
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 