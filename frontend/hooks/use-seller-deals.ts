"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

// Types
export interface SellerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  phoneNumber?: string;
  website?: string;
  profilePicture?: string | null;
  role?: string;
}

export interface FinancialDetails {
  trailingRevenueCurrency?: string;
  trailingRevenueAmount?: number;
  trailingEBITDACurrency?: string;
  trailingEBITDAAmount?: number;
  t12FreeCashFlow?: number;
  t12NetIncome?: number;
  avgRevenueGrowth?: number;
  netIncome?: number;
  askingPrice?: number;
  finalSalePrice?: number;
}

export interface BusinessModel {
  recurringRevenue?: boolean;
  projectBased?: boolean;
  assetLight?: boolean;
  assetHeavy?: boolean;
}

export interface Deal {
  _id: string;
  title: string;
  companyDescription: string;
  companyType?: string[];
  dealType: string;
  status: string;
  visibility?: string;
  isPublic?: boolean;
  requiresBuyerFeeAboveAmplifyFees?: boolean;
  industrySector: string;
  geographySelection: string;
  yearsInBusiness: number;
  employeeCount?: number;
  seller: string;
  financialDetails?: FinancialDetails;
  businessModel?: BusinessModel;
  managementPreferences?: string;
  rewardLevel?: string;
  closedWithBuyer?: string;
  closedWithBuyerCompany?: string;
  closedWithBuyerEmail?: string;
  createdAt?: string;
  timeline?: {
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    completedAt?: string;
  };
}

// API Helper Functions
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

// Helper to handle auth errors
const handleAuthResponse = async (response: Response) => {
  if (response.status === 401) {
    // Clear all auth storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userRole");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      // Redirect to seller login
      window.location.href = "/seller/login";
    }
    throw new Error("Session expired. Please login again.");
  }
  return response;
};

// API Functions
async function fetchSellerDeals(): Promise<Deal[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.myDeals}`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch deals: ${response.statusText}`);
  }

  return response.json();
}

async function fetchLOIDeals(): Promise<Deal[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.loiDeals}`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch LOI deals: ${response.statusText}`);
  }

  return response.json();
}

async function fetchCompletedDeals(): Promise<Deal[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.completed}`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch completed deals: ${response.statusText}`);
  }

  return response.json();
}

async function fetchSellerProfile(): Promise<SellerProfile> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.sellers.profile}`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

async function updateDealStatus(params: {
  dealId: string;
  status: string;
  finalSalePrice?: number;
  closedWithBuyer?: string;
  closedWithBuyerCompany?: string;
  closedWithBuyerEmail?: string;
}): Promise<Deal> {
  const apiUrl = getApiUrl();
  const { dealId, ...updateData } = params;

  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.byId(dealId)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to update deal: ${response.statusText}`);
  }

  return response.json();
}

async function pauseDealForLOI(dealId: string): Promise<Deal> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.byId(dealId)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: "loi" }),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to pause deal: ${response.statusText}`);
  }

  return response.json();
}

async function reviveDeal(dealId: string): Promise<Deal> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.byId(dealId)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: "active" }),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to revive deal: ${response.statusText}`);
  }

  return response.json();
}

async function markDealOffMarket(params: {
  dealId: string;
  finalSalePrice?: number;
  closedWithBuyer?: string;
  closedWithBuyerCompany?: string;
  closedWithBuyerEmail?: string;
}): Promise<Deal> {
  const apiUrl = getApiUrl();
  const { dealId, ...updateData } = params;

  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.byId(dealId)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      status: "completed",
      ...updateData,
      timeline: { completedAt: new Date().toISOString() }
    }),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to mark deal off market: ${response.statusText}`);
  }

  return response.json();
}

// Custom Hooks

/**
 * Hook for fetching seller's active deals
 */
export function useSellerDeals() {
  return useQuery({
    queryKey: ["seller-deals"],
    queryFn: fetchSellerDeals,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching seller's LOI (paused) deals
 */
export function useLOIDeals() {
  return useQuery({
    queryKey: ["seller-loi-deals"],
    queryFn: fetchLOIDeals,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching seller's completed (off-market) deals
 */
export function useCompletedDeals() {
  return useQuery({
    queryKey: ["seller-completed-deals"],
    queryFn: fetchCompletedDeals,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching seller profile
 */
export function useSellerProfile() {
  return useQuery({
    queryKey: ["seller-profile"],
    queryFn: fetchSellerProfile,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for pausing a deal for LOI
 */
export function usePauseDealForLOI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseDealForLOI,
    onSuccess: () => {
      // Invalidate all deal queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] });
    },
  });
}

/**
 * Hook for reviving a paused deal
 */
export function useReviveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviveDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] });
    },
  });
}

/**
 * Hook for marking a deal as off-market (completed)
 */
export function useMarkDealOffMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markDealOffMarket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] });
    },
  });
}

/**
 * Hook for updating deal status
 */
export function useUpdateDealStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDealStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-deals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-loi-deals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-completed-deals"] });
    },
  });
}

// Deal Details API Functions
async function fetchDealDetails(dealId: string): Promise<Deal> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/deals/${dealId}`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch deal details: ${response.statusText}`);
  }

  return response.json();
}

async function fetchMatchingBuyers(dealId: string): Promise<any[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/deals/${dealId}/matching-buyers`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch matching buyers: ${response.statusText}`);
  }

  return response.json();
}

async function fetchDealStatusSummary(dealId: string): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.statusSummary(dealId)}`, {
    headers: getAuthHeaders(),
  });

  await handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch status summary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook for fetching deal details
 */
export function useDealDetails(dealId: string | null) {
  return useQuery({
    queryKey: ["deal-details", dealId],
    queryFn: () => fetchDealDetails(dealId!),
    enabled: !!dealId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching matching buyers for a deal
 */
export function useMatchingBuyers(dealId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["matching-buyers", dealId],
    queryFn: () => fetchMatchingBuyers(dealId!),
    enabled: !!dealId && enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching deal status summary
 */
export function useDealStatusSummary(dealId: string | null) {
  return useQuery({
    queryKey: ["deal-status-summary", dealId],
    queryFn: () => fetchDealStatusSummary(dealId!),
    enabled: !!dealId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
