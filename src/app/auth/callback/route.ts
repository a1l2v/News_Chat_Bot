import { NextResponse } from 'next/server'
import { createClientForServer } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createClientForServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Fix starts here
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
      const protocol = host?.includes('localhost') ? 'http' : 'https'
      const baseUrl = `${protocol}://${host}`

      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect('/')
}
