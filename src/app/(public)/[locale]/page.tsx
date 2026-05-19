import { setRequestLocale } from 'next-intl/server'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/public/ContentCard'
import AboutStrip from '@/components/landing/AboutStrip'
import FeaturedSection from '@/components/landing/FeaturedSection'
import InFocusStrip from '@/components/landing/InFocusStrip'
import LatestSection from '@/components/landing/LatestSection'

/* Dynamic-import LandingHero so framer-motion (~40KB gzipped) doesn't ship in
   the initial bundle. SSR is preserved (no LCP regression on the hero markup),
   but the client chunk is code-split and loads after the initial HTML/CSS,
   unblocking hydration of the rest of the page. */
const LandingHero = dynamic(() => import('@/components/landing/LandingHero'))

/* HeroItem is duplicated locally because `Parameters<typeof LandingHero>` no
   longer resolves once the component is wrapped by next/dynamic — the dynamic
   wrapper type is opaque. Kept in shape sync with the interface in
   LandingHero.tsx; if you add a field there, mirror it here. */
interface HeroItem {
  id:              string
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  cover_image_url: string | null
  created_at:      string
}

/* 1-hour ISR window. The public site is primarily refreshed on demand by
   `revalidatePath` calls from admin content actions (publish/unpublish/update/
   delete) and translate-actions — see docs/isr-and-revalidation.md. The 3600s
   window is a safety net for any code path that mutates content without
   calling revalidatePath. (Pure `force-static` would be cleaner but doesn't
   work here because createClient() reads cookies, which is a dynamic API.) */
export const revalidate = 3600

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const { data: heroData } = await supabase
    .from('content')
    .select('id, title, content_type, theme, speaker, cover_image_url, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(8)

  const heroItems = (heroData ?? []) as HeroItem[]

  const { data: featuredData } = await supabase
    .from('content')
    .select('id, title, content_type, theme, speaker, date_preached, cover_image_url, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  const featuredItems = (featuredData ?? []) as Parameters<typeof FeaturedSection>[0]['items']

  const types = ['manual', 'prophecy', 'article', 'blog'] as const
  const fetches = await Promise.all(
    types.map(t =>
      supabase
        .from('content')
        .select('id, title, content_type, theme, speaker, series, date_preached, cover_image_url, created_at, summary_points')
        .eq('status', 'published')
        .eq('content_type', t)
        .order('created_at', { ascending: false })
        .limit(4)
    )
  )

  const sections = types.map((type, idx) => ({
    type,
    items: ((fetches[idx].data ?? []) as Parameters<typeof ContentCard>[0]['item'][]),
  }))

  return (
    <div>
      <LandingHero items={heroItems} />

      <InFocusStrip />

      <FeaturedSection items={featuredItems} />

      <AboutStrip />

      {sections.map(section => (
        <LatestSection key={section.type} type={section.type} items={section.items} />
      ))}
    </div>
  )
}