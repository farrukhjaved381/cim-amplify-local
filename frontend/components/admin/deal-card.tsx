"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { Deal } from "@/hooks/use-admin-deals";

interface DealCardProps {
  deal: Deal;
  variant: "active" | "offMarket" | "allDeals";
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
  onActivity: (deal: Deal) => void;
  onOffMarket?: (deal: Deal) => void;
}

export function DealCard({
  deal,
  variant,
  onEdit,
  onDelete,
  onActivity,
  onOffMarket,
}: DealCardProps) {
  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return "N/A";
    const symbol = currency?.replace("USD($)", "$") || "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 p-3 sm:p-4 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base sm:text-lg font-medium text-teal-500 break-words">
            {deal.title}
          </h3>
          {deal.isPublic && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
              Marketplace
            </span>
          )}
        </div>
        {deal.rewardLevel && (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f7fa] text-[#00796b] self-start sm:self-auto">
            {deal.rewardLevel}
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {/* Posted Date */}
        {deal.createdAt && (
          <div className="text-xs text-gray-500 mb-2">
            Posted: {new Date(deal.createdAt).toLocaleDateString()}
          </div>
        )}

        {/* Sale Information for Off Market Deals */}
        {variant === "offMarket" && (
          <div className="mb-4 p-2 sm:p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <h4 className="font-semibold text-teal-800 mb-2 text-sm">Sale Information</h4>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date Taken Off Market:</span>
                <span className="font-medium text-gray-800">
                  {deal.timeline?.completedAt
                    ? new Date(deal.timeline.completedAt).toLocaleDateString()
                    : deal.timeline?.updatedAt
                    ? new Date(deal.timeline.updatedAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Value:</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(deal.financialDetails?.finalSalePrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer From CIM Amplify:</span>
                <span className={`font-medium ${deal.closedWithBuyer ? "text-green-600" : "text-gray-800"}`}>
                  {deal.closedWithBuyer ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Company Name:</span>
                <span className="font-medium text-gray-800">
                  {deal.closedWithBuyerCompany || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Summary Badges */}
        {deal.statusSummary && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              Targeted: {deal.statusSummary.totalTargeted}
            </span>
            {deal.statusSummary.totalActive > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Active: {deal.statusSummary.totalActive}
              </span>
            )}
            {deal.statusSummary.totalPending > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                Pending: {deal.statusSummary.totalPending}
              </span>
            )}
            {deal.statusSummary.totalRejected > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Rejected: {deal.statusSummary.totalRejected}
              </span>
            )}
          </div>
        )}

        {/* Seller Information */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-800 mb-1">Seller Information</h4>
          {deal.sellerProfile ? (
            <div className="text-xs text-gray-500 space-y-0.5">
              <div><span className="font-medium">Name:</span> {deal.sellerProfile.fullName}</div>
              <div className="truncate"><span className="font-medium">Email:</span> {deal.sellerProfile.email}</div>
              <div><span className="font-medium">Company:</span> {deal.sellerProfile.companyName}</div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Seller information not available</p>
          )}
        </div>

        {/* Overview */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-800 mb-1">Overview</h4>
          <div className="text-xs text-gray-600 space-y-0.5">
            <p><span className="font-medium">Industry:</span> {deal.industrySector}</p>
            <p><span className="font-medium">Location:</span> {deal.geographySelection}</p>
            <p className="line-clamp-2">
              <span className="font-medium">Description:</span> {deal.companyDescription}
            </p>
          </div>
        </div>

        {/* Financial */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-800 mb-1">Financial</h4>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            <p>Revenue: {formatCurrency(deal.financialDetails?.trailingRevenueAmount, deal.financialDetails?.trailingRevenueCurrency)}</p>
            <p>EBITDA: {formatCurrency(deal.financialDetails?.trailingEBITDAAmount, deal.financialDetails?.trailingEBITDACurrency)}</p>
            <p>Asking: {formatCurrency(deal.financialDetails?.askingPrice)}</p>
            <p>Net Income: {formatCurrency(deal.financialDetails?.t12NetIncome)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onActivity(deal)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Activity
          </Button>
          {variant !== "offMarket" && onOffMarket && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => onOffMarket(deal)}
            >
              Off Market
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onEdit(deal)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="text-xs"
            onClick={() => onDelete(deal._id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
