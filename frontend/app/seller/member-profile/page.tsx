"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import SellerProtectedRoute from "@/components/seller/protected-route"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MemberProfileForm } from "@/components/team/member-profile-form"
import { SellerNav } from "@/components/seller/seller-nav"

export default function SellerMemberProfilePage() {
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("token")
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app"
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: sessionStorage.getItem("refreshToken") }),
        }).catch(() => {})
      }
    } finally {
      logout()
    }
  }

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-0 h-screen bg-white/80 backdrop-blur-sm border-r border-gray-100 p-6 flex flex-col overflow-y-auto shadow-sm">
            <SellerNav activePage="member-profile" onLogout={handleLogout} />
          </div>
        </div>

        <div className="flex-1 space-y-4 p-3 sm:p-6 overflow-auto">
          <header className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 sm:px-6 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-teal-50 transition-colors rounded-xl">
                    <Menu className="h-6 w-6 text-gray-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] flex flex-col h-full overflow-hidden bg-white/95 backdrop-blur-md">
                  <SheetHeader><SheetTitle className="text-gray-800">Menu</SheetTitle></SheetHeader>
                  <div className="mt-6 flex-1 overflow-y-auto pb-6">
                    <SellerNav activePage="member-profile" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">My Profile</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage your account settings</p>
              </div>
            </div>
          </header>

          <MemberProfileForm />
        </div>
      </div>
      <Toaster />
    </SellerProtectedRoute>
  )
}
