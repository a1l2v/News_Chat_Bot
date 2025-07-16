'use client'
import {signInWithGithub,signInWithGoogle} from '@/utils/actions'
import { Button } from '../ui/button'

import React from 'react'

const AuthForm = () => {
  return (
    <div>
        <form className="flex flex-col gap-4">
            <Button className="w-full bg-indigo-500" formAction={signInWithGithub}>
                Sign In with Github 
            </Button>
            <Button className="w-full bg-indigo-500" formAction={signInWithGoogle}>
                Sign In with Google 
            </Button>
        </form>
    </div>
  )
}

export default AuthForm