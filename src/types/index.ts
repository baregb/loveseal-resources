export type { Database, AdminRole, AuditAction } from './database'

export type ContentType = 'manual' | 'prophecy' | 'article' | 'blog'
export type ContentStatus = 'draft' | 'published'
export type Locale = 'en' | 'es' | 'fr' | 'pt' | 'ar'
export type SourceMode = 'pdf' | 'editor'
export type AttachmentType = 'pdf' | 'image' | 'audio' | 'other'

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'super_admin'
}

export interface ContentFilters {
  type?: ContentType
  category?: string
  tag?: string
  query?: string
  status?: ContentStatus
  locale?: Locale
}

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
