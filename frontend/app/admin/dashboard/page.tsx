"use client";

import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Search, X, Building2, ChevronDown, ChevronUp, Users, Mail, Briefcase, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminProtectedRoute } from "@/components/admin/protected-route";



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
  ndaDocument?: {
    originalName: string;
    base64Content: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  };
  rewardLevel?: string;
  closedWithBuyer?: string;
  closedWithBuyerCompany?: string;
  closedWithBuyerEmail?: string;
  closedWithCimAmplify?: boolean;
  wasLOIDeal?: boolean;
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
  timeline?: {
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    completedAt?: string;
  };
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
  ndaDocument?: {
    originalName: string;
    base64Content: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  };
  visibility: string;
  status: string;
  isPublic: boolean;
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

const normalizeId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    if (typeof value._id === "string") return value._id.trim();
    if (typeof value.id === "string") return value.id.trim();
    if (typeof value.toString === "function") {
      const converted = value.toString();
      if (converted && converted !== "[object Object]") return converted.trim();
    }
  }
  return "";
};

const hasCimAmplifyBuyer = (deal: Deal): boolean => {
  return Boolean(
    (deal as any).closedWithCimAmplify === true ||
    normalizeId((deal as any).closedWithBuyer) ||
    (deal as any).closedWithBuyerCompany ||
    (deal as any).closedWithBuyerEmail
  );
};

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-100">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Buyer's Activity
              </h2>
              <p className="text-sm text-gray-500">
                Deal: <span className="font-medium text-teal-600">{dealTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <p className="text-xl font-bold text-green-600">{buyersActivity.active?.length || 0}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <p className="text-xl font-bold text-amber-600">{buyersActivity.pending?.length || 0}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <p className="text-xl font-bold text-red-600">{filteredRejectedBuyers.length}</p>
            <p className="text-xs text-gray-500">Rejected</p>
          </div>
        </div>

        {/* Buyers List */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-220px)]">
          {allBuyers.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No buyers available</p>
              <p className="text-gray-400 text-sm mt-1">No buyer activity for this deal yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allBuyers.map((buyer) => (
                <div
                  key={buyer.buyerId}
                  className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 hover:border-gray-200 cursor-pointer transition-all"
                  onClick={() => setSelectedBuyer(buyer)}
                >
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {buyer.buyerName
                      ? buyer.buyerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">
                      {buyer.buyerName || "Unknown"}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {buyer.buyerEmail || "No email"}
                    </p>
                    {buyer.buyerCompany && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {buyer.buyerCompany}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        buyer.status
                      )}`}
                    >
                      {buyer.status.charAt(0).toUpperCase() +
                        buyer.status.slice(1)}
                    </span>
                    {buyer.lastInteraction && (
                      <span className="text-xs text-gray-400">
                        {new Date(buyer.lastInteraction).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {allBuyers.length} {allBuyers.length === 1 ? "buyer" : "buyers"} total
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Buyer Detail Popup */}
      {selectedBuyer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium">
                  {selectedBuyer.buyerName
                    ? selectedBuyer.buyerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "?"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedBuyer.buyerName || "Unknown"}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-0.5 ${getStatusColor(selectedBuyer.status)}`}>
                    {selectedBuyer.status.charAt(0).toUpperCase() + selectedBuyer.status.slice(1)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBuyer(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedBuyer.buyerEmail || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedBuyer.buyerCompany || "N/A"}</p>
                </div>
              </div>

              {selectedBuyer.companyType && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Company Type</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBuyer.companyType}</p>
                  </div>
                </div>
              )}

              {selectedBuyer.lastInteraction && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Last Interaction</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedBuyer.lastInteraction).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {selectedBuyer.interactions && selectedBuyer.interactions.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="font-medium text-gray-800 text-sm mb-2">
                    Interaction History
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedBuyer.interactions.map((interaction, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${
                          interaction.type === 'accepted' ? 'bg-green-100 text-green-700' :
                          interaction.type === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
                        </span>
                        <span className="text-gray-500">
                          {new Date(interaction.timestamp).toLocaleDateString()}
                        </span>
                        {interaction.notes && (
                          <span className="text-gray-600 flex-1">{interaction.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button
                onClick={() => setSelectedBuyer(null)}
                className="bg-teal-500 hover:bg-teal-600 text-white"
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
  const [ndaFile, setNdaFile] = useState<File | null>(null);


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
      ndaDocument: deal.ndaDocument,
      visibility: deal.visibility || "",
      status: deal.status || "",
      isPublic: deal.isPublic || false,
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
      const token = sessionStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      let updatedNdaDocument = form.ndaDocument;
      if (ndaFile) {
        const base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(ndaFile);
        });
        updatedNdaDocument = {
          originalName: ndaFile.name,
          base64Content,
          mimetype: ndaFile.type,
          size: ndaFile.size,
          uploadedAt: new Date(),
        };
      }
      
      const payload = {
        title: form.title,
        companyDescription: form.companyDescription,
        industrySector: form.industrySector,
        geographySelection: form.geographySelection,
        yearsInBusiness: form.yearsInBusiness,
        companyType: form.companyType,
        financialDetails: form.financialDetails,
        businessModel: form.businessModel,
        managementPreferences: form.managementPreferences,
        buyerFit: form.buyerFit,
        ndaDocument: updatedNdaDocument,
        visibility: form.visibility,
        status: form.status,
        isPublic: form.isPublic,
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

      {/* NDA Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">NDA & Agreements</h3>
        {form.ndaDocument ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Current NDA Document</p>
                <p className="text-xs text-gray-500 mt-1">{form.ndaDocument.originalName}</p>
                <p className="text-xs text-gray-400">Uploaded: {new Date(form.ndaDocument.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:${form.ndaDocument!.mimetype};base64,${form.ndaDocument!.base64Content}`;
                    link.download = form.ndaDocument!.originalName;
                    link.click();
                  }}
                >
                  Download
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setForm((prev) => prev ? { ...prev, ndaDocument: undefined } : null)}
                >
                  Remove
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="ndaUpdate" className="text-sm">Update NDA Document</Label>
              <Input
                id="ndaUpdate"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setNdaFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {ndaFile && <p className="text-xs text-green-600 mt-1">New file selected: {ndaFile.name}</p>}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Label htmlFor="ndaUpload" className="text-sm font-medium text-gray-700">Upload NDA Document</Label>
            <Input
              id="ndaUpload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setNdaFile(e.target.files?.[0] || null)}
              className="mt-2"
            />
            {ndaFile && <p className="text-xs text-green-600 mt-1">File selected: {ndaFile.name}</p>}
          </div>
        )}
      </div>

      {/* Marketplace Toggle Section */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col">
            <Label className="text-base font-semibold text-gray-800">Publish to Marketplace</Label>
            <p className="text-sm text-gray-600 mt-1">
              Enable this to make the deal visible in the public marketplace
            </p>
          </div>
          <Switch
            checked={form.isPublic}
            onCheckedChange={(checked) => setForm((prev) => prev ? { ...prev, isPublic: checked } : null)}
          />
        </div>
        {form.isPublic && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            This deal will be visible in the Marketplace
          </div>
        )}
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
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "active";
  const initialSearch = searchParams.get("search") || "";

  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const dealsAbortRef = useRef<Record<"active" | "offMarket" | "allDeals" | "loi", AbortController | null>>({
    active: null,
    offMarket: null,
    allDeals: null,
    loi: null,
  });
  const tabCountsAbortRef = useRef<AbortController | null>(null);
  const recentDealsRequestRef = useRef<Map<string, number>>(new Map());
  const [activeTab, setActiveTab] = useState(initialTab);

  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [offMarketDeals, setOffMarketDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [loiDeals, setLoiDeals] = useState<Deal[]>([]);
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
  const [loiCurrentPage, setLoiCurrentPage] = useState(1);
  const dealsPerPage = 5;
  const [activeTotalDeals, setActiveTotalDeals] = useState(0);
  const [offMarketTotalDeals, setOffMarketTotalDeals] = useState(0);
  const [allDealsTotalDeals, setAllDealsTotalDeals] = useState(0);
  const [loiTotalDeals, setLoiTotalDeals] = useState(0);
  // Page transition loading states
  const [activePageLoading, setActivePageLoading] = useState(false);
  const [offMarketPageLoading, setOffMarketPageLoading] = useState(false);
  const [allDealsPageLoading, setAllDealsPageLoading] = useState(false);
  const [loiPageLoading, setLoiPageLoading] = useState(false);
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

  // LOI dialog state
  const [loiDialogOpen, setLoiDialogOpen] = useState(false);
  const [selectedDealForLoi, setSelectedDealForLoi] = useState<Deal | null>(null);
  const [selectedLoiBuyer, setSelectedLoiBuyer] = useState("");
  const [loiBuyerActivity, setLoiBuyerActivity] = useState<any[]>([]);
  const [loiBuyerActivityLoading, setLoiBuyerActivityLoading] = useState(false);
  const [isSubmittingLoi, setIsSubmittingLoi] = useState(false);

  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

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
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const formatWithCommas = (value: string | number): string => {
    const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString();
  };

  const fetchDealStatusSummary = async (dealId: string) => {
    try {
      const token = sessionStorage.getItem('token');
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

  // Fetch buyers who have ever had this deal in Active (for "Buyer from CIM Amplify" option)
  const fetchEverActiveBuyers = async (dealId: string) => {
    try {
      const token = sessionStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";

      const response = await fetch(`${apiUrl}/deals/admin/${dealId}/ever-active-buyers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const buyers = await response.json();

        // Transform to match the expected format
        const transformedBuyers = buyers.map((buyer: any) => ({
          buyerId: normalizeId(buyer?._id || buyer?.id),
          buyerName: buyer.fullName || "Unknown Buyer",
          companyName: buyer.companyName || "Unknown Company",
          buyerEmail: buyer.email || "",
          status: "active", // Mark all as active since they were ever active
          currentStatus: buyer.currentStatus,
          isCurrentlyActive: buyer.isCurrentlyActive,
        })).filter((buyer: any) => !!buyer.buyerId);

        setBuyerActivity(transformedBuyers);

        // Pre-select first buyer if available
        if (transformedBuyers.length > 0) {
          setSelectedWinningBuyer(transformedBuyers[0].buyerId);
        }

        return transformedBuyers;
      }
    } catch (error) {
      // Error fetching buyers
    }
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
            const token = sessionStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(
              `${apiUrl}/deals/${selectedDealForOffMarketDialog._id}/close-deal`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ buyerFromCIM: false }),
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
    // If buyer from CIM is selected, winningBuyerId must be provided
    if (offMarketData.buyerFromCIM === true && !selectedWinningBuyer) {
      return;
    }
    setIsSubmittingOffMarket(true);
    try {
      const token = sessionStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const body: any = {
        finalSalePrice: Number.parseFloat(offMarketData.transactionValue),
        buyerFromCIM: offMarketData.buyerFromCIM === true,
      };
      // Only add winningBuyerId if buyer is from CIM Amplify AND a buyer is selected
      if (offMarketData.buyerFromCIM === true && selectedWinningBuyer) {
        body.winningBuyerId = normalizeId(selectedWinningBuyer);
      }
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
      // Refresh all tabs to get updated data from backend
      await Promise.all([
        fetchDeals(activeCurrentPage, dealsPerPage, "active", debouncedSearchTerm),
        fetchDeals(offMarketCurrentPage, dealsPerPage, "offMarket", debouncedSearchTerm),
        fetchDeals(allDealsCurrentPage, dealsPerPage, "allDeals", debouncedSearchTerm),
        fetchDeals(loiCurrentPage, dealsPerPage, "loi", debouncedSearchTerm),
      ]);
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

  // Uses everActiveBuyers - buyers who ever had the deal in Active (even if later rejected/passed)
  useEffect(() => {
    if (
      offMarketDialogOpen &&
      selectedDealForOffMarketDialog &&
      offMarketData.buyerFromCIM === true
    ) {
      setBuyerActivity([]);
      setBuyerActivityLoading(true);
      fetchEverActiveBuyers(selectedDealForOffMarketDialog._id).finally(() =>
        setBuyerActivityLoading(false)
      );
    }
  }, [offMarketDialogOpen, selectedDealForOffMarketDialog, offMarketData.buyerFromCIM]);

  // LOI dialog handlers
  const handleAdminPauseForLOI = (deal: Deal) => {
    setSelectedDealForLoi(deal);
    setSelectedLoiBuyer("");
    setLoiBuyerActivity([]);
    setLoiDialogOpen(true);
  };

  const handleAdminPauseForLOISubmit = async (isCimBuyer: boolean) => {
    if (!selectedDealForLoi) return;
    setIsSubmittingLoi(true);
    try {
      const token = sessionStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";
      const body = isCimBuyer && selectedLoiBuyer ? { loiBuyerId: selectedLoiBuyer } : {};

      const response = await fetch(`${apiUrl}/deals/${selectedDealForLoi._id}/pause-for-loi`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setLoiDialogOpen(false);
        return;
      }

      // Refresh all tabs
      await Promise.all([
        fetchDeals(activeCurrentPage, dealsPerPage, "active", debouncedSearchTerm),
        fetchDeals(allDealsCurrentPage, dealsPerPage, "allDeals", debouncedSearchTerm),
        fetchDeals(loiCurrentPage, dealsPerPage, "loi", debouncedSearchTerm),
      ]);

      setLoiDialogOpen(false);
      setSelectedDealForLoi(null);
      setSelectedLoiBuyer("");
      setLoiBuyerActivity([]);
    } catch (error) {
      setLoiDialogOpen(false);
    } finally {
      setIsSubmittingLoi(false);
    }
  };

  // Fetch ever-active buyers when LOI dialog opens
  useEffect(() => {
    if (loiDialogOpen && selectedDealForLoi) {
      setLoiBuyerActivity([]);
      setSelectedLoiBuyer("");
      setLoiBuyerActivityLoading(true);
      fetchEverActiveBuyers(selectedDealForLoi._id)
        .then((buyers) => {
          setLoiBuyerActivity(buyers);
          if (buyers.length > 0) {
            setSelectedLoiBuyer(buyers[0].buyerId);
          }
        })
        .finally(() => setLoiBuyerActivityLoading(false));
    }
  }, [loiDialogOpen, selectedDealForLoi]);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const token = sessionStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";
      const res = await fetch(`${apiUrl}/admin/profile`, {
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
    status: "active" | "offMarket" | "allDeals" | "loi",
    searchTerm: string = ""
  ) => {
    const token = sessionStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";
    if (!token) {
      setLoading(false);
      setSearchLoading(false);
      return;
    }

    // Deduplicate ultra-close identical calls (common in React StrictMode DEV).
    const requestKey = `${status}|${page}|${limit}|${searchTerm}`;
    const now = Date.now();
    const lastRequestAt = recentDealsRequestRef.current.get(requestKey) || 0;
    if (now - lastRequestAt < 500) return;
    recentDealsRequestRef.current.set(requestKey, now);

    // Abort any in-flight request for the same tab/status before starting a new one.
    if (dealsAbortRef.current[status]) {
      dealsAbortRef.current[status]?.abort();
    }
    const controller = new AbortController();
    dealsAbortRef.current[status] = controller;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const fetchWith429Retry = async (url: string, init: RequestInit, retries = 2): Promise<Response> => {
      let attempt = 0;
      while (true) {
        const res = await fetch(url, init);
        if (res.status !== 429 || attempt >= retries) return res;
        const retryAfter = Number(res.headers.get("retry-after"));
        const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 400 * Math.pow(2, attempt);
        attempt += 1;
        await wait(backoffMs);
      }
    };

    // Set page loading state
    if (status === "active") setActivePageLoading(true);
    else if (status === "offMarket") setOffMarketPageLoading(true);
    else if (status === "allDeals") setAllDealsPageLoading(true);
    else if (status === "loi") setLoiPageLoading(true);

    try {
      // Properly encode the search term to handle special characters
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      let endpoint;
      if (status === "active") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&buyerResponse=accepted`;
      } else if (status === "offMarket") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&status=completed`;
      } else if (status === "allDeals") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&excludeStatus=completed`;
      } else if (status === "loi") {
        endpoint = `${apiUrl}/deals/admin?page=${page}&limit=${limit}&search=${encodedSearchTerm}&status=loi`;
      }

      if (!endpoint) {
        throw new Error("Invalid deal status provided");
      }
      const response = await fetchWith429Retry(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: any = new Error(`Failed to fetch ${status} deals`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      const dealsArray = Array.isArray(data.data) ? data.data : [data.data];

      const validDealsArray = dealsArray.filter((deal: Deal) => deal !== null && deal !== undefined);

      const dealsWithSellers = validDealsArray.map((deal: Deal) => {
        let sellerProfile = (deal as any).sellerProfile || null;
        if (Array.isArray(sellerProfile)) {
          sellerProfile = sellerProfile[0] || null;
        }
        const statusSummary = (deal as any).statusSummary || null;
        return { ...deal, sellerProfile, statusSummary };
      });

      if (status === "active") {
        setActiveDeals(dealsWithSellers);
        setActiveTotalDeals(data.total);
        setActivePageLoading(false);
      } else if (status === "offMarket") {
        setOffMarketDeals(dealsWithSellers);
        setOffMarketTotalDeals(data.total);
        setOffMarketPageLoading(false);
      } else if (status === "allDeals") {
        setAllDeals(dealsWithSellers);
        setAllDealsTotalDeals(data.total);
        setAllDealsPageLoading(false);
      } else if (status === "loi") {
        setLoiDeals(dealsWithSellers);
        setLoiTotalDeals(data.total);
        setLoiPageLoading(false);
      }
      setError(null);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return;
      }

      if (error?.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
        return;
      }

      if (status === "active") {
        setActiveDeals([]);
        setActiveTotalDeals(0);
        setActivePageLoading(false);
      } else if (status === "offMarket") {
        setOffMarketDeals([]);
        setOffMarketTotalDeals(0);
        setOffMarketPageLoading(false);
      } else if (status === "allDeals") {
        setAllDeals([]);
        setAllDealsTotalDeals(0);
        setAllDealsPageLoading(false);
      } else if (status === "loi") {
        setLoiDeals([]);
        setLoiTotalDeals(0);
        setLoiPageLoading(false);
      }
      setError(error.message);
    } finally {
      if (dealsAbortRef.current[status] === controller) {
        dealsAbortRef.current[status] = null;
      }
      setLoading(false);
    }
  };

  const fetchAllTabCounts = async (search: string) => {
    const token = sessionStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";
    if (!token) return;

    if (tabCountsAbortRef.current) {
      tabCountsAbortRef.current.abort();
    }
    const controller = new AbortController();
    tabCountsAbortRef.current = controller;

    const encodedSearchTerm = encodeURIComponent(search);

    try {
      const res = await fetch(`${apiUrl}/deals/admin/tab-counts?search=${encodedSearchTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTotalDeals(Number(data?.active || 0));
        setOffMarketTotalDeals(Number(data?.offMarket || 0));
        setAllDealsTotalDeals(Number(data?.allDeals || 0));
        setLoiTotalDeals(Number(data?.loi || 0));
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        // keep existing counters on count-fetch failure
      }
    } finally {
      if (tabCountsAbortRef.current === controller) {
        tabCountsAbortRef.current = null;
      }
    }
  };

  // Debounce search term
  useEffect(() => {
    setSearchLoading(true);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  const currentTabPage =
    activeTab === "active"
      ? activeCurrentPage
      : activeTab === "offMarket"
      ? offMarketCurrentPage
      : activeTab === "allDeals"
      ? allDealsCurrentPage
      : loiCurrentPage;

  useEffect(() => {
    const fetchCurrentTabDeals = async () => {
      if (activeTab === "active") {
        await fetchDeals(currentTabPage, dealsPerPage, "active", debouncedSearchTerm);
      } else if (activeTab === "offMarket") {
        await fetchDeals(currentTabPage, dealsPerPage, "offMarket", debouncedSearchTerm);
      } else if (activeTab === "allDeals") {
        await fetchDeals(currentTabPage, dealsPerPage, "allDeals", debouncedSearchTerm);
      } else if (activeTab === "loi") {
        await fetchDeals(currentTabPage, dealsPerPage, "loi", debouncedSearchTerm);
      }
      setSearchLoading(false);
    };
    fetchCurrentTabDeals();
  }, [activeTab, currentTabPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchAllTabCounts(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    return () => {
      dealsAbortRef.current.active?.abort();
      dealsAbortRef.current.offMarket?.abort();
      dealsAbortRef.current.allDeals?.abort();
      dealsAbortRef.current.loi?.abort();
      tabCountsAbortRef.current?.abort();
    };
  }, []);

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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
    } else if (tab === "loi") {
      return loiTotalDeals;
    }
    return 0;
  };

  const activeTotalPages = Math.ceil(activeTotalDeals / dealsPerPage);
  const offMarketTotalPages = Math.ceil(offMarketTotalDeals / dealsPerPage);
  const allDealsTotalPages = Math.ceil(allDealsTotalDeals / dealsPerPage);
  const loiTotalPages = Math.ceil(loiTotalDeals / dealsPerPage);
  const currentActiveDeals = activeDeals;
  const currentOffMarketDeals = offMarketDeals;
  const currentAllDeals = allDeals;
  const currentLoiDeals = loiDeals;

  function getProfileImageSrc(src?: string | null) {
    if (!src) return undefined;
    return src;
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3aafa9] mb-4"></div>
          <span className="text-gray-600 text-lg">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 p-3 px-4 lg:px-6 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-2xl font-bold text-gray-800">Deal Management</h1>
          </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="relative hidden sm:block">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${searchLoading ? "text-teal-500 animate-pulse" : "text-gray-400"}`} />
                <Input
                  type="text"
                  placeholder="Search deals..."
                  className={`pl-10 pr-8 w-48 lg:w-80 bg-gray-100 border-0 transition-all ${searchLoading ? "ring-2 ring-teal-200" : ""}`}
                  value={searchTerm}
                  onChange={handleSearch}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-medium flex items-center text-sm lg:text-base">
                    {adminProfile?.fullName || "Admin"}
                  </div>
                </div>
                <div className="relative h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium overflow-hidden ring-2 ring-teal-200">
                {adminProfile?.profilePicture ? (
                  <img
                    src={getProfileImageSrc(adminProfile.profilePicture)}
                    alt={adminProfile.fullName || "User"}
                    className="h-full w-full object-cover"
                    key={adminProfile.profilePicture}
                  />
                ) : (
                  <span className="text-sm lg:text-base">{adminProfile?.fullName ? adminProfile.fullName.charAt(0) : "A"}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        <div className="sm:hidden p-3 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${searchLoading ? "text-teal-500 animate-pulse" : "text-gray-400"}`} />
            <Input
              type="text"
              placeholder="Search deals..."
              className={`pl-10 pr-8 w-full bg-gray-100 border-0 transition-all ${searchLoading ? "ring-2 ring-teal-200" : ""}`}
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 overflow-auto">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-4 lg:mb-6 h-auto">
              <TabsTrigger value="active" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Active Deals</span>
                <span className="sm:hidden">Active</span>
                <Badge className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{getTabCount("active")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="loi" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">LOI Deals</span>
                <span className="sm:hidden">LOI</span>
                <Badge className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-amber-100 text-amber-700">{getTabCount("loi")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="offMarket" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Off Market</span>
                <span className="sm:hidden">Off Mkt</span>
                <Badge className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{getTabCount("offMarket")}</Badge>
              </TabsTrigger>
              <TabsTrigger value="allDeals" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">All Deals</span>
                <span className="sm:hidden">All</span>
                <Badge className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{getTabCount("allDeals")}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {/* Page Loading Overlay */}
              {activePageLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Loading deals...</span>
                  </div>
                </div>
              )}
              {!activePageLoading && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {currentActiveDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                    >
                      {/* Header - Compact with inline badges */}
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-teal-600 truncate" title={deal.title}>
                            {deal.title}
                          </h3>
                          {deal.isPublic && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                              Marketplace
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {deal.rewardLevel && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e0f7fa] text-[#00796b]">
                              {deal.rewardLevel}
                            </span>
                          )}
                          {deal.createdAt && (
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              Posted: {new Date(deal.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {/* Status Badges - Inline compact */}
                        {deal.statusSummary && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
                              Active: {deal.statusSummary.totalActive}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700">
                              Pending: {deal.statusSummary.totalPending}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">
                              Rejected: {deal.statusSummary.totalRejected}
                            </span>
                          </div>
                        )}

                        {/* Two Column Layout - Seller & Financial side by side */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {/* Seller Information */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Seller Information</h4>
                            {deal.sellerProfile ? (
                              <div className="space-y-0.5 text-xs">
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.fullName}>{deal.sellerProfile.fullName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Email:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.email}>{deal.sellerProfile.email}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Company Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.companyName}>{deal.sellerProfile.companyName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Phone Number:</span><span className="text-gray-700">{deal.sellerProfile.phoneNumber}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Website:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.website}>{deal.sellerProfile.website}</span></div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">Seller information is not available.</div>
                            )}
                          </div>

                          {/* Financial */}
                          <div className="bg-teal-50/50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Financial</h4>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Currency:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month Revenue:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month EBITDA:</span><span className="text-gray-700">{deal.financialDetails?.trailingEBITDACurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">T12 Net Income:</span><span className="text-gray-700">${deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}</span></div>
                              {deal.financialDetails?.finalSalePrice && (
                                <div className="flex"><span className="text-gray-400 w-28 shrink-0">Final Sale Price:</span><span className="text-teal-600 font-semibold">${deal.financialDetails.finalSalePrice.toLocaleString()}</span></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Overview - Enhanced with Show More */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Overview</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Industry:</span>
                              <span className="text-gray-700 font-medium">{deal.industrySector}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Location:</span>
                              <span className="text-gray-700">{deal.geographySelection}</span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200/60 pt-2 mt-2">
                            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Company Description</span>
                            <p className={`text-xs text-gray-600 mt-1 leading-relaxed ${expandedDescriptions.has(deal._id) ? '' : 'line-clamp-4'}`}>
                              {deal.companyDescription}
                            </p>
                            {deal.companyDescription && deal.companyDescription.length > 200 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescription(deal._id);
                                }}
                                className="mt-1.5 text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors"
                              >
                                {expandedDescriptions.has(deal._id) ? (
                                  <>Show Less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                  <>Show More <ChevronDown className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Enhanced styling */}
                        <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            className="bg-teal-500 hover:bg-teal-600 h-8 px-4 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            size="sm"
                            className="bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminPauseForLOI(deal);
                            }}
                            disabled={deal.status === "loi"}
                          >
                            Pause for LOI
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminOffMarketClick(deal);
                            }}
                            disabled={offMarketLoading && offMarketDeal?._id === deal._id}
                          >
                            Off Market
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white h-8 px-3 text-xs"
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
              )}
              {!activePageLoading && currentActiveDeals.length === 0 && (
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
              {!activePageLoading && activeTotalPages > 1 && (
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

            {/* LOI Deals Tab Content */}
            <TabsContent value="loi">
              {/* Info Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>LOI Deals:</strong> Deals paused for Letter of Intent negotiations appear here.
                  These deals are temporarily on hold while LOI negotiations are in progress.
                </p>
              </div>

              {/* Page Loading Overlay */}
              {loiPageLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Loading LOI deals...</span>
                  </div>
                </div>
              )}
              {!loiPageLoading && currentLoiDeals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No LOI Deals</h3>
                  <p className="text-gray-500 text-sm max-w-md">
                    There are no deals currently paused for LOI negotiations.
                    When sellers pause their deals for LOI, they will appear here.
                  </p>
                </div>
              )}
              {!loiPageLoading && currentLoiDeals.length > 0 && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {currentLoiDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className="rounded-xl border border-amber-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                    >
                      {/* Header - LOI Status Badge */}
                      <div className="flex items-center justify-between border-b border-amber-100 px-4 py-3 bg-gradient-to-r from-amber-50 to-white">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-teal-600 truncate" title={deal.title}>
                            {deal.title}
                          </h3>
                          <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                            LOI - Paused
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {deal.rewardLevel && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e0f7fa] text-[#00796b]">
                              {deal.rewardLevel}
                            </span>
                          )}
                          {deal.createdAt && (
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              Posted: {new Date(deal.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {/* Status Badges */}
                        {deal.statusSummary && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
                              Active: {deal.statusSummary.totalActive}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700">
                              Pending: {deal.statusSummary.totalPending}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">
                              Rejected: {deal.statusSummary.totalRejected}
                            </span>
                          </div>
                        )}

                        {/* Two Column Layout - Seller & Financial */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {/* Seller Information */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Seller Information</h4>
                            {deal.sellerProfile ? (
                              <div className="space-y-0.5 text-xs">
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.fullName}>{deal.sellerProfile.fullName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Email:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.email}>{deal.sellerProfile.email}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Company Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.companyName}>{deal.sellerProfile.companyName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Phone Number:</span><span className="text-gray-700">{deal.sellerProfile.phoneNumber}</span></div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">Seller information is not available.</div>
                            )}
                          </div>

                          {/* Financial */}
                          <div className="bg-amber-50/50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Financial</h4>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Currency:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month Revenue:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month EBITDA:</span><span className="text-gray-700">{deal.financialDetails?.trailingEBITDACurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">T12 Net Income:</span><span className="text-gray-700">${deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Overview */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Overview</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Industry:</span>
                              <span className="text-gray-700 font-medium">{deal.industrySector}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Location:</span>
                              <span className="text-gray-700">{deal.geographySelection}</span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200/60 pt-2 mt-2">
                            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Company Description</span>
                            <p className={`text-xs text-gray-600 mt-1 leading-relaxed ${expandedDescriptions.has(deal._id) ? '' : 'line-clamp-4'}`}>
                              {deal.companyDescription}
                            </p>
                            {deal.companyDescription && deal.companyDescription.length > 200 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescription(deal._id);
                                }}
                                className="mt-1.5 text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors"
                              >
                                {expandedDescriptions.has(deal._id) ? (
                                  <>Show less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                  <>Show more <ChevronDown className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Enhanced styling matching Active Deals */}
                        <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            className="bg-teal-500 hover:bg-teal-600 h-8 px-4 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 h-8 px-3 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const token = sessionStorage.getItem('token');
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                                const res = await fetch(`${apiUrl}/deals/${deal._id}`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ status: "active" }),
                                });
                                if (res.ok) {
                                  setLoiDeals((prev) => prev.filter((d) => d._id !== deal._id));
                                  fetchDeals(activeCurrentPage, dealsPerPage, "active", searchTerm);
                                }
                              } catch (error) {
                                // Failed to revive deal
                              }
                            }}
                          >
                            Revive
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminOffMarketClick(deal);
                            }}
                          >
                            Off Market
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white h-8 px-3 text-xs"
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
              )}
              {/* Pagination for LOI Deals */}
              {!loiPageLoading && loiTotalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoiCurrentPage(loiCurrentPage - 1)}
                    disabled={loiCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {loiCurrentPage} of {loiTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoiCurrentPage(loiCurrentPage + 1)}
                    disabled={loiCurrentPage === loiTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="offMarket">
              {/* Page Loading Overlay */}
              {offMarketPageLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Loading deals...</span>
                  </div>
                </div>
              )}
              {!offMarketPageLoading && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {currentOffMarketDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
                    >
                      {/* Header - Compact with inline badges */}
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-teal-600 truncate" title={deal.title}>
                            {deal.title}
                          </h3>
                          {(deal as any).wasLOIDeal && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">
                              LOI
                            </span>
                          )}
                          {deal.isPublic && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                              Marketplace
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {deal.rewardLevel && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e0f7fa] text-[#00796b]">
                              {deal.rewardLevel}
                            </span>
                          )}
                          {deal.createdAt && (
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              Posted: {new Date(deal.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {/* Sale Information - Complete Section */}
                        <div className="mb-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
                          <h4 className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            Sale Information
                          </h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date Taken Off Market:</span>
                              <span className="font-medium text-gray-700">
                                {deal.timeline?.completedAt
                                  ? new Date(deal.timeline.completedAt).toLocaleDateString()
                                  : deal.timeline?.updatedAt
                                  ? new Date(deal.timeline.updatedAt).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Transaction Value:</span>
                              <span className="font-semibold text-teal-700">
                                {deal.financialDetails?.finalSalePrice
                                  ? `$${deal.financialDetails.finalSalePrice.toLocaleString()}`
                                  : "N/A"}
                              </span>
                            </div>


                            <div className="flex justify-between">
                              <span className="text-gray-500">Buyer From CIM Amplify:</span>
                              <span className={`font-medium ${hasCimAmplifyBuyer(deal) ? "text-green-600" : "text-gray-600"}`}>
                                {hasCimAmplifyBuyer(deal) ? "Yes" : "No"}
                              </span>
                            </div>
                            {deal.closedWithBuyerCompany && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Buyer Company:</span>
                                <span className="font-medium text-gray-700 truncate ml-1" title={deal.closedWithBuyerCompany}>
                                  {deal.closedWithBuyerCompany}
                                </span>
                              </div>
                            )}
                            {deal.closedWithBuyerEmail && (
                              <div className="flex col-span-2">
                                <span className="text-gray-500 shrink-0">Buyer Email:</span>
                                <span className="font-medium text-gray-700 truncate ml-2" title={deal.closedWithBuyerEmail}>
                                  {deal.closedWithBuyerEmail}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badges - Inline compact */}
                        {deal.statusSummary && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            {deal.statusSummary.totalActive > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
                                Active: {deal.statusSummary.totalActive}
                              </span>
                            )}
                            {deal.statusSummary.totalPending > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700">
                                Pending: {deal.statusSummary.totalPending}
                              </span>
                            )}
                            {deal.statusSummary.totalRejected > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">
                                Rejected: {deal.statusSummary.totalRejected}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Two Column Layout - Seller & Financial side by side */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {/* Seller Information */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Seller Information</h4>
                            {deal.sellerProfile ? (
                              <div className="space-y-0.5 text-xs">
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.fullName}>{deal.sellerProfile.fullName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Email:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.email}>{deal.sellerProfile.email}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Company Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.companyName}>{deal.sellerProfile.companyName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Phone Number:</span><span className="text-gray-700">{deal.sellerProfile.phoneNumber}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Website:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.website}>{deal.sellerProfile.website}</span></div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">Seller information is not available.</div>
                            )}
                          </div>

                          {/* Financial */}
                          <div className="bg-teal-50/50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Financial</h4>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Currency:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month Revenue:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month EBITDA:</span><span className="text-gray-700">{deal.financialDetails?.trailingEBITDACurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">T12 Net Income:</span><span className="text-gray-700">${deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}</span></div>
                              {deal.financialDetails?.finalSalePrice && (
                                <div className="flex"><span className="text-gray-400 w-28 shrink-0">Transaction Value:</span><span className="text-teal-600 font-semibold">${deal.financialDetails.finalSalePrice.toLocaleString()}</span></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Overview - Enhanced with Show More */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Overview</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Industry:</span>
                              <span className="text-gray-700 font-medium">{deal.industrySector}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Location:</span>
                              <span className="text-gray-700">{deal.geographySelection}</span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200/60 pt-2 mt-2">
                            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Company Description</span>
                            <p className={`text-xs text-gray-600 mt-1 leading-relaxed ${expandedDescriptions.has(deal._id) ? '' : 'line-clamp-4'}`}>
                              {deal.companyDescription}
                            </p>
                            {deal.companyDescription && deal.companyDescription.length > 200 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescription(deal._id);
                                }}
                                className="mt-1.5 text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors"
                              >
                                {expandedDescriptions.has(deal._id) ? (
                                  <>Show Less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                  <>Show More <ChevronDown className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Enhanced styling */}
                        <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            className="bg-teal-500 hover:bg-teal-600 h-8 px-4 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white h-8 px-3 text-xs"
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
              )}
              {!offMarketPageLoading && currentOffMarketDeals.length === 0 && (
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
              {!offMarketPageLoading && offMarketTotalPages > 1 && (
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
              {/* Page Loading Overlay */}
              {allDealsPageLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Loading deals...</span>
                  </div>
                </div>
              )}
              {!allDealsPageLoading && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {currentAllDeals.map((deal) => (
                  deal && (
                    <div
                      key={deal._id}
                      className={`rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 ${
                        deal.status === "loi"
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Header - Compact with inline badges */}
                      <div className={`flex items-center justify-between border-b px-4 py-3 ${
                        deal.status === "loi"
                          ? "border-amber-100 bg-gradient-to-r from-amber-50 to-amber-50/50"
                          : "border-gray-100 bg-gradient-to-r from-gray-50 to-white"
                      }`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-teal-600 truncate" title={deal.title}>
                            {deal.title}
                          </h3>
                          {deal.status === "loi" && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">
                              LOI
                            </span>
                          )}
                          {deal.isPublic && (
                            <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                              Marketplace
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {deal.rewardLevel && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e0f7fa] text-[#00796b]">
                              {deal.rewardLevel}
                            </span>
                          )}
                          {deal.createdAt && (
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              Posted: {new Date(deal.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {/* Status Badges - Inline compact */}
                        {deal.statusSummary && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700">
                              Total Targeted: {deal.statusSummary.totalTargeted}
                            </span>
                            {deal.statusSummary.totalActive > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
                                Active: {deal.statusSummary.totalActive}
                              </span>
                            )}
                            {deal.statusSummary.totalPending > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700">
                                Pending: {deal.statusSummary.totalPending}
                              </span>
                            )}
                            {deal.statusSummary.totalRejected > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">
                                Rejected: {deal.statusSummary.totalRejected}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Two Column Layout - Seller & Financial side by side */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {/* Seller Information */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Seller Information</h4>
                            {deal.sellerProfile ? (
                              <div className="space-y-0.5 text-xs">
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.fullName}>{deal.sellerProfile.fullName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Seller Email:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.email}>{deal.sellerProfile.email}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Company Name:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.companyName}>{deal.sellerProfile.companyName}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Phone Number:</span><span className="text-gray-700">{deal.sellerProfile.phoneNumber}</span></div>
                                <div className="flex"><span className="text-gray-400 w-20 shrink-0">Website:</span><span className="text-gray-700 truncate" title={deal.sellerProfile.website}>{deal.sellerProfile.website}</span></div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">Seller information is not available.</div>
                            )}
                          </div>

                          {/* Financial */}
                          <div className="bg-teal-50/50 rounded-lg p-2.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Financial</h4>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Currency:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month Revenue:</span><span className="text-gray-700">{deal.financialDetails?.trailingRevenueCurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingRevenueAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">Trailing 12-Month EBITDA:</span><span className="text-gray-700">{deal.financialDetails?.trailingEBITDACurrency?.replace("USD($)", "$") || "$"}{deal.financialDetails?.trailingEBITDAAmount?.toLocaleString() || "N/A"}</span></div>
                              <div className="flex"><span className="text-gray-400 w-28 shrink-0">T12 Net Income:</span><span className="text-gray-700">${deal.financialDetails?.t12NetIncome?.toLocaleString() || "N/A"}</span></div>
                              {deal.financialDetails?.finalSalePrice && (
                                <div className="flex"><span className="text-gray-400 w-28 shrink-0">Transaction Value:</span><span className="text-teal-600 font-semibold">${deal.financialDetails.finalSalePrice.toLocaleString()}</span></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Overview - Enhanced with Show More */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Overview</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Industry:</span>
                              <span className="text-gray-700 font-medium">{deal.industrySector}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-medium">Location:</span>
                              <span className="text-gray-700">{deal.geographySelection}</span>
                            </div>
                          </div>
                          <div className="border-t border-gray-200/60 pt-2 mt-2">
                            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Company Description</span>
                            <p className={`text-xs text-gray-600 mt-1 leading-relaxed ${expandedDescriptions.has(deal._id) ? '' : 'line-clamp-4'}`}>
                              {deal.companyDescription}
                            </p>
                            {deal.companyDescription && deal.companyDescription.length > 200 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescription(deal._id);
                                }}
                                className="mt-1.5 text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-0.5 transition-colors"
                              >
                                {expandedDescriptions.has(deal._id) ? (
                                  <>Show Less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                  <>Show More <ChevronDown className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Closed Buyer Info - Enhanced */}
                        {(deal.closedWithBuyer || deal.closedWithBuyerCompany || deal.closedWithBuyerEmail) && (
                          <div className="mb-3 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg">
                            <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Sale Information</h4>
                            <div className="space-y-0.5 text-xs">
                              {deal.closedWithBuyerCompany && (
                                <div className="flex"><span className="text-gray-500 w-16 shrink-0">Company:</span><span className="text-gray-700 font-medium">{deal.closedWithBuyerCompany}</span></div>
                              )}
                              {deal.closedWithBuyerEmail && (
                                <div className="flex"><span className="text-gray-500 w-16 shrink-0">Email:</span><span className="text-gray-700">{deal.closedWithBuyerEmail}</span></div>
                              )}
                              {deal.closedWithBuyer && !deal.closedWithBuyerCompany && !deal.closedWithBuyerEmail && (
                                <div className="flex"><span className="text-gray-500 w-16 shrink-0">Buyer ID:</span><span className="text-gray-700">{deal.closedWithBuyer}</span></div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons - Enhanced styling */}
                        <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            className="bg-teal-500 hover:bg-teal-600 h-8 px-4 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(deal);
                            }}
                          >
                            Activity
                          </Button>
                          {deal.status !== "loi" && (
                            <Button
                              size="sm"
                              className="bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 h-8 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminPauseForLOI(deal);
                              }}
                            >
                              Pause for LOI
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminOffMarketClick(deal);
                            }}
                            disabled={offMarketLoading && offMarketDeal?._id === deal._id}
                          >
                            Off Market
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white h-8 px-3 text-xs"
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
              )}
              {!allDealsPageLoading && currentAllDeals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No deals found
                  </h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm
                      ? `No deals match your search "${searchTerm}"`
                      : `No deals available`}
                  </p>
                </div>
              )}
              {!allDealsPageLoading && allDealsTotalPages > 1 && (
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

      {/* LOI Dialog */}
      <Dialog
        open={loiDialogOpen}
        onOpenChange={() => {
          setLoiDialogOpen(false);
          setSelectedDealForLoi(null);
          setSelectedLoiBuyer("");
          setLoiBuyerActivity([]);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-cyan-50 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Select The Buyer</DialogTitle>
            <p className="text-gray-500">Choose the LOI buyer for this deal</p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {loiBuyerActivityLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <div className="w-10 h-10 rounded-full border-3 border-teal-200 border-t-teal-500 animate-spin mb-3" />
                  <span className="text-sm font-medium">Loading buyers...</span>
                </div>
              ) : loiBuyerActivity.length > 0 ? (
                loiBuyerActivity.map((buyer: any) => (
                  <div
                    key={buyer.buyerId}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedLoiBuyer === buyer.buyerId
                        ? "border-teal-400 bg-teal-50 shadow-md shadow-teal-100"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedLoiBuyer(buyer.buyerId)}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{buyer.buyerName || "Unknown Buyer"}</div>
                      <div className="text-xs text-gray-500 truncate">{buyer.companyName || "Unknown Company"}</div>
                    </div>
                    {selectedLoiBuyer === buyer.buyerId && (
                      <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No buyers have interacted with this deal yet</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={() => handleAdminPauseForLOISubmit(true)}
                disabled={!selectedLoiBuyer || isSubmittingLoi}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200 disabled:opacity-70"
              >
                {isSubmittingLoi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pause for LOI"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAdminPauseForLOISubmit(false)}
                disabled={isSubmittingLoi}
                className="w-full py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-70"
              >
                {isSubmittingLoi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "No, not from CIM Amplify"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </AdminProtectedRoute>
  );
}
