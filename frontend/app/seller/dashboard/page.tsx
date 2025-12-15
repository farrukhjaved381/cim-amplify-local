"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, Clock, LogOut, Plus, FileText, Download, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import SellerProtectedRoute from "@/components/seller/protected-route"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Classifier from "@/components/seller/Classifier";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
  const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"
  const formattedPath = path.replace(/\\/g, "/")
  return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.slice(1) : formattedPath}`
}

function DealCard({
  deal,
  onDocumentUpload,
  handleOffMarketClick,
  handleCompleteDealClick,
}: {
  deal: Deal
  onDocumentUpload: (dealId: string) => void
  handleOffMarketClick: (deal: Deal) => void
  handleCompleteDealClick: (deal: Deal) => void
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Helper functions
  const handleDocumentUpload = async (dealId: string) => {
    const token = localStorage.getItem("token")
    const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

    const response = await fetch(`${apiUrl}/deals/${dealId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      onDocumentUpload(dealId)
    } else {
      toast({ title: "Error refreshing deal data after upload" })
    }
  }

  const getBusinessModel = (model: Deal["businessModel"]): string => {
    const models = []
    if (model.recurringRevenue) models.push("Recurring Revenue")
    if (model.projectBased) models.push("Project-Based")
    if (model.assetLight) models.push("Asset Light")
    if (model.assetHeavy) models.push("Asset Heavy")
    return models.length > 0 ? models[0] : "Not specified"
  }

  const getManagementPreferences = (prefs: Deal["managementPreferences"]): string => {
    if (prefs.retiringDivesting && prefs.staffStay) return "Retiring to diversity"
    if (prefs.retiringDivesting) return "Owner(s) Departing"
    if (prefs.staffStay) return "Management Team Staying"
    return "Not specified"
  }

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

  const handleDocumentUploadInner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()

    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })

    try {
      const token = localStorage.getItem("token")
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

      const response = await fetch(`${apiUrl}/deals/${deal._id}/upload-documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      toast({
        title: "Documents uploaded successfully",
        description: `Uploaded ${result.uploadedFiles} document(s)`,
      })

      // Trigger refresh
      onDocumentUpload(deal._id)
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const downloadDocument = (doc: DealDocument) => {
    const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

    // Create a download link
    const link = document.createElement("a")
    link.href = `${apiUrl}/uploads/deal-documents/${doc.filename}`
    link.download = doc.originalName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-medium text-[#3aafa9] break-words">{deal.title}</h2>
          {deal.isPublic ? (
            <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 w-fit">
              Marketplace
            </span>
          ) : null}
        </div>
      </div>

      {/* Overview Section */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Overview</h3>
        <div className="space-y-1 text-xs sm:text-sm">
          {/* <div>
            <span className="text-gray-500">Company Description: </span>
            <span>{deal.companyDescription}</span>
          </div> */}
          <div>
            <span className="text-gray-500">Industry: </span>
            <span>{deal.industrySector}</span>
          </div>
          {/* <div>
            <span className="text-gray-500">Geography: </span>
            <span>{deal.geographySelection}</span>
          </div> */}
          {/* <div>
            <span className="text-gray-500">Number of Years in Business: </span>
            <span>{deal.yearsInBusiness}</span>
          </div> */}
          {/* <div>
            <span className="text-gray-500">Status: </span>
            <span className="capitalize">{deal.status}</span>
          </div> */}
        </div>
      </div>

      {/* Financial Section */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        {/* <h3 className="text-lg font-medium mb-3">Financial</h3> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
          <div>
            <span className="text-gray-500">Trailing 12-Month Revenue: </span>
            <span>
              {deal.financialDetails
                ? formatCurrency(
                    deal.financialDetails.trailingRevenueAmount,
                    deal.financialDetails.trailingRevenueCurrency,
                  )
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Trailing 12-Month EBITDA: </span>
            <span>
              {deal.financialDetails
                ? formatCurrency(
                    deal.financialDetails.trailingEBITDAAmount,
                    deal.financialDetails.trailingRevenueCurrency,
                  )
                : "N/A"}
            </span>
          </div>
          {/* <div>
            <span className="text-gray-500">Average 3-YEAR REVENUE GROWTH IN %: </span>
            <span>{deal.financialDetails.avgRevenueGrowth || 0}%</span>
          </div>
          <div>
            <span className="text-gray-500">Net Income: </span>
            <span>
              {formatCurrency(deal.financialDetails.netIncome, deal.financialDetails.trailingRevenueCurrency)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Asking Price: </span>
            <span>
              {formatCurrency(deal.financialDetails.askingPrice, deal.financialDetails.trailingRevenueCurrency)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Business Model: </span>
            <span>{getBusinessModel(deal.businessModel)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Management Future Preferences: </span>
            <span>{getManagementPreferences(deal.managementPreferences)}</span>
          </div> */}
        </div>
      </div>

    

      {/* Action Buttons */}
      <div className="flex flex-wrap p-3 sm:p-4 gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/seller/edit-deal?id=${deal._id}`)}
          className="flex-1 min-w-[80px] py-2 text-xs sm:text-sm border border-gray-400 text-gray-600"
        >
          Edit
        </Button>
        {deal.status === "active" && (
          <Button
            variant="outline"
            className="flex-1 min-w-[100px] py-2 text-xs sm:text-sm bg-green-50 text-green-600 border border-green-200"
            onClick={() => handleCompleteDealClick(deal)}
          >
            Complete Deal
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1 min-w-[90px] py-2 text-xs sm:text-sm bg-red-50 text-red-500 border border-red-200"
          onClick={() => handleOffMarketClick(deal)}
        >
          Off Market
        </Button>
        <Button
          className="flex-1 min-w-[80px] py-2 text-xs sm:text-sm bg-[#3aafa9] text-white"
          onClick={() => router.push(`/seller/deal?id=${deal._id}`)}
        >
          Activity
        </Button>
      </div>
    </div>
  )
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [offMarketDialogOpen, setOffMarketDialogOpen] = useState(false)
  const [currentDialogStep, setCurrentDialogStep] = useState(1)
  const [selectedDealForOffMarket, setSelectedDealForOffMarket] = useState<Deal | null>(null)
  const [offMarketData, setOffMarketData] = useState({
    dealSold: null as boolean | null,
    transactionValue: "",
    buyerFromCIM: null as boolean | null,
  })

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
  const activeBuyerOptions = buyerActivity.filter((buyer) => buyer?.status === "active")

  const searchParams = useSearchParams()
  const { logout } = useAuth()

  const [profileName, setProfileName] = useState("")

  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

        const response = await fetch(`${apiUrl}/sellers/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSellerProfile(data)
          setUserProfile({
            fullName: data.fullName,
            location: data.companyName,
            phone: data.email,
            profilePicture: data.profilePicture, // This comes from the API
          })
          setProfileName(data.fullName)
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error)
      }
    }
    fetchSellerProfile()
  }, [])

  // Fetch deals
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

        if (!token) {
          router.push("/seller/login?error=no_token")
          return
        }

        const response = await fetch(`${apiUrl}/deals/my-deals`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          // Sort deals by creation date (most recent first)
          const sortedDeals = data
            .map((deal: any) => ({ ...deal, id: deal._id }))
            .sort((a, b) => new Date(b.timeline.createdAt).getTime() - new Date(a.timeline.createdAt).getTime())
          setDeals(sortedDeals)
        } else {
          setDeals([])
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching deals:", err)
        setError(err.message || "Failed to load deals")
        setDeals([])
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [router, refreshTrigger])

  const handleLogout = () => {
    logout()
    router.push("/seller/login")
  }

  const filteredDeals = deals.filter(
    (deal) =>
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.companyDescription.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUpdateName = async () => {
    if (profileName.trim()) {
      try {
        const token = localStorage.getItem("token")
        const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

        const response = await fetch(`${apiUrl}/sellers/${sellerProfile?._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fullName: profileName }),
        })

        if (response.ok) {
          setUserProfile((prev: any) => ({
            ...prev,
            fullName: profileName,
          }))
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
    // Refresh deals to show updated documents
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleOffMarketClick = (deal: Deal) => {
    setSelectedDealForOffMarket(deal)
    setCurrentDialogStep(1)
    setOffMarketDialogOpen(true)
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
            const token = localStorage.getItem("token")
            const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"
            const response = await fetch(`${apiUrl}/deals/${selectedDealForOffMarket._id}/close-deal`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            })
            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(errorText || "Failed to close deal")
            }
            setDeals((prevDeals) => prevDeals.filter((deal) => deal._id !== selectedDealForOffMarket._id))
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
      const token = localStorage.getItem("token")
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

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
        }),
      })

      if (!closeResponse.ok) {
        const errorText = await closeResponse.text()
        console.error("Error response:", errorText)
        throw new Error(`Failed to complete deal: ${closeResponse.statusText}`)
      }

      // Remove the deal from the deals list
      setDeals((prevDeals) => prevDeals.filter((deal) => deal._id !== selectedDealForCompletion._id))

      setCompleteDealDialogOpen(false)
      toast({
        title: "Deal completed successfully",
        description: "The deal has been marked as completed and removed from your active deals",
      })
    } catch (error: any) {
      console.error("Error completing deal:", error)
      toast({
        title: "Error completing deal",
        description: error.message || "Failed to complete deal. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Replace the handleOffMarketSubmit function with this updated version
  const handleOffMarketSubmit = async () => {
    if (!selectedDealForOffMarket || !offMarketData.transactionValue) {
      toast({
        title: "Missing information",
        description: "Please provide transaction value",
        variant: "destructive",
      })
      return
    }

    // If buyer is from CIM, ensure a buyer is selected
    if (offMarketData.buyerFromCIM === true && !selectedWinningBuyer) {
      toast({
        title: "Buyer required",
        description: "Please select a buyer from the list",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

      // Prepare winningBuyerId: only send if buyerFromCIM is true
      const body: any = {
        finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
      }
      if (offMarketData.buyerFromCIM === true) {
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
        console.error("Error response:", errorText)
        throw new Error(`Failed to close deal: ${closeResponse.statusText}`)
      }

      // Remove the deal from the deals list
      setDeals((prevDeals) => prevDeals.filter((deal) => deal._id !== selectedDealForOffMarket._id))

      setOffMarketDialogOpen(false)
      toast({
        title: "Deal closed successfully",
        description: "The deal has been marked as closed and removed from your active deals",
      })
    } catch (error: any) {
      console.error("Error closing deal:", error)
      toast({
        title: "Error closing deal",
        description: error.message || "Failed to close deal. Please try again.",
        variant: "destructive",
      })
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

    try {
      const token = localStorage.getItem("token")
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

      const body: any = {}
      if (offMarketData.transactionValue) {
        body.finalSalePrice = Number.parseFloat(offMarketData.transactionValue)
      }

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
        console.error("Error response:", errorText)
        throw new Error(`Failed to close deal: ${closeResponse.statusText}`)
      }

      setDeals((prevDeals) => prevDeals.filter((deal) => deal._id !== selectedDealForOffMarket._id))
      setOffMarketDialogOpen(false)
      toast({
        title: "Deal closed successfully",
        description: "The deal has been marked as closed and removed from your active deals",
      })
    } catch (error: any) {
      console.error("Error closing deal:", error)
      toast({
        title: "Error closing deal",
        description: error.message || "Failed to close deal. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchDealStatusSummary = async (dealId: string) => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

      const response = await fetch(`${apiUrl}/deals/${dealId}/status-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Deal status summary:", data)

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
          } catch (error) {
            console.error(`Error fetching buyer ${buyerId}:`, error)
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
    } catch (error) {
      console.error("Error fetching deal status summary:", error)
    }
    return []
  }

  // Update the useEffect that fetches buyer activity for off-market dialog:
  useEffect(() => {
    if (offMarketDialogOpen && selectedDealForOffMarket && offMarketData.buyerFromCIM === true) {
      setBuyerActivity([]) // Reset before fetching
      setBuyerActivityLoading(true)
      fetchDealStatusSummary(selectedDealForOffMarket._id).finally(() => setBuyerActivityLoading(false))
    }
  }, [offMarketDialogOpen, selectedDealForOffMarket, offMarketData.buyerFromCIM])

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

  // Navigation component to avoid duplication
  const NavigationContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="mb-8">
        <Link href="/seller/dashboard" onClick={onNavigate}>
          <Image src="/logo.svg" alt="CIM Amplify Logo" width={150} height={50} className="h-auto" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6">
        <Button
          variant="secondary"
          className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
          onClick={onNavigate}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16.5 6L12 1.5L7.5 6M3.75 8.25H20.25M5.25 8.25V19.5C5.25 19.9142 5.58579 20.25 6 20.25H18C18.4142 20.25 18.75 19.9142 18.75 19.5V8.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>MyDeals</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 font-normal"
          onClick={() => {
            onNavigate?.()
            router.push("/seller/view-profile")
          }}
        >
          <Eye className="h-5 w-5" />
          <span>View Profile</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 font-normal"
          onClick={() => {
            onNavigate?.()
            router.push("/seller/history")
          }}
        >
          <Clock className="h-5 w-5" />
          <span>Off Market</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 font-normal text-red-600 hover:text-red-700 hover:bg-red-50 mt-auto"
          onClick={() => {
            onNavigate?.()
            handleLogout()
          }}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
      </nav>
    </>
  )

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col">
          <NavigationContent />
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4 p-3 sm:p-4">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-3 sm:px-6 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-8">
                    <NavigationContent onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Active Deals</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-medium text-sm sm:text-base">
                    {userProfile?.fullName || sellerProfile?.fullName || "User"}
                  </div>
                </div>
                <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium overflow-hidden">
                  {sellerProfile?.profilePicture ? (
                    <img
                      src={
                        getProfilePictureUrl(sellerProfile.profilePicture) || "/placeholder.svg" || "/placeholder.svg"
                      }
                      alt={sellerProfile.fullName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    (sellerProfile?.fullName || "U").charAt(0)
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-4 mt-6">
            {/* Deals Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="relative w-full sm:w-2/3">
                  <Input
                    type="text"
                    placeholder="Search deal with Title"
                    className="border-gray-300 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="default"
                  className="bg-[#3aafa9] hover:bg-[#2a9d8f] w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => router.push("/seller/seller-form")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </div>

              <div className="p-3 sm:p-6">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-20 w-full mb-4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error && deals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-red-500 text-lg mb-2">Error loading deals</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => setRefreshTrigger((prev) => prev + 1)}>Try Again</Button>
                  </div>
                ) : filteredDeals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-500 text-lg mb-4">
                      {searchTerm ? "No deals match your search" : "You don't have any deals yet"}
                    </div>
                    <Button onClick={() => router.push("/seller/seller-form")}>Create Your First Deal</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {filteredDeals.map((deal) => (
                      <DealCard
                        key={deal._id}
                        deal={deal}
                        onDocumentUpload={handleDocumentUpload}
                        handleOffMarketClick={handleOffMarketClick}
                        handleCompleteDealClick={handleCompleteDealClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Off Market Dialog */}
        <Dialog open={offMarketDialogOpen} onOpenChange={setOffMarketDialogOpen}>
          <DialogContent className="sm:max-w-md">
            {currentDialogStep === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-lg font-medium">Did the deal sell?</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant={offMarketData.dealSold === false ? "default" : "outline"}
                    onClick={() => handleDialogResponse("dealSold", false)}
                    className={
                      offMarketData.dealSold === false
                        ? "px-8 bg-red-500 text-white hover:bg-red-600 border-red-500"
                        : "px-8 bg-white text-red-500 border border-red-500 hover:bg-red-50"
                    }
                  >
                    No
                  </Button>
                  <Button
                    variant={offMarketData.dealSold === true ? "default" : "outline"}
                    onClick={() => handleDialogResponse("dealSold", true)}
                    className={
                      offMarketData.dealSold === true
                        ? "px-8 bg-teal-500 text-white hover:bg-teal-600 border-teal-500"
                        : "px-8 bg-white text-teal-500 border border-teal-500 hover:bg-teal-50"
                    }
                  >
                    Yes
                  </Button>
                </div>
              </>
            ) : currentDialogStep === 2 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-lg font-medium">What was the transaction value?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    value={
                      offMarketData.transactionValue && offMarketData.transactionValue !== "0"
                        ? formatWithCommas(offMarketData.transactionValue)
                        : ""
                    }
                    onChange={(e) => {
                      // Remove commas before storing in state
                      const rawValue = e.target.value.replace(/,/g, "")
                      setOffMarketData((prev) => ({
                        ...prev,
                        transactionValue: rawValue,
                      }))
                    }}
                    placeholder="Enter transaction value"
                    className="w-full"
                  />
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setCurrentDialogStep(3)}
                      className="px-8 bg-teal-500 hover:bg-teal-600"
                      disabled={!offMarketData.transactionValue}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : currentDialogStep === 3 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-teal-500 text-lg font-medium">Did the buyer come from CIM Amplify?</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* Buyer from CIM Amplify */}
                  <div className="flex gap-4">
                    <Button
                      variant={offMarketData.buyerFromCIM === false ? "default" : "outline"}
                      onClick={handleImmediateCloseNoCIM}
                      className={
                        offMarketData.buyerFromCIM === false
                          ? "flex-1 bg-red-500 text-white hover:bg-red-600 border-red-500"
                          : "flex-1 bg-white text-red-500 border border-red-500 hover:bg-red-50"
                      }
                    >
                      No
                    </Button>
                    <Button
                      variant={offMarketData.buyerFromCIM === true ? "default" : "outline"}
                      onClick={() => {
                        setOffMarketData((prev) => ({ ...prev, buyerFromCIM: true }))
                        setCurrentDialogStep(4)
                      }}
                      className={
                        offMarketData.buyerFromCIM === true
                          ? "flex-1 bg-teal-500 text-white hover:bg-teal-600 border-teal-500"
                          : "flex-1 bg-white text-teal-500 border border-teal-500 hover:bg-teal-50"
                      }
                    >
                      Yes
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

        {/* Buyer Selection Dialog (Step 4) */}
        <Dialog open={offMarketDialogOpen && currentDialogStep === 4} onOpenChange={setOffMarketDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="sr-only">Select Buyer</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-2">
              <div>
                <Label className="text-base font-medium mb-3 block">Select the buyer:</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {buyerActivityLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></span>
                      Matching this deal with potential buyers...
                    </div>
                  ) : activeBuyerOptions.length > 0 ? (
                    activeBuyerOptions.map((buyer) => (
                      <div
                        key={buyer.buyerId}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                          selectedWinningBuyer === buyer.buyerId
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => setSelectedWinningBuyer(buyer.buyerId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                            <img
                              src="/placeholder.svg?height=40&width=40"
                              alt={buyer.buyerName || "Buyer"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{buyer.buyerName || "Unknown Buyer"}</div>
                            <div className="text-xs text-gray-500">{buyer.companyName || "Unknown Company"}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No active buyers found. Please ensure there are interested buyers before completing the deal.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleOffMarketSubmit} className="bg-teal-500 hover:bg-teal-600" disabled={!selectedWinningBuyer}>
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Complete Deal Dialog */}
        <Dialog open={completeDealDialogOpen} onOpenChange={setCompleteDealDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600 text-lg font-medium">Complete Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="text-center text-gray-600">
                Mark this deal as completed and update the final sale price.
              </div>

              {/* Final Sale Price */}
              <div>
                <Label className="text-base font-medium mb-3 block">Final Sale Price</Label>
                <Input
                  type="number"
                  value={completionData.finalSalePrice}
                  onChange={(e) =>
                    setCompletionData((prev) => ({
                      ...prev,
                      finalSalePrice: e.target.value,
                    }))
                  }
                  placeholder="Enter final sale price"
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Original asking price: $
                  {selectedDealForCompletion?.financialDetails.askingPrice?.toLocaleString() || 0}
                </div>
              </div>

              {/* Buyer Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Select Winning Buyer</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {buyerActivityLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></span>
                      Matching this deal with potential buyers...
                    </div>
                  ) : activeBuyerOptions.length > 0 ? (
                    activeBuyerOptions.map((buyer) => (
                      <div
                        key={buyer.buyerId}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                          selectedWinningBuyer === buyer.buyerId ? "border-green-500 bg-green-50" : "border-gray-200"
                        }`}
                        onClick={() => setSelectedWinningBuyer(buyer.buyerId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                            <img
                              src="/placeholder.svg?height=40&width=40"
                              alt={buyer.buyerName || "Buyer"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{buyer.buyerName || "Unknown Buyer"}</div>
                            <div className="text-xs text-gray-500">{buyer.companyName || "Unknown Company"}</div>
                          </div>
                        </div>
                        
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-amber-600 text-sm py-4">
                      No buyers found. Please ensure there are interested buyers before completing the deal.
                    </div>
                  )}
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCompleteDealDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteDealSubmit}
                  className="bg-green-600 hover:bg-green-700"
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
