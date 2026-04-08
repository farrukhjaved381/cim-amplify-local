"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Activity,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  FileText,
  Target,
  Globe,
  DollarSign,
  TrendingUp as TrendUp,
  Handshake,
  Eye
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AdminProtectedRoute } from "@/components/admin/protected-route";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

// Types
interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  loiDeals: number;
  totalBuyers: number;
  totalSellers: number;
  dealsThisMonth: number;
  dealsLastMonth: number;
  marketplaceDeals: number;
  dealsPreviousWeek: number;
  buyersPreviousWeek: number;
  dealsCurrentWeek: number;
  buyersCurrentWeek: number;
  previousWeekStart: string;
  previousWeekEnd: string;
  currentWeekStart: string;
  totalRevenueSize: number;
  totalEbitdaSize: number;
  totalInvitations: number;
  buyerReferralSources: Array<{ name: string; value: number }>;
  sellerReferralSources: Array<{ name: string; value: number }>;
  industryBreakdown: Array<{ name: string; value: number }>;
}

interface DealSummary {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  isPublic?: boolean;
  financialDetails?: {
    askingPrice?: number;
    finalSalePrice?: number;
    trailingRevenueAmount?: number;
    trailingEBITDAAmount?: number;
  };
  rewardLevel?: string;
  sellerProfile?: {
    fullName: string;
    companyName: string;
  };
  statusSummary?: {
    totalTargeted: number;
    totalActive: number;
    totalPending: number;
    totalRejected: number;
  };
  timeline?: {
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    completedAt?: string;
  };
  closedWithBuyer?: string;
  closedWithBuyerCompany?: string;
  [key: string]: unknown;
}

// Chart colors matching the theme
const CHART_COLORS = {
  teal: "#14b8a6",
  emerald: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  red: "#ef4444",
  gray: "#6b7280",
};

// Pie chart color palettes - distinct contrasting colors for readability
const PIE_COLORS_BUYER = [
  "#7c3aed", "#3b82f6", "#14b8a6", "#f59e0b", "#ef4444",
  "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316",
];
const PIE_COLORS_ADVISOR = [
  "#d97706", "#0891b2", "#7c3aed", "#dc2626", "#059669",
  "#db2777", "#2563eb", "#ca8a04", "#9333ea", "#0d9488",
];

interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
}

// Helper functions
const formatCurrency = (amount: number | undefined): string => {
  if (!amount && amount !== 0) return "N/A";
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const getPercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const getTimeAgo = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const formatDateShort = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";

// API fetch functions
const fetchStats = async (): Promise<DashboardStats> => {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${API_URL}/deals/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

const fetchActiveDeals = async (): Promise<{ data: DealSummary[]; total: number }> => {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${API_URL}/deals/admin?page=1&limit=10&status=active&buyerResponse=accepted`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch active deals");
  return res.json();
};

const fetchCompletedDeals = async (): Promise<{ data: DealSummary[]; total: number }> => {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${API_URL}/deals/admin?page=1&limit=10&status=completed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch completed deals");
  return res.json();
};

const fetchAllDealsForMetrics = async (): Promise<{ data: DealSummary[]; total: number }> => {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${API_URL}/deals/admin?page=1&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch all deals");
  return res.json();
};

const fetchAdminProfile = async (): Promise<AdminProfile> => {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${API_URL}/admin/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch admin profile");
  return res.json();
};

export default function AdminOverviewPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Set mounted state to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/admin/login");
    }
  }, [authLoading, isLoggedIn, router]);

  // React Query hooks with auto-refresh every 30 seconds
  // Only enable queries after component is mounted (client-side) to prevent hydration issues
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: mounted,
  });

  const { data: activeDealsData, isLoading: activeDealsLoading } = useQuery({
    queryKey: ["admin-active-deals"],
    queryFn: fetchActiveDeals,
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: mounted,
  });

  const { data: completedDealsData, isLoading: completedDealsLoading } = useQuery({
    queryKey: ["admin-completed-deals"],
    queryFn: fetchCompletedDeals,
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: mounted,
  });

  const { data: allDealsData } = useQuery({
    queryKey: ["admin-all-deals-metrics"],
    queryFn: fetchAllDealsForMetrics,
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: mounted,
  });

  const { data: adminProfile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: fetchAdminProfile,
    staleTime: 60000,
    enabled: mounted,
  });

  // Calculate derived metrics - buyerEngagement still from paginated data for charts
  const buyerEngagement = React.useMemo(() => {
    if (!allDealsData?.data) return { totalInvitations: 0, accepted: 0, pending: 0, rejected: 0 };

    let totalInvitations = 0;
    let accepted = 0;
    let pending = 0;
    let rejected = 0;

    allDealsData.data.forEach((deal: DealSummary) => {
      if (deal.statusSummary) {
        totalInvitations += deal.statusSummary.totalTargeted;
        accepted += deal.statusSummary.totalActive;
        pending += deal.statusSummary.totalPending;
        rejected += deal.statusSummary.totalRejected;
      }
    });

    return { totalInvitations, accepted, pending, rejected };
  }, [allDealsData]);

  const dealsByRewardLevel = React.useMemo(() => {
    if (!allDealsData?.data) return { Seed: 0, Bloom: 0, Fruit: 0 };

    const levels = { Seed: 0, Bloom: 0, Fruit: 0 };
    allDealsData.data.forEach((deal: DealSummary) => {
      if (deal.rewardLevel && Object.prototype.hasOwnProperty.call(levels, deal.rewardLevel)) {
        levels[deal.rewardLevel as keyof typeof levels]++;
      }
    });
    return levels;
  }, [allDealsData]);

  // Platform metrics from server-side stats (accurate across ALL deals)
  const totalRevenueSize = stats?.totalRevenueSize || 0;
  const totalEbitdaSize = stats?.totalEbitdaSize || 0;
  const marketplaceDeals = stats?.marketplaceDeals || 0;
  const serverTotalInvitations = stats?.totalInvitations || 0;

  // Chart data for Deal Status Distribution (Pie Chart)
  const dealStatusChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Active", value: stats.activeDeals, color: CHART_COLORS.emerald },
      { name: "LOI", value: stats.loiDeals || 0, color: CHART_COLORS.amber },
      { name: "Completed", value: stats.completedDeals, color: CHART_COLORS.blue },
      { name: "Other", value: Math.max(0, stats.totalDeals - stats.activeDeals - stats.completedDeals - (stats.loiDeals || 0)), color: CHART_COLORS.gray },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Chart data for Deal Exclusivity (Pie Chart) - distinct colors so Fruit/Bloom are easy to tell apart
  const exclusivityChartData = useMemo(() => {
    return [
      { name: "Fruit", value: dealsByRewardLevel.Fruit, color: "#f59e0b" },  // amber/gold
      { name: "Bloom", value: dealsByRewardLevel.Bloom, color: "#8b5cf6" },  // purple
      { name: "Seed", value: dealsByRewardLevel.Seed, color: CHART_COLORS.gray },
    ].filter(item => item.value > 0);
  }, [dealsByRewardLevel]);

  // Chart data for Buyer Response (Bar Chart)
  const buyerResponseChartData = useMemo(() => {
    return [
      { name: "Accepted", value: buyerEngagement.accepted, fill: CHART_COLORS.teal },
      { name: "Pending", value: buyerEngagement.pending, fill: CHART_COLORS.amber },
      { name: "Rejected", value: buyerEngagement.rejected, fill: CHART_COLORS.red },
    ];
  }, [buyerEngagement]);

  // Monthly comparison data for bar chart
  const monthlyComparisonData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Last Month", deals: stats.dealsLastMonth, fill: CHART_COLORS.gray },
      { name: "This Month", deals: stats.dealsThisMonth, fill: CHART_COLORS.teal },
    ];
  }, [stats]);

  const buyerSourceChartData = useMemo(() => {
    return (stats?.buyerReferralSources || []).filter((item) => item.value > 0);
  }, [stats]);

  const advisorSourceChartData = useMemo(() => {
    return (stats?.sellerReferralSources || []).filter((item) => item.value > 0);
  }, [stats]);

  const industryBreakdownChartData = useMemo(() => {
    return (stats?.industryBreakdown || []).slice(0, 10);
  }, [stats]);

  // Deal value distribution data
  const dealValueDistribution = useMemo(() => {
    if (!allDealsData?.data) return [];

    const ranges = [
      { name: "<$1M", min: 0, max: 1000000, count: 0 },
      { name: "$1M-$5M", min: 1000000, max: 5000000, count: 0 },
      { name: "$5M-$10M", min: 5000000, max: 10000000, count: 0 },
      { name: "$10M-$50M", min: 10000000, max: 50000000, count: 0 },
      { name: ">$50M", min: 50000000, max: Infinity, count: 0 },
    ];

    allDealsData.data.forEach((deal: DealSummary) => {
      const price = deal.financialDetails?.askingPrice || 0;
      for (const range of ranges) {
        if (price >= range.min && price < range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges.map(r => ({ name: r.name, deals: r.count }));
  }, [allDealsData]);

  // Deals by month (last 6 months trend)
  const dealsTrendData = useMemo(() => {
    if (!allDealsData?.data) return [];

    const months: { [key: string]: number } = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short' });
      months[key] = 0;
    }

    // Count deals per month
    allDealsData.data.forEach((deal: DealSummary) => {
      const dealDate = new Date(deal.createdAt);
      const monthsDiff = (now.getFullYear() - dealDate.getFullYear()) * 12 + (now.getMonth() - dealDate.getMonth());
      if (monthsDiff >= 0 && monthsDiff < 6) {
        const key = dealDate.toLocaleDateString('en-US', { month: 'short' });
        if (months[key] !== undefined) {
          months[key]++;
        }
      }
    });

    return Object.entries(months).map(([month, deals]) => ({ month, deals }));
  }, [allDealsData]);

  // Calculate metrics
  const dealsGrowth = stats ? getPercentageChange(stats.dealsThisMonth, stats.dealsLastMonth) : 0;
  const responseRate = buyerEngagement.totalInvitations > 0
    ? Math.round((buyerEngagement.accepted / buyerEngagement.totalInvitations) * 100)
    : 0;

  const isLoading = !mounted || statsLoading || activeDealsLoading || completedDealsLoading || authLoading;

  if (isLoading) {
    return (
      <div className="flex-1 p-4 lg:p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 lg:h-28 bg-white rounded-lg border animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="h-64 bg-white rounded-lg border animate-pulse" />
          <div className="h-64 bg-white rounded-lg border animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
      <header className="bg-gradient-to-r from-white to-teal-50 border-b border-teal-100 p-3 px-4 lg:px-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-800">Platform Overview</h1>
            <p className="text-[10px] lg:text-xs text-teal-600 flex items-center gap-1">
              <span className="hidden sm:inline">CIM Amplify dashboard statistics</span>
              <span className="inline sm:hidden">Live stats</span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden sm:block text-right">
            <div className="font-medium text-gray-800 text-sm lg:text-base">{adminProfile?.fullName || "Loading..."}</div>
            <div className="text-[10px] lg:text-xs text-gray-500">{adminProfile?.email || ""}</div>
          </div>
          <div className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium overflow-hidden ring-2 ring-teal-200">
            {adminProfile?.profilePicture ? (
              <img src={adminProfile.profilePicture} alt={adminProfile.fullName || "Admin"} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm lg:text-base">{adminProfile?.fullName?.charAt(0) || "A"}</span>
            )}
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-3 sm:p-4 lg:p-6 overflow-auto flex-1">
          {/* Row 1: Key Stats - 6 columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Deals */}
            <Card className="bg-white border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Deals</span>
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <FileText className="h-4 w-4 text-teal-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalDeals || 0)}</div>
                <div className="flex items-center gap-1 mt-1">
                  {dealsGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-teal-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${dealsGrowth >= 0 ? "text-teal-600" : "text-red-500"}`}>
                    {Math.abs(dealsGrowth)}% vs last month
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Active Deals */}
            <Card className="bg-white border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Active Deals</span>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(activeDealsData?.total || 0)}</div>
                <div className="text-xs text-emerald-600 mt-1">With buyer responses accepted</div>
              </CardContent>
            </Card>

            {/* LOI Deals */}
            <Card className="bg-white border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">LOI Deals</span>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.loiDeals || 0)}</div>
                <div className="text-xs text-amber-600 mt-1">Paused for LOI negotiations</div>
              </CardContent>
            </Card>

            {/* Off Market Deals */}
            <Card className="bg-white border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Off Market</span>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.completedDeals || 0)}</div>
                <div className="text-xs text-blue-600 mt-1">Completed deals</div>
              </CardContent>
            </Card>

            {/* Total Buyers */}
            <Card className="bg-white border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Buyers</span>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalBuyers || 0)}</div>
                <div className="text-xs text-purple-600 mt-1">{responseRate}% response rate</div>
              </CardContent>
            </Card>

            {/* Total Sellers */}
            <Card className="bg-white border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Sellers</span>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Briefcase className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalSellers || 0)}</div>
                <div className="text-xs text-amber-600 mt-1">M&A Advisors</div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Quick Actions */}
          <Card className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-teal-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 bg-white hover:bg-teal-50 hover:border-teal-300 border-teal-200 transition-all">
                    <Handshake className="h-5 w-5 text-teal-600" />
                    <span className="text-xs text-teal-700 font-medium">Manage Deals</span>
                  </Button>
                </Link>
                <Link href="/admin/buyers">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 bg-white hover:bg-purple-50 hover:border-purple-300 border-purple-200 transition-all">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="text-xs text-purple-700 font-medium">View Buyers</span>
                  </Button>
                </Link>
                <Link href="/admin/sellers">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 bg-white hover:bg-amber-50 hover:border-amber-300 border-amber-200 transition-all">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    <span className="text-xs text-amber-700 font-medium">View Sellers</span>
                  </Button>
                </Link>
                <Link href="/admin/viewprofile">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 bg-white hover:bg-blue-50 hover:border-blue-300 border-blue-200 transition-all">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">My Profile</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Row 3: Charts Section - 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Deals Trend Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-teal-100 rounded-md">
                    <TrendUp className="h-4 w-4 text-teal-600" />
                  </div>
                  Deals Trend (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dealsTrendData}>
                      <defs>
                        <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="deals" stroke={CHART_COLORS.teal} strokeWidth={2} fillOpacity={1} fill="url(#colorDeals)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Deal Value Distribution */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  Deal Value Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dealValueDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Bar dataKey="deals" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Pie Charts and Stats - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Deal Status Pie Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-md">
                    <PieChartIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  Deal Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dealStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {dealStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-3 mt-2">
                  {dealStatusChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[10px] text-gray-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exclusivity Pie Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  Deal Exclusivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={exclusivityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {exclusivityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-3 mt-2">
                  {exclusivityChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[10px] text-gray-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buyer Response Bar Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-md">
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  Buyer Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buyerResponseChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {buyerResponseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs text-gray-500">Response Rate: </span>
                  <span className="text-xs font-semibold text-teal-600">{responseRate}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Platform Metrics */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  Platform Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-teal-50 to-white rounded-lg">
                    <span className="text-xs text-gray-600">Total Revenue Size</span>
                    <span className="text-sm font-bold text-teal-600">{formatCurrency(totalRevenueSize)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-white rounded-lg">
                    <span className="text-xs text-gray-600">Total EBITDA Size</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(totalEbitdaSize)}</span>
                  </div>
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-50 to-white rounded-lg">
                    <span className="text-xs text-gray-600">Marketplace</span>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3 text-purple-500" />
                      <span className="text-sm font-bold text-purple-600">{marketplaceDeals}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-amber-50 to-white rounded-lg">
                    <span className="text-xs text-gray-600">Invitations</span>
                    <span className="text-sm font-bold text-amber-600">{serverTotalInvitations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 5: Referral Source Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Buyer Referral Sources - Donut Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <PieChartIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  Buyer Referral Sources
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200">
                    {buyerSourceChartData.length} sources
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {buyerSourceChartData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-[220px] w-full sm:w-1/2 min-w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={buyerSourceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {buyerSourceChartData.map((_: any, index: number) => (
                              <Cell key={`buyer-cell-${index}`} fill={PIE_COLORS_BUYER[index % PIE_COLORS_BUYER.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number, name: string) => [`${value}`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {buyerSourceChartData.map((item: any, index: number) => {
                        const total = buyerSourceChartData.reduce((sum: number, i: any) => sum + i.value, 0);
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div key={item.name} className="group">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS_BUYER[index % PIE_COLORS_BUYER.length] }} />
                                <span className="text-xs text-gray-700 truncate" title={item.name}>{item.name}</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">{item.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                            </div>
                            <div className="ml-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: PIE_COLORS_BUYER[index % PIE_COLORS_BUYER.length] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Advisor Referral Sources - Donut Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-md">
                    <PieChartIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  Advisor Referral Sources
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200">
                    {advisorSourceChartData.length} sources
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {advisorSourceChartData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-[220px] w-full sm:w-1/2 min-w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={advisorSourceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {advisorSourceChartData.map((_: any, index: number) => (
                              <Cell key={`advisor-cell-${index}`} fill={PIE_COLORS_ADVISOR[index % PIE_COLORS_ADVISOR.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number, name: string) => [`${value}`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {advisorSourceChartData.map((item: any, index: number) => {
                        const total = advisorSourceChartData.reduce((sum: number, i: any) => sum + i.value, 0);
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div key={item.name} className="group">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS_ADVISOR[index % PIE_COLORS_ADVISOR.length] }} />
                                <span className="text-xs text-gray-700 truncate" title={item.name}>{item.name}</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">{item.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                            </div>
                            <div className="ml-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: PIE_COLORS_ADVISOR[index % PIE_COLORS_ADVISOR.length] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 5b: Industry Breakdown - Full Width */}
          <div className="mb-6">
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  Industry Breakdown
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200">
                    {industryBreakdownChartData.length} industries
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryBreakdownChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={160} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value} deals`, 'Count']}
                      />
                      <Bar dataKey="value" fill={CHART_COLORS.teal} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 6: Monthly Comparison & KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Monthly Comparison Bar Chart */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-md">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  Monthly Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="deals" radius={[4, 4, 0, 0]}>
                        {monthlyComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${dealsGrowth >= 0 ? "bg-teal-50" : "bg-red-50"}`}>
                    {dealsGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-teal-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${dealsGrowth >= 0 ? "text-teal-600" : "text-red-500"}`}>
                      {Math.abs(dealsGrowth)}% {dealsGrowth >= 0 ? "growth" : "decline"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overview KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
                    <div className="text-xs text-white/80">Total Deals</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">{stats?.totalBuyers || 0}</div>
                    <div className="text-xs text-white/80">Total Buyers</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">{responseRate}%</div>
                    <div className="text-xs text-white/80">Response Rate</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold">{formatCurrency(totalEbitdaSize)}</div>
                    <div className="text-xs text-white/80">Total EBITDA</div>
                  </div>
                </div>
                {/* Weekly KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Current Week */}
                  <div className="p-3 bg-white/15 rounded-lg backdrop-blur-sm">
                    <div className="text-[11px] text-white/70 mb-2 font-medium">
                      Current Week (from {formatDateShort(stats?.currentWeekStart || "")})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-white/10 rounded-md">
                        <div className="text-xl font-bold">{stats?.dealsCurrentWeek || 0}</div>
                        <div className="text-[10px] text-white/80">Deals Added</div>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-md">
                        <div className="text-xl font-bold">{stats?.buyersCurrentWeek || 0}</div>
                        <div className="text-[10px] text-white/80">Buyers Added</div>
                      </div>
                    </div>
                  </div>
                  {/* Previous Week */}
                  <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="text-[11px] text-white/70 mb-2 font-medium">
                      Previous Week: {formatDateShort(stats?.previousWeekStart || "")} - {formatDateShort(stats?.previousWeekEnd || "")}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-white/10 rounded-md">
                        <div className="text-xl font-bold">{stats?.dealsPreviousWeek || 0}</div>
                        <div className="text-[10px] text-white/80">Deals Added</div>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-md">
                        <div className="text-xl font-bold">{stats?.buyersPreviousWeek || 0}</div>
                        <div className="text-[10px] text-white/80">Buyers Added</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 7: Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Active Deals */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-md">
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </div>
                  Recent Active Deals
                </CardTitle>
                <Link href="/admin/dashboard?tab=active" prefetch={true}>
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-xs">
                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-[320px] pr-3">
                  <div className="space-y-3">
                    {!activeDealsData?.data || activeDealsData.data.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">No active deals yet</div>
                    ) : (
                      activeDealsData.data.slice(0, 10).map((deal) => (
                        <Link
                          key={deal._id}
                          href={`/admin/dashboard?tab=active&search=${encodeURIComponent(deal.title)}`}
                          prefetch={true}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-teal-50 hover:to-white transition-all border border-gray-100 hover:border-teal-200 block"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{deal.title}</h4>
                              {deal.rewardLevel && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                                  deal.rewardLevel === 'Fruit' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  deal.rewardLevel === 'Bloom' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                  'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                  {deal.rewardLevel}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{deal.sellerProfile?.companyName || "Unknown"}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <div className="text-sm font-medium text-teal-600">{formatCurrency(deal.financialDetails?.askingPrice)}</div>
                            <div className="text-[10px] text-gray-400">{getTimeAgo(deal.createdAt)}</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Closings */}
            <Card className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  Recent Closings
                </CardTitle>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Off-Market
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-[320px] pr-3">
                  <div className="space-y-3">
                    {!completedDealsData?.data || completedDealsData.data.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">No completed deals yet</div>
                    ) : (
                      completedDealsData.data.slice(0, 10).map((deal) => {
                        const isCimAmplifyBuyer = !!deal.closedWithBuyer;
                        return (
                          <Link
                            key={deal._id}
                            href={`/admin/dashboard?tab=offMarket&search=${encodeURIComponent(deal.title)}`}
                            prefetch={true}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all block ${
                              isCimAmplifyBuyer
                                ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300 hover:from-emerald-100 hover:to-green-100"
                                : "bg-gradient-to-r from-gray-50 to-white border-gray-100 hover:border-blue-200 hover:from-blue-50 hover:to-white"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{deal.title}</h4>
                                {isCimAmplifyBuyer && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-300">
                                    CIM Buyer
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{deal.sellerProfile?.companyName || "Unknown"}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <div className={`text-sm font-medium ${isCimAmplifyBuyer ? "text-emerald-600" : "text-blue-600"}`}>
                                {formatCurrency(deal.financialDetails?.finalSalePrice || deal.financialDetails?.askingPrice)}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {deal.timeline?.completedAt ? getTimeAgo(deal.timeline.completedAt) : getTimeAgo(deal.createdAt)}
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
