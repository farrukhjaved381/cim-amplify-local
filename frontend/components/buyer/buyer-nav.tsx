"use client"

import Link from "next/link"
import { Briefcase, Store, Settings, User, LogOut, Users } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/contexts/auth-context"

type ActivePage = "deals" | "marketplace" | "company-profile" | "profile" | "team" | "member-profile"

interface BuyerNavProps {
  activePage: ActivePage
  onLogout: () => void
  onNavigate?: () => void
}

interface NavItem {
  key: string
  permissionKey: string
  label: string
  path: string
  Icon: React.ComponentType<{ className?: string }>
}

export function BuyerNav({ activePage, onLogout, onNavigate }: BuyerNavProps) {
  const { hasPermission, isTeamMember } = usePermissions()
  const { isLoggedIn } = useAuth()

  // Don't render nav items during logout transition to prevent flash
  if (!isLoggedIn) {
    return (
      <nav className="flex flex-col p-4">
        <button
          onClick={() => { onNavigate?.(); onLogout() }}
          className="mt-4 flex items-center rounded-md px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-left w-full transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </nav>
    )
  }

  const navItems: NavItem[] = [
    { key: "deals", permissionKey: "dashboard", label: "All Deals", path: "/buyer/deals", Icon: Briefcase },
    { key: "marketplace", permissionKey: "marketplace", label: "Marketplace", path: "/buyer/marketplace", Icon: Store },
    { key: "company-profile", permissionKey: "company-profile", label: "Company Profile", path: "/buyer/company-profile", Icon: Settings },
  ]

  const filteredItems = navItems.filter((item) => hasPermission(item.permissionKey))

  const navLinkClass = (key: string) =>
    `mb-2 flex items-center rounded-md px-4 py-3 transition-colors ${
      activePage === key
        ? "bg-teal-500 text-white hover:bg-teal-600"
        : "text-gray-700 hover:bg-gray-100"
    }`

  return (
    <nav className="flex flex-col p-4">
      {/* Permission-filtered pages */}
      {filteredItems.map((item) => (
        <Link key={item.key} href={item.path} onClick={onNavigate} className={navLinkClass(item.key)}>
          <item.Icon className="mr-3 h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Team - only for owners, above My Profile */}
      {!isTeamMember && (
        <Link href="/buyer/team" onClick={onNavigate} className={navLinkClass("team")}>
          <Users className="mr-3 h-5 w-5" />
          <span>Team</span>
        </Link>
      )}

      {/* My Profile - owners */}
      {!isTeamMember && (
        <Link href="/buyer/profile" onClick={onNavigate} className={navLinkClass("profile")}>
          <User className="mr-3 h-5 w-5" />
          <span>My Profile</span>
        </Link>
      )}

      {/* My Profile - members (always shown) */}
      {isTeamMember && (
        <Link href="/buyer/member-profile" onClick={onNavigate} className={navLinkClass("member-profile")}>
          <User className="mr-3 h-5 w-5" />
          <span>My Profile</span>
        </Link>
      )}

      <button
        onClick={() => { onNavigate?.(); onLogout() }}
        className="mt-4 flex items-center rounded-md px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-left w-full transition-colors"
      >
        <LogOut className="mr-3 h-5 w-5" />
        <span>Sign Out</span>
      </button>
    </nav>
  )
}
