import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const createClient = () => {
	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
				'Ensure smart-bookmark-app/.env.local exists next to package.json, then fully restart `npm run dev`. ' +
				'If it still fails, stop the dev server and delete smart-bookmark-app/.next to clear cached env.'
		)
	}

	// Next.js can SSR "use client" components; avoid createBrowserClient throwing on the server.
	if (typeof window === 'undefined') {
		return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
				detectSessionInUrl: false
			}
		})
	}

	return createBrowserClient(supabaseUrl, supabaseAnonKey)
}