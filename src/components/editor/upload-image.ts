import { createClient } from '@/lib/supabase/client'

/**
 * Upload an image file to the content-assets bucket and return its public URL.
 * Used by the editor toolbar's image button.
 */
export async function uploadEditorImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files allowed')
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Image must be under 20 MB')
  }

  const supabase = createClient()
  const ext  = file.name.split('.').pop() ?? 'png'
  const path = `editor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('content-assets')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('content-assets')
    .getPublicUrl(path)

  return publicUrl
}
