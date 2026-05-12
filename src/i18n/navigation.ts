import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation primitives.
// Use these in PUBLIC pages instead of next/link / next/navigation.
// Admin pages keep using next/link directly since admin is locale-agnostic.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
