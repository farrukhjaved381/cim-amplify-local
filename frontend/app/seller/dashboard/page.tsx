"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Menu, PauseCircle, Loader2, TrendingUp, Building2, MapPin, Search, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import SellerProtectedRoute from "@/components/seller/protected-route"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSellerDeals, useSellerProfile, usePauseDealForLOI } from "@/hooks/use-seller-deals"
import { useQueryClient } from "@tanstack/react-query"
import { SellerNav } from "@/components/seller/seller-nav"

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

// Updated interfaces to match API structure
interface SellerProfile {
  _id: string
  fullName: string
  email: string
  companyName: string
  role: string
  profilePicture: string
}

interface DealDocument {
  filename: string
  originalName: string
  path: string
  size: number
  mimetype: string
  uploadedAt: string
}

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
  documents: DealDocument[]
  timeline: {
    createdAt: string
    updatedAt: string
    publishedAt?: string
    completedAt?: string
  }
}

// Helper function to get the complete profile picture URL
function getProfilePictureUrl(path: string | null) {
  if (!path) return null
  // If it's a base64 image, return as-is
  if (path.startsWith('data:image')) {
    return path
  }
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const apiUrl = getApiUrl()
  const formattedPath = path.replace(/\\/g, "/")
  return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.slice(1) : formattedPath}`
}

function DealCard({
  deal,
  onDocumentUpload,
  handleOffMarketClick,
  handlePauseForLOI,
  isPausingLOI,
}: {
  deal: Deal
  onDocumentUpload: (dealId: string) => void
  handleOffMarketClick: (deal: Deal) => void
  handlePauseForLOI: (deal: Deal) => void
  isPausingLOI?: boolean
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
    <div
      className="bg-white rounded-2xl shadow-sm border-2 border-teal-200 overflow-hidden hover:shadow-md hover:border-teal-300 transition-all duration-200"
    >
      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-teal-100/80 bg-gradient-to-br from-white via-gray-50/30 to-teal-50/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words line-clamp-2">
              {deal.title}
            </h2>
            {deal.companyDescription && (
              <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mt-2">
                {deal.companyDescription}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {deal.isPublic && (
              <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60 font-semibold shadow-sm">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Marketplace
              </span>
            )}
            <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Info Tags Section */}
      <div className="px-5 sm:px-6 py-4 border-b border-teal-100/60 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-teal-50/80 text-teal-700 text-xs font-semibold border border-teal-100">
            <Building2 className="w-3 h-3 mr-1.5 opacity-70" />
            {deal.industrySector || "N/A"}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-100">
            <MapPin className="w-3 h-3 mr-1.5 opacity-70" />
            {deal.geographySelection || "N/A"}
          </span>
          {deal.yearsInBusiness > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-purple-50/80 text-purple-700 text-xs font-semibold border border-purple-100">
              {deal.yearsInBusiness}+ years
            </span>
          )}
        </div>
      </div>

      {/* Financial Section */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-gray-50/50 via-white to-teal-50/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">T12 Revenue</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
              {deal.financialDetails?.trailingRevenueAmount
                ? formatCurrency(
                    deal.financialDetails.trailingRevenueAmount,
                    deal.financialDetails.trailingRevenueCurrency,
                  )
                : "N/A"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">T12 EBITDA</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
              {deal.financialDetails?.trailingEBITDAAmount
                ? formatCurrency(
                    deal.financialDetails.trailingEBITDAAmount,
                    deal.financialDetails.trailingEBITDACurrency,
                  )
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons with enhanced styling */}
      <div className="grid grid-cols-2 xl:grid-cols-4 p-4 sm:p-5 gap-2.5 bg-teal-50/30 border-t border-teal-100/60">
        <Button
          variant="outline"
          onClick={() => {
            setNavigating('edit')
            router.push(`/seller/edit-deal?id=${deal._id}`)
          }}
          disabled={navigating === 'edit'}
          className="py-2.5 text-xs sm:text-sm font-semibold border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-200 rounded-xl shadow-sm hover:shadow"
          aria-label="Edit deal"
        >
          {navigating === 'edit' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Edit'}
        </Button>
        <Button
          variant="outline"
          className="py-2.5 text-xs sm:text-sm font-semibold bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-800 whitespace-nowrap disabled:opacity-70 transition-all duration-200 rounded-xl shadow-sm hover:shadow"
          onClick={() => handlePauseForLOI(deal)}
          disabled={isPausingLOI}
          aria-label="Pause deal for Letter of Intent"
        >
          {isPausingLOI ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <PauseCircle className="hidden xl:inline-block h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
              <span>Pause for LOI</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="py-2.5 text-xs sm:text-sm font-semibold bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700 whitespace-nowrap transition-all duration-200 rounded-xl shadow-sm hover:shadow"
          onClick={() => handleOffMarketClick(deal)}
          aria-label="Take deal off market"
        >
          Off Market
        </Button>
        <Button
          className="py-2.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white disabled:opacity-70 transition-all duration-200 rounded-xl shadow-sm hover:shadow-lg hover:shadow-teal-200"
          onClick={() => {
            setNavigating('activity')
            router.push(`/seller/deal?id=${deal._id}`)
          }}
          disabled={navigating === 'activity'}
          aria-label="View deal activity"
        >
          {navigating === 'activity' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <span>Activity</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")

  const [offMarketDialogOpen, setOffMarketDialogOpen] = useState(false)
  const [loiDialogOpen, setLoiDialogOpen] = useState(false)
  const [currentDialogStep, setCurrentDialogStep] = useState(1)
  const [selectedDealForOffMarket, setSelectedDealForOffMarket] = useState<Deal | null>(null)
  const [selectedDealForLoi, setSelectedDealForLoi] = useState<Deal | null>(null)
  const [offMarketData, setOffMarketData] = useState({
    dealSold: null as boolean | null,
    transactionValue: "",
    buyerFromCIM: null as boolean | null,
  })
  const [isSubmittingOffMarket, setIsSubmittingOffMarket] = useState(false)

  const [completeDealDialogOpen, setCompleteDealDialogOpen] = useState(false)
  const [selectedDealForCompletion, setSelectedDealForCompletion] = useState<Deal | null>(null)
  const [completionData, setCompletionData] = useState({
    finalSalePrice: "",
  })

  // Add this state near the other state declarations
  const [buyerActivity, setBuyerActivity] = useState<any[]>([])
  const [selectedWinningBuyer, setSelectedWinningBuyer] = useState<string>("")
  const [buyerActivityLoading, setBuyerActivityLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pausingDealId, setPausingDealId] = useState<string | null>(null) // Track which deal is being paused
  const [creatingDeal, setCreatingDeal] = useState(false) // Track navigation to create deal page
  const activeBuyerOptions = buyerActivity.filter((buyer) => buyer?.status === "active")

  const { logout } = useAuth()

  const [profileName, setProfileName] = useState("")

  // React Query hooks for data fetching
  const { data: dealsData, isLoading, isFetching, error: dealsError } = useSellerDeals()
  // Show loading on initial load OR when data is undefined (first render)
  const loading = isLoading || (isFetching && dealsData === undefined)
  const { data: profileData } = useSellerProfile()
  const pauseDealMutation = usePauseDealForLOI()

  // Process deals data
  const deals = dealsData
    ? [...dealsData]
        .map((deal: any) => ({ ...deal, id: deal._id }))
        .sort((a, b) => new Date(b.timeline?.createdAt || 0).getTime() - new Date(a.timeline?.createdAt || 0).getTime())
    : []

  const error = dealsError ? (dealsError as Error).message : null

  // Derived state from profile data
  const sellerProfile = profileData as SellerProfile | null
  const userProfile = profileData ? {
    fullName: profileData.fullName,
    location: profileData.companyName,
    phone: profileData.email,
    profilePicture: profileData.profilePicture,
  } : null

  const handleLogout = () => {
    logout() // logout() from useAuth already handles redirect
  }

  const filteredDeals = deals.filter(
    (deal) =>
      deal.status !== "loi" && // Exclude LOI deals from active deals
      (deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.companyDescription.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleUpdateName = async () => {
    if (profileName.trim()) {
      try {
        const token = sessionStorage.getItem("token")
        const apiUrl = getApiUrl()

        const response = await fetch(`${apiUrl}/sellers/${sellerProfile?._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fullName: profileName }),
        })

        if (response.ok) {
          // Invalidate profile query to refresh data
          queryClient.invalidateQueries({ queryKey: ["seller-profile"] })
          toast({
            title: "Name updated",
            description: "Your name has been updated successfully.",
          })
        }
      } catch (error) {
        toast({
          title: "Update failed",
          description: "Failed to update name",
          variant: "destructive",
        })
      }
    }
  }

  const handleDocumentUpload = (dealId: string) => {
    // Refresh deals to show updated documents using React Query
    queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
  }

  const handleOffMarketClick = (deal: Deal) => {
    setSelectedDealForOffMarket(deal)
    setCurrentDialogStep(1)
    setOffMarketDialogOpen(true)
    setSelectedWinningBuyer("") // Reset selected buyer
    setOffMarketData({
      dealSold: null,
      transactionValue: "",
      buyerFromCIM: null,
    })
  }

  const handleCompleteDealClick = (deal: Deal) => {
    setSelectedDealForCompletion(deal)
    setCompletionData({
      finalSalePrice: "",
    })
    setCompleteDealDialogOpen(true)
  }

  const handlePauseForLOI = async (deal: Deal) => {
    setSelectedDealForLoi(deal)
    setSelectedWinningBuyer("")
    setBuyerActivity([])
    setLoiDialogOpen(true)
  }

  const handlePauseForLOISubmit = async (isCimBuyer: boolean) => {
    if (!selectedDealForLoi) return
    setPausingDealId(selectedDealForLoi._id)
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()
      const body = isCimBuyer && selectedWinningBuyer ? { loiBuyerId: selectedWinningBuyer } : {}

      const response = await fetch(`${apiUrl}/deals/${selectedDealForLoi._id}/pause-for-loi`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to pause deal for LOI")
      }

      queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] })
      setLoiDialogOpen(false)
      toast({
        title: "Deal Paused for LOI",
        description: "The deal has been moved to LOI - Deals. You can find it in the LOI - Deals section.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pause deal for LOI",
        variant: "destructive",
      })
    } finally {
      setPausingDealId(null)
    }
  }

  const formatTransactionValue = (value: string) => {
    // Remove all non-digits
    const numericValue = value.replace(/\D/g, '')
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleDialogResponse = async (key: string, value: boolean) => {
    setOffMarketData((prev) => ({ ...prev, [key]: value }))
    if (key === "dealSold") {
      if (value === false) {
        // Mark deal as off-market
        if (selectedDealForOffMarket) {
          try {
            const token = sessionStorage.getItem("token")
            const apiUrl = getApiUrl()
            const response = await fetch(`${apiUrl}/deals/${selectedDealForOffMarket._id}/close-deal`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ buyerFromCIM: false }),
            })
            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(errorText || "Failed to close deal")
            }
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
            queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })
            setOffMarketDialogOpen(false)
            toast({
              title: "Deal marked as off-market",
              description: "The deal has been removed from your active deals.",
            })
          } catch (error: any) {
            toast({
              title: "Error marking deal off-market",
              description: error.message || "Failed to mark deal off-market.",
              variant: "destructive",
            })
          }
        } else {
          setOffMarketDialogOpen(false)
        }
      } else {
        // Go to next step if deal sold
        setCurrentDialogStep(2)
      }
    }
  }

  // Replace the handleCompleteDealSubmit function with this updated version
  const handleCompleteDealSubmit = async () => {
    if (!selectedDealForCompletion || !completionData.finalSalePrice) {
      toast({
        title: "Missing information",
        description: "Please provide final sale price",
        variant: "destructive",
      })
      return
    }

    // Ensure we have a selected buyer
    if (!selectedWinningBuyer) {
      toast({
        title: "Buyer required",
        description: "Please select a winning buyer to complete the deal",
        variant: "destructive",
      })
      return
    }

    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()

      // Close the deal with the selected buyer
      const closeResponse = await fetch(`${apiUrl}/deals/${selectedDealForCompletion._id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalSalePrice: Number.parseFloat(completionData.finalSalePrice),
          winningBuyerId: selectedWinningBuyer, // Use the selected buyer ID
          buyerFromCIM: true,
        }),
      })

      if (!closeResponse.ok) {
        const errorText = await closeResponse.text()
        throw new Error(`Failed to complete deal: ${closeResponse.statusText}`)
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
      queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })

      setCompleteDealDialogOpen(false)
      toast({
        title: "Deal completed successfully",
        description: "The deal has been marked as completed and removed from your active deals",
      })
    } catch (error: any) {
      toast({
        title: "Error completing deal",
        description: error.message || "Failed to complete deal. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Replace the handleOffMarketSubmit function with this updated version
  const handleOffMarketSubmit = async (buyerFromCIMOverride?: boolean) => {
    if (!selectedDealForOffMarket || !offMarketData.transactionValue) {
      toast({
        title: "Missing information",
        description: "Please provide transaction value",
        variant: "destructive",
      })
      return
    }

    const effectiveBuyerFromCIM =
      typeof buyerFromCIMOverride === "boolean" ? buyerFromCIMOverride : offMarketData.buyerFromCIM

    // If buyer is from CIM, ensure a buyer is selected
    if (effectiveBuyerFromCIM === true && !selectedWinningBuyer) {
      toast({
        title: "Buyer required",
        description: "Please select a buyer from the list",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingOffMarket(true)
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()

      // Prepare winningBuyerId: only send if buyerFromCIM is true
      const body: any = {
        finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
        buyerFromCIM: effectiveBuyerFromCIM === true,
      }
      if (effectiveBuyerFromCIM === true) {
        body.winningBuyerId = selectedWinningBuyer
      }

      // Close the deal
      const closeResponse = await fetch(`${apiUrl}/deals/${selectedDealForOffMarket._id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!closeResponse.ok) {
        const errorText = await closeResponse.text()
        throw new Error(`Failed to close deal: ${closeResponse.statusText}`)
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
      queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })

      setOffMarketDialogOpen(false)
      toast({
        title: "✅ Deal closed successfully",
        description: "The deal has been marked as closed and removed from your active deals",
        duration: 4000
      })
    } catch (error: any) {
      toast({
        title: "Error closing deal",
        description: error.message || "Failed to close deal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingOffMarket(false)
    }
  }

  // New: Immediately close the deal when seller chooses "No" (buyer did not come from CIM)
  const handleImmediateCloseNoCIM = async () => {
    if (!selectedDealForOffMarket) {
      toast({
        title: "Error",
        description: "No deal selected for off-market.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingOffMarket(true)
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()

      const body: any = {}
      if (offMarketData.transactionValue) {
        body.finalSalePrice = Number.parseFloat(offMarketData.transactionValue)
      }
      body.buyerFromCIM = false

      const closeResponse = await fetch(`${apiUrl}/deals/${selectedDealForOffMarket._id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!closeResponse.ok) {
        const errorText = await closeResponse.text()
        throw new Error(`Failed to close deal: ${closeResponse.statusText}`)
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] })
      queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] })

      setOffMarketDialogOpen(false)
      toast({
        title: "✅ Deal closed successfully",
        description: "The deal has been marked as closed and removed from your active deals",
        duration: 4000
      })
    } catch (error: any) {
      toast({
        title: "Error closing deal",
        description: error.message || "Failed to close deal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingOffMarket(false)
    }
  }

  const fetchDealStatusSummary = async (dealId: string) => {
    try {
      const token = sessionStorage.getItem("token")
      const apiUrl = getApiUrl()

      const response = await fetch(`${apiUrl}/deals/${dealId}/status-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        // Extract buyer IDs from the deal data
        const allBuyerIds = [...data.deal.targetedBuyers, ...data.deal.interestedBuyers]

        // Remove duplicates
        const uniqueBuyerIds = [...new Set(allBuyerIds)]

        // Fetch individual buyer details
        const buyerDetailsPromises = uniqueBuyerIds.map(async (buyerId) => {
          try {
            const buyerResponse = await fetch(`${apiUrl}/buyers/${buyerId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (buyerResponse.ok) {
              const buyerData = await buyerResponse.json()

              // Determine status based on invitation status
              let status = "pending"
              const invitationStatus = data.deal.invitationStatus[buyerId]
              if (invitationStatus) {
                if (invitationStatus.response === "accepted") {
                  status = "active"
                } else if (invitationStatus.response === "rejected") {
                  status = "rejected"
                }
              }

              return {
                buyerId: buyerId,
                buyerName: buyerData.fullName || buyerData.name || "Unknown Buyer",
                companyName: buyerData.companyName || "Unknown Company",
                buyerEmail: buyerData.email || "",
                status: status,
                invitationStatus: invitationStatus,
              }
            }
          } catch {
            return null
          }
        })

        const buyerDetails = await Promise.all(buyerDetailsPromises)
        const validBuyerDetails = buyerDetails.filter((buyer) => buyer !== null)

        setBuyerActivity(validBuyerDetails)

        // If there's an active buyer, pre-select them
        const activeBuyer = validBuyerDetails.find((buyer) => buyer && buyer.status === "active")
        if (activeBuyer) {
          setSelectedWinningBuyer(activeBuyer.buyerId)
        }

        return validBuyerDetails
      }
    } catch {
      // Silently handle error
    }
    return []
  }

  // Fetch buyers who have ever had this deal in Active (for "Buyer from CIM Amplify" option)
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

        // Transform to match the expected format
        const transformedBuyers = buyers.map((buyer: any) => ({
          buyerId: buyer._id,
          buyerName: buyer.fullName || "Unknown Buyer",
          companyName: buyer.companyName || "Unknown Company",
          buyerEmail: buyer.email || "",
          status: "active", // Mark all as active since they were ever active
          currentStatus: buyer.currentStatus,
          isCurrentlyActive: buyer.isCurrentlyActive,
        }))

        setBuyerActivity(transformedBuyers)

        // Pre-select first buyer if available
        if (transformedBuyers.length > 0) {
          setSelectedWinningBuyer(transformedBuyers[0].buyerId)
        }

        return transformedBuyers
      }
    } catch (error) {
      // Error fetching buyers
    }
    return []
  }

  // Update the useEffect that fetches buyer activity for off-market dialog:
  // Uses everActiveBuyers - buyers who ever had the deal in Active (even if later rejected/passed)
  // Now fetches when reaching step 3 (buyer selection step)
  useEffect(() => {
    if (offMarketDialogOpen && selectedDealForOffMarket && currentDialogStep === 3) {
      setBuyerActivity([]) // Reset before fetching
      setSelectedWinningBuyer("") // Reset selected buyer
      setBuyerActivityLoading(true)
      fetchEverActiveBuyers(selectedDealForOffMarket._id).finally(() => setBuyerActivityLoading(false))
    }
  }, [offMarketDialogOpen, selectedDealForOffMarket, currentDialogStep])

  useEffect(() => {
    if (loiDialogOpen && selectedDealForLoi) {
      setBuyerActivity([])
      setSelectedWinningBuyer("")
      setBuyerActivityLoading(true)
      fetchEverActiveBuyers(selectedDealForLoi._id).finally(() => setBuyerActivityLoading(false))
    }
  }, [loiDialogOpen, selectedDealForLoi])

  // Update the useEffect for complete deal dialog:
  useEffect(() => {
    if (completeDealDialogOpen && selectedDealForCompletion) {
      setBuyerActivity([]) // Reset before fetching
      setBuyerActivityLoading(true)
      fetchDealStatusSummary(selectedDealForCompletion._id).finally(() => setBuyerActivityLoading(false))
    }
  }, [completeDealDialogOpen, selectedDealForCompletion])

  // Utility to format numbers with commas for display
  const formatWithCommas = (value: string | number) => {
    const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : value
    if (isNaN(num)) return ""
    return num.toLocaleString()
  }

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
        {/* Desktop Sidebar - Sticky */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-0 h-screen bg-white/80 backdrop-blur-sm border-r border-gray-100 p-6 flex flex-col overflow-y-auto shadow-sm">
            <SellerNav activePage="dashboard" onLogout={handleLogout} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4 p-3 sm:p-6 overflow-auto">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 sm:px-6 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-teal-50 transition-colors rounded-xl">
                    <Menu className="h-6 w-6 text-gray-600" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] flex flex-col h-full overflow-hidden bg-white/95 backdrop-blur-md">
                  <SheetHeader>
                    <SheetTitle className="text-gray-800">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex-1 overflow-y-auto pb-6">
                    <SellerNav activePage="dashboard" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Active Deals</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage your active deal listings</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-sm text-gray-900">
                    {userProfile?.fullName || sellerProfile?.fullName || "User"}
                  </div>
                  <div className="text-xs text-gray-500">Advisor</div>
                </div>
                <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-white shadow-lg shadow-teal-200/50 transition-transform duration-200 hover:scale-105">
                  {sellerProfile?.profilePicture ? (
                    <img
                      src={
                        getProfilePictureUrl(sellerProfile.profilePicture) || "/placeholder.svg"
                      }
                      alt={sellerProfile.fullName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    (sellerProfile?.fullName || "U").charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 mt-2">
            {/* Deals Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="text"
                    placeholder="Search deals..."
                    className="border-gray-200 bg-gray-50/50 text-sm sm:text-base w-full pl-11 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-teal-300 focus:ring-teal-200 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search deals"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 w-full sm:w-auto text-sm sm:text-base font-semibold disabled:opacity-70 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-teal-200/50 rounded-xl px-6"
                  onClick={() => {
                    setCreatingDeal(true)
                    router.push("/seller/seller-form")
                  }}
                  disabled={creatingDeal}
                  aria-label="Create new deal"
                >
                  {creatingDeal ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {creatingDeal ? "Loading..." : "New Deal"}
                </Button>
              </div>

              {/* Search Results Count */}
              {searchTerm && !loading && dealsData && (
                <div className="px-4 sm:px-6 pb-3">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    {filteredDeals.length === 0
                      ? "No deals found"
                      : `${filteredDeals.length} deal${filteredDeals.length !== 1 ? 's' : ''} found`}
                  </p>
                </div>
              )}

              <div className="p-4 sm:p-6 pt-0">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                        <div className="p-5 sm:p-6 border-b border-gray-100">
                          <Skeleton className="h-6 w-3/4 mb-3 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
                          <Skeleton className="h-4 w-2/3 rounded-lg" />
                        </div>
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                          <div className="flex gap-2">
                            <Skeleton className="h-7 w-24 rounded-lg" />
                            <Skeleton className="h-7 w-20 rounded-lg" />
                          </div>
                        </div>
                        <div className="p-5 sm:p-6">
                          <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 rounded-xl" />
                            <Skeleton className="h-20 rounded-xl" />
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50/80 border-t border-gray-100">
                          <div className="grid grid-cols-4 gap-2">
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error && deals.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-red-600 text-lg font-semibold mb-2">Error loading deals</div>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["seller-deals"] })}
                      className="bg-red-500 hover:bg-red-600 rounded-xl"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : dealsData && filteredDeals.length === 0 ? (
                  <div className="bg-gradient-to-br from-white to-teal-50/30 rounded-2xl border border-gray-100 p-10 sm:p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-100/50">
                      <Plus className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {searchTerm ? "No deals match your search" : "Create your first deal"}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      {searchTerm
                        ? "Try adjusting your search terms to find what you're looking for"
                        : "Get started by creating a new deal listing to connect with potential buyers"
                      }
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => {
                          setCreatingDeal(true)
                          router.push("/seller/seller-form")
                        }}
                        disabled={creatingDeal}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 rounded-xl px-8 py-3 font-semibold shadow-lg shadow-teal-200/50 transition-all duration-300 hover:shadow-xl"
                      >
                        {creatingDeal ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Deal
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : !dealsData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                        <div className="p-5 sm:p-6 border-b border-gray-100">
                          <Skeleton className="h-6 w-3/4 mb-3 rounded-lg" />
                          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
                          <Skeleton className="h-4 w-2/3 rounded-lg" />
                        </div>
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                          <div className="flex gap-2">
                            <Skeleton className="h-7 w-24 rounded-lg" />
                            <Skeleton className="h-7 w-20 rounded-lg" />
                          </div>
                        </div>
                        <div className="p-5 sm:p-6">
                          <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 rounded-xl" />
                            <Skeleton className="h-20 rounded-xl" />
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50/80 border-t border-gray-100">
                          <div className="grid grid-cols-4 gap-2">
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                            <Skeleton className="h-10 rounded-xl" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {filteredDeals.map((deal, index) => (
                      <div
                        key={deal._id}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <DealCard
                          deal={deal}
                          onDocumentUpload={handleDocumentUpload}
                          handleOffMarketClick={handleOffMarketClick}
                          handlePauseForLOI={handlePauseForLOI}
                          isPausingLOI={pausingDealId === deal._id}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* LOI Dialog */}
        <Dialog open={loiDialogOpen} onOpenChange={setLoiDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="text-center pb-2">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-cyan-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Select The Buyer</DialogTitle>
              <p className="text-gray-500">Choose the LOI buyer for this deal</p>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {buyerActivityLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <div className="w-10 h-10 rounded-full border-3 border-teal-200 border-t-teal-500 animate-spin mb-3" />
                    <span className="text-sm font-medium">Loading buyers...</span>
                  </div>
                ) : activeBuyerOptions.length > 0 ? (
                  activeBuyerOptions.map((buyer) => (
                    <div
                      key={buyer.buyerId}
                      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedWinningBuyer === buyer.buyerId
                          ? "border-teal-400 bg-teal-50 shadow-md shadow-teal-100"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedWinningBuyer(buyer.buyerId)}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{buyer.buyerName || "Unknown Buyer"}</div>
                        <div className="text-xs text-gray-500 truncate">{buyer.companyName || "Unknown Company"}</div>
                      </div>
                      {selectedWinningBuyer === buyer.buyerId && (
                        <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                  onClick={() => handlePauseForLOISubmit(true)}
                  disabled={!selectedWinningBuyer || !!pausingDealId}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200 disabled:opacity-70"
                >
                  {pausingDealId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pause for LOI"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePauseForLOISubmit(false)}
                  disabled={!!pausingDealId}
                  className="w-full py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-70"
                >
                  {pausingDealId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "No, not from CIM Amplify"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Off Market Dialog */}
        <Dialog open={offMarketDialogOpen} onOpenChange={setOffMarketDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            {currentDialogStep === 1 ? (
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
            ) : currentDialogStep === 2 ? (
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
            ) : currentDialogStep === 3 ? (
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
                  {/* Buyer Selection List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {buyerActivityLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <div className="w-10 h-10 rounded-full border-3 border-teal-200 border-t-teal-500 animate-spin mb-3" />
                        <span className="text-sm font-medium">Loading buyers...</span>
                      </div>
                    ) : activeBuyerOptions.length > 0 ? (
                      activeBuyerOptions.map((buyer) => (
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

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setOffMarketData((prev) => ({ ...prev, buyerFromCIM: true }))
                        handleOffMarketSubmit(true)
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
                      onClick={handleImmediateCloseNoCIM}
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
            ) : (
              <DialogHeader>
                <DialogTitle className="sr-only">Off Market Dialog</DialogTitle>
              </DialogHeader>
            )}
          </DialogContent>
        </Dialog>

        {/* Complete Deal Dialog */}
        <Dialog open={completeDealDialogOpen} onOpenChange={setCompleteDealDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="text-center pb-2">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Complete Deal</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Finalize this deal and record the outcome</p>
            </DialogHeader>
            <div className="space-y-5 mt-4">
              {/* Final Sale Price */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Final Sale Price</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <Input
                    type="number"
                    value={completionData.finalSalePrice}
                    onChange={(e) =>
                      setCompletionData((prev) => ({
                        ...prev,
                        finalSalePrice: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="pl-8 pr-4 py-3 text-lg font-semibold rounded-xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Original asking price: ${selectedDealForCompletion?.financialDetails.askingPrice?.toLocaleString() || 0}
                </div>
              </div>

              {/* Buyer Selection */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Select Winning Buyer</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {buyerActivityLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <div className="w-10 h-10 rounded-full border-3 border-green-200 border-t-green-500 animate-spin mb-3" />
                      <span className="text-sm font-medium">Finding buyers...</span>
                    </div>
                  ) : activeBuyerOptions.length > 0 ? (
                    activeBuyerOptions.map((buyer) => (
                      <div
                        key={buyer.buyerId}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedWinningBuyer === buyer.buyerId
                            ? "border-green-400 bg-green-50 shadow-md shadow-green-100"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedWinningBuyer(buyer.buyerId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-sm">
                            {(buyer.buyerName || "B").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{buyer.buyerName || "Unknown Buyer"}</div>
                            <div className="text-xs text-gray-500">{buyer.companyName || "Unknown Company"}</div>
                          </div>
                        </div>
                        {selectedWinningBuyer === buyer.buyerId && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-amber-50 rounded-xl border border-amber-100">
                      <svg className="w-8 h-8 text-amber-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-amber-700 text-sm font-medium">No interested buyers found</p>
                      <p className="text-amber-600 text-xs mt-1">Ensure there are interested buyers before completing</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCompleteDealDialogOpen(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteDealSubmit}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-semibold shadow-lg shadow-green-200/50 transition-all duration-200"
                  disabled={!completionData.finalSalePrice || !selectedWinningBuyer}
                >
                  Complete Deal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </SellerProtectedRoute>
  )
}
