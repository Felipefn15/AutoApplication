import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Auth callback initiated:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const next = requestUrl.searchParams.get('next') ?? '/jobs'
  const origin = requestUrl.origin

  console.log('Parsed callback parameters:', {
    hasCode: !!code,
    hasState: !!state,
    next,
    origin,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  if (!code) {
    console.error('No code present in callback URL');
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
          const cookie = request.cookies.get(name)
          console.log('Reading cookie:', { name, value: cookie ? '**present**' : '**missing**' });
          return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
          console.log('Setting cookie:', { name, options });
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
          console.log('Removing cookie:', { name, options });
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

  try {
    console.log('Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', {
        error: {
          message: error.message,
          status: error.status,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    console.log('Successfully exchanged code for session:', {
      hasSession: !!data.session,
      user: data.session?.user?.email
    });
    
    return response
  } catch (error) {
    console.error('Unexpected error in callback:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }
} 