'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Header from "@/components/ui/auth-header";
import Footer from "@/components/ui/auth-footer";

export default function BuyerResetPasswordPage() {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const role = searchParams.get('role') || 'buyer'
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/${role}/reset-password`,
        {
          token,
          newPassword,
          confirmPassword,
        }
      )

      const successMsg =
        response.data?.message || 'Password has been updated successfully.'
      setMessage(successMsg)
      toast({ title: 'Success', description: successMsg })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        router.push('/buyer/login')
      }, 1000)
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || 'Something went wrong during reset.'
      setError(errMsg)
      toast({
        title: 'Reset Failed',
        description: errMsg,
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
      {/* Left side - Illustration */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
        <Image
          src="/Bg.svg"
          alt="Reset Password Illustration"
          width={500}
          height={500}
          priority
          className="z-10 bg-cover bg-center w-full h-full object-cover"
        />
      </div>

      {/* Right side - Reset Password Form */}
      <div className="w-full md:w-2/3 bg-white rounded-l-[30px] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Reset Password</h1>

          {message && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full py-6 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full py-6 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white py-6 rounded-3xl"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
      <Toaster />
    </div>
    <Footer />
      <Toaster />
    </div>
  );
}
