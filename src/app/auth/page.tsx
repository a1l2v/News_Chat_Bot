/* eslint-disable react/no-unescaped-entities */
import AuthForm from '@/components/forms/AuthForm'
import React from 'react'
import { createClientForServer } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { BsNewspaper } from 'react-icons/bs';

const Page = async () => {
  const supabase = await createClientForServer()
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-lg p-8 space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BsNewspaper className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">
                Welcome to News AI Chatbot
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                Stay updated with the world's latest events using our AI-powered news assistant. Ask questions, get summaries, and explore headlines—all in one place.
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-400">Sign in to continue</span>
              </div>
            </div>

            {/* Auth Form */}
            <AuthForm />
          </div>
        </div>
      </div>
    )
  } else {
    redirect("/")
  }
}

export default Page
