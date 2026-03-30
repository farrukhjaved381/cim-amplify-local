"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BuyerProtectedRoute } from "@/components/buyer/protected-route";
import {
  Search, Briefcase, User, Menu,
  ChevronDown, ChevronUp, Building2, MapPin,
  DollarSign, Loader2, CheckCircle2, XCircle,
  ArrowRight, RefreshCw, AlertTriangle, Phone, Mail
} from "lucide-react";
import { BuyerNav } from "@/components/buyer/buyer-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Deal {
  id: string;
  sellerId?: string;
  title: string;
  status: "active" | "pending" | "passed";
  companyDescription: string;
  industry: string;
  geography: string;
  yearsInBusiness: number;
  trailingRevenue: number;
  trailingEbitda: number;
  averageGrowth?: number;
  netIncome: number;
  askingPrice: number;
  businessModel: string;
  phoneNumber: string;
  email: string;
  t12FreeCashFlow?: number;
  t12NetIncome?: number;
  documents?: Document[];
  trailingRevenueCurrency?: string;
  trailingEbitdaCurrency?: string;
  t12FreeCashFlowCurrency?: string;
  t12NetIncomeCurrency?: string;
  netIncomeCurrency?: string;
  askingPriceCurrency?: string;
  managementPreferences?: string;
  isLoi?: boolean;
}

interface Document {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface CompanyProfileData {
  _id: string;
  companyName: string;
  website: string;
  selectedCurrency: string;
  contacts: Array<{ name: string; email: string; phone: string }>;
  companyType: string;
  capitalEntity?: string;
  dealsCompletedLast5Years?: number;
  averageDealSize?: number;
  preferences?: {
    stopSendingDeals: boolean;
    doNotSendMarketedDeals: boolean;
    allowBuyerLikeDeals: boolean;
  };
  targetCriteria?: {
    countries: string[];
    industrySectors: string[];
    revenueMin?: number;
    revenueMax?: number;
    ebitdaMin?: number;
    ebitdaMax?: number;
    transactionSizeMin?: number;
    transactionSizeMax?: number;
    revenueGrowth?: number;
    minStakePercent?: number;
    minYearsInBusiness?: number;
    preferredBusinessModels?: string[];
    description?: string;
  };
  agreements?: {
    termsAndConditionsAccepted: boolean;
    ndaAccepted: boolean;
    feeAgreementAccepted: boolean;
    agreementsAcceptedAt?: string;
  };
  buyer: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface BuyerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  profilePicture: string | null;
}

type SellerInfo = {
  name: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  website?: string;
};

type SellerInfoMap = {
  [sellerId: string]: SellerInfo;
};

// Format currency helper
const formatCurrency = (value: number) => {
  if (!value && value !== 0) return "N/A";
  return value.toLocaleString();
};

const getCurrencyLabel = (currency?: string, fallback?: string) => {
  if (currency && currency !== "$") return currency;
  if (fallback && fallback !== "$") return fallback;
  return "USD($)";
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");

const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return API_BASE_URL;
};

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [dealDetailsOpen, setDealDetailsOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showProfileIncompleteWarning, setShowProfileIncompleteWarning] = useState(false);
  const [phoneNumber, setphoneNumber] = useState<{ phone: string; email: string; } | null>(null);
  const [sellerInfoMap, setSellerInfoMap] = useState<SellerInfoMap>({});
  const [sellerInfoLoading, setSellerInfoLoading] = useState(false);
  const [passingDealId, setPassingDealId] = useState<string | null>(null);
  const [activatingDealId, setActivatingDealId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleDescription = (dealId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout: authLogout } = useAuth();
  const { toast, dismiss } = useToast();

  // Memoized deal counts
  const dealCounts = useMemo(() => ({
    pending: deals.filter(d => d.status === "pending").length,
    active: deals.filter(d => d.status === "active").length,
    passed: deals.filter(d => d.status === "passed").length,
    total: deals.length,
    loi: deals.filter(d => d.isLoi).length
  }), [deals]);

  // API functions
  const fetchDealsByStatus = async (status: "pending" | "active" | "passed") => {
    try {
      setApiError(null);
      const token = sessionStorage.getItem("token");
      if (!token) {
        setApiError("Authentication token not found. Please log in again.");
        return [];
      }

      const apiUrl = getApiBaseUrl();

      let endpoint = "";
      switch (status) {
        case "pending":
          endpoint = "/buyers/deals/pending";
          break;
        case "active":
          endpoint = "/buyers/deals/active";
          break;
        case "passed":
          endpoint = "/buyers/deals/rejected";
          break;
      }

      const url = `${apiUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear all auth storage
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refreshToken");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("userRole");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          router.push("/buyer/login");
          return [];
        }
        throw new Error(`Failed to fetch ${status} deals: ${response.status}`);
      }

      const data = await response.json();

      const mappedDeals = data.map((deal: any) => ({
        id: deal._id,
        sellerId: typeof deal.seller === "string" ? deal.seller : deal.seller?._id,
        title: deal.title,
        status: status,
        companyDescription: deal.companyDescription,
        industry: deal.industrySector,
        geography: deal.geographySelection,
        yearsInBusiness: deal.yearsInBusiness,
        trailingRevenue: deal.financialDetails?.trailingRevenueAmount || 0,
        trailingEbitda: deal.financialDetails?.trailingEBITDAAmount || 0,

        netIncome: deal.financialDetails?.netIncome || 0,
        askingPrice: deal.financialDetails?.askingPrice || 0,
        businessModel: getBusinessModelString(deal.businessModel),
        phoneNumber: "Contact via platform",
        email: "Contact via platform",
        t12FreeCashFlow: deal.financialDetails?.t12FreeCashFlow || 0,
        t12NetIncome: deal.financialDetails?.t12NetIncome || 0,
        documents: deal.documents || [],
        trailingRevenueCurrency: deal.financialDetails?.trailingRevenueCurrency || "$",
        trailingEbitdaCurrency: deal.financialDetails?.trailingEBITDACurrency || "$",
        t12FreeCashFlowCurrency: deal.financialDetails?.t12FreeCashFlowCurrency || "$",
        t12NetIncomeCurrency: deal.financialDetails?.t12NetIncomeCurrency || "$",
        netIncomeCurrency: deal.financialDetails?.netIncomeCurrency || "$",
        askingPriceCurrency: deal.financialDetails?.askingPriceCurrency || "$",
        managementPreferences: deal.managementPreferences || deal.managementFuturePreferences || '',
        isLoi: deal.status === 'loi' || deal.isLoi === true,
      }));

      return mappedDeals;
    } catch (error) {
      return [];
    }
  };

  const fetchAllDeals = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setDeals([]);

      const [pendingDeals, activeDeals, passedDeals] = await Promise.all([
        fetchDealsByStatus("pending"),
        fetchDealsByStatus("active"),
        fetchDealsByStatus("passed"),
      ]);

      const allDeals = [...pendingDeals, ...activeDeals, ...passedDeals];
      setDeals(allDeals);
    } catch (error) {
      setApiError("Failed to load deals. Please try again later.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setInitialLoadComplete(true);
    }
  };

  const getBusinessModelString = (businessModel: any) => {
    if (!businessModel) return "Not specified";
    const models = [];
    if (businessModel.recurringRevenue) models.push("Recurring Revenue");
    if (businessModel.projectBased) models.push("Project-Based");
    if (businessModel.assetLight) models.push("Asset Light");
    if (businessModel.assetHeavy) models.push("Asset Heavy");
    return models.join(", ") || "Not specified";
  };

  const isProfileComplete = (profile: CompanyProfileData | null): boolean => {
    if (!profile) return false;
    if (!profile.companyName || !profile.website || profile.contacts.length === 0 ||
        !profile.companyType || !profile.capitalEntity ||
        profile.dealsCompletedLast5Years === undefined || profile.averageDealSize === undefined) {
      return false;
    }
    const contactsComplete = profile.contacts.every(c => c.name && c.email && c.phone);
    if (!contactsComplete) return false;
    if (!profile.targetCriteria || profile.targetCriteria.countries.length === 0 ||
        profile.targetCriteria.industrySectors.length === 0 ||
        profile.targetCriteria.revenueMin === undefined || profile.targetCriteria.revenueMax === undefined ||
        profile.targetCriteria.ebitdaMin === undefined || profile.targetCriteria.ebitdaMax === undefined ||
        profile.targetCriteria.transactionSizeMin === undefined || profile.targetCriteria.transactionSizeMax === undefined ||
        profile.targetCriteria.minYearsInBusiness === undefined ||
        !profile.targetCriteria.preferredBusinessModels || profile.targetCriteria.preferredBusinessModels.length === 0 ||
        !profile.targetCriteria.description) {
      return false;
    }
    if (!profile.agreements || !profile.agreements.feeAgreementAccepted) {
      return false;
    }
    return true;
  };

  const updateDealStatus = async (dealId: string, action: "activate" | "reject" | "set-pending") => {
    try {
      setApiError(null);
      const token = sessionStorage.getItem("token");
      const currentBuyerId = sessionStorage.getItem("userId");
      const apiUrl = getApiBaseUrl();

      if (!token || !currentBuyerId) {
        setApiError("Authentication required. Please log in again.");
        return false;
      }

      let endpoint = "";
      let body: any = {};

      switch (action) {
        case "activate":
          endpoint = `/buyers/deals/${dealId}/activate`;
          body = { notes: "Buyer interested in deal" };
          break;
        case "reject":
          endpoint = `/buyers/deals/${dealId}/reject`;
          body = { notes: "Deal passed by buyer" };
          break;
        case "set-pending":
          endpoint = `/buyers/deals/${dealId}/set-pending`;
          body = { notes: "Deal set back to pending" };
          break;
        default:
          return false;
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear all auth storage
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refreshToken");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("userRole");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          router.push("/buyer/login");
          return false;
        }
        throw new Error(`Failed to update deal status`);
      }

      toast({
        title: action === "activate" ? "Deal Activated" : action === "reject" ? "Deal Passed" : "Deal Updated",
        description: action === "activate"
          ? "The deal has been moved to your active deals."
          : action === "reject"
          ? "The deal has been moved to passed deals."
          : "Deal status updated successfully.",
      });

      await fetchAllDeals(true);
      return true;
    } catch (error) {
      setApiError(`Failed to update deal status. Please try again.`);
      return false;
    }
  };

  const initializeComponent = () => {
    const urlToken = searchParams?.get("token");
    const urlUserId = searchParams?.get("userId");

    if (urlToken) {
      localStorage.setItem("token", urlToken.trim());
      setAuthToken(urlToken.trim());
    } else {
      const storedToken = sessionStorage.getItem("token");
      if (storedToken) {
        setAuthToken(storedToken.trim());
      } else {
        router.push("/buyer/login");
        return false;
      }
    }

    if (urlUserId) {
      localStorage.setItem("userId", urlUserId.trim());
      setBuyerId(urlUserId.trim());
    } else {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        setBuyerId(storedUserId.trim());
      }
    }

    return true;
  };

  const handleEmailAction = async (action: string, dealId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    url.searchParams.delete('dealId');
    window.history.replaceState({}, '', url.toString());

    if (action === 'activate') {
      setActivatingDealId(dealId);
      try {
        const success = await updateDealStatus(dealId, 'activate');
        if (success) {
          setActiveTab('active');
        }
      } finally {
        setActivatingDealId(null);
      }
    } else if (action === 'pass') {
      setPassingDealId(dealId);
      try {
        const success = await updateDealStatus(dealId, 'reject');
        if (success) {
          setActiveTab('passed');
        }
      } finally {
        setPassingDealId(null);
      }
    }
  };

  useEffect(() => {
    if (searchParams?.get("profileSubmitted") === "true" && !localStorage.getItem("profileSubmissionNotified")) {
      setProfileSubmitted(true);
      localStorage.setItem("profileSubmissionNotified", "true");
    }

    if (!isInitialized) {
      const initialized = initializeComponent();
      if (!initialized) return;
      setIsInitialized(true);
      checkProfileSubmission();
      fetchBuyerProfile();
      fetchAllDeals();
    }
  }, [searchParams, router, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const emailAction = searchParams?.get('action');
    const emailDealId = searchParams?.get('dealId');
    if (emailAction && emailDealId) {
      handleEmailAction(emailAction, emailDealId);
    }
  }, [isInitialized, searchParams]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        fetchAllDeals(true);
        fetchBuyerProfile();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isInitialized]);

  const checkProfileSubmission = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userId = sessionStorage.getItem("userId");
      if (!token || !userId) return;

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/company-profiles/my-profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (!response || !response.ok) {
        setShowProfileIncompleteWarning(true);
        return;
      }

      const data: CompanyProfileData = await response.json();
      setShowProfileIncompleteWarning(!isProfileComplete(data));
    } catch (error) {
      // Error checking profile
    }
  };

  const fetchBuyerProfile = async () => {
    try {
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/buyers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear all auth storage
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("refreshToken");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("userRole");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          router.push("/buyer/login");
          return;
        }
        throw new Error(`Failed to fetch buyer profile`);
      }

      const data = await response.json();
      setBuyerProfile(data);
    } catch (error) {
      // Error fetching buyer profile
    }
  };

  const handlePassDeal = async (dealId: string) => {
    setPassingDealId(dealId);
    try {
      const success = await updateDealStatus(dealId, "reject");
      if (success) {
        setDealDetailsOpen(false);
        setActiveTab("passed");
      }
    } finally {
      setPassingDealId(null);
    }
  };

  const fetchphoneNumber = async (deal: Deal) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/deals/${deal.id}/seller-contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setphoneNumber({
        phone: data.phoneNumber || "N/A",
        email: data.email || "N/A",
      });
    } catch (error) {
      setphoneNumber({ phone: "N/A", email: "N/A" });
    }
  };

  const handleViewDealDetails = (deal: Deal) => {
    if (deal.status === "active") {
      setSelectedDeal(deal);
      setDealDetailsOpen(true);
      fetchphoneNumber(deal);
      if (deal.sellerId) {
        fetchSellerInfo(deal.sellerId);
      }
    } else if (deal.status === "pending" || deal.status === "passed") {
      setSelectedDealId(deal.id);
      handleGoToCIMClick(deal.id);
    }
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (deal.status !== activeTab) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          deal.title.toLowerCase().includes(query) ||
          deal.companyDescription.toLowerCase().includes(query) ||
          deal.industry.toLowerCase().includes(query) ||
          deal.geography.toLowerCase().includes(query) ||
          deal.businessModel.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [deals, activeTab, searchQuery]);

  const handleGoToCIMClick = async (dealId: string) => {
    setActivatingDealId(dealId);
    try {
      const success = await updateDealStatus(dealId, "activate");
      if (success) {
        setActiveTab("active");
      }
    } finally {
      setActivatingDealId(null);
    }
  };

  const handleLogout = () => {
    authLogout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000,
    });
  };

  const getProfilePictureUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("data:image")) return path;
    const apiUrl = getApiBaseUrl();
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const formattedPath = path.replace(/\\/g, "/");
    return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.substring(1) : formattedPath}`;
  };

  const fetchSellerInfo = async (sellerId: string) => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/sellers/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerIds: [sellerId] }),
      });
      if (!response.ok) throw new Error("Failed to fetch seller info");
      const [data] = await response.json();
      setSellerInfoMap(prev => ({
        ...prev,
        [sellerId]: {
          name: data?.fullName || "N/A",
          email: data?.email || "N/A",
          phoneNumber: data?.phoneNumber || "N/A",
          companyName: data?.companyName || "N/A",
          website: data?.website || "N/A",
        },
      }));
    } catch {
      setSellerInfoMap(prev => ({
        ...prev,
        [sellerId]: { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" },
      }));
    }
  };

  useEffect(() => {
    if (activeTab !== "active") return;

    const fetchSellerInfos = async () => {
      const uniqueSellerIds = Array.from(
        new Set(filteredDeals.map(d => d.sellerId).filter((id): id is string => typeof id === "string"))
      ).filter(sellerId => !sellerInfoMap[sellerId]);

      if (uniqueSellerIds.length === 0) {
        setSellerInfoLoading(false);
        return;
      }

      setSellerInfoLoading(true);
      const apiUrl = getApiBaseUrl();
      try {
        const response = await fetch(`${apiUrl}/sellers/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sellerIds: uniqueSellerIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch seller bulk info");
        }

        const sellers = await response.json();
        const nextMap: SellerInfoMap = {};
        for (const seller of sellers) {
          if (!seller?.id) continue;
          nextMap[seller.id] = {
            name: seller.fullName || "N/A",
            email: seller.email || "N/A",
            phoneNumber: seller.phoneNumber || "N/A",
            companyName: seller.companyName || "N/A",
            website: seller.website || "N/A",
          };
        }

        for (const sellerId of uniqueSellerIds) {
          if (!nextMap[sellerId]) {
            nextMap[sellerId] = { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" };
          }
        }

        setSellerInfoMap(prev => ({ ...prev, ...nextMap }));
      } catch {
        const fallbackMap: SellerInfoMap = {};
        for (const sellerId of uniqueSellerIds) {
          fallbackMap[sellerId] = { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" };
        }
        setSellerInfoMap(prev => ({ ...prev, ...fallbackMap }));
      }
      setSellerInfoLoading(false);
    };

    fetchSellerInfos();
  }, [filteredDeals, activeTab]);

  // Loading State
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-teal-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <BuyerProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-8 py-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-gray-100">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-6 border-b border-gray-200">
                  <Link href="/buyer/deals" onClick={() => setMobileMenuOpen(false)}>
                    <img src="/logo.svg" alt="CIM Amplify" className="h-10" />
                  </Link>
                </div>
                <BuyerNav activePage="deals" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/buyer/deals" className="hidden lg:block">
              <img src="/logo.svg" alt="CIM Amplify" className="h-10" />
            </Link>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals by title, industry, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right: Actions + Profile */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchAllDeals(true)}
              disabled={isRefreshing}
              className="hover:bg-gray-100 rounded-xl"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{buyerProfile?.fullName || "User"}</p>
                <p className="text-xs text-gray-500">{buyerProfile?.companyName || "Buyer"}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-teal-200">
                {buyerProfile?.profilePicture ? (
                  <img
                    src={getProfilePictureUrl(buyerProfile.profilePicture) || ""}
                    alt={buyerProfile.fullName}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  buyerProfile?.fullName?.charAt(0) || "U"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block md:w-56 border-r border-gray-200 bg-white h-[calc(100vh-4rem)] sticky top-[4rem] overflow-y-auto flex-shrink-0">
          <BuyerNav activePage="deals" onLogout={handleLogout} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Alerts */}
          {profileSubmitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">Your company profile has been successfully submitted!</p>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{apiError}</p>
              </div>
              <button onClick={() => setApiError(null)} className="text-red-600 hover:text-red-800">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {showProfileIncompleteWarning && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Complete your profile to receive deals</p>
                  <p className="text-xs text-amber-600 mt-1">You won&apos;t receive any deals until your Company Overview is complete.</p>
                  <Link href="/buyer/acquireprofile">
                    <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg">
                      Complete Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {["pending", "active", "passed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'bg-teal-500 text-white hover:bg-teal-600'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {dealCounts[tab as keyof typeof dealCounts]}
                  </span>
                </button>
              ))}
            </div>

            {searchQuery && (
              <p className="text-sm text-gray-500">
                {filteredDeals.length} result{filteredDeals.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Deals Grid */}
          {loading || !initialLoadComplete ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-2/3"></div>
                      <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 bg-gray-100 rounded-lg w-24"></div>
                      <div className="h-7 bg-gray-100 rounded-lg w-20"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 rounded w-28"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50/50 flex justify-end gap-3">
                    <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
                    <div className="h-10 bg-gray-200 rounded-xl w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <Briefcase className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600">
                {searchQuery
                  ? "No results found"
                  : `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Deals`}
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? `No deals match "${searchQuery}". Try adjusting your search terms.`
                  : activeTab === 'pending'
                  ? "We'll send you an email when a deal matches your criteria.Check out Marketplace to see deals that are posted by Advisors to all members."
                  : activeTab === 'active'
                  ? "Move deals from Pending to start working on them."
                  : "Deals you've passed on that are still on the market will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDeals.map((deal) => {
                const sellerIdStr = typeof deal.sellerId === "string" ? deal.sellerId : undefined;
                const sellerInfo = sellerIdStr && sellerInfoMap[sellerIdStr]
                  ? sellerInfoMap[sellerIdStr]
                  : { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" };

                return (
                  <div
                    key={deal.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
                      deal.isLoi
                        ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-white"
                        : "border-gray-100 hover:border-teal-200"
                    }`}
                  >
                    {/* LOI Warning Banner */}
                    {deal.isLoi && (
                      <div className="px-5 py-3 bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800">
                            Under LOI - We&apos;ll notify you if available again
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h3 className={`text-lg font-bold leading-tight ${
                          deal.isLoi ? "text-amber-700" : "text-gray-800"
                        }`}>
                          {activeTab === "active" ? deal.title : "Hidden Until Active"}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          deal.isLoi
                            ? "bg-amber-100 text-amber-700"
                            : deal.status === "active"
                            ? "bg-green-100 text-green-700"
                            : deal.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {deal.isLoi ? "LOI" : deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium">
                          <Building2 className="w-3.5 h-3.5 mr-1.5" />
                          {deal.industry || "N/A"}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 mr-1.5" />
                          {deal.geography || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Financial Section */}
                    <div className="p-5 bg-gradient-to-br from-gray-50/80 to-white border-b border-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4 text-teal-600" />
                        <h4 className="text-sm font-semibold text-gray-700">Financial Overview</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">T12 Revenue</p>
                          <p className="text-xs text-gray-400">{getCurrencyLabel(deal.trailingRevenueCurrency)}</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.trailingRevenue)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">T12 EBITDA</p>
                          <p className="text-xs text-gray-400">{getCurrencyLabel(deal.trailingEbitdaCurrency)}</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.trailingEbitda)}</p>
                        </div>


                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-blue-500" />
                            Asking Price
                          </p>
                          <p className="text-xs text-gray-400">{getCurrencyLabel(deal.askingPriceCurrency, deal.trailingRevenueCurrency)}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {deal.askingPrice ? formatCurrency(deal.askingPrice) : <span className="text-gray-400 text-sm">N/A</span>}
                          </p>
                        </div>
                        {deal.t12FreeCashFlow !== undefined && deal.t12FreeCashFlow !== 0 && (
                          <div className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">T12 Free Cash Flow</p>
                            <p className="text-xs text-gray-400">{getCurrencyLabel(deal.t12FreeCashFlowCurrency, deal.trailingRevenueCurrency)}</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.t12FreeCashFlow)}</p>
                          </div>
                        )}
                        {deal.t12NetIncome !== undefined && deal.t12NetIncome !== 0 && (
                          <div className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">T12 Net Income</p>
                            <p className="text-xs text-gray-400">{getCurrencyLabel(deal.t12NetIncomeCurrency, deal.trailingRevenueCurrency)}</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.t12NetIncome)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Business Details */}
                    <div className="p-5 border-b border-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Years in Business</p>
                          <p className="text-sm font-semibold text-gray-800">{deal.yearsInBusiness}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Business Model</p>
                          <p className="text-sm font-semibold text-gray-800">{deal.businessModel}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Company Description</p>
                        <p className={`text-sm text-gray-600 leading-relaxed ${expandedDescriptions.has(deal.id) ? '' : 'line-clamp-3'}`}>
                          {deal.companyDescription}
                        </p>
                        {deal.companyDescription && deal.companyDescription.length > 150 && (
                          <button
                            onClick={() => toggleDescription(deal.id)}
                            className="mt-2 text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                          >
                            {expandedDescriptions.has(deal.id) ? (
                              <>Show Less <ChevronUp className="h-3 w-3" /></>
                            ) : (
                              <>Show More <ChevronDown className="h-3 w-3" /></>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Management Preferences */}
                      {deal.managementPreferences && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Management Future Preferences</p>
                          <p className="text-sm text-gray-600">{deal.managementPreferences}</p>
                        </div>
                      )}
                    </div>

                    {/* Advisor Info */}
                    <div className="p-5 border-b border-gray-50">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Advisor Information</p>
                      {activeTab === "active" ? (
                        sellerInfoLoading && !sellerInfoMap[sellerIdStr || ""] ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        ) : (
                          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                            <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <User className="w-4 h-4 text-blue-600" />
                              {sellerInfo.name}
                            </p>
                            <p className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {sellerInfo.email}
                            </p>
                            <p className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {sellerInfo.phoneNumber}
                            </p>
                            {sellerInfo.companyName && sellerInfo.companyName !== 'N/A' && (
                              <p className="flex items-center gap-2 text-xs text-gray-600">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                {sellerInfo.companyName}
                              </p>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-400 italic">Hidden until active</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-5 bg-gray-50/50 flex flex-wrap justify-end gap-3">
                      {activeTab === "pending" && !deal.isLoi && (
                        <Button
                          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-200"
                          onClick={() => handleGoToCIMClick(deal.id)}
                          disabled={activatingDealId === deal.id}
                        >
                          {activatingDealId === deal.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Move to Active
                            </>
                          )}
                        </Button>
                      )}
                      {deal.status !== "passed" && !deal.isLoi && (
                        <Button
                          variant="outline"
                          className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl"
                          onClick={() => handlePassDeal(deal.id)}
                          disabled={passingDealId === deal.id}
                        >
                          {passingDealId === deal.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Passing...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Pass
                            </>
                          )}
                        </Button>
                      )}
                      {activeTab === "passed" && !deal.isLoi && (
                        <Button
                          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-200"
                          onClick={() => handleGoToCIMClick(deal.id)}
                          disabled={activatingDealId === deal.id}
                        >
                          {activatingDealId === deal.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reactivate
                            </>
                          )}
                        </Button>
                      )}
                      {deal.isLoi && (
                        <span className="text-sm text-amber-600 italic flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Under LOI - No actions available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
    </BuyerProtectedRoute>
  );
}

