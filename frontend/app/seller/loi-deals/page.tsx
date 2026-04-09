"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, FileText, Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import SellerProtectedRoute from "@/components/seller/protected-route"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useLOIDeals, useSellerProfile } from "@/hooks/use-seller-deals"
import { useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { SellerNav } from "@/components/seller/seller-nav"

interface Deal {
  _id: string
  id?: string
  title: string
  companyDescription: string
  dealType: string
  status: string
  visibility?: string
  industrySector: string
  geographySelection: string
  yearsInBusiness: number
  employeeCount?: number
  financialDetails: {
    trailingRevenueCurrency?: string
    trailingRevenueAmount?: number
    trailingEBITDACurrency?: string
    trailingEBITDAAmount?: number
    avgRevenueGrowth?: number
    netIncome?: number
    askingPrice?: number
    finalSalePrice?: number
  }
  businessModel: {
    recurringRevenue?: boolean
    projectBased?: boolean
    assetLight?: boolean
    assetHeavy?: boolean
  }
  managementPreferences: {
    retiringDivesting?: boolean
    staffStay?: boolean
  }
  buyerFit: {
    capitalAvailability?: string
    minPriorAcquisitions?: number
    minTransactionSize?: number
  }
  targetedBuyers: string[]
  interestedBuyers: string[]
  tags: string[]
  isPublic: boolean
  isFeatured: boolean
  stakePercentage?: number
  documents: any[]
  timeline: {
    createdAt: string
    updatedAt: string
    publishedAt?: string
    completedAt?: string
  }
}

// Helper to get API URL - uses environment variable with localStorage fallback
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

function LOIDealCard({
  deal,
  onRevive,
  onOffMarket,
  isReviving,
}: {
  deal: Deal
  onRevive: (deal: Deal) => void
  onOffMarket: (deal: Deal) => void
  isReviving?: boolean
}) {
  const router = useRouter()
  const [navigating, setNavigating] = useState<string | null>(null)

  const formatCurrency = (amount = 0, currency = "USD($)"): string => {
    const currencySymbol = currency.includes("USD")
      ? "$"
      : currency.includes("EUR")
        ? "€"
        : currency.includes("GBP")
          ? "£"
          : "$"
    return `${currencySymbol}${amount.toLocaleString()}`
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-amber-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with title and LOI-Paused badge */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-amber-50/50">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
          <h2 className="text-teal-700 font-semibold text-base sm:text-lg line-clamp-2 xs:truncate xs:pr-4 w-full xs:w-auto">
            {deal.title}
          </h2>
          <span className="inline-flex items-center text-xs px-2.5 sm:px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium flex-shrink-0 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
            LOI - Paused
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {/* OVERVIEW Section */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
            <div className="w-1 h-4 bg-amber-500 rounded-full" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">OVERVIEW</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
            <span className="text-xs px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-100">
              {deal.industrySector || "N/A"}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100">
              {deal.geographySelection || "N/A"}
            </span>
          </div>

          {/* Description */}
          {deal.companyDescription && (
            <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">
              {deal.companyDescription}
            </p>
          )}
        </div>

        {/* Financial Info - Side by side boxes */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-3 sm:mb-4">
          <div className="border border-gray-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">T12 Revenue</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900">
              {deal.financialDetails?.trailingRevenueAmount
                ? formatCurrency(
                    deal.financialDetails.trailingRevenueAmount,
                    deal.financialDetails.trailingRevenueCurrency,
                  )
                : "N/A"}
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">T12 EBITDA</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900">
              {deal.financialDetails?.trailingEBITDAAmount
                ? formatCurrency(
                    deal.financialDetails.trailingEBITDAAmount,
                    deal.financialDetails.trailingEBITDACurrency,
                  )
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Action Buttons - responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNavigating('edit')
              router.push(`/seller/edit-deal?id=${deal._id}`)
            }}
            disabled={navigating === 'edit'}
            className="text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl py-2 sm:py-1.5"
          >
            {navigating === 'edit' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-lg sm:rounded-xl py-2 sm:py-1.5"
            onClick={() => onRevive(deal)}
            disabled={isReviving}
          >
            {isReviving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Revive'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100 rounded-lg sm:rounded-xl py-2 sm:py-1.5"
            onClick={() => onOffMarket(deal)}
          >
            Off Market
          </Button>
          <Button
            size="sm"
            className="text-xs font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-lg sm:rounded-xl py-2 sm:py-1.5"
            onClick={() => {
              setNavigating('activity')
              router.push(`/seller/deal?id=${deal._id}`)
            }}
            disabled={navigating === 'activity'}
          >
            {navigating === 'activity' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Activity'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LOIDealsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [offMarketDialogOpen, setOffMarketDialogOpen] = useState(false)
  const [selectedDealForOffMarket, setSelectedDealForOffMarket] = useState<Deal | null>(null)
  const [currentDialogStep, setCurrentDialogStep] = useState(1)
  const [offMarketData, setOffMarketData] = useState({
    dealSold: null as boolean | null,
    transactionValue: "",
    buyerFromCIM: null as boolean | null,
  })
  const [buyerActivity, setBuyerActivity] = useState<any[]>([])
  const [selectedWinningBuyer, setSelectedWinningBuyer] = useState("")
  const [buyerActivityLoading, setBuyerActivityLoading] = useState(false)
  const [isSubmittingOffMarket, setIsSubmittingOffMarket] = useState(false)
  const [reviveDialogOpen, setReviveDialogOpen] = useState(false)
  const [selectedDealForRevive, setSelectedDealForRevive] = useState<Deal | null>(null)

  const { logout } = useAuth()

  // React Query hooks for data fetching
  const { data: dealsData, isLoading: loading, error: dealsError } = useLOIDeals()
  const { data: profileData } = useSellerProfile()

  // Process deals data
  const deals = dealsData
    ? [...dealsData]
        .map((deal: any) => ({ ...deal, id: deal._id }))
        .sort((a, b) => new Date(b.timeline?.updatedAt || 0).getTime() - new Date(a.timeline?.updatedAt || 0).getTime())
    : []

  const error = dealsError ? (dealsError as Error).message : null

  // Derived state from profile data
  const sellerProfile = profileData || null

  const [revivingDealId, setRevivingDealId] = useState<string | null>(null)

  const handleLogout = () => {
    logout() // logout() from useAuth already handles redirect
  }

  const filteredDeals = deals.filter(
    (deal) =>
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.companyDescription.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleReviveClick = (deal: Deal) => {
    setSelectedDealForRevive(deal)
    setReviveDialogOpen(true)
  }

  // Fetch buyers when dialog opens and reaches step 3
  useEffect(() => {
    if (
      offMarketDialogOpen &&
      selectedDealForOffMarket &&
      currentDialogStep === 3
    ) {
      setBuyerActivity([])
      setSelectedWinningBuyer("")
      setBuyerActivityLoading(true)
      fetchEverActiveBuyers(selectedDealForOffMarket._id).finally(() =>
        setBuyerActivityLoading(false)
      )
    }
  }, [offMarketDialogOpen, selectedDealForOffMarket, currentDialogStep])

  const formatWithCommas = (value: string | number): string => {
    const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : value
    if (isNaN(num)) return ""
    return num.toLocaleString()
  }

  const handleReviveConfirm = async () => {
    if (!selectedDealForRevive) return

    setRevivingDealId(selectedDealForRevive._id)
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/deals/${selectedDealForRevive._id}/revive-from-loi`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to revive deal")
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })

      setReviveDialogOpen(false)
      toast({
        title: "Deal Revived",
        description: "The deal has been moved back to Active Deals.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revive deal",
        variant: "destructive",
      })
    } finally {
      setRevivingDealId(null)
    }
  }

  const handleOffMarketClick = (deal: Deal) => {
    setSelectedDealForOffMarket(deal)
    setCurrentDialogStep(1)
    setOffMarketDialogOpen(true)
    setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null })
    setBuyerActivity([])
    setSelectedWinningBuyer("")
  }

  const handleDialogResponse = async (key: string, value: boolean) => {
    setOffMarketData((prev) => ({ ...prev, [key]: value }))
    if (key === "dealSold") {
      if (value === false) {
        if (selectedDealForOffMarket) {
          try {
            const token = sessionStorage.getItem("token")
            const apiUrl = getApiUrl()
            const response = await fetch(
              `${apiUrl}/deals/${selectedDealForOffMarket._id}/close-deal`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ buyerFromCIM: false }),
              }
            )
            if (!response.ok) {
              throw new Error("Failed to close deal")
            }
            queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })
            queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })
            setOffMarketDialogOpen(false)
            toast({
              title: "Deal Closed",
              description: "The deal has been marked as off-market.",
            })
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to close deal",
              variant: "destructive",
            })
            setOffMarketDialogOpen(false)
          }
        }
      } else {
        setCurrentDialogStep(2)
      }
    }
  }

  const handleOffMarketSubmit = async (buyerFromCIMOverride?: boolean) => {
    if (!selectedDealForOffMarket || !offMarketData.transactionValue) return
    const effectiveBuyerFromCIM =
      typeof buyerFromCIMOverride === "boolean" ? buyerFromCIMOverride : offMarketData.buyerFromCIM
    if (effectiveBuyerFromCIM === true && !selectedWinningBuyer) return

    setIsSubmittingOffMarket(true)
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()
      const body: any = {
        finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
        buyerFromCIM: effectiveBuyerFromCIM === true,
      }
      if (effectiveBuyerFromCIM === true) {
        body.winningBuyerId = selectedWinningBuyer
      }
      const closeResponse = await fetch(
        `${apiUrl}/deals/${selectedDealForOffMarket._id}/close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      )
      if (!closeResponse.ok) {
        throw new Error("Failed to close deal")
      }
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })
      queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })
      setOffMarketDialogOpen(false)
      setCurrentDialogStep(1)
      setSelectedDealForOffMarket(null)
      setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null })
      setBuyerActivity([])
      setSelectedWinningBuyer("")
      toast({
        title: "Deal Closed",
        description: "The deal has been marked as off-market.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close deal",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingOffMarket(false)
    }
  }

  const fetchEverActiveBuyers = async (dealId: string) => {
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/deals/${dealId}/ever-active-buyers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const buyers = await response.json()
        const transformedBuyers = buyers.map((buyer: any) => ({
          buyerId: buyer._id,
          buyerName: buyer.fullName || "Unknown Buyer",
          companyName: buyer.companyName || "Unknown Company",
          buyerEmail: buyer.email || "",
        }))
        setBuyerActivity(transformedBuyers)
        if (transformedBuyers.length > 0) {
          setSelectedWinningBuyer(transformedBuyers[0].buyerId)
        }
        return transformedBuyers
      }
    } catch (error) {
      // Error fetching active buyers
    }
    return []
  }

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-0 h-screen bg-white border-r border-gray-200 p-6 flex flex-col overflow-y-auto">
            <SellerNav activePage="loi-deals" onLogout={handleLogout} />
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
                    <SellerNav activePage="loi-deals" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">LOI - Deals</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden lg:block">
                {sellerProfile?.fullName || "User"}
              </span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-medium overflow-hidden ring-2 ring-white shadow-md">
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
          </header>

          {/* Info Banner */}
          <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 bg-gradient-to-r from-amber-50 to-amber-50/50 border-2 border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              <span className="font-semibold text-red-600">LOI - Deals:</span>{" "}
              <span className="hidden xs:inline">Deals paused for Letter of Intent negotiations appear here.</span>
              <span className="xs:hidden">Paused LOI deals appear here.</span>
              {" "}Use{" "}
              <span className="font-semibold text-teal-600">Revive</span> to move back to Active, or{" "}
              <span className="font-semibold text-gray-700">Off Market</span> to close.
            </p>
          </div>

          {/* Search */}
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder="Search LOI deals..."
                className="pl-9 sm:pl-10 bg-white border-gray-200 text-sm rounded-lg sm:rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl sm:rounded-2xl border-2 border-amber-100 overflow-hidden">
                    <div className="p-3 sm:p-4 border-b border-amber-100 bg-amber-50/30">
                      <Skeleton className="h-5 sm:h-6 w-3/4" />
                    </div>
                    <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                      <div className="flex gap-1.5 sm:gap-2">
                        <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
                        <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                      </div>
                      <Skeleton className="h-12 sm:h-16 w-full" />
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                        <Skeleton className="h-14 sm:h-16 w-full rounded-lg" />
                        <Skeleton className="h-14 sm:h-16 w-full rounded-lg" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
                        <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
                        <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
                        <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-red-200 p-6 sm:p-8 text-center">
                <div className="text-red-600 text-base sm:text-lg font-semibold mb-2">Error loading deals</div>
                <p className="text-gray-500 text-sm sm:text-base mb-4">{error}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })} variant="outline" className="rounded-xl">
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
              <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-amber-100 p-8 sm:p-12 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No deals paused for LOI</h3>
                <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto">When you pause a deal for Letter of Intent negotiations, it will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {filteredDeals.map((deal) => (
                  <LOIDealCard
                    key={deal._id}
                    deal={deal}
                    onRevive={handleReviveClick}
                    onOffMarket={handleOffMarketClick}
                    isReviving={revivingDealId === deal._id}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Off Market Confirmation Dialog */}
        <Dialog
          open={offMarketDialogOpen}
          onOpenChange={() => {
            setOffMarketDialogOpen(false)
            setCurrentDialogStep(1)
            setSelectedDealForOffMarket(null)
            setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null })
            setBuyerActivity([])
            setSelectedWinningBuyer("")
          }}
        >
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            {currentDialogStep === 1 && (
              <>
                <DialogHeader className="text-center pb-2">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Did the deal sell?</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">Let us know the outcome of this deal</p>
                </DialogHeader>
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant={offMarketData.dealSold === false ? "default" : "outline"}
                    onClick={() => handleDialogResponse("dealSold", false)}
                    className={`px-10 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      offMarketData.dealSold === false
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200"
                        : "bg-white text-red-500 border-2 border-red-200 hover:bg-red-50 hover:border-red-300"
                    }`}
                  >
                    No
                  </Button>
                  <Button
                    variant={offMarketData.dealSold === true ? "default" : "outline"}
                    onClick={() => handleDialogResponse("dealSold", true)}
                    className={`px-10 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      offMarketData.dealSold === true
                        ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-200"
                        : "bg-white text-teal-500 border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                    }`}
                  >
                    Yes
                  </Button>
                </div>
              </>
            )}
            {currentDialogStep === 2 && (
              <>
                <DialogHeader className="text-center pb-2">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Transaction Value</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">What was the final transaction value?</p>
                </DialogHeader>
                <div className="space-y-5 mt-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <Input
                      value={
                        offMarketData.transactionValue && offMarketData.transactionValue !== "0"
                          ? formatWithCommas(offMarketData.transactionValue)
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "")
                        setOffMarketData((prev) => ({
                          ...prev,
                          transactionValue: rawValue,
                        }))
                      }}
                      placeholder="0"
                      className="pl-8 pr-4 py-3 text-lg font-semibold rounded-xl border-gray-200 focus:border-teal-300 focus:ring-teal-200"
                    />
                  </div>
                  <Button
                    onClick={() => setCurrentDialogStep(3)}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200"
                    disabled={!offMarketData.transactionValue}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
            {currentDialogStep === 3 && (
              <>
                <DialogHeader className="text-center pb-2">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-cyan-50 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Select the Buyer</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">Choose the winning buyer for this deal</p>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {buyerActivityLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <div className="w-10 h-10 rounded-full border-3 border-teal-200 border-t-teal-500 animate-spin mb-3" />
                        <span className="text-sm font-medium">Loading buyers...</span>
                      </div>
                    ) : buyerActivity.length > 0 ? (
                      buyerActivity.map((buyer) => (
                        <div
                          key={buyer.buyerId}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedWinningBuyer === buyer.buyerId
                              ? "border-teal-400 bg-teal-50 shadow-md shadow-teal-100"
                              : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedWinningBuyer(buyer.buyerId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                              {(buyer.buyerName || "B").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{buyer.buyerName || "Unknown Buyer"}</div>
                              <div className="text-xs text-gray-500">{buyer.companyName || "Unknown Company"}</div>
                            </div>
                          </div>
                          {selectedWinningBuyer === buyer.buyerId && (
                            <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No buyers have interacted with this deal yet</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      onClick={async () => {
                        if (!selectedDealForOffMarket || !offMarketData.transactionValue || !selectedWinningBuyer) return
                        setIsSubmittingOffMarket(true)
                        try {
                          const token = sessionStorage.getItem("token")
                          const apiUrl = getApiUrl()
                          const closeResponse = await fetch(
                            `${apiUrl}/deals/${selectedDealForOffMarket._id}/close`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
                                winningBuyerId: selectedWinningBuyer,
                                buyerFromCIM: true,
                              }),
                            }
                          )
                          if (!closeResponse.ok) {
                            throw new Error("Failed to close deal")
                          }
                          queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })
                          queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })
                          setOffMarketDialogOpen(false)
                          setCurrentDialogStep(1)
                          setSelectedDealForOffMarket(null)
                          setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null })
                          setBuyerActivity([])
                          setSelectedWinningBuyer("")
                          toast({
                            title: "Deal Closed",
                            description: "The deal has been marked as off-market.",
                          })
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to close deal",
                            variant: "destructive",
                          })
                        } finally {
                          setIsSubmittingOffMarket(false)
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200 disabled:opacity-70"
                      disabled={!selectedWinningBuyer || isSubmittingOffMarket}
                    >
                      {isSubmittingOffMarket ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        'Confirm Selection'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!selectedDealForOffMarket || !offMarketData.transactionValue) return
                        setIsSubmittingOffMarket(true)
                        try {
                          const token = sessionStorage.getItem("token")
                          const apiUrl = getApiUrl()
                          const closeResponse = await fetch(
                            `${apiUrl}/deals/${selectedDealForOffMarket._id}/close`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
                                buyerFromCIM: false,
                              }),
                            }
                          )
                          if (!closeResponse.ok) {
                            throw new Error("Failed to close deal")
                          }
                          queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })
                          queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })
                          setOffMarketDialogOpen(false)
                          setCurrentDialogStep(1)
                          setSelectedDealForOffMarket(null)
                          setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null })
                          setBuyerActivity([])
                          setSelectedWinningBuyer("")
                          toast({
                            title: "Deal Closed",
                            description: "The deal has been marked as off-market.",
                          })
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to close deal",
                            variant: "destructive",
                          })
                        } finally {
                          setIsSubmittingOffMarket(false)
                        }
                      }}
                      className="w-full py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-70"
                      disabled={isSubmittingOffMarket}
                    >
                      {isSubmittingOffMarket ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Buyer not from CIM Amplify'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Revive Deal Confirmation Dialog */}
        <ConfirmDialog
          open={reviveDialogOpen}
          onOpenChange={setReviveDialogOpen}
          title="Revive Deal?"
          description={`Are you sure you want to revive "${selectedDealForRevive?.title || 'this deal'}"? The deal will be moved back to Active Deals. When revived we will notify active buyers that it is available again. You can also invite new buyers who may have signed up on the platform.`}
          confirmText="Revive Deal"
          cancelText="Cancel"
          onConfirm={handleReviveConfirm}
          variant="success"
          isLoading={revivingDealId === selectedDealForRevive?._id}
        />
      </div>
      <Toaster />
    </SellerProtectedRoute>
  )
}
