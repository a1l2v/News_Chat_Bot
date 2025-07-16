
import { NextResponse } from 'next/server'
import { createClientForServer } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  
  if (!next.startsWith('/')) {
    next = '/'
  }

  const baseUrl = process.env.SITE_URL || 'https://news-chat-bot.vercel.app'

  if (code) {
    const supabase = await createClientForServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the next page with full URL
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Always redirect with full URL, even on error
  return NextResponse.redirect(`${baseUrl}/`)
}