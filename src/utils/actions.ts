'use server';

import { createClientForServer } from '@/utils/supabase/server';
import { Provider } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const signInWith = async (provider: Provider): Promise<void> => {
  const supabase = await createClientForServer();

  const callback_url = `${process.env.SITE_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callback_url,
    },
  });
  console.log(data);
  if (error) {
    console.log(error);
  }

  if (data.url) {
    redirect(data.url);
  } else {
    throw new Error('OAuth sign-in did not return a redirect URL.');
  }
};


const signOut = async ()=>{
  const supabase = await createClientForServer();
  supabase.auth.signOut()
  redirect("/auth")
}


const signInWithGoogle = () => signInWith('google');
const signInWithGithub = () => signInWith('github')

export { signInWithGoogle,signInWithGithub,signOut };




