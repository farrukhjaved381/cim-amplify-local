"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

// Types
export interface SellerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  website: string;
  profilePicture: string | null;
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
  recurringRevenue: boolean;
  projectBased: boolean;
  assetLight: boolean;
  assetHeavy: boolean;
}

export interface BuyerFit {
  capitalAvailability: string[];
  minPriorAcquisitions: number;
  minTransactionSize: number;
}

export interface StatusSummary {
  totalTargeted: number;
  totalActive: number;
  totalPending: number;
  totalRejected: number;
}

export interface Deal {
  _id: string;
  title: string;
  sellerProfile?: SellerProfile;
  companyDescription: string;
  companyType?: string[];
  dealType: string;
  status: string;
  visibility?: string;
  isPublic?: boolean;
  industrySector: string;
  geographySelection: string;
  yearsInBusiness: number;
  employeeCount?: number;
  seller: string;
  financialDetails?: FinancialDetails;
  rewardLevel?: string;
  closedWithBuyer?: string;
  closedWithBuyerCompany?: string;
  closedWithBuyerEmail?: string;
  businessModel?: BusinessModel;
  managementPreferences?: string;
  buyerFit?: BuyerFit;
  statusSummary?: StatusSummary;
  createdAt?: string;
  timeline?: {
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    completedAt?: string;
  };
}

export interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalBuyers: number;
  totalSellers: number;
  dealsThisMonth?: number;
  dealsLastMonth?: number;
}

export interface DealsResponse {
  data: Deal[];
  total: number;
  page: number;
  lastPage: number;
  stats: DashboardStats;
}

export interface BuyerActivity {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  companyType?: string;
  status: string;
  lastInteraction?: string;
  totalInteractions?: number;
  interactions?: Array<{
    type: string;
    timestamp: string;
    notes: string;
    metadata?: any;
  }>;
}

export interface BuyersActivity {
  active: BuyerActivity[];
  pending: BuyerActivity[];
  rejected: BuyerActivity[];
  summary: StatusSummary;
}

// API Functions
const getApiUrl = () => API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Fetch deals with all data included
async function fetchAdminDeals(params: {
  page: number;
  limit: number;
  search: string;
  status: "active" | "offMarket" | "allDeals";
}): Promise<DealsResponse> {
  const { page, limit, search, status } = params;
  const apiUrl = getApiUrl();

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: search,
  });

  if (status === "active") {
    queryParams.append("buyerResponse", "accepted");
  } else if (status === "offMarket") {
    queryParams.append("status", "completed");
  } else if (status === "allDeals") {
    queryParams.append("excludeStatus", "completed");
  }

  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.admin}?${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deals: ${response.statusText}`);
  }

  return response.json();
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.adminStats}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  return response.json();
}

// Fetch deal status summary (for activity popup)
async function fetchDealStatusSummary(dealId: string): Promise<BuyersActivity> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.statusSummary(dealId)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deal status: ${response.statusText}`);
  }

  const data = await response.json();

  // Process buyer details
  const allBuyerIds = [...(data.deal?.targetedBuyers || []), ...(data.deal?.interestedBuyers || [])];
  const uniqueBuyerIds = [...new Set(allBuyerIds)];

  const buyerDetailsPromises = uniqueBuyerIds.map(async (buyerId) => {
    try {
      const buyerResponse = await fetch(`${apiUrl}${API_ENDPOINTS.buyers.publicById(buyerId)}`, {
        headers: getAuthHeaders(),
      });
      if (buyerResponse.ok) {
        const buyerData = await buyerResponse.json();
        let status = "pending";
        const invitationStatus = data.deal?.invitationStatus?.[buyerId];
        if (invitationStatus) {
          if (invitationStatus.response === "accepted") status = "active";
          else if (invitationStatus.response === "rejected") status = "rejected";
        }
        return {
          buyerId,
          buyerName: buyerData.fullName || buyerData.name || "Unknown Buyer",
          buyerCompany: buyerData.companyName || "Unknown Company",
          buyerEmail: buyerData.email || "",
          status,
        } as BuyerActivity;
      }
      return null;
    } catch {
      return null;
    }
  });

  const buyerDetails = await Promise.all(buyerDetailsPromises);
  const validBuyers = buyerDetails.filter((b): b is BuyerActivity => b !== null);

  return {
    active: validBuyers.filter((b) => b.status === "active"),
    pending: validBuyers.filter((b) => b.status === "pending"),
    rejected: validBuyers.filter((b) => b.status === "rejected"),
    summary: data.summary || {
      totalTargeted: 0,
      totalActive: 0,
      totalPending: 0,
      totalRejected: 0,
    },
  };
}

// Delete deal
async function deleteDeal(dealId: string): Promise<void> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.byId(dealId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete deal: ${response.statusText}`);
  }
}

// Close deal (mark as off-market)
async function closeDeal(params: {
  dealId: string;
  finalSalePrice?: number;
  winningBuyerId?: string;
  notes?: string;
}): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.close(params.dealId)}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      finalSalePrice: params.finalSalePrice,
      winningBuyerId: params.winningBuyerId,
      notes: params.notes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to close deal: ${response.statusText}`);
  }

  return response.json();
}

// Update deal
async function updateDeal(params: { dealId: string; data: Partial<Deal> }): Promise<Deal> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}${API_ENDPOINTS.deals.byId(params.dealId)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(params.data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update deal: ${response.statusText}`);
  }

  return response.json();
}

// Custom Hooks

/**
 * Hook for fetching admin deals with React Query
 * Only fetches when the tab is active (enabled param)
 */
export function useAdminDeals(params: {
  page: number;
  limit: number;
  search: string;
  status: "active" | "offMarket" | "allDeals";
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["admin-deals", params.status, params.page, params.limit, params.search],
    queryFn: () => fetchAdminDeals(params),
    enabled: params.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}

/**
 * Hook for fetching dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for fetching deal status summary (buyers activity)
 */
export function useDealStatusSummary(dealId: string | null) {
  return useQuery({
    queryKey: ["deal-status-summary", dealId],
    queryFn: () => fetchDealStatusSummary(dealId!),
    enabled: !!dealId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for deleting a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      // Invalidate all deal queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
  });
}

/**
 * Hook for closing a deal (marking as off-market)
 */
export function useCloseDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
  });
}

/**
 * Hook for updating a deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
    },
  });
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
