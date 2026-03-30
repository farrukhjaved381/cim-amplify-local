"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Clock, Menu, Building2, MapPin, Calendar, DollarSign, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import SellerProtectedRoute from "@/components/seller/protected-route"
import { SellerNav } from "@/components/seller/seller-nav"

interface Deal {
  id: string
  title: string
  description: string
  industrySector: string
  geographySelection: string
  buyersActive: number
  buyersPassed: number
  updatedAt: string
  finalSalePrice: string | null
  trailingEBITDAAmount?: number
  trailingRevenueAmount?: number
  closedWithBuyerCompany?: string
  closedWithBuyerEmail?: string
  wasLOIDeal?: boolean
}

// Helper to get API URL
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app";
  }
  return "https://cim-backend.vercel.app";
};

function getProfilePictureUrl(path: string | null) {
  if (!path) return null
  if (path.startsWith("data:image")) return path
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const apiUrl = getApiUrl()
  const formattedPath = path.replace(/\\/g, "/")
  return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.slice(1) : formattedPath}`
}

function DealCard({ deal }: { deal: Deal }) {
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "N/A"
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-teal-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Teal Header with title and badges */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-4 sm:px-5 py-3 sm:py-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
        <h2 className="text-white font-semibold text-base sm:text-lg line-clamp-2 xs:truncate xs:pr-4 w-full xs:w-auto">
          {deal.title}
        </h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          {deal.wasLOIDeal && (
            <span className="inline-flex items-center text-xs px-2.5 sm:px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium shadow-sm">
              LOI
            </span>
          )}
          <span className="inline-flex items-center text-xs px-2.5 sm:px-3 py-1 rounded-full bg-white text-teal-700 font-medium shadow-sm">
            Completed
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {/* Description */}
        {deal.description && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
            {deal.description}
          </p>
        )}

        {/* Info Grid - Label on left, value on right */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Industry</span>
              <span className="xs:hidden">Ind.</span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-teal-600 truncate text-right">{deal.industrySector || "N/A"}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Location</span>
              <span className="xs:hidden">Loc.</span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate text-right">{deal.geographySelection || "N/A"}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              T12 Revenue
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {formatCurrency(deal.trailingRevenueAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              T12 EBITDA
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {formatCurrency(deal.trailingEBITDAAmount)}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-2.5 sm:pt-3 mt-2.5 sm:mt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Closing Date</span>
                <span className="xs:hidden">Closed</span>
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{deal.updatedAt || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Final Sale Price</span>
              <span className="xs:hidden">Sale Price</span>
            </span>
            <span className={`text-xs sm:text-sm font-medium ${deal.finalSalePrice && deal.finalSalePrice !== "N/A" ? "text-teal-600" : "text-red-500"}`}>
              {deal.finalSalePrice && deal.finalSalePrice !== "N/A" ? `$${deal.finalSalePrice}` : "N/A"}
            </span>
          </div>

          {/* Buyer Information if available */}
          {(deal.closedWithBuyerCompany || deal.closedWithBuyerEmail) && (
            <div className="border-t border-gray-100 pt-2.5 sm:pt-3 mt-2.5 sm:mt-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Buyer Information
              </div>
              {deal.closedWithBuyerCompany && (
                <p className="text-xs sm:text-sm font-medium text-gray-700 ml-5 sm:ml-6 truncate">{deal.closedWithBuyerCompany}</p>
              )}
              {deal.closedWithBuyerEmail && (
                <p className="text-xs text-teal-600 ml-5 sm:ml-6 truncate">{deal.closedWithBuyerEmail}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DealsHistoryPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoadingDeals, setIsLoadingDeals] = useState(true)
  const [dealsError, setDealsError] = useState<string | null>(null)

  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const token = sessionStorage.getItem("token")
        const apiUrl = getApiUrl()

        const response = await fetch(`${apiUrl}/sellers/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSellerProfile(data)
        }
      } catch (error) {
        // Error fetching seller profile
      }
    }
    fetchSellerProfile()
  }, [])

  // Fetch completed deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setIsLoadingDeals(true)
        setDealsError(null)
        const token = sessionStorage.getItem("token")
        const apiUrl = getApiUrl()

        const response = await fetch(`${apiUrl}/deals/completed`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Map backend fields to frontend Deal interface
          const mappedDeals: Deal[] = data.map((deal: any, idx: number) => ({
            id: deal.id || deal._id || `deal-${idx}`,
            title: deal.title,
            description: deal.companyDescription,
            industrySector: deal.industrySector,
            geographySelection: deal.geographySelection,
            trailingEBITDAAmount: deal.financialDetails?.trailingEBITDAAmount,
            trailingRevenueAmount: deal.financialDetails?.trailingRevenueAmount,
            buyersActive: deal.interestedBuyers?.length || 0,
            buyersPassed:
              (deal.targetedBuyers?.length || 0) - (deal.interestedBuyers?.length || 0),
            updatedAt:
              deal.timeline?.completedAt
                ? new Date(deal.timeline.completedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : deal.updatedAt
                ? new Date(deal.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A",
            finalSalePrice: deal.financialDetails?.finalSalePrice
              ? deal.financialDetails.finalSalePrice.toLocaleString()
              : null,
            closedWithBuyerCompany: deal.closedWithBuyerCompany,
            closedWithBuyerEmail: deal.closedWithBuyerEmail,
            wasLOIDeal: deal.wasLOIDeal || false,
          }))
          setDeals(mappedDeals)
        } else {
          setDealsError("Failed to fetch deals")
        }
      } catch (error) {
        setDealsError("Error loading deals")
      } finally {
        setIsLoadingDeals(false)
      }
    }
    fetchDeals()
  }, [])

  const filteredDeals = deals.filter(
    (deal) =>
      (deal.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (deal.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const handleLogout = () => {
    logout() // logout() from useAuth already handles redirect
  }

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-0 h-screen bg-white border-r border-gray-200 p-6 flex flex-col overflow-y-auto">
            <SellerNav activePage="deal-history" onLogout={handleLogout} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] flex flex-col h-full overflow-hidden">
                  <SheetHeader>
                    <SheetTitle className="text-gray-800">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex-1 overflow-y-auto pb-6">
                    <SellerNav activePage="deal-history" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">Off Market Deals</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Search */}
            <div className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Search deals..."
                className="w-48 lg:w-64 pl-10 bg-gray-50 border-gray-200 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden lg:block">
                {sellerProfile?.fullName || "User"}
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium overflow-hidden ring-2 ring-white shadow-md">
                {sellerProfile?.profilePicture ? (
                  <img
                    src={getProfilePictureUrl(sellerProfile.profilePicture) || "/placeholder.svg"}
                    alt={sellerProfile.fullName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                ) : (
                  <span className="text-xs sm:text-sm">{(sellerProfile?.fullName || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-gray-200">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search deals..."
              className="w-full pl-9 sm:pl-10 bg-gray-50 border-gray-200 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          {isLoadingDeals ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl sm:rounded-2xl border-2 border-teal-100 overflow-hidden">
                  <Skeleton className="h-12 sm:h-14 w-full" />
                  <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                    <Skeleton className="h-3.5 sm:h-4 w-full" />
                    <Skeleton className="h-3.5 sm:h-4 w-3/4" />
                    <Skeleton className="h-3.5 sm:h-4 w-1/2" />
                    <Skeleton className="h-3.5 sm:h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : dealsError ? (
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-red-200 p-6 sm:p-8 text-center">
              <div className="text-red-600 text-base sm:text-lg font-semibold mb-2">Error loading deals</div>
              <p className="text-gray-500 text-sm sm:text-base mb-4">{dealsError}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">
                Try Again
              </Button>
            </div>
          ) : filteredDeals.length === 0 && deals.length > 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 p-8 sm:p-12 text-center">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No deals match your search</h3>
              <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search terms</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-teal-100 p-8 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No completed deals yet</h3>
              <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto">When you close or complete deals, they will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
    </SellerProtectedRoute>
  )
}
