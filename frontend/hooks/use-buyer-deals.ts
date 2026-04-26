"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

// Types
export interface Deal {
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
}

export interface Document {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface BuyerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  profilePicture: string | null;
  phoneNumber?: string;
  website?: string;
  preferences?: {
    receiveDealEmails: boolean;
  };
}

export interface CompanyProfileData {
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
}

export interface SellerInfo {
  name: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  website?: string;
}

export interface MarketplaceDeal {
  _id: string;
  title?: string;
  companyDescription?: string;
  industrySector?: string;
  geographySelection?: string;
  yearsInBusiness?: number;
  businessModel?: {
    recurringRevenue?: boolean;
    projectBased?: boolean;
    assetLight?: boolean;
    assetHeavy?: boolean;
  };
  financialDetails?: {
    trailingRevenueAmount?: number;
    trailingRevenueCurrency?: string;
    trailingEBITDAAmount?: number;
    trailingEBITDACurrency?: string;
    netIncome?: number;
    netIncomeCurrency?: string;
    askingPrice?: number;
    askingPriceCurrency?: string;
    avgRevenueGrowth?: number;
  };
  isFeatured?: boolean;
  currentBuyerRequested?: boolean;
  currentBuyerStatus?: string;
  createdAt?: string;
}

// API Helpers
const getApiUrl = () => {
  return API_BASE_URL;
};

const getAuthHeaders = () => {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" } as Record<string, string>;
  }
  // Check sessionStorage first (current session), then localStorage
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Helper to handle auth errors - clears storage and redirects to buyer login
const handleAuthError = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    window.location.href = "/buyer/login";
  }
};

// Helper function to convert business model object to string
const getBusinessModelString = (businessModel: any): string => {
  if (!businessModel) return "Not specified";
  const models: string[] = [];
  if (businessModel.recurringRevenue) models.push("Recurring Revenue");
  if (businessModel.projectBased) models.push("Project-Based");
  if (businessModel.assetLight) models.push("Asset Light");
  if (businessModel.assetHeavy) models.push("Asset Heavy");
  return models.join(", ") || "Not specified";
};

// API Functions
async function fetchDealsByStatus(status: "pending" | "active" | "passed"): Promise<Deal[]> {
  const apiUrl = getApiUrl();
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    handleAuthError();
    throw new Error("No authentication token");
  }

  let endpoint = "";
  switch (status) {
    case "pending":
      endpoint = API_ENDPOINTS.buyers.dealsPending;
      break;
    case "active":
      endpoint = API_ENDPOINTS.buyers.dealsActive;
      break;
    case "passed":
      endpoint = API_ENDPOINTS.buyers.dealsRejected;
      break;
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthError();
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`Failed to fetch ${status} deals`);
  }

  const data = await response.json();

  return data.map((deal: any) => ({
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
    managementPreferences: deal.managementPreferences || deal.managementFuturePreferences || "",
  }));
}

async function fetchAllDeals(): Promise<{ pending: Deal[]; active: Deal[]; passed: Deal[] }> {
  const [pending, active, passed] = await Promise.all([
    fetchDealsByStatus("pending"),
    fetchDealsByStatus("active"),
    fetchDealsByStatus("passed"),
  ]);

  return { pending, active, passed };
}

async function fetchBuyerProfile(): Promise<BuyerProfile> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.buyers.profile}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthError();
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to fetch buyer profile");
  }

  const data = await response.json();
  // Map backend 'phone' field to frontend 'phoneNumber'
  return {
    ...data,
    phoneNumber: data.phone || data.phoneNumber || "",
  };
}

async function fetchCompanyProfile(): Promise<CompanyProfileData | null> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.buyers.companyProfile}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    if (response.status === 401) {
      handleAuthError();
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to fetch company profile");
  }

  return response.json();
}

async function fetchSellerInfo(sellerId: string): Promise<SellerInfo> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.sellers.publicById(sellerId)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return { name: "N/A", email: "N/A", phoneNumber: "N/A", companyName: "N/A", website: "N/A" };
  }

  const data = await response.json();
  return {
    name: data.fullName || "N/A",
    email: data.email || "N/A",
    phoneNumber: data.phoneNumber || "N/A",
    companyName: data.companyName || "N/A",
    website: data.website || "N/A",
  };
}

async function updateDealStatus(
  dealId: string,
  action: "activate" | "reject" | "set-pending"
): Promise<boolean> {
  const apiUrl = getApiUrl();
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    handleAuthError();
    throw new Error("No authentication token");
  }

  let endpoint = "";
  let body: any = {};

  switch (action) {
    case "activate":
      endpoint = API_ENDPOINTS.buyers.activateDeal(dealId);
      body = { notes: "Buyer interested in deal" };
      break;
    case "reject":
      endpoint = API_ENDPOINTS.buyers.rejectDeal(dealId);
      body = { notes: "Deal passed by buyer" };
      break;
    case "set-pending":
      endpoint = API_ENDPOINTS.buyers.setPendingDeal(dealId);
      body = { notes: "Deal set back to pending" };
      break;
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthError();
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`Failed to ${action} deal`);
  }

  return true;
}

async function fetchMarketplaceDeals(page: number = 1, limit: number = 20): Promise<{ data: MarketplaceDeal[]; total: number; page: number; lastPage: number }> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.marketplace}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthError();
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to fetch marketplace deals");
  }

  const payload = await response.json();
  const deals = Array.isArray(payload) ? payload : payload?.data || [];
  const sortedDeals = (deals || []).sort((a: MarketplaceDeal, b: MarketplaceDeal) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  return {
    data: sortedDeals,
    total: payload?.total ?? sortedDeals.length,
    page: payload?.page ?? page,
    lastPage: payload?.lastPage ?? 1,
  };
}

async function requestMarketplaceAccess(dealId: string): Promise<void> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.requestAccess(dealId)}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to request access");
  }
}

async function updateBuyerProfile(data: Partial<BuyerProfile>): Promise<BuyerProfile> {
  const apiUrl = getApiUrl();

  // Convert phoneNumber to phone for backend compatibility
  const payload: any = { ...data };
  if (payload.phoneNumber !== undefined) {
    payload.phone = payload.phoneNumber;
    delete payload.phoneNumber;
  }

  const response = await fetch(`${apiUrl}${API_ENDPOINTS.buyers.profile}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthError();
      throw new Error("UNAUTHORIZED");
    }
    const errorText = await response.text();
    console.error("Update profile error:", errorText);
    throw new Error("Failed to update profile");
  }

  const result = await response.json();
  // Map phone back to phoneNumber for frontend
  return {
    ...result,
    phoneNumber: result.phone || result.phoneNumber || "",
  };
}

async function uploadProfilePicture(file: File): Promise<string> {
  const apiUrl = getApiUrl();
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  // Convert file to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Image = e.target?.result as string;
        
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.buyers.uploadProfilePicture}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profilePicture: base64Image }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError();
            throw new Error("UNAUTHORIZED");
          }
          throw new Error("Failed to upload profile picture");
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        resolve(data.profilePicture);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Custom Hooks

/**
 * Hook for fetching all buyer deals
 */
export function useBuyerDeals() {
  const router = useRouter();

  return useQuery({
    queryKey: ["buyer-deals"],
    queryFn: fetchAllDeals,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message === "UNAUTHORIZED") return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for fetching deals by status
 */
export function useBuyerDealsByStatus(status: "pending" | "active" | "passed") {
  return useQuery({
    queryKey: ["buyer-deals", status],
    queryFn: () => fetchDealsByStatus(status),
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message === "UNAUTHORIZED") return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for fetching buyer profile
 */
export function useBuyerProfile() {
  return useQuery({
    queryKey: ["buyer-profile"],
    queryFn: fetchBuyerProfile,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message === "UNAUTHORIZED") return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for fetching company profile
 */
export function useCompanyProfile() {
  return useQuery({
    queryKey: ["company-profile"],
    queryFn: fetchCompanyProfile,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message === "UNAUTHORIZED") return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for fetching seller info
 */
export function useSellerInfo(sellerId: string | null) {
  return useQuery({
    queryKey: ["seller-info", sellerId],
    queryFn: () => fetchSellerInfo(sellerId!),
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching multiple seller infos
 */
export function useMultipleSellerInfos(sellerIds: string[]) {
  return useQuery({
    queryKey: ["seller-infos", sellerIds.sort().join(",")],
    queryFn: async () => {
      const results: Record<string, SellerInfo> = {};
      await Promise.all(
        sellerIds.map(async (id) => {
          results[id] = await fetchSellerInfo(id);
        })
      );
      return results;
    },
    enabled: sellerIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for updating deal status
 */
export function useUpdateDealStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, action }: { dealId: string; action: "activate" | "reject" | "set-pending" }) =>
      updateDealStatus(dealId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-deals"] });
    },
  });
}

/**
 * Hook for marketplace deals
 */
export function useMarketplaceDeals(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["marketplace-deals", page, limit],
    queryFn: () => fetchMarketplaceDeals(page, limit),
    staleTime: 30 * 1000,
    retry: (failureCount, error) => {
      if (error.message === "UNAUTHORIZED") return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for requesting marketplace access
 */
export function useRequestMarketplaceAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestMarketplaceAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-deals"] });
    },
  });
}

/**
 * Hook for updating buyer profile
 */
export function useUpdateBuyerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBuyerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-profile"] });
    },
  });
}

/**
 * Hook for uploading profile picture
 */
export function useUploadProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-profile"] });
    },
  });
}

/**
 * Helper to check if profile is complete
 */
export function isProfileComplete(profile: CompanyProfileData | null): boolean {
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

    profile.targetCriteria.minYearsInBusiness === undefined ||
    !profile.targetCriteria.preferredBusinessModels ||
    profile.targetCriteria.preferredBusinessModels.length === 0 ||
    !profile.targetCriteria.description
  ) {
    return false;
  }

  // Check agreements
  if (!profile.agreements || !profile.agreements.feeAgreementAccepted) {
    return false;
  }

  return true;
}

/**
 * Debounce hook for search input
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
