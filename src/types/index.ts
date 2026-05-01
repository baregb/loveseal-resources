/* ─────────────────────────────────────────────────────────────────────────────
   LOVE SEAL CHURCH — GLOBAL TYPES
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Content Types ── */

export type ContentType = 'manual' | 'prophecy' | 'article' | 'blog'

export type ContentStatus = 'draft' | 'published'

export type Locale = 'en' | 'es' | 'fr' | 'pt' | 'ar'

export interface ContentItem {
  id: string
  title: string
  content_type: ContentType
  category: string
  tags: string[]
  extracted_text: string | null
  summary_points: string[] | null
  pdf_url: string
  cover_image_url: string | null
  status: ContentStatus
  language: Locale
  created_at: string
  updated_at: string
  // Computed field — signed URL from Supabase Storage
  pdf_download_url?: string
}

export interface ContentSummary {
  id: string
  title: string
  content_type: ContentType
  category: string
  tags: string[]
  cover_image_url: string | null
  status: ContentStatus
  language: Locale
  created_at: string
}

/* ── Category ── */

export interface Category {
  id: string
  name: string
  slug: string
  content_type: ContentType | 'all'
  created_at: string
}

/* ── Admin ── */

export interface AdminUser {
  id: string
  email: string
  role: 'admin'
}

/* ── Filtering ── */

export interface ContentFilters {
  type?: ContentType
  category?: string
  tag?: string
  query?: string
  status?: ContentStatus
  locale?: Locale
}

/* ── API Responses ── */

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

/* ── Upload ── */

export interface UploadPayload {
  title: string
  content_type: ContentType
  category: string
  tags: string[]
  language: Locale
  summary_points?: string[]
  file: File
  cover_image?: File
}

/* ── Supabase Database schema (matches DB exactly) ── */

export interface Database {
  public: {
    Tables: {
      content: {
        Row: ContentItem
        Insert: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ContentItem, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
    }
  }
}
