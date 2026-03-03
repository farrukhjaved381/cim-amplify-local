'use client'

import { useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Header from "@/components/ui/auth-header";
import Footer from "@/components/ui/auth-footer";

export default function BuyerForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/buyer/forgot-password`,
        { email }
      )

      setMessage(response.data?.message || 'Password reset email sent.')
      toast({
        title: 'Success',
        description: response.data?.message || 'Password reset email sent.',
      })
    } catch (err: any) {
      let errorMessage = "Unable to send reset email. Please try again.";
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status === 404) {
        errorMessage = "No account found with this email address. Please check your email or register for a new account.";
      } else if (err?.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a few minutes.";
      } else if (err.message && err.message.includes("Network Error")) {
        errorMessage = "Network connection error. Please check your internet connection and try again.";
      }
      
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Header />
    <div className="flex h-screen bg-gradient-to-b from-[#C7D7D7] to-[#8C9EA8] overflow-hidden">
      {/* Left Side - Illustration */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
        <Image
          src="/Bg.svg"
          alt="Forgot Password Illustration"
          width={500}
          height={500}
          priority
          className="z-10 bg-cover bg-center w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full md:w-2/3 bg-white rounded-l-[30px] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Forgot Password</h1>

          {message && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{message}</div>
          )}
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full py-6"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white py-6 rounded-3xl"
              disabled={isLoading}
            >
              {isLoading ? 'Sending reset email...' : 'Send Reset Email'}
            </Button>
          </form>
        </div>
      </div>

      <Toaster />
    </div>
    <Footer />
    </div>
  );
}
