"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Eye, LogOut, Briefcase, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Deal {
  id: string;
  sellerId?: string; // Add this line
  title: string;
  status: "active" | "pending" | "passed";
  companyDescription: string;
  industry: string;
  geography: string;
  yearsInBusiness: number;
  trailingRevenue: number;
  trailingEbitda: number;
  averageGrowth: number;
  netIncome: number;
  askingPrice: number;
  businessModel: string;
  phoneNumber: string;
  email: string;
  t12FreeCashFlow?: number; // <-- Add this line
  t12NetIncome?: number; // <-- Add this line
  documents?: Document[];
  trailingRevenueCurrency?: string; // <-- Add this line
  trailingEbitdaCurrency?: string;
  t12FreeCashFlowCurrency?: string;
  t12NetIncomeCurrency?: string;
  netIncomeCurrency?: string;
  askingPriceCurrency?: string;
  managementPreferences?: string; // <-- Add this line
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
    agreementsAcceptedAt?: string; // Assuming this is set when agreements are accepted
  };
  buyer: string; // Buyer ID
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
// Update SellerInfo type to include companyName and website
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

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [activeTitle, setActiveTitle] = useState("Pending Deals");
  const [termsModalOpen, setTermsModalOpen] = useState(false);
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
  const [phoneNumber, setphoneNumber] = useState<{
    phone: string;
    email: string;
  } | null>(null);
  const [sellerInfoMap, setSellerInfoMap] = useState<{
    [sellerId: string]: { name: string; email: string; phoneNumber: string };
  }>({});
  const [sellerInfoLoading, setSellerInfoLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Store the dealId to approve after modal
  const [pendingCIMDealId, setPendingCIMDealId] = useState<string | null>(null);

  // API functions
  const fetchDealsByStatus = async (
    status: "pending" | "active" | "passed"
  ) => {
    try {
      setLoading(true);
      setApiError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setApiError("Authentication token not found. Please log in again.");
        return [];
      }


      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";


      // Map status to API endpoint
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

      console.log(`Fetching ${status} deals from:`, url);
      console.log("Using token:", token.substring(0, 20) + "...");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed - redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.push("/buyer/login?session=expired");
          return [];
        }
        throw new Error(`Failed to fetch ${status} deals: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Raw API response for ${status}:`, data);

      // Map API response to component structure
      const mappedDeals = data.map((deal: any) => {
        console.log("Raw deal from API:", deal); // Debug: log the raw deal
        const mappedDeal = {
          id: deal._id,
          sellerId:
            typeof deal.seller === "string" ? deal.seller : deal.seller?._id,
          title: deal.title,
          status: status,
          companyDescription: deal.companyDescription,
          industry: deal.industrySector,
          geography: deal.geographySelection,
          yearsInBusiness: deal.yearsInBusiness,
          trailingRevenue: deal.financialDetails?.trailingRevenueAmount || 0,
          trailingEbitda: deal.financialDetails?.trailingEBITDAAmount || 0,
          averageGrowth: deal.financialDetails?.avgRevenueGrowth || 0,
          netIncome: deal.financialDetails?.netIncome || 0,
          askingPrice: deal.financialDetails?.askingPrice || 0,
          businessModel: getBusinessModelString(deal.businessModel),
          phoneNumber: "Contact via platform",
          email: "Contact via platform",
          t12FreeCashFlow: deal.financialDetails?.t12FreeCashFlow || 0,
          t12NetIncome: deal.financialDetails?.t12NetIncome || 0,
          documents: deal.documents || [],
          trailingRevenueCurrency:
            deal.financialDetails?.trailingRevenueCurrency || "$",
          trailingEbitdaCurrency:
            deal.financialDetails?.trailingEBITDACurrency || "$",
          t12FreeCashFlowCurrency:
            deal.financialDetails?.t12FreeCashFlowCurrency || "$",
          t12NetIncomeCurrency:
            deal.financialDetails?.t12NetIncomeCurrency || "$",
          netIncomeCurrency: deal.financialDetails?.netIncomeCurrency || "$",
          askingPriceCurrency:
            deal.financialDetails?.askingPriceCurrency || "$",
          managementPreferences: deal.managementPreferences || deal.managementFuturePreferences || '',
        };
        console.log("Mapped deal:", mappedDeal);
        return mappedDeal;
      });

      console.log(`All mapped ${status} deals:`, mappedDeals);
      return mappedDeals;
    } catch (error) {
      console.error(`Error fetching ${status} deals:`, error);
      setApiError(`Failed to load ${status} deals. Please try again later.`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeals = async () => {
    try {
      setLoading(true);
      setDeals([]); // <-- Add this line to clear previous deals
      console.log("Fetching all deals...");

      // Fetch deals for all statuses
      const [pendingDeals, activeDeals, passedDeals] = await Promise.all([
        fetchDealsByStatus("pending"),
        fetchDealsByStatus("active"),
        fetchDealsByStatus("passed"),
      ]);

      // Combine all deals
      const allDeals = [...pendingDeals, ...activeDeals, ...passedDeals];
      console.log("Combined all deals:", allDeals);

      setDeals(allDeals);
    } catch (error) {
      console.error("Error fetching all deals:", error);
      setApiError("Failed to load deals. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getBusinessModelString = (businessModel: any) => {
    if (!businessModel) return "Not specified";
    const models = [];
    if (businessModel.recurringRevenue) models.push("Recurring Revenue");
    if (businessModel.projectBased) models.push("Project-Based");
    if (businessModel.assetLight) models.push("Asset Light");
    if (businessModel.assetHeavy) models.push("Asset Heavy");
    return models.join(", ") || "Not specified";
  };

  // Helper to determine if the company profile is complete
  const isProfileComplete = (profile: CompanyProfileData | null): boolean => {
    if (!profile) return false;

    // Check essential top-level fields
    if (
      !profile.companyName ||
      !profile.website ||
      profile.contacts.length === 0 ||
      !profile.companyType ||
      !profile.capitalEntity ||
      profile.dealsCompletedLast5Years === undefined ||
      profile.averageDealSize === undefined
    ) {
      return false;
    }

    // Check contacts completeness
    const contactsComplete = profile.contacts.every(
      (contact) => contact.name && contact.email && contact.phone
    );
    if (!contactsComplete) return false;

    // Check targetCriteria fields
    if (
      !profile.targetCriteria ||
      profile.targetCriteria.countries.length === 0 ||
      profile.targetCriteria.industrySectors.length === 0 ||
      profile.targetCriteria.revenueMin === undefined ||
      profile.targetCriteria.revenueMax === undefined ||
      profile.targetCriteria.ebitdaMin === undefined ||
      profile.targetCriteria.ebitdaMax === undefined ||
      profile.targetCriteria.transactionSizeMin === undefined ||
      profile.targetCriteria.transactionSizeMax === undefined ||
      profile.targetCriteria.revenueGrowth === undefined ||
      profile.targetCriteria.minYearsInBusiness === undefined ||
      !profile.targetCriteria.preferredBusinessModels || profile.targetCriteria.preferredBusinessModels.length === 0 ||
      !profile.targetCriteria.description
    ) {
      return false;
    }

    // Check agreements
    if (
      !profile.agreements ||
      !profile.agreements.feeAgreementAccepted
    ) {
      return false;
    }

    return true;
  };

  // Update deal status via API
  const updateDealStatus = async (
    dealId: string,
    action: "activate" | "reject" | "set-pending"
  ) => {
    try {
      console.log(`=== Starting updateDealStatus ===`);
      console.log(`Deal ID: ${dealId}`);
      console.log(`Action: ${action}`);

      setApiError(null);
      const token = localStorage.getItem("token");
      const currentBuyerId = localStorage.getItem("userId");

      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";


      console.log("Token exists:", !!token);
      console.log("Buyer ID:", currentBuyerId);
      console.log("API URL:", apiUrl);

      if (!token) {
        const errorMsg = "Authentication token not found. Please log in again.";
        console.error(errorMsg);
        setApiError(errorMsg);
        return false;
      }

      if (!currentBuyerId) {
        const errorMsg = "User ID not found. Please log in again.";
        console.error(errorMsg);
        setApiError(errorMsg);
        return false;
      }

      let endpoint = "";
      const method = "POST";
      let body: any = {};

      // Use the correct endpoints from your backend
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
          const errorMsg = `Invalid action: ${action}`;
          console.error(errorMsg);
          setApiError(errorMsg);
          return false;
      }

      const url = `${apiUrl}${endpoint}`;
      console.log(`=== Making API Request ===`);
      console.log(`URL: ${url}`);
      console.log(`Method: ${method}`);
      console.log(`Headers:`, {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        "Content-Type": "application/json",
      });
      console.log(`Body:`, body);

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log(`=== API Response ===`);
      console.log(`Status: ${response.status}`);
      console.log(`Status Text: ${response.statusText}`);
      console.log(`OK: ${response.ok}`);

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
          console.error(`API Error Response:`, errorText);
        } catch (e) {
          console.error("Could not read error response:", e);
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }

        if (response.status === 401) {
          console.error(
            "Authentication failed during status update - redirecting to login"
          );
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.push("/buyer/login?session=expired");
          return false;
        }

        const errorMsg = `Failed to update deal status. Server responded with: ${response.status} - ${errorText}`;
        console.error(errorMsg);
        setApiError(errorMsg);
        return false;
      }

      let responseData = null;
      try {
        responseData = await response.json();
        console.log(`Success Response Data:`, responseData);
      } catch (e) {
        console.log("No JSON response body or failed to parse");
      }

      console.log(`=== Deal ${dealId} successfully updated to ${action} ===`);

      // Show success message
      console.log(`SUCCESS: Deal status updated to ${action}`);

      // Refresh all deals after successful update
      console.log("Refreshing all deals after successful update...");
      await fetchAllDeals();

      return true;
    } catch (error) {
      console.error(`=== Error updating deal status to ${action} ===`);
      console.error("Error details:", error);

      const errorMsg = `Failed to update deal status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      setApiError(errorMsg);
      return false;
    }
  };

  // Initialize component
  const initializeComponent = () => {
    console.log("Initializing DealsPage component");

    const urlToken = searchParams?.get("token");
    const urlUserId = searchParams?.get("userId");

    // Handle token from URL or localStorage
    if (urlToken) {
      const cleanToken = urlToken.trim();
      localStorage.setItem("token", cleanToken);
      setAuthToken(cleanToken);
      console.log("Token set from URL:", cleanToken.substring(0, 10) + "...");
    } else {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const cleanToken = storedToken.trim();
        setAuthToken(cleanToken);
        console.log(
          "Token set from localStorage:",
          cleanToken.substring(0, 10) + "..."
        );
      } else {
        console.warn("No token found, redirecting to login");
        router.push("/buyer/login");
        return false;
      }
    }

    // Handle user ID from URL or localStorage
    if (urlUserId) {
      const cleanUserId = urlUserId.trim();
      localStorage.setItem("userId", cleanUserId);
      setBuyerId(cleanUserId);
      console.log("Buyer ID set from URL:", cleanUserId);
    } else {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        const cleanUserId = storedUserId.trim();
        setBuyerId(cleanUserId);
        console.log("Buyer ID set from localStorage:", cleanUserId);
      } else {
        console.warn("No user ID found");
      }
    }

    return true;
  };

  // Check for token and userId on mount and from URL parameters
  useEffect(() => {
    console.log("DealsPage useEffect triggered");

    setActiveTitle(
      `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Deals`
    );

    if (
      searchParams?.get("profileSubmitted") === "true" &&
      !localStorage.getItem("profileSubmissionNotified")
    ) {
      setProfileSubmitted(true);
      localStorage.setItem("profileSubmissionNotified", "true");
      console.log(
        "Profile Submitted: Your company profile has been successfully submitted."
      );
    }

    if (!isInitialized) {
      const initialized = initializeComponent();
      if (!initialized) return;

      setIsInitialized(true);
      checkProfileSubmission();
      fetchBuyerProfile();
      fetchAllDeals();
    }
  }, [searchParams, router, activeTab, isInitialized]);

  // Add a separate effect to handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        console.log("Page became visible, refreshing data");
        fetchAllDeals();
        fetchBuyerProfile();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isInitialized]);

  const checkProfileSubmission = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        console.warn("Missing token or userId for profile check");
        return;
      }

      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";


      const response = await fetch(`${apiUrl}/company-profiles/my-profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch((error) => {
        console.log("Profile check error:", error);
        return null;
      });

      if (!response || !response.ok) {
        console.log("Profile check failed or no profile found (e.g., 404)");
        setShowProfileIncompleteWarning(true); // Treat as incomplete if API call fails or no profile found
        return;
      }

      const data: CompanyProfileData = await response.json();
      console.log("Data received for profile completeness check:", data); // Add this line

      if (!isProfileComplete(data)) {
        console.log("Profile incomplete, showing warning");
        setShowProfileIncompleteWarning(true);
      } else {
        setShowProfileIncompleteWarning(false);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const fetchBuyerProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Missing token for profile fetch");
        return;
      }


      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";


      const response = await fetch(`${apiUrl}/buyers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.push("/buyer/login?session=expired");
          return;
        }
        throw new Error(`Failed to fetch buyer profile: ${response.status}`);
      }

      const data = await response.json();
      setBuyerProfile(data);
      console.log("Buyer profile fetched:", data);
    } catch (error) {
      console.error("Error fetching buyer profile:", error);
    }
  };

  const handlePassDeal = async (dealId: string) => {
    console.log("Handling pass deal:", dealId);
    const success = await updateDealStatus(dealId, "reject");

    if (success) {
      console.log(
        "Deal Passed: The deal has been moved to the passed section."
      );
      setDealDetailsOpen(false);

      // Switch to passed tab to show the deal
      setActiveTab("passed");
      setActiveTitle("Passed Deals");
    }
  };

  // Fetch seller contact info for a deal
  const fetchphoneNumber = async (deal: Deal) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;


      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";


      // Option 2: Use deal ID to get seller info (recommended)
      const response = await fetch(
        `${apiUrl}/deals/${deal.id}/seller-contact`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch seller contact: ${response.status}`);
        return;
      }

      const data = await response.json();
      setphoneNumber({
        phone: data.phoneNumber || "N/A",
        email: data.email || "N/A",
      });
    } catch (error) {
      console.error("Error fetching seller contact:", error);
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
      } else {
        setSellerInfoMap({});
      }
    } else if (deal.status === "pending") {
      setSelectedDealId(deal.id); // ✅ Just show terms dialog for passed deals
      setTermsModalOpen(true); // ✅ Only auto-approve if status is pending
    } else if (deal.status === "passed") {
      setSelectedDealId(deal.id); // ✅ Just show terms dialog for passed deals
      setTermsModalOpen(true);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setActiveTitle(`${tab.charAt(0).toUpperCase() + tab.slice(1)} Deals`);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const filteredDeals = deals.filter((deal) => {
    // First filter by tab status
    if (deal.status !== activeTab) return false;
    // Then filter by search query if one exists
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

  // Store the dealId to approve after modal
  const handleGoToCIMClick = (dealId: string) => {
    setPendingCIMDealId(dealId);
    setTermsModalOpen(true);
  };

  const handleApproveTerms = async () => {
    if (pendingCIMDealId) {
      setIsApproving(true);
      await handleGoToCIM(pendingCIMDealId);
      setTermsModalOpen(false);
      setPendingCIMDealId(null);
      setIsApproving(false);
    }
  };

  const { dismiss } = useToast();
  const handleLogout = () => {
    console.log("Logging out");
    dismiss();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/buyer/login");
  };

  const getProfilePictureUrl = (path: string | null) => {
    if (!path) return null;

    const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";


    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const formattedPath = path.replace(/\\/g, "/");
    return `${apiUrl}/${
      formattedPath.startsWith("/") ? formattedPath.substring(1) : formattedPath
    }`;
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "active":
        return (
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span>Active</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-orange-500 mr-2"></div>
            <span>Pending</span>
          </div>
        );
      case "passed":
        return (
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
            <span>Passed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const countDealsByStatus = (status: string) => {
    return deals.filter((deal) => deal.status === status).length;
  };

  // Update fetchSellerInfo to store companyName and website
  const fetchSellerInfo = async (sellerId: string) => {
    try {
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

      const response = await fetch(`${apiUrl}/sellers/public/${sellerId}`);
      if (!response.ok) throw new Error("Failed to fetch seller info");
      const data = await response.json();
      console.log("Seller info for", sellerId, ":", data);
      setSellerInfoMap((prev: typeof sellerInfoMap) => ({
        ...prev,
        [sellerId]: {
          name: data.fullName || "N/A",
          email: data.email || "N/A",
          phoneNumber: data.phoneNumber || "N/A",
          companyName: data.companyName || "N/A",
          website: data.website || "N/A",
        },
      }));
    } catch {
      setSellerInfoMap((prev: typeof sellerInfoMap) => ({
        ...prev,
        [sellerId]: { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" },
      }));
    }
  };

  useEffect(() => {
    if (activeTab !== "active") return;

    const fetchSellerInfos = async () => {
      const uniqueSellerIds = Array.from(
        new Set(
          filteredDeals
            .map((d) => d.sellerId)
            .filter((id): id is string => typeof id === "string")
        )
      ).filter((sellerId) => !sellerInfoMap[sellerId]); // Fetch only missing seller infos

      if (uniqueSellerIds.length === 0) {
        setSellerInfoLoading(false);
        return;
      }

      setSellerInfoLoading(true);
      const token = localStorage.getItem("token");
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

      for (const sellerId of uniqueSellerIds) {
        try {
          const response = await fetch(`${apiUrl}/sellers/public/${sellerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setSellerInfoMap((prev: typeof sellerInfoMap) => ({
              ...prev,
              [sellerId]: {
                name: data.fullName || "N/A",
                email: data.email || "N/A",
                phoneNumber: data.phoneNumber || "N/A",
                companyName: data.companyName || "N/A",
                website: data.website || "N/A",
              },
            }));
          } else {
            setSellerInfoMap((prev: typeof sellerInfoMap) => ({
              ...prev,
              [sellerId]: { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" },
            }));
          }
        } catch (error) {
          setSellerInfoMap((prev: typeof sellerInfoMap) => ({
            ...prev,
            [sellerId]: { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" },
          }));
        }
      }
      setSellerInfoLoading(false);
    };

    fetchSellerInfos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDeals, activeTab]); // only rerun when deals or tab change

  // Restore handleGoToCIM for modal approval
  const handleGoToCIM = async (dealId: string) => {
    console.log("Go to CIM clicked for deal:", dealId);
    const success = await updateDealStatus(dealId, "activate");
    if (success) {
      console.log("✅ Deal activated via Go to CIM");
      setActiveTab("active");
      setActiveTitle("Active Deals");
    }
  };

  // Show loading if not initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-10 pt-0 sm:pt-3 pb-0 sm:pb-1">
            <Link href="/deals" className="flex items-center">
              <img src="/logo.svg" alt="CIM Amplify" className="h-8 sm:h-10" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {activeTitle}
            </h1>
            <div className="relative w-full sm:w-auto">
              <div className="flex items-center rounded-xl bg-[#3AAFA914] px-3 py-2 sm:py-4 w-full sm:w-auto">
                <Search className="ml-2 text-[#3AAFA9] mr-3 font-bold h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  className="bg-transparent text-sm focus:outline-none w-full sm:w-72"
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
            <div className="flex items-center">
              <div className="mr-2 text-right hidden sm:block">
                <div className="text-sm font-medium">
                  {buyerProfile?.fullName || "User"}
                </div>
              </div>
              <div className="relative">
                {buyerProfile?.profilePicture ? (
                  <img
                    src={
                      getProfilePictureUrl(buyerProfile.profilePicture) ||
                      "/placeholder.svg"
                    }
                    alt={buyerProfile.fullName}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">
                      {buyerProfile?.fullName?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden md:block md:w-56 border-r border-gray-200 bg-white">
          <nav className="flex flex-col p-4">
            <Link
              href="/buyer/deals"
              className="mb-2 flex items-center rounded-md bg-teal-500 px-4 py-3 text-white hover:bg-teal-600"
            >
              <Briefcase className="mr-3 h-5 w-5" />
              <span>All Deals</span>
            </Link>
            <Link
              href="/buyer/marketplace"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <Store className="mr-3 h-5 w-5" />
              <span>MarketPlace</span>
            </Link>
            <Link
              href="/buyer/company-profile"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <Eye className="mr-3 h-5 w-5" />
              <span>Company Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 text-left w-full"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden border-b border-gray-200 bg-white">
          <nav className="flex overflow-x-auto p-2 space-x-2">
            <Link
              href="/buyer/deals"
              className="flex items-center rounded-md bg-teal-500 px-3 py-2 text-white text-sm whitespace-nowrap"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Deals</span>
            </Link>
            <Link
              href="/buyer/marketplace"
              className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 text-sm whitespace-nowrap"
            >
              <Store className="mr-2 h-4 w-4" />
              <span>MarketPlace</span>
            </Link>
            <Link
              href="/buyer/company-profile"
              className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 text-sm whitespace-nowrap"
            >
              <Eye className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 text-sm whitespace-nowrap"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>








        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-4 sm:p-6">
          {profileSubmitted && (
            <div className="mb-6 rounded-md bg-green-50 p-4 text-green-800 border border-green-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    Your company profile has been successfully submitted!
                  </p>
                </div>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{apiError}</p>
                  <button
                    onClick={() => setApiError(null)}
                    className="text-sm underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {showProfileIncompleteWarning && (
            <div className="mb-6 rounded-md bg-yellow-50 p-4 text-yellow-800 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                  You will not receive any deals until you complete your Company Overview.
                  </p>
                  <Link href="/buyer/acquireprofile">
                    <Button className="text-sm underline mt-1">
                      Complete Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Debug and Refresh Section */}
          <div className="mb-4  items-center justify-between hidden">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  console.log("Manual refresh triggered");
                  fetchAllDeals();
                }}
                variant="outline"
                className="text-sm"
              >
                Refresh Deals
              </Button>
              <div className="text-sm text-gray-500">
                Total deals: {deals.length} | Pending:{" "}
                {countDealsByStatus("pending")} | Active:{" "}
                {countDealsByStatus("active")} | Passed:{" "}
                {countDealsByStatus("passed")}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Token: {authToken ? `${authToken.substring(0, 10)}...` : "None"} |
              User ID: {buyerId || "None"}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="mb-6 gap-2"
          >
            <TabsList className="bg-white space-x-4">
              <TabsTrigger
                value="pending"
                className={`relative ${
                  activeTab === "pending"
                    ? "bg-[#3AAFA9] text-white"
                    : "bg-gray-200 text-gray-700"
                } hover:bg-[#3AAFA9] hover:text-white px-6 py-2 rounded-md`}
              >
                Pending ({countDealsByStatus("pending")})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className={`relative ${
                  activeTab === "active"
                    ? "bg-[#3AAFA9] text-white"
                    : "bg-gray-200 text-gray-700"
                } hover:bg-[#3AAFA9] hover:text-white px-6 py-2 rounded-md`}
              >
                Active ({countDealsByStatus("active")})
              </TabsTrigger>
              <TabsTrigger
                value="passed"
                className={`relative ${
                  activeTab === "passed"
                    ? "bg-[#3AAFA9] text-white"
                    : "bg-gray-200 text-gray-700"
                } hover:bg-[#3AAFA9] hover:text-white px-6 py-2 rounded-md`}
              >
                Passed ({countDealsByStatus("passed")})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading || sellerInfoLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading deals...</div>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">
                {activeTab === "passed"
                  ? "Only Passed Deals that are still on the market will show here."
                  : activeTab === "active"
                  ? "You have no Active Deals."
                  : "We will send you an email when a deal matches your criteria."}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredDeals.map((deal) => {
                const sellerIdStr =
                  typeof deal.sellerId === "string" ? deal.sellerId : undefined;
                const sellerInfo =
                  sellerIdStr && sellerInfoMap[sellerIdStr]
                    ? sellerInfoMap[sellerIdStr]
                    : { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" };
                return (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewDealDetails(deal)}
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 p-4">
                      <h3 className="text-lg font-medium text-teal-500">
                        {activeTab === "active"
                          ? deal.title
                          : "Hidden Until Active"}
                      </h3>
                    </div>

                    <div className="p-4">
                      {/* Overview */}
                      {activeTab === "active" ? (
                        <h4 className="mb-2 font-medium text-gray-800"><strong>Overview</strong></h4>
                      ) : (
                        <h4 className="mb-2 font-medium text-gray-800">Overview</h4>
                      )}
                      <div className="mb-4 space-y-1 text-sm text-gray-600">
                        <p><strong>Industry:</strong> {deal.industry}</p>
                        <p><strong>Geography:</strong> {deal.geography}</p>
                        <p><strong>Number of Years in Business:</strong> {deal.yearsInBusiness}</p>
                        <p><strong>Business Model:</strong> {deal.businessModel}</p>
                        <p><strong>Company Description:</strong> {deal.companyDescription}</p>
                        <p><strong>Management Future Preferences:</strong> {deal.managementPreferences || 'Not specified'}</p>
                      </div>

                      {/* Financial */}
                      {activeTab === "active" ? (
                        <h4 className="mb-2 font-medium text-gray-800"><strong>Financial</strong></h4>
                      ) : (
                        <h4 className="mb-2 font-medium text-gray-800">Financial</h4>
                      )}
                      <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Trailing 12-Month Revenue:</strong> {deal.trailingRevenueCurrency} {deal.trailingRevenue.toLocaleString()}</p>
                        <p><strong>Trailing 12-Month EBITDA:</strong> {deal.trailingEbitdaCurrency} {deal.trailingEbitda.toLocaleString()}</p>
                        <p><strong>T12 Free Cash Flow:</strong> {deal.trailingRevenueCurrency} {deal.t12FreeCashFlow && deal.t12FreeCashFlow >= 0 ? deal.t12FreeCashFlow.toLocaleString() : "Not provided"}</p>
                        <p><strong>T12 Net Income:</strong> {deal.trailingRevenueCurrency} {deal.t12NetIncome && deal.t12NetIncome >= 0 ? deal.t12NetIncome.toLocaleString() : "Not provided"}</p>
                        <p><strong>Average 3-Year Revenue Growth:</strong> {deal.averageGrowth.toLocaleString()} %</p>
                        <p><strong>Net Income:</strong> {deal.trailingRevenueCurrency} {deal.netIncome && deal.netIncome >= 0 ? deal.netIncome.toLocaleString() : "Not provided"}</p>
                        <p><strong>Asking Price:</strong> {deal.trailingRevenueCurrency} {deal.askingPrice && deal.askingPrice >= 0 ? deal.askingPrice.toLocaleString() : "Not provided"}</p>
                      </div>

                      {/* Seller Information */}
                      {activeTab === "active" ? (
                        <h4 className="mb-2 font-medium text-gray-800"><strong>Seller Information</strong></h4>
                      ) : (
                        <h4 className="mb-2 font-medium text-gray-800">Seller Information</h4>
                      )}
                      {activeTab === "active" ? (
                        !sellerIdStr || !sellerInfoMap[sellerIdStr] ? (
                          <div className="mb-4 text-sm text-gray-500 italic">Loading seller info...</div>
                        ) : (
                          <div className="mb-4 text-sm text-gray-600 space-y-1">
                            <p><strong>Name:</strong> {sellerInfo.name}</p>
                            <p><strong>Email:</strong> {sellerInfo.email}</p>
                            <p><strong>Phone:</strong> {sellerInfo.phoneNumber}</p>
                            <p><strong>Company Name:</strong> {(sellerInfo as { companyName: string }).companyName || 'N/A'}</p>
                            <p><strong>Website:</strong> {(sellerInfo as { website: string }).website || 'N/A'}</p>
                          </div>
                        )
                      ) : (
                        <div className="mb-4 text-sm text-gray-500 italic">
                          Hidden Until Active
                        </div>
                      )}
                      {/* Actions */}
                      <div className="flex justify-end space-x-2">
                        {/* Go to CIM button */}
                        {activeTab === "pending" && (
                          <Button
                            variant="outline"
                            className="border-blue-200 bg-[#3AAFA922] text-[#3AAFA9] hover:bg-[#3AAFA933]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoToCIMClick(deal.id);
                            }}
                          >
                            Move to Active
                          </Button>
                        )}
                        {/* Pass button */}
                        {deal.status !== "passed" && (
                          <Button
                            variant="outline"
                            className="border-red-200 bg-[#E3515333] text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePassDeal(deal.id);
                            }}
                          >
                            Pass
                          </Button>
                        )}
                        {activeTab === "passed" && (
                          <Button
                            variant="outline"
                            className="border-blue-200 bg-[#3AAFA922] text-[#3AAFA9] hover:bg-[#3AAFA933]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoToCIMClick(deal.id);
                            }}
                          >
                            Move to Active
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>


{/* Terms of Access Modal */}
<Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terms of Access</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-gray-600">
             By clicking "Approve" you reaffirm your previous acceptance of the CIM AMPLIFY MASTER FEE AGREEMENT.
             <br />
               <p className="text-sm text-gray-600">
             Once you approve, this deal will be moved to Active and an introduction will be sent to you and the M&A Advisor via email.
            </p>
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setTermsModalOpen(false)} disabled={isApproving}>
              Go Back
            </Button>
            <Button
              onClick={handleApproveTerms}
              className="bg-teal-500 hover:bg-teal-600"
              disabled={isApproving}
            >
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
