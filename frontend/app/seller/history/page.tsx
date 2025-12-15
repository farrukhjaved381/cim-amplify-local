"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Eye, Clock, Settings, LogOut, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  avgRevenueGrowth?: number
  trailingEBITDAAmount?: number
  trailingRevenueAmount?: number
  closedWithBuyerCompany?: string
  closedWithBuyerEmail?: string
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{deal.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{deal.description}</p>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500">Industry Sector: </span>
          <span className="font-medium text-gray-900">{deal.industrySector || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-500">Location: </span>
          <span className="font-medium text-gray-900">{deal.geographySelection || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-500">Avg Revenue Growth: </span>
          <span className="font-medium text-gray-900">
            {deal.avgRevenueGrowth !== undefined ? `${deal.avgRevenueGrowth}%` : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Trailing 12 Revenue Amount: </span>
          <span className="font-medium text-gray-900">
            {deal.trailingRevenueAmount !== undefined && deal.trailingRevenueAmount !== null
              ? `${deal.trailingRevenueAmount.toLocaleString()}`
              : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Trailing 12 EBITDA: </span>
          <span className="font-medium text-gray-900">
            {deal.trailingEBITDAAmount !== undefined
              ? `$${deal.trailingEBITDAAmount.toLocaleString()}`
              : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Closing Date: </span>
          <span className="font-medium text-gray-900">{deal.updatedAt}</span>
        </div>
        <div>
          <span className="text-gray-500">Final Sale Price: </span>
          <span className="font-medium text-gray-900">{deal.finalSalePrice}</span>
        </div>
        {/* Show buyer company and email if present */}
        {deal.closedWithBuyerCompany && (
          <div>
            <span className="text-gray-500">Buyer Company: </span>
            <span className="font-medium text-gray-900">{deal.closedWithBuyerCompany}</span>
          </div>
        )}
        {deal.closedWithBuyerEmail && (
          <div>
            <span className="text-gray-500">Buyer Email: </span>
            <span className="font-medium text-gray-900">{deal.closedWithBuyerEmail}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DealsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("history")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [profileName, setProfileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoadingDeals, setIsLoadingDeals] = useState(true)
  const [dealsError, setDealsError] = useState<string | null>(null)

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
          console.log("Deals API response:", data);
          setSellerProfile(data)
          setUserProfile({
            fullName: data.fullName,
            location: data.companyName,
            phone: data.email,
            profilePicture: data.profilePicture,
          })
          setProfileName(data.fullName)
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error)
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
        const token = localStorage.getItem("token")
        const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

        const response = await fetch(`${apiUrl}/deals/completed`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
           console.log("Deals API response:", data); 
          // Map backend fields to frontend Deal interface
       const mappedDeals: Deal[] = data.map((deal: any, idx: number) => ({
  id: deal.id || deal._id || `deal-${idx}`,
  title: deal.title,
  description: deal.companyDescription,
  industrySector: deal.industrySector,
  geographySelection: deal.geographySelection,
  avgRevenueGrowth: deal.financialDetails?.avgRevenueGrowth,
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
    : "N/A",
  closedWithBuyerCompany: deal.closedWithBuyerCompany,
  closedWithBuyerEmail: deal.closedWithBuyerEmail,
}))
          setDeals(mappedDeals)
        } else {
          setDealsError("Failed to fetch deals")
        }
      } catch (error) {
        console.error("Error fetching deals:", error)
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

  const getProfilePictureUrl = (path: string | null) => {
    if (!path) return null
    const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"
    const formattedPath = path.replace(/\\/g, "/")
    return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.slice(1) : formattedPath}`
  }
  // Add router hook at the top of the component
  const router = useRouter()

  // Add handleLogout function
  const handleLogout = () => {
    // If you have a logout function from a context, use it here
    // For now, clear token and redirect to login
    localStorage.removeItem("token")
    router.push("/seller/login")
  }

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = localStorage.getItem("token")
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app"

      const response = await fetch(`${apiUrl}/sellers/upload-profile-picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()

      setUserProfile((prev: any) => ({
        ...prev,
        profilePicture: result.profilePicture,
      }))
    } catch (error) {
      console.error("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

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
          setEditingProfile(null)
        }
      } catch (error) {
        console.error("Update failed")
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <Link href="/seller/dashboard">
            <Image src="/logo.svg" alt="CIM Amplify Logo" width={150} height={50} className="h-auto" />
          </Link>
        </div>

        <nav className="flex-1 space-y-6">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/seller/dashboard")}
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
            <span>My Deals</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/seller/view-profile")}
          >
            <Eye className="h-5 w-5" />
            <span>View Profile</span>
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
          >
            <Clock className="h-5 w-5" />
            <span>Off Market
</span>
          </Button>

          {/* <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/seller/settings")}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Button> */}

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal text-red-600 hover:text-red-700 hover:bg-red-50 mt-auto"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Deals Now Off Market</h1>

          <div className="flex items-center justify-start gap-60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search here..."
                className="pl-10 w-80 bg-gray-100 border-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium flex items-center">
                  {editingProfile === "name" ? (
                    <div className="flex items-center">
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="mr-2 w-40"
                      />
                      <Button variant="ghost" size="icon" onClick={handleUpdateName} className="h-6 w-6 mr-1">
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingProfile(null)} className="h-6 w-6"/>
                        <X className="h-4 w-4 text-red-500" />
                      </div>
                  ) : (
                    <>
                      {userProfile?.fullName || sellerProfile?.fullName || "User"}
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProfile("name")}
                        className="ml-1 h-6 w-6"
                      >
                        <Pencil className="h-3 w-3 text-gray-400" />
                      </Button> */}
                    </>
                  )}
                </div>
                {/* <div className="text-sm text-gray-500">
                  {userProfile?.location || sellerProfile?.companyName || "Company"}
                </div> */}
              </div>
              <div className="relative h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium overflow-hidden">
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
    (sellerProfile?.fullName || "U").charAt(0)
  )}
</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {isLoadingDeals ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading deals...</p>
            </div>
          ) : dealsError ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{dealsError}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>

              {filteredDeals.length === 0 && deals.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No deals found matching your search.</p>
                </div>
              )}

              {deals.length === 0 && !isLoadingDeals && !dealsError && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No completed deals found.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}