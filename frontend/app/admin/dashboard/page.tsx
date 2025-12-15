"use client";

import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Search, X, LogOut, Building2, Handshake, ShoppingCart, Tag, Eye } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";



interface SellerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  website: string;
  role: string;
  profilePicture: string | null;
}

interface FinancialDetails {
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

interface Deal {
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
  statusSummary?: {
    totalTargeted: number;
    totalActive: number;
    totalPending: number;
    totalRejected: number;
  };
  createdAt?: string;
}

interface Buyer {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  companyType?: string;
  lastInteraction?: string;
  totalInteractions?: number;
  interactions?: Array<{
    type: string;
    timestamp: string;
    notes: string;
    metadata?: any;
  }>;
  status: string;
}

interface BuyersActivity {
  active: Buyer[];
  pending: Buyer[];
  rejected: Buyer[];
  summary: {
    totalTargeted: number;
    totalActive: number;
    totalPending: number;
    totalRejected: number;
  };
}

interface AdminProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

interface BusinessModel {
  recurringRevenue: boolean;
  projectBased: boolean;
  assetLight: boolean;
  assetHeavy: boolean;
}

interface BuyerFit {
  capitalAvailability: string[];
  minPriorAcquisitions: number;
  minTransactionSize: number;
}

interface AdminEditDealFormData {
  _id: string;
  title: string;
  companyDescription: string;
  industrySector: string;
  geographySelection: string;
  yearsInBusiness: number;
  companyType: string[];
  financialDetails: FinancialDetails;
  businessModel: BusinessModel;
  managementPreferences: string;
  buyerFit: BuyerFit;
  
  visibility: string;
  status: string;
}

const COMPANY_TYPE_OPTIONS = [
  "Buy Side Mandate",
  "Entrepreneurship through Acquisition",
  "Family Office",
  "Holding Company",
  "Independent Sponsor",
  "Private Equity",
  "Single Acquisition Search",
  "Strategic Operating Company",
];

const BuyersActivityPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  buyersActivity: BuyersActivity;
  dealTitle: string;
}> = ({ isOpen, onClose, buyersActivity, dealTitle }) => {
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  if (!isOpen) return null;

  const filteredRejectedBuyers = buyersActivity.rejected || [];

  const buyerMap = new Map<string, Buyer>();
  [
    ...(buyersActivity.active || []).map((b) => ({ ...b, status: "active" })),
    ...(buyersActivity.pending || []).map((b) => ({ ...b, status: "pending" })),
    ...filteredRejectedBuyers.map((b) => ({
      ...b,
      status: "rejected",
    })),
  ].forEach((buyer) => {
    if (!buyerMap.has(buyer.buyerId)) {
      buyerMap.set(buyer.buyerId, buyer);
    } else {
      const existing = buyerMap.get(buyer.buyerId)!;
      existing.interactions = [
        ...(existing.interactions || []),
        ...(buyer.interactions || []),
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      existing.lastInteraction =
        existing.interactions?.[0]?.timestamp || existing.lastInteraction;
      existing.totalInteractions =
        existing.interactions?.length || existing.totalInteractions;
    }
  });
  const allBuyers = Array.from(buyerMap.values());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Buyer's Activity
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Deal: <span className="font-medium">{dealTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {allBuyers.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No buyers available.</p>
          ) : (
            <ul className="space-y-2">
              {allBuyers.map((buyer) => (
                <li
                  key={buyer.buyerId}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedBuyer(buyer)}
                >
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {buyer.buyerName
                        ? buyer.buyerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {buyer.buyerName || "Unknown"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {buyer.buyerEmail || ""}
                    </p>
                    {buyer.buyerCompany && (
                      <p className="text-sm text-gray-500">
                        {buyer.buyerCompany}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      buyer.status
                    )}`}
                  >
                    {buyer.status.charAt(0).toUpperCase() +
                      buyer.status.slice(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {selectedBuyer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Buyer Details
              </h3>
              <button
                onClick={() => setSelectedBuyer(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {selectedBuyer.buyerName || "Unknown"}
              </p>
              <p>
                <strong>Email:</strong> {selectedBuyer.buyerEmail || "N/A"}
              </p>
              <p>
                <strong>Company:</strong> {selectedBuyer.buyerCompany || "N/A"}
              </p>
              {selectedBuyer.companyType && (
                <p>
                  <strong>Company Type:</strong> {selectedBuyer.companyType}
                </p>
              )}
              {selectedBuyer.lastInteraction && (
                <p>
                  <strong>Last Interaction:</strong>{" "}
                  {new Date(selectedBuyer.lastInteraction).toLocaleString()}
                </p>
              )}
              {selectedBuyer.interactions &&
                selectedBuyer.interactions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mt-4">
                      Interactions
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {selectedBuyer.interactions.map((interaction, index) => (
                        <li key={index}>
                          {interaction.type.charAt(0).toUpperCase() +
                            interaction.type.slice(1)}{" "}
                          - {new Date(interaction.timestamp).toLocaleString()} -{" "}
                          {interaction.notes}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setSelectedBuyer(null)}
                className="bg-teal-500 hover:bg-teal-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatNumberWithCommas(num: any): string {
  if (num === undefined || num === null) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const AdminEditDealForm: React.FC<{
  deal: Deal;
  onClose: () => void;
  onSaved: () => void;
}> = ({ deal, onClose, onSaved }) => {
  const [form, setForm] = useState<AdminEditDealFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!deal) return;
    setForm({
      _id: deal._id,
      title: deal.title || "",
      companyDescription: deal.companyDescription || "",
      industrySector: deal.industrySector || "",
      geographySelection: deal.geographySelection || "",
      yearsInBusiness: deal.yearsInBusiness || 0,
      companyType: Array.isArray(deal.companyType) ? deal.companyType : deal.companyType ? [deal.companyType] : [],
      financialDetails: {
        trailingRevenueCurrency: deal.financialDetails?.trailingRevenueCurrency || "USD($)",
        trailingRevenueAmount: deal.financialDetails?.trailingRevenueAmount || 0,
        trailingEBITDACurrency: deal.financialDetails?.trailingEBITDACurrency || "USD($)",
        trailingEBITDAAmount: deal.financialDetails?.trailingEBITDAAmount || 0,
        avgRevenueGrowth: deal.financialDetails?.avgRevenueGrowth || 0,
        netIncome: deal.financialDetails?.netIncome || 0,
        askingPrice: deal.financialDetails?.askingPrice || 0,
        t12FreeCashFlow: deal.financialDetails?.t12FreeCashFlow || 0,
        t12NetIncome: deal.financialDetails?.t12NetIncome || 0,
      },
      businessModel: {
        recurringRevenue: deal.businessModel?.recurringRevenue || false,
        projectBased: deal.businessModel?.projectBased || false,
        assetLight: deal.businessModel?.assetLight || false,
        assetHeavy: deal.businessModel?.assetHeavy || false,
      },
      managementPreferences: deal.managementPreferences || "",
      buyerFit: {
        capitalAvailability: deal.buyerFit?.capitalAvailability || [],
        minPriorAcquisitions: deal.buyerFit?.minPriorAcquisitions || 0,
        minTransactionSize: deal.buyerFit?.minTransactionSize || 0,
      },
      visibility: deal.visibility || "",
      status: deal.status || "",
    });
  }, [deal]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FinancialDetails | keyof BuyerFit | "yearsInBusiness",
    nested?: "financialDetails" | "buyerFit"
  ) => {
    const value = e.target.value === "" ? undefined : Number.parseFloat(e.target.value);
    if (nested && form) {
      setForm({
        ...form,
        [nested]: { ...form[nested], [field]: value },
      });
    } else if (form) {
      setForm({ ...form, [field]: value });
    }
  };

  const handleCheckboxChange = (
    checked: boolean,
    field: keyof BusinessModel | keyof BuyerFit,
    nested?: "businessModel" | "buyerFit"
  ) => {
    if (nested && form) {
      setForm({
        ...form,
        [nested]: { ...form[nested], [field]: checked },
      });
    } else if (form) {
      setForm({ ...form, [field]: checked });
    }
  };

  const handleMultiSelectChange = (option: string) => {
    setForm((prev) => {
      if (!prev) return null;
      const currentValues = Array.isArray(prev.companyType) ? prev.companyType : [];
      const isChecked = currentValues.includes(option);
      const newValues = isChecked
        ? currentValues.filter((v) => v !== option)
        : [...currentValues, option];
      return { ...prev, companyType: newValues };
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const payload: Omit<AdminEditDealFormData, "_id"> = {
        title: form.title,
        companyDescription: form.companyDescription,
        industrySector: form.industrySector,
        geographySelection: form.geographySelection,
        yearsInBusiness: form.yearsInBusiness,
        companyType: form.companyType,
        financialDetails: { ...form.financialDetails },
        businessModel: { ...form.businessModel },
        managementPreferences: form.managementPreferences,
        buyerFit: { ...form.buyerFit },
        visibility: form.visibility,
        status: form.status,
      };
      const res = await fetch(`${apiUrl}/deals/${deal._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update deal");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 text-lg">Loading form...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Title</Label>
          <Input
            name="title"
            value={form.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label>Company Description</Label>
          <Textarea
            name="companyDescription"
            value={form.companyDescription}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label>Industry Sector</Label>
          <Input
            name="industrySector"
            value={form.industrySector}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label>Geography</Label>
          <Input
            name="geographySelection"
            value={form.geographySelection}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label>Years in Business</Label>
          <Input
            type="number"
            name="yearsInBusiness"
            value={form.yearsInBusiness}
            onChange={(e) => handleNumberChange(e, "yearsInBusiness")}
            required
          />
        </div>
        <div>
          <Label>Company Type</Label>
          <div className="flex flex-wrap gap-2">
            {COMPANY_TYPE_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.companyType.includes(option)}
                  onChange={() => handleMultiSelectChange(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Trailing 12-Month Revenue</Label>
          <Input
            type="text"
            value={
              form.financialDetails.trailingRevenueAmount
                ? formatNumberWithCommas(form.financialDetails.trailingRevenueAmount)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "trailingRevenueAmount",
                "financialDetails"
              );
            }}
          />
        </div>
        <div>
          <Label>Trailing 12-Month EBITDA</Label>
          <Input
            type="text"
            value={
              form.financialDetails.trailingEBITDAAmount
                ? formatNumberWithCommas(form.financialDetails.trailingEBITDAAmount)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "trailingEBITDAAmount",
                "financialDetails"
              );
            }}
          />
        </div>
        <div>
          <Label>Average 3-Year Revenue Growth (%)</Label>
          <Input
            type="text"
            value={
              form.financialDetails.avgRevenueGrowth
                ? formatNumberWithCommas(form.financialDetails.avgRevenueGrowth)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "avgRevenueGrowth",
                "financialDetails"
              );
            }}
          />
        </div>
        <div>
          <Label>Net Income</Label>
          <Input
            type="text"
            value={
              form.financialDetails.netIncome
                ? formatNumberWithCommas(form.financialDetails.netIncome)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "netIncome",
                "financialDetails"
              );
            }}
          />
        </div>
        <div>
          <Label>Asking Price</Label>
          <Input
            type="text"
            value={
              form.financialDetails.askingPrice
                ? formatNumberWithCommas(form.financialDetails.askingPrice)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "askingPrice",
                "financialDetails"
              );
            }}
          />
        </div>
        <div>
          <Label>T12 Free Cash Flow</Label>
          <Input
            type="text"
            value={
              form.financialDetails.t12FreeCashFlow
                ? formatNumberWithCommas(form.financialDetails.t12FreeCashFlow)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "t12FreeCashFlow",
                "financialDetails"
              );
            }}
          />
        </div>
        <div>
          <Label>T12 Net Income</Label>
          <Input
            type="text"
            value={
              form.financialDetails.t12NetIncome
                ? formatNumberWithCommas(form.financialDetails.t12NetIncome)
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, "");
              handleNumberChange(
                { target: { value: rawValue } } as React.ChangeEvent<HTMLInputElement>,
                "t12NetIncome",
                "financialDetails"
              );
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Business Models</Label>
          <div className="flex flex-wrap gap-2">
            {[ "recurringRevenue", "projectBased", "assetLight", "assetHeavy" ].map(
              (key) => (
                <label key={key} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.businessModel[key as keyof BusinessModel]}
                    onChange={(e) =>
                      handleCheckboxChange(e.target.checked, key as keyof BusinessModel, "businessModel")
                    }
                  />
                  {key}
                </label>
              )
            )}
          </div>
        </div>
        <div>
          <Label>Management Preferences</Label>
          <Textarea
            name="managementPreferences"
            value={form.managementPreferences}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Capital Availability</Label>
          <div className="flex flex-wrap gap-2">
            {["Ready to deploy immediately", "Need to raise"].map((option) => (
              <label key={option} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.buyerFit.capitalAvailability.includes(option)}
                  onChange={() => {
                    setForm((prev) => {
                      if (!prev) return null;
                      const current = prev.buyerFit.capitalAvailability || [];
                      const isChecked = current.includes(option);
                      const newValues = isChecked
                        ? current.filter((v) => v !== option)
                        : [...current, option];
                      return {
                        ...prev,
                        buyerFit: { ...prev.buyerFit, capitalAvailability: newValues },
                      };
                    });
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label>Min Prior Acquisitions</Label>
          <Input
            type="number"
            value={form.buyerFit.minPriorAcquisitions}
            onChange={(e) =>
              handleNumberChange(e, "minPriorAcquisitions", "buyerFit")
            }
          />
        </div>
        <div>
          <Label>Min Transaction Size</Label>
          <Input
            type="number"
            value={form.buyerFit.minTransactionSize}
            onChange={(e) =>
              handleNumberChange(e, "minTransactionSize", "buyerFit")
            }
          />
        </div>
      </div>

      {error && <div className="text-red-500 mt-2">{error}</div>}
      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-teal-500 text-white"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default function DealManagementDashboard() {
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [offMarketDeals, setOffMarketDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [showBuyersActivity, setShowBuyersActivity] = useState(false);
  const [selectedDealForActivity, setSelectedDealForActivity] = useState<Deal | null>(null);
  const [buyersActivity, setBuyersActivity] = useState<BuyersActivity>({
    active: [],
    pending: [],
    rejected: [],
    summary: {
      totalTargeted: 0,
      totalActive: 0,
      totalPending: 0,
      totalRejected: 0,
    },
  });
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [offMarketCurrentPage, setOffMarketCurrentPage] = useState(1);
  const [allDealsCurrentPage, setAllDealsCurrentPage] = useState(1);
  const dealsPerPage = 5;
  const [activeTotalDeals, setActiveTotalDeals] = useState(0);
  const [offMarketTotalDeals, setOffMarketTotalDeals] = useState(0);
  const [allDealsTotalDeals, setAllDealsTotalDeals] = useState(0);
  const [deleteDealId, setDeleteDealId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [offMarketDeal, setOffMarketDeal] = useState<Deal | null>(null);
  const [offMarketLoading, setOffMarketLoading] = useState(false);
  const [offMarketError, setOffMarketError] = useState<string | null>(null);
  const [offMarketDialogOpen, setOffMarketDialogOpen] = useState(false);
  const [currentDialogStep, setCurrentDialogStep] = useState(1);
  const [selectedDealForOffMarketDialog, setSelectedDealForOffMarketDialog] = useState<Deal | null>(null);
  const [offMarketData, setOffMarketData] = useState({
    dealSold: null as boolean | null,
    transactionValue: "",
    buyerFromCIM: null as boolean | null,
  });
  const [buyerActivity, setBuyerActivity] = useState<any[]>([]);
  const [selectedWinningBuyer, setSelectedWinningBuyer] = useState("");
  const [buyerActivityLoading, setBuyerActivityLoading] = useState(false);
  const [isSubmittingOffMarket, setIsSubmittingOffMarket] = useState(false);

  const router = useRouter();
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const formatWithCommas = (value: string | number): string => {
    const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString();
  };

  const fetchDealStatusSummary = async (dealId: string) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/deals/${dealId}/status-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const allBuyerIds = [...data.deal.targetedBuyers, ...data.deal.interestedBuyers];
        const uniqueBuyerIds = [...new Set(allBuyerIds)];
        const buyerDetailsPromises = uniqueBuyerIds.map(async (buyerId) => {
          try {
            const buyerResponse = await fetch(`${apiUrl}/buyers/${buyerId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (buyerResponse.ok) {
              const buyerData = await buyerResponse.json();
              let status = "pending";
              const invitationStatus = data.deal.invitationStatus[buyerId];
              if (invitationStatus) {
                if (invitationStatus.response === "accepted") status = "active";
                else if (invitationStatus.response === "rejected") status = "rejected";
              }
              return {
                buyerId: buyerId,
                buyerName: buyerData.fullName || buyerData.name || "Unknown Buyer",
                companyName: buyerData.companyName || "Unknown Company",
                buyerEmail: buyerData.email || "",
                status: status,
                invitationStatus: invitationStatus,
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        });
        const buyerDetails = await Promise.all(buyerDetailsPromises);
        const validBuyerDetails = buyerDetails.filter((buyer) => buyer !== null);
        setBuyerActivity(validBuyerDetails);
        const activeBuyer = validBuyerDetails.find((buyer) => buyer && buyer.status === "active");
        if (activeBuyer) setSelectedWinningBuyer(activeBuyer.buyerId);
        return validBuyerDetails;
      }
    } catch (error) {}
    return [];
  };

  const handleAdminOffMarketClick = (deal: Deal) => {
    setSelectedDealForOffMarketDialog(deal);
    setCurrentDialogStep(1);
    setOffMarketDialogOpen(true);
    setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null });
    setBuyerActivity([]);
    setSelectedWinningBuyer("");
  };

  const handleAdminDialogResponse = async (key: string, value: boolean) => {
    setOffMarketData((prev) => ({ ...prev, [key]: value }));
    if (key === "dealSold") {
      if (value === false) {
        if (selectedDealForOffMarketDialog) {
          try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(
              `${apiUrl}/deals/${selectedDealForOffMarketDialog._id}/close-deal`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
              }
            );
            if (!response.ok) {
              setOffMarketDialogOpen(false);
              return;
            }
            setActiveDeals((prev) =>
              prev.filter((d) => d._id !== selectedDealForOffMarketDialog._id)
            );
            setOffMarketDeals((prev) => [selectedDealForOffMarketDialog, ...prev]);
            setOffMarketDialogOpen(false);
          } catch (error) {
            setOffMarketDialogOpen(false);
          }
        } else {
          setOffMarketDialogOpen(false);
        }
      } else {
        setCurrentDialogStep(2);
      }
    }
  };

  const handleAdminOffMarketSubmit = async () => {
    if (!selectedDealForOffMarketDialog || !offMarketData.transactionValue) {
      return;
    }
    if (offMarketData.buyerFromCIM === true && !selectedWinningBuyer) {
      return;
    }
    setIsSubmittingOffMarket(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const body = {
        finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
        ...(offMarketData.buyerFromCIM === true && selectedWinningBuyer
          ? { winningBuyerId: selectedWinningBuyer }
          : {}),
      };
      const closeResponse = await fetch(
        `${apiUrl}/deals/${selectedDealForOffMarketDialog._id}/close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!closeResponse.ok) {
        setOffMarketDialogOpen(false);
        return;
      }
      setActiveDeals((prev) =>
        prev.filter((d) => d._id !== selectedDealForOffMarketDialog._id)
      );
      setOffMarketDeals((prev) => [selectedDealForOffMarketDialog, ...prev]);
      setOffMarketDialogOpen(false);
      setCurrentDialogStep(1);
      setSelectedDealForOffMarketDialog(null);
      setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null });
      setBuyerActivity([]);
      setSelectedWinningBuyer("");
    } catch (error) {
      setOffMarketDialogOpen(false);
    } finally {
      setIsSubmittingOffMarket(false);
    }
  };

  useEffect(() => {
    if (
      offMarketDialogOpen &&
      selectedDealForOffMarketDialog &&
      offMarketData.buyerFromCIM === true
    ) {
      setBuyerActivity([]);
      setBuyerActivityLoading(true);
      fetchDealStatusSummary(selectedDealForOffMarketDialog._id).finally(() =>
        setBuyerActivityLoading(false)
      );
    }
  }, [offMarketDialogOpen, selectedDealForOffMarketDialog, offMarketData.buyerFromCIM]);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("https://cim-backend.vercel.app/admin/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminProfile(data);
      }
    };
    fetchAdminProfile();
  }, []);

  const fetchDeals = async (
    page: number,
    limit: number,
    status: "active" | "offMarket" | "allDeals",
    searchTerm: string = ""
  ) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // Properly encode the search term to handle special characters
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      let endpoint;
      if (status === "active") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&buyerResponse=accepted`;
      } else if (status === "offMarket") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&status=completed`;
      } else if (status === "allDeals") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&excludeStatus=completed`;
      }

      if (!endpoint) {
        throw new Error("Invalid deal status provided");
      }
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch ${status} deals`);
      const data = await response.json();
      const dealsArray = Array.isArray(data.data) ? data.data : [data.data];

      const validDealsArray = dealsArray.filter((deal: Deal) => deal !== null && deal !== undefined);

      const dealsWithSellers = await Promise.all(
        validDealsArray.map(async (deal: Deal) => {
          try {
            // Fetch seller profile
            const sellerRes = await fetch(`${apiUrl}/sellers/public/${deal.seller}`);
            let sellerProfile = null;
            if (sellerRes.ok) {
              sellerProfile = await sellerRes.json();
            }

            // Fetch status summary for each deal
            const statusRes = await fetch(`${apiUrl}/deals/${deal._id}/status-summary`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            
            let statusSummary = null;
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              console.log(`Status summary for deal ${deal.title}:`, statusData.summary);
              statusSummary = statusData.summary;
            }

            return { ...deal, sellerProfile, statusSummary };
          } catch {
            return deal;
          }
        })
      );

      if (status === "active") {
        setActiveDeals(dealsWithSellers);
        setActiveTotalDeals(data.total);
      } else if (status === "offMarket") {
        setOffMarketDeals(dealsWithSellers);
        setOffMarketTotalDeals(data.total);
      } else if (status === "allDeals") {
        setAllDeals(dealsWithSellers);
        setAllDealsTotalDeals(data.total);
      }
      setError(null);
    } catch (error: any) {
      if (status === "active") {
        setActiveDeals([]);
        setActiveTotalDeals(0);
      } else if (status === "offMarket") {
        setOffMarketDeals([]);
        setOffMarketTotalDeals(0);
      } else if (status === "allDeals") {
        setAllDeals([]);
        setAllDealsTotalDeals(0);
      }
      setError(error.message);
      console.error(`Error fetching ${status} deals:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals(activeCurrentPage, dealsPerPage, "active", searchTerm);
    fetchDeals(offMarketCurrentPage, dealsPerPage, "offMarket", searchTerm);
    fetchDeals(allDealsCurrentPage, dealsPerPage, "allDeals", searchTerm);
  }, [activeCurrentPage, offMarketCurrentPage, allDealsCurrentPage, searchTerm]);

  useEffect(() => {
    if (activeTab === "active") {
      setActiveCurrentPage(1);
      fetchDeals(1, dealsPerPage, "active", searchTerm);
    } else if (activeTab === "offMarket") {
      setOffMarketCurrentPage(1);
      fetchDeals(1, dealsPerPage, "offMarket", searchTerm);
    } else if (activeTab === "allDeals") {
      setAllDealsCurrentPage(1);
      fetchDeals(1, dealsPerPage, "allDeals", searchTerm);
    }
  }, [activeTab]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const handleEditDeal = (deal: Deal) => {
    setEditDeal(deal);
    setError(null);
  };

  const handleActivityClick = async (deal: Deal) => {
    setSelectedDealForActivity(deal);
    setBuyersActivity({
      active: [],
      pending: [],
      rejected: [],
      summary: {
        totalTargeted: 0,
        totalActive: 0,
        totalPending: 0,
        totalRejected: 0,
      },
    });
    setActivityError(null);
    setShowBuyersActivity(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/${deal._id}/status-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch buyers activity");
      }
      const data = await res.json();
      console.log(`Activity data for deal ${deal.title}:`, data);
      setBuyersActivity({
        active: data.buyersByStatus.active || [],
        pending: data.buyersByStatus.pending || [],
        rejected: data.buyersByStatus.rejected || [],
        summary: data.summary || {
          totalTargeted: 0,
          totalActive: 0,
          totalPending: 0,
          totalRejected: 0,
        },
      });
    } catch (error: any) {
      setActivityError(error.message);
      setBuyersActivity({
        active: [],
        pending: [],
        rejected: [],
        summary: {
          totalTargeted: 0,
          totalActive: 0,
          totalPending: 0,
          totalRejected: 0,
        },
      });
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      let response = await fetch(`${apiUrl}/deals/${dealId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 403 || response.status === 400) {
        const userId = localStorage.getItem("userId") || "admin";
        response = await fetch(`${apiUrl}/deals/${dealId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete deal");
      }
      fetchDeals(activeCurrentPage, dealsPerPage, "active", searchTerm);
      fetchDeals(offMarketCurrentPage, dealsPerPage, "offMarket", searchTerm);
      setDeleteDealId(null);
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOffMarketClick = (deal: Deal) => {
    setOffMarketDeal(deal);
    setOffMarketError(null);
  };

  const handleConfirmOffMarket = async () => {
    if (!offMarketDeal) return;
    setOffMarketLoading(true);
    setOffMarketError(null);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/deals/${offMarketDeal._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to mark deal as off market");
      }
      fetchDeals(activeCurrentPage, dealsPerPage, "active", searchTerm);
      fetchDeals(offMarketCurrentPage, dealsPerPage, "offMarket", searchTerm);
      setOffMarketDeal(null);
    } catch (error: any) {
      setOffMarketError(error.message);
    } finally {
      setOffMarketLoading(false);
    }
  };

  const getTabCount = (tab: string) => {
    if (tab === "active") {
      return activeTotalDeals;
    } else if (tab === "offMarket") {
      return offMarketTotalDeals;
    } else if (tab === "allDeals") {
      return allDealsTotalDeals;
    }
    return 0;
  };

  const activeTotalPages = Math.ceil(activeTotalDeals / dealsPerPage);
  const offMarketTotalPages = Math.ceil(offMarketTotalDeals / dealsPerPage);
  const allDealsTotalPages = Math.ceil(allDealsTotalDeals / dealsPerPage);
  const currentActiveDeals = activeDeals;
  const currentOffMarketDeals = offMarketDeals;
  const currentAllDeals = allDeals;

  function getProfileImageSrc(src?: string | null) {
    if (!src) return undefined;
    if (src.startsWith("data:")) return src;
    return src + `?cb=${Date.now()}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
          <div className="mb-8">
            <Link href="/seller/dashboard">
              <Image
                src="/logo.svg"
                alt="CIM Amplify Logo"
                width={150}
                height={50}
                className="h-auto"
              />
            </Link>
          </div>
          <nav className="flex-1 flex flex-col gap-4">
            <Link href="/admin/dashboard">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
              >
                <Handshake className="h-5 w-5" />
                <span>Deals</span>
              </Button>
            </Link>
            <Link href="/admin/buyers">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 font-normal"
              >
                <Tag className="h-5 w-5" />
                <span>Buyers</span>
              </Button>
            </Link>
            <Link href="/admin/sellers">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 font-normal"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Sellers</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal"
              onClick={() => router.push("/admin/viewprofile")}
            >
              <Eye className="h-5 w-5" />
              <span>View Profile</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </nav>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3aafa9] mb-4"></div>
            <span className="text-gray-600 text-lg">Loading deals...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <Link href="/seller/dashboard">
            <Image
              src="/logo.svg"
              alt="CIM Amplify Logo"
              width={150}
              height={50}
              className="h-auto"
            />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <Link href="/admin/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
            >
              <Handshake className="h-5 w-5" />
              <span>Deals</span>
            </Button>
          </Link>
          <Link href="/admin/buyers">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal"
            >
              <Tag className="h-5 w-5" />
              <span>Buyers</span>
            </Button>
          </Link>
          <Link href="/admin/sellers">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Sellers</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal"
            onClick={() => router.push("/admin/viewprofile")}
          >
            <Eye className="h-5 w-5" />
            <span>View Profile</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-3 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Deal Management</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search deals..."
                className="pl-10 w-80 bg-gray-100 border-0"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium flex items-center">
                  {adminProfile?.fullName || "Admin"}
                </div>
              </div>
              <div className="relative h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium overflow-hidden">
                {adminProfile?.profilePicture ? (
                  <img
                    src={getProfileImageSrc(adminProfile.profilePicture)}
                    alt={adminProfile.fullName || "User"}
                    className="h-full w-full object-cover"
                    key={adminProfile.profilePicture}
                  />
                ) : (
                  <span>{adminProfile?.fullName ? adminProfile.fullName.charAt(0) : "A"}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active">
                Active Deals <Badge className="ml-2">{getTabCount("active")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="offMarket">
                Off Market Deals <Badge className="ml-2">{getTabCount("offMarket")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="allDeals">
                All Deals <Badge className="ml-2">{getTabCount("allDeals")}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {currentActiveDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className="rounded-lg border border-gray-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 p-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-teal-500">
                            {deal.title}
                          </h3>
                          {deal.isPublic && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                              Marketplace
                            </span>
                          )}
                        </div>
                        {deal.rewardLevel && (
                          <span
                            className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f7fa] text-[#00796b]"
                          >
                            {deal.rewardLevel}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {/* Display creation date */}
                        {deal.createdAt && (
                          <div className="text-xs text-gray-500 mb-2">
                            Posted: {new Date(deal.createdAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        {/* Display status badges */}
                        {deal.statusSummary && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active: {deal.statusSummary.totalActive}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Pending: {deal.statusSummary.totalPending}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Rejected: {deal.statusSummary.totalRejected}
                            </span>
                          </div>
                        )}
                        <h4>Seller Information</h4>
                        {deal.sellerProfile ? (
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <div className="text-gray-500 text-xs mr-1">
                                <span>Seller Name:</span> &nbsp;
                                {deal.sellerProfile.fullName}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Seller Email:</span>
                                {deal.sellerProfile.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Company Name:</span>
                                {deal.sellerProfile.companyName}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Phone Number:</span>
                                {deal.sellerProfile.phoneNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Website:</span>
                                {deal.sellerProfile.website}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-2 text-sm text-gray-500 italic">
                            Seller information is not available.
                          </div>
                        )}
                        <h4 className="mb-2 font-medium text-gray-800">Overview</h4>
                        <div className="mb-4 space-y-1 text-sm text-gray-600">
                          <p>Industry: {deal.industrySector}</p>
                          <p>Location: {deal.geographySelection}</p>
                          <p>Company Description: {deal.companyDescription}</p>
                        </div>
                        <h4 className="mb-2 font-medium text-gray-800">Financial</h4>
                        <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <p>
                            Currency: {deal.financialDetails?.trailingRevenueCurrency}
                          </p>
                          <p>
                            Trailing 12-Month Revenue:{" "}
                            {deal.financialDetails?.trailingRevenueCurrency?.replace(
                              "USD($)",
                              "$"
                            ) || "$"}
                            {deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}
                          </p>
                          <p>
                            Trailing 12-Month EBITDA:{" "}
                            {deal.financialDetails?.trailingEBITDACurrency?.replace(
                              "USD($)",
                              "$"
                            ) || "$"}
                            {deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}
                          </p>
                          <p>
                            T12 Net Income: $
                            {deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}
                          </p>
                          {deal.financialDetails?.finalSalePrice && (
                            <p>
                              Final Sale Price: $
                              {deal.financialDetails?.finalSalePrice?.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            className="bg-teal-500 hover:bg-teal-600 px-8 py-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            className="bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 hover:text-black px-4 py-2 ml-3"
                            style={{ minWidth: 110 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminOffMarketClick(deal);
                            }}
                            disabled={offMarketLoading && offMarketDeal?._id === deal._id}
                          >
                            Off Market
                          </Button>
                          <Button
                            variant="outline"
                            className="px-4 py-2 mr-2 ml-3"
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </Button>
                          <Button
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 ml-2 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDealId(deal._id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
              {currentActiveDeals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No deals found
                  </h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm
                      ? `No deals match your search "${searchTerm}"`
                      : `No active deals available`}
                  </p>
                </div>
              )}
              {activeTotalPages > 1 && (
                <div className="flex justify-center items-center gap-1 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCurrentPage(activeCurrentPage - 1)}
                    disabled={activeCurrentPage === 1}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: activeTotalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={activeCurrentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCurrentPage(page)}
                        className={
                          activeCurrentPage === page ? "bg-[#3aafa9] text-white" : ""
                        }
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCurrentPage(activeCurrentPage + 1)}
                    disabled={activeCurrentPage === activeTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="offMarket">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {currentOffMarketDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className="rounded-lg border border-gray-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 p-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-teal-500">
                            {deal.title}
                          </h3>
                          {deal.isPublic && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                              Marketplace
                            </span>
                          )}
                        </div>
                        {deal.rewardLevel && (
                          <span
                            className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f7fa] text-[#00796b]"
                          >
                            {deal.rewardLevel}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {/* Display creation date */}
                        {deal.createdAt && (
                          <div className="text-xs text-gray-500 mb-2">
                            Posted: {new Date(deal.createdAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        {/* Display status badges */}
                        {deal.statusSummary && (
                          <div className="flex gap-2 mb-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            {deal.statusSummary.totalActive > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active: {deal.statusSummary.totalActive}
                              </span>
                            )}
                            {deal.statusSummary.totalPending > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Pending: {deal.statusSummary.totalPending}
                              </span>
                            )}
                            {deal.statusSummary.totalRejected > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Rejected: {deal.statusSummary.totalRejected}
                              </span>
                            )}
                          </div>
                        )}
                        <h4>Seller Information</h4>
                        {deal.sellerProfile ? (
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <div className="text-gray-500 text-xs mr-1">
                                <span>Seller Name:</span> &nbsp;
                                {deal.sellerProfile.fullName}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Seller Email:</span>
                                {deal.sellerProfile.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Company Name:</span>
                                {deal.sellerProfile.companyName}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Phone Number:</span>
                                {deal.sellerProfile.phoneNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Website:</span>
                                {deal.sellerProfile.website}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-2 text-sm text-gray-500 italic">
                            Seller information is not available.
                          </div>
                        )}
                        <h4 className="mb-2 font-medium text-gray-800">Overview</h4>
                        <div className="mb-4 space-y-1 text-sm text-gray-600">
                          <p>Industry: {deal.industrySector}</p>
                          <p>Location: {deal.geographySelection}</p>
                          <p>Company Description: {deal.companyDescription}</p>
                        </div>
                        <h4 className="mb-2 font-medium text-gray-800">Financial</h4>
                        <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <p>
                            Currency: {deal.financialDetails?.trailingRevenueCurrency}
                          </p>
                          <p>
                            Trailing 12-Month Revenue:{" "}
                            {deal.financialDetails?.trailingRevenueCurrency?.replace(
                              "USD($)",
                              "$"
                            ) || "$"}
                            {deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}
                          </p>
                          <p>
                            Trailing 12-Month EBITDA:{" "}
                            {deal.financialDetails?.trailingEBITDACurrency?.replace(
                              "USD($)",
                              "$"
                            ) || "$"}
                            {deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}
                          </p>
                          <p>
                            T12 Net Income: $
                            {deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}
                          </p>
                          {deal.financialDetails?.finalSalePrice && (
                            <p className="col-span-2">
                              <span className="font-semibold">Transaction Value:</span> $
                              {deal.financialDetails.finalSalePrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {(deal.closedWithBuyer || deal.closedWithBuyerCompany || deal.closedWithBuyerEmail) && (
                          <div className="mb-4 text-sm text-gray-700 border border-gray-100 rounded p-2 bg-gray-50">
                            <div className="font-semibold mb-1">Closed Buyer</div>
                            {deal.closedWithBuyerCompany && (
                              <div>Company: {deal.closedWithBuyerCompany}</div>
                            )}
                            {deal.closedWithBuyerEmail && (
                              <div>Email: {deal.closedWithBuyerEmail}</div>
                            )}
                            {deal.closedWithBuyer &&
                              !deal.closedWithBuyerCompany &&
                              !deal.closedWithBuyerEmail && (
                                <div>Buyer ID: {deal.closedWithBuyer}</div>
                              )}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            className="bg-teal-500 hover:bg-teal-600 px-8 py-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 ml-2 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDealId(deal._id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
              {currentOffMarketDeals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No deals found
                  </h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm
                      ? `No deals match your search "${searchTerm}"`
                      : `No off market deals available`}
                  </p>
                </div>
              )}
              {offMarketTotalPages > 1 && (
                <div className="flex justify-center items-center gap-1 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffMarketCurrentPage(offMarketCurrentPage - 1)}
                    disabled={offMarketCurrentPage === 1}
                  >
                    Prev
                  </Button>
                  {Array.from(
                    { length: offMarketTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={
                        offMarketCurrentPage === page ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setOffMarketCurrentPage(page)}
                      className={
                        offMarketCurrentPage === page
                          ? "bg-[#3aafa9] text-white"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffMarketCurrentPage(offMarketCurrentPage + 1)}
                    disabled={offMarketCurrentPage === offMarketTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="allDeals">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {currentAllDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className="rounded-lg border border-gray-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 p-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-teal-500">
                            {deal.title}
                          </h3>
                          {deal.isPublic && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                              Marketplace
                            </span>
                          )}
                        </div>
                        {deal.rewardLevel && (
                          <span
                            className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f7fa] text-[#00796b]"
                          >
                            {deal.rewardLevel}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {/* Display creation date */}
                        {deal.createdAt && (
                          <div className="text-xs text-gray-500 mb-2">
                            Posted: {new Date(deal.createdAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        {/* Display status badges */}
                        {deal.statusSummary && (
                          <div className="flex gap-2 mb-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            {deal.statusSummary.totalActive > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active: {deal.statusSummary.totalActive}
                              </span>
                            )}
                            {deal.statusSummary.totalPending > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Pending: {deal.statusSummary.totalPending}
                              </span>
                            )}
                            {deal.statusSummary.totalRejected > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Rejected: {deal.statusSummary.totalRejected}
                              </span>
                            )}
                          </div>
                        )}
                        <h4>Seller Information</h4>
                        {deal.sellerProfile ? (
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <div className="text-gray-500 text-xs mr-1">
                                <span>Seller Name:</span> &nbsp;
                                {deal.sellerProfile.fullName}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Seller Email:</span>
                                {deal.sellerProfile.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Company Name:</span>
                                {deal.sellerProfile.companyName}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Phone Number:</span>
                                {deal.sellerProfile.phoneNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="mr-1">Website:</span>
                                {deal.sellerProfile.website}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-2 text-sm text-gray-500 italic">
                            Seller information is not available.
                          </div>
                        )}
                        <h4 className="mb-2 font-medium text-gray-800">Overview</h4>
                        <div className="mb-4 space-y-1 text-sm text-gray-600">
                          <p>Industry: {deal.industrySector}</p>
                          <p>Location: {deal.geographySelection}</p>
                          <p>Company Description: {deal.companyDescription}</p>
                        </div>
                        <h4 className="mb-2 font-medium text-gray-800">Financial</h4>
                        <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <p>
                            Currency: {deal.financialDetails?.trailingRevenueCurrency}
                          </p>
                          <p>
                            Trailing 12-Month Revenue:{" "}
                            {deal.financialDetails?.trailingRevenueCurrency?.replace(
                              "USD($)",
                              "$"
                            ) || "$"}
                            {deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}
                          </p>
                          <p>
                            Trailing 12-Month EBITDA:{" "}
                            {deal.financialDetails?.trailingEBITDACurrency?.replace(
                              "USD($)",
                              "$"
                            ) || "$"}
                            {deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}
                          </p>
                          <p>
                            T12 Net Income: $
                            {deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}
                          </p>
                          {deal.financialDetails?.finalSalePrice && (
                            <p className="col-span-2">
                              <span className="font-semibold">Transaction Value:</span> $
                              {deal.financialDetails.finalSalePrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                        {(deal.closedWithBuyer || deal.closedWithBuyerCompany || deal.closedWithBuyerEmail) && (
                          <div className="mb-4 text-sm text-gray-700 border border-gray-100 rounded p-2 bg-gray-50">
                            <div className="font-semibold mb-1">Closed Buyer</div>
                            {deal.closedWithBuyerCompany && (
                              <div>Company: {deal.closedWithBuyerCompany}</div>
                            )}
                            {deal.closedWithBuyerEmail && (
                              <div>Email: {deal.closedWithBuyerEmail}</div>
                            )}
                            {deal.closedWithBuyer &&
                              !deal.closedWithBuyerCompany &&
                              !deal.closedWithBuyerEmail && (
                                <div>Buyer ID: {deal.closedWithBuyer}</div>
                              )}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            className="bg-teal-500 hover:bg-teal-600 px-8 py-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            className="bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 hover:text-black px-4 py-2 ml-3"
                            style={{ minWidth: 110 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminOffMarketClick(deal);
                            }}
                            disabled={offMarketLoading && offMarketDeal?._id === deal._id}
                          >
                            Off Market
                          </Button>
                          <Button
                            variant="outline"
                            className="px-4 py-2 mr-2 ml-3"
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </Button>
                          <Button
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 ml-2 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDealId(deal._id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
              {currentAllDeals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No deals found
                  </h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm
                      ? `No deals match your search "${searchTerm}"`
                      : `No all deals available`}
                  </p>
                </div>
              )}
              {allDealsTotalPages > 1 && (
                <div className="flex justify-center items-center gap-1 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllDealsCurrentPage(allDealsCurrentPage - 1)}
                    disabled={allDealsCurrentPage === 1}
                  >
                    Prev
                  </Button>
                  {Array.from(
                    { length: allDealsTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={allDealsCurrentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAllDealsCurrentPage(page)}
                      className={
                        allDealsCurrentPage === page
                          ? "bg-[#3aafa9] text-white"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllDealsCurrentPage(allDealsCurrentPage + 1)}
                    disabled={allDealsCurrentPage === allDealsTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <BuyersActivityPopup
          isOpen={showBuyersActivity}
          onClose={() => setShowBuyersActivity(false)}
          buyersActivity={buyersActivity}
          dealTitle={selectedDealForActivity?.title || ""}
        />
      </div>

      {editDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl p-8 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4">Edit Deal</h2>
            <AdminEditDealForm
              deal={editDeal}
              onClose={() => setEditDeal(null)}
              onSaved={() => {
                setEditDeal(null);
                fetchDeals(activeCurrentPage, dealsPerPage, "active", searchTerm);
                fetchDeals(offMarketCurrentPage, dealsPerPage, "offMarket", searchTerm);
              }}
            />
          </div>
        </div>
      )}

      {deleteDealId && (
        <Dialog open={!!deleteDealId} onOpenChange={() => setDeleteDealId(null)}>
          <DialogContent>
            <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-gray-700">
              Are you sure you want to delete this deal? This action cannot be undone.
            </div>
            {deleteError && <div className="text-red-500 mb-4">{deleteError}</div>}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDealId(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleDeleteDeal(deleteDealId)}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {offMarketDeal && (
        <Dialog open={!!offMarketDeal} onOpenChange={() => setOffMarketDeal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Deal as Off Market</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-gray-700">
              Are you sure you want to mark this deal as off market?
            </div>
            {offMarketError && <div className="text-red-500 mb-4">{offMarketError}</div>}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOffMarketDeal(null)}
                disabled={offMarketLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-teal-500 hover:bg-teal-600 text-white"
                onClick={handleConfirmOffMarket}
                disabled={offMarketLoading}
              >
                {offMarketLoading ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedDealForOffMarketDialog && (
        <Dialog
          open={offMarketDialogOpen}
          onOpenChange={() => {
            setOffMarketDialogOpen(false);
            setCurrentDialogStep(1);
            setSelectedDealForOffMarketDialog(null);
            setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null });
            setBuyerActivity([]);
            setSelectedWinningBuyer("");
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentDialogStep === 1
                  ? "Mark Deal as Off Market"
                  : "Provide Transaction Details"}
              </DialogTitle>
            </DialogHeader>
            {currentDialogStep === 1 && (
              <div className="space-y-4 py-4">
                <p className="text-gray-700">
                  Was the deal sold? This will help us categorize it appropriately.
                </p>
                <div className="flex gap-4">
                  <Button
                    className={`flex-1 ${
                      offMarketData.dealSold === true
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => handleAdminDialogResponse("dealSold", true)}
                  >
                    Yes
                  </Button>
                  <Button
                    className={`flex-1 ${
                      offMarketData.dealSold === false
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => handleAdminDialogResponse("dealSold", false)}
                  >
                    No
                  </Button>
                </div>
              </div>
            )}
            {currentDialogStep === 2 && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="transactionValue">Transaction Value</Label>
                  <Input
                    id="transactionValue"
                    type="text"
                    value={formatWithCommas(offMarketData.transactionValue)}
                    onChange={(e) =>
                      setOffMarketData((prev) => ({
                        ...prev,
                        transactionValue: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="Enter transaction value"
                    className="mt-1"
                  />
                </div>
                <p className="text-gray-700">
                  Was the buyer sourced through CIM Amplify?
                </p>
                <div className="flex gap-4">
                  <Button
                    className={`flex-1 ${
                      offMarketData.buyerFromCIM === true
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => setOffMarketData((prev) => ({ ...prev, buyerFromCIM: true }))}
                  >
                    Yes
                  </Button>
                  <Button
                    className={`flex-1 ${
                      offMarketData.buyerFromCIM === false
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => setOffMarketData((prev) => ({ ...prev, buyerFromCIM: false }))}
                  >
                    No
                  </Button>
                </div>
                {offMarketData.buyerFromCIM === true && (
                  <div className="mt-4">
                    <Label htmlFor="winningBuyer">Select Winning Buyer</Label>
                    {buyerActivityLoading ? (
                      <div className="text-gray-500 text-sm">Loading buyers...</div>
                    ) : (
                      <select
                        id="winningBuyer"
                        value={selectedWinningBuyer}
                        onChange={(e) => setSelectedWinningBuyer(e.target.value)}
                        className="w-full mt-1 rounded-md border border-gray-300 p-2 text-sm"
                      >
                        <option value="">Select a buyer</option>
                        {buyerActivity.map((buyer) => (
                          <option key={buyer.buyerId} value={buyer.buyerId}>
                            {buyer.buyerName} ({buyer.buyerEmail})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
            {offMarketError && <div className="text-red-500 mb-4">{offMarketError}</div>}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOffMarketDialogOpen(false);
                  setCurrentDialogStep(1);
                  setSelectedDealForOffMarketDialog(null);
                  setOffMarketData({ dealSold: null, transactionValue: "", buyerFromCIM: null });
                  setBuyerActivity([]);
                  setSelectedWinningBuyer("");
                }}
                disabled={isSubmittingOffMarket}
              >
                Cancel
              </Button>
              {currentDialogStep === 2 && (
                <Button
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                  onClick={handleAdminOffMarketSubmit}
                  disabled={
                    isSubmittingOffMarket ||
                    !offMarketData.transactionValue ||
                    (offMarketData.buyerFromCIM === true && !selectedWinningBuyer)
                  }
                >
                  {isSubmittingOffMarket ? "Submitting..." : "Submit"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}