import { createClientForServer } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';
import React from 'react'
import { BsDatabase } from "react-icons/bs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Form from './components/Form'

async function Dataset() {
    const supabase = await createClientForServer()
    const { data } = await supabase.auth.getUser();
    if (!data.user){
        return redirect("/auth")
    } 
    console.log(data)
    const { data: user } = await supabase
            .from("users")
            .select("role")
            .eq("id",data.user.id)
            .single()
    if(user?.role!="admin"){
        return redirect("/")
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto h-screen flex justify-center items-center p-4">
                <div className="w-full bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-600 pb-4">
                        <div className="flex items-center gap-3">
                            <BsDatabase className="w-6 h-6 text-blue-400" />
                            <h1 className="text-2xl font-semibold text-gray-100">Daily AI Dataset</h1>
                        </div>
                        <Link href="/">
                            <Button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                    <Form/>
                </div>
            </div>
        </div>
    )
}

export default Dataset