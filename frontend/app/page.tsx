"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
export default function Home() {
  const router = useRouter()
  const { isLoggedIn, userRole, isLoading } = useAuth()
  useEffect(() => {
    if (isLoading) return
    if (isLoggedIn && userRole) {
      switch (userRole) {
        case "buyer":
          router.push("/buyer/deals")
          break
        case "seller":
          router.push("/seller/dashboard")
          break
        case "admin":
          router.push("/admin/dashboard")
          break
        default:
          router.push("/landing")
      }
    } else if (!isLoading) {
      router.push("/landing")
    }
  }, [isLoggedIn, userRole, router, isLoading])
 if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#3AAFA9] border-r-[#3AAFA9] border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#344054]">Loading...</p>
        </div>
      </div>
    )
  }
  // Render nothing while redirecting (prevents flicker)
  return null
}