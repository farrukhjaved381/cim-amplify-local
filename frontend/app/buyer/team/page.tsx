"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { BuyerNav } from "@/components/buyer/buyer-nav"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import { BuyerProtectedRoute } from "@/components/buyer/protected-route"
import { TeamManagement } from "@/components/team/team-management"

export default function BuyerTeamPage() {
  const router = useRouter()
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
    <BuyerProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="CIM Amplify" className="h-8" />
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
              <BuyerNav activePage="team" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block md:w-56 border-r border-gray-200 bg-white h-[calc(100vh-4rem)] sticky top-[4rem] overflow-y-auto flex-shrink-0">
            <BuyerNav activePage="team" onLogout={handleLogout} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="text-sm text-gray-500">Manage your team members and permissions</p>
            </div>
            <TeamManagement ownerType="buyer" />
          </main>
        </div>
      </div>
      <Toaster />
    </BuyerProtectedRoute>
  )
}
