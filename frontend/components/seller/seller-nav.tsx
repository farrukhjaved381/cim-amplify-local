"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Clock, LogOut, FileText, Users, User } from "lucide-react"
import { triggerNavigationProgress } from "@/components/navigation-progress"
import { Button } from "@/components/ui/button"
import { AmplifyVenturesBox } from "@/components/seller/amplify-ventures-box"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/contexts/auth-context"

type ActivePage = "dashboard" | "loi-deals" | "deal-history" | "view-profile" | "create-deal" | "edit-deal" | "team" | "member-profile"

interface SellerNavProps {
  activePage: ActivePage
  onNavigate?: () => void
  onLogout: () => void
}

const DealIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.5 6L12 1.5L7.5 6M3.75 8.25H20.25M5.25 8.25V19.5C5.25 19.9142 5.58579 20.25 6 20.25H18C18.4142 20.25 18.75 19.9142 18.75 19.5V8.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface NavItem {
  key: string
  permissionKey: string
  label: string
  path: string
  icon: React.ReactNode
  hoverBg: string
}

export function SellerNav({ activePage, onNavigate, onLogout }: SellerNavProps) {
  const router = useRouter()
  const { hasPermission, isTeamMember } = usePermissions()
  const { isLoggedIn } = useAuth()

  // Don't render nav items during logout transition to prevent flash
  if (!isLoggedIn) {
    return (
      <>
        <div className="mb-8">
          <Link href="https://cimamplify.com/" className="block transition-transform hover:scale-105 duration-200">
            <Image src="/logo.svg" alt="CIM Amplify Logo" width={150} height={50} className="h-auto" />
          </Link>
        </div>
        <nav className="flex-1 space-y-2" />
        <AmplifyVenturesBox />
      </>
    )
  }

  const navItems: NavItem[] = [
    {
      key: "dashboard",
      permissionKey: "dashboard",
      label: "MyDeals",
      path: "/seller/dashboard",
      icon: <DealIcon className="h-4 w-4 text-gray-500 group-hover:text-teal-600 transition-colors duration-200" />,
      hoverBg: "group-hover:bg-teal-100",
    },
    {
      key: "loi-deals",
      permissionKey: "loi-deals",
      label: "LOI - Deals",
      path: "/seller/loi-deals",
      icon: <FileText className="h-4 w-4 text-gray-500 group-hover:text-amber-600 transition-colors duration-200" />,
      hoverBg: "group-hover:bg-amber-100",
    },
    {
      key: "deal-history",
      permissionKey: "deal-history",
      label: "Off Market",
      path: "/seller/history",
      icon: <Clock className="h-4 w-4 text-gray-500 group-hover:text-teal-600 transition-colors duration-200" />,
      hoverBg: "group-hover:bg-teal-100",
    },
    // Team is inserted here for owners (before View Profile) — see below
    // View Profile is always last
    {
      key: "view-profile",
      permissionKey: "view-profile",
      label: "View Profile",
      path: "/seller/view-profile",
      icon: <Eye className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />,
      hoverBg: "group-hover:bg-blue-100",
    },
  ]

  // Insert Team before View Profile for owners
  if (!isTeamMember) {
    const viewProfileIdx = navItems.findIndex(i => i.key === "view-profile");
    navItems.splice(viewProfileIdx, 0, {
      key: "team",
      permissionKey: "dashboard", // owners always have dashboard permission
      label: "Team",
      path: "/seller/team",
      icon: <Users className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 transition-colors duration-200" />,
      hoverBg: "group-hover:bg-indigo-100",
    });
  }

  // "create-deal" and "edit-deal" don't have their own sidebar entry but map to the dashboard
  const isActive = (key: string) => {
    if (key === "dashboard" && (activePage === "dashboard" || activePage === "create-deal" || activePage === "edit-deal")) return true
    if (key === "team" && activePage === "team") return true
    return key === activePage
  }

  const filteredItems = navItems.filter((item) => hasPermission(item.permissionKey))

  return (
    <>
      <div className="mb-8">
        <Link href="https://cimamplify.com/" onClick={onNavigate} className="block transition-transform hover:scale-105 duration-200">
          <Image src="/logo.svg" alt="CIM Amplify Logo" width={150} height={50} className="h-auto" />
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {filteredItems.map((item) =>
          isActive(item.key) ? (
            <Button
              key={item.key}
              variant="secondary"
              className="w-full justify-start gap-3 font-semibold bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 hover:from-teal-100 hover:to-teal-150 border border-teal-200/50 shadow-sm rounded-xl transition-all duration-200"
              onClick={onNavigate}
            >
              <div className="p-1.5 bg-teal-500 rounded-lg">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </Button>
          ) : (
            <Button
              key={item.key}
              variant="ghost"
              className="w-full justify-start gap-3 font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50/50 rounded-xl transition-all duration-200 group"
              onClick={() => {
                triggerNavigationProgress()
                onNavigate?.()
                router.push(item.path)
              }}
            >
              <div className={`p-1.5 bg-gray-100 ${item.hoverBg} rounded-lg transition-colors duration-200`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </Button>
          ),
        )}

        {/* Member Profile - only for team members (replaces View Profile position) */}
        {isTeamMember && (
          isActive("member-profile") ? (
            <Button
              variant="secondary"
              className="w-full justify-start gap-3 font-semibold bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 hover:from-teal-100 hover:to-teal-150 border border-teal-200/50 shadow-sm rounded-xl transition-all duration-200"
              onClick={onNavigate}
            >
              <div className="p-1.5 bg-teal-500 rounded-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              <span>My Profile</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50/50 rounded-xl transition-all duration-200 group"
              onClick={() => {
                triggerNavigationProgress()
                onNavigate?.()
                router.push("/seller/member-profile")
              }}
            >
              <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors duration-200">
                <User className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
              </div>
              <span>My Profile</span>
            </Button>
          )
        )}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
            onClick={() => {
              onNavigate?.()
              onLogout()
            }}
          >
            <div className="p-1.5 bg-red-100 rounded-lg">
              <LogOut className="h-4 w-4 text-red-600" />
            </div>
            <span>Sign Out</span>
          </Button>
        </div>
      </nav>

      <AmplifyVenturesBox />
    </>
  )
}
