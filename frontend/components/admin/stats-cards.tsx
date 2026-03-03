"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2, Handshake, ShoppingCart, Tag, FileText } from "lucide-react";
import { StatsGridSkeleton } from "@/components/ui/skeleton-card";
import type { DashboardStats } from "@/hooks/use-admin-deals";

interface StatsCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  filteredStats?: {
    activeDeals: number;
    offMarketDeals: number;
    allDeals: number;
  };
}

export function StatsCards({ stats, isLoading, filteredStats }: StatsCardsProps) {
  if (isLoading) {
    return <StatsGridSkeleton />;
  }

  const statItems = [
    {
      label: "Total Deals",
      value: stats?.totalDeals ?? 0,
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Deals",
      value: filteredStats?.activeDeals ?? stats?.activeDeals ?? 0,
      icon: Handshake,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Off Market",
      value: filteredStats?.offMarketDeals ?? stats?.completedDeals ?? 0,
      icon: ShoppingCart,
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Total Buyers",
      value: stats?.totalBuyers ?? 0,
      icon: Building2,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total Sellers",
      value: stats?.totalSellers ?? 0,
      icon: Tag,
      color: "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.label} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`rounded-lg p-2 ${item.color}`}>
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 truncate">{item.label}</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {item.value.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
