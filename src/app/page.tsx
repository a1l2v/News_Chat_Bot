import { createClientForServer } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Search from '@/components/Search'

export default async function Home() {
  const supabase = await createClientForServer()

  const {data} = await supabase.auth.getUser()

  if (!data.user)
    redirect("/auth")

  
  return (
    <div className='min-h-screen bg-gray-900 text-white'>
      <div className='max-w-6xl mx-auto h-screen flex justify-center items-center p-4'>
        <div className='w-full h-[90vh] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 flex flex-col p-6'>
          <Search />
        </div>
      </div>
    </div>
  )
}