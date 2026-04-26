"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Search, Edit, Trash2, Building2, User, Mail, Phone, Globe, Briefcase, Calendar, CheckCircle, XCircle, Users, Loader2, Handshake, Eye, EyeOff, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminProtectedRoute } from "@/components/admin/protected-route";

// Add Buyer interface
interface CompanyProfile {
  companyName?: string;
  _id?: string;
  id?: string;
  website?: string;
  companyType?: string;
  capitalEntity?: string;
  dealsCompletedLast5Years?: number;
  averageDealSize?: number;
}

interface Buyer {
  _id?: string;
  id?: string;
  companyName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  companyProfileId?: string | { $oid: string };
  companyProfile?: CompanyProfile;
  profileId?: string;
  activeDealsCount?: number;
  pendingDealsCount?: number;
  rejectedDealsCount?: number;
  referralSource?: string;
  signUpForSms?: boolean;
  profilePicture?: string | null;
  website?: string;
  isEmailVerified?: boolean;
  isGoogleAccount?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Add AdminProfile type
interface AdminProfile {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  title?: string;
  companyName?: string;
  website?: string;
  location?: string;
  profilePicture?: string | null;
  role?: string;
}

// Add type for deal status counts
interface BuyerDealStatusCounts {
  active: number;
  pending: number;
  rejected: number;
}

// Helper to get image src with API URL prefix
function getProfileImageSrc(src?: string | null) {
  if (!src) return undefined;
  // If already a full URL, return as is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  // Prepend API URL for relative paths
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cim-backend.vercel.app';
  return `${apiUrl}/${src.startsWith('/') ? src.substring(1) : src}`;
}

export default function BuyersManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDeals, setModalDeals] = useState<any[]>([]);
  const [modalStatus, setModalStatus] = useState<"active" | "pending" | "rejected" | null>(null);
  const [modalBuyer, setModalBuyer] = useState<Buyer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [buyerCategory, setBuyerCategory] = useState<"all" | "active" | "pending" | "rejected">("all");
  const [buyerSort, setBuyerSort] = useState<"default" | "name-asc" | "name-desc">("default");
  const [buyersPerPage, setBuyersPerPage] = useState(10);
  const [pageLoading, setPageLoading] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Edit buyer modal state
  const [editBuyer, setEditBuyer] = useState<Buyer | null>(null);
  const [editForm, setEditForm] = useState<{ fullName: string; email: string; companyName: string; phone: string; website: string; password: string }>({
    fullName: "",
    email: "",
    companyName: "",
    phone: "",
    website: "",
    password: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [navigatingBuyerId, setNavigatingBuyerId] = useState<string | null>(null);

  const router = useRouter();
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Define buyersPerPage before useEffect hooks

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error("No authentication token found");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";
        const res = await fetch(`${apiUrl}/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch admin profile");
        const data = await res.json();
        setAdminProfile(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    const fetchBuyers = async () => {
      // Use pageLoading for pagination, loading for initial load
      if (!loading) setPageLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error("No authentication token found");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        let endpoint = `${apiUrl}/admin/buyers`;
        if (showIncompleteOnly) {
          endpoint = `${apiUrl}/admin/buyers/incomplete-profiles`;
        }

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: buyersPerPage.toString(),
          search: searchTerm,
        });

        // Add dealStatus parameter if filtering by deal status
        if (buyerCategory !== "all") {
          queryParams.append("dealStatus", buyerCategory);
        }

        const res = await fetch(`${endpoint}?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch buyers");
        const data = await res.json();
        setBuyers(Array.isArray(data.data) ? data.data : []);
        setTotalBuyers(data.total || 0);
      } catch (error: any) {
        setError(error.message);
        setBuyers([]);
        setTotalBuyers(0);
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };
    fetchBuyers();
  }, [currentPage, searchTerm, buyersPerPage, showIncompleteOnly, buyerCategory]);

  const openDealModal = async (buyer: Buyer, status: "active" | "pending" | "rejected") => {
    setModalBuyer(buyer);
    setModalStatus(status);
    setModalLoading(true);
    setModalOpen(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/admin/buyer/${buyer._id || buyer.id}/deals?status=${status}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch deals");
      const deals = await res.json();
      setModalDeals(Array.isArray(deals) ? deals : []);
    } catch (error: any) {
      setModalDeals([]);
      setError(error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewDetails = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setDetailModalOpen(true);
  };

  const handleEdit = (buyer: Buyer) => {
    const buyerId = buyer._id || buyer.id || "";
    const companyProfileId =
      typeof buyer.companyProfileId === "string"
        ? buyer.companyProfileId
        : buyer.companyProfileId?.$oid ||
          buyer.companyProfile?._id ||
          buyer.companyProfile?.id ||
          "";
    if (companyProfileId) {
      setNavigatingBuyerId(buyerId);
      router.push(`/admin/acquireprofile?id=${companyProfileId}`);
    } else {
      alert("No company profile found for this buyer.");
    }
  };

  const handleDelete = async (buyerId: string) => {
    if (!buyerId || !window.confirm("Are you sure you want to delete this buyer?")) return;
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/buyers/${buyerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete buyer");
      // Re-fetch buyers after deletion
      setCurrentPage(1); // Reset to first page
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const resFetch = await fetch(
        `${apiUrl}/admin/buyers?page=1&limit=${buyersPerPage}&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!resFetch.ok) throw new Error("Failed to fetch buyers after deletion");
      const data = await resFetch.json();
      setBuyers(Array.isArray(data.data) ? data.data : []);
      setTotalBuyers(data.total || 0);
    } catch (error: any) {
      setError("Failed to delete buyer: " + error.message);
    }
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditBuyer(buyer);
    setEditForm({
      fullName: buyer.fullName || "",
      email: buyer.email || "",
      companyName: buyer.companyProfile?.companyName || buyer.companyName || "",
      phone: buyer.phone || "",
      website: buyer.website || buyer.companyProfile?.website || "",
      password: "",
    });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editBuyer) return;
    setEditLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const buyerId = editBuyer._id || editBuyer.id;

      const body: { fullName?: string; email?: string; companyName?: string; phone?: string; website?: string; password?: string } = {};
      if (editForm.fullName) body.fullName = editForm.fullName;
      if (editForm.email) body.email = editForm.email;
      if (editForm.companyName) body.companyName = editForm.companyName;
      if (editForm.phone) body.phone = editForm.phone;
      if (editForm.website) body.website = editForm.website;
      if (editForm.password) body.password = editForm.password;

      const res = await fetch(`${apiUrl}/admin/buyers/${buyerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to update buyer");
      }
      const updated = await res.json();
      setBuyers(
        buyers.map((b) =>
          (b._id || b.id) === (updated._id || updated.id) ? { ...b, ...updated } : b
        )
      );
      setEditBuyer(null);
      // Also update selected buyer if it's the same one
      if (selectedBuyer && (selectedBuyer._id || selectedBuyer.id) === (updated._id || updated.id)) {
        setSelectedBuyer({ ...selectedBuyer, ...updated });
      }
    } catch (error: any) {
      setError(`Failed to update buyer: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const totalPages = Math.ceil(totalBuyers / buyersPerPage);
  
  const getDealCounts = (buyer: Buyer) => {
    // Counts come from the main /admin/buyers response (denormalized backend fields).
    // This avoids N+1 requests and keeps table performance stable at high page sizes.
    return {
      active: buyer.activeDealsCount || 0,
      pending: buyer.pendingDealsCount || 0,
      rejected: buyer.rejectedDealsCount || 0,
    };
  };

  const currentBuyers = buyers;

  return (
    <AdminProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
      <header className="bg-white border-b border-gray-200 p-3 px-4 lg:px-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800 truncate">
            {showIncompleteOnly ? "Incomplete Profiles" :
             buyerCategory === "all" ? "All Buyers" :
             buyerCategory === "active" ? "Active Deals" :
             buyerCategory === "pending" ? "Pending Deals" :
             "Rejected Deals"}
          </h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="Search here..."
              className="pl-10 w-48 lg:w-80 bg-gray-100 border-0"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-medium flex items-center text-sm lg:text-base">{adminProfile?.fullName || "Admin"}</div>
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
      <div className="md:hidden p-3 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="search"
            placeholder="Search here..."
            className="pl-10 w-full bg-gray-100 border-0"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {/* Page Title & Sorting */}
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-10 w-full sm:w-52 lg:w-56 bg-white border border-gray-200 h-9 text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button
                variant={showIncompleteOnly ? "default" : "outline"}
                onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                className={`h-9 text-xs sm:text-sm px-2 sm:px-3 ${showIncompleteOnly ? "bg-[#3aafa9] hover:bg-[#359a94]" : ""}`}
              >
                <span className="hidden sm:inline">{showIncompleteOnly ? "Show All Buyers" : "Incomplete Profile Buyers"}</span>
                <span className="sm:hidden">{showIncompleteOnly ? "All" : "Incomplete"}</span>
              </Button>
              <div className="flex items-center gap-1">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Category:</label>
                <Select
                  value={buyerCategory}
                  onValueChange={(value) => {
                    setBuyerCategory(value as "all" | "active" | "pending" | "rejected");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[135px] sm:w-[145px] text-xs sm:text-sm">
                    <SelectValue placeholder="Categorize" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active Deals</SelectItem>
                    <SelectItem value="pending">Pending Deals</SelectItem>
                    <SelectItem value="rejected">Rejected Deals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
                <Select
                  value={buyerSort}
                  onValueChange={(value) => {
                    setBuyerSort(value as "default" | "name-asc" | "name-desc");
                    if (value === "name-asc" || value === "name-desc") {
                      const order = value.split("-")[1];
                      const sorted = [...currentBuyers].sort((a, b) => {
                        const aName = (a.companyProfile?.companyName || a.companyName || "").toLowerCase();
                        const bName = (b.companyProfile?.companyName || b.companyName || "").toLowerCase();
                        return order === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
                      });
                      setBuyers(sorted);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-[150px] sm:w-[165px] text-xs sm:text-sm">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="name-asc">Company Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Company Name Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Per page:</span>
                <Select
                  value={String(buyersPerPage)}
                  onValueChange={(value) => {
                    setBuyersPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger className="h-9 w-[95px] sm:w-[105px] text-xs sm:text-sm">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Buyers Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-sm">Loading buyers...</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
              {/* Page transition loading overlay */}
              {pageLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Loading buyers...</span>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Company</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Full Name</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Email</th>
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden sm:table-cell">
                        Phone
                      </th>
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden md:table-cell">Referral</th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden md:table-cell">SMS</th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Active</th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Pending</th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">Rejected</th>
                      <th className="text-center py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentBuyers.map((buyer, index) => {
                      const buyerId = String(buyer._id || buyer.id || "");
                      const dealCounts = getDealCounts(buyer);

                      return (
                        <tr key={buyerId} className={`hover:bg-teal-50/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                                {buyer.profilePicture ? (
                                  <img src={getProfileImageSrc(buyer.profilePicture)} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  (buyer.companyProfile?.companyName || buyer.companyName || "N")?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="font-medium text-gray-900 text-sm truncate max-w-[130px]" title={buyer.companyProfile?.companyName || buyer.companyName || "N/A"}>
                                {buyer.companyProfile?.companyName || buyer.companyName || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700 text-sm truncate max-w-[120px]" title={buyer.fullName || "N/A"}>
                              {buyer.fullName || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <div className="text-gray-600 text-sm truncate max-w-[160px]" title={buyer.email || "N/A"}>
                                {buyer.email || "N/A"}
                              </div>
                              {buyer.isEmailVerified && (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" aria-label="Verified" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <div className="text-gray-600 text-sm truncate" title={buyer.phone || "-"}>{buyer.phone || "-"}</div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full inline-block truncate max-w-[100px]" title={buyer.referralSource || "-"}>
                              {buyer.referralSource || "-"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center hidden md:table-cell">
                            {buyer.signUpForSms === undefined ? (
                              <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full inline-block">-</span>
                            ) : buyer.signUpForSms ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Yes</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">No</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(buyer, "active")}
                            >
                              {dealCounts.active}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(buyer, "pending")}
                            >
                              {dealCounts.pending}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(buyer, "rejected")}
                            >
                              {dealCounts.rejected}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                onClick={() => handleViewDetails(buyer)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-8 w-8 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                onClick={() => handleEdit(buyer)}
                                title="Edit"
                                disabled={
                                  navigatingBuyerId === buyerId ||
                                  !(
                                    buyer.companyProfile &&
                                    (buyer.companyProfile._id || buyer.companyProfile.id || buyer.companyProfileId)
                                  )
                                }
                              >
                                {navigatingBuyerId === buyerId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={() => handleDelete(buyerId)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar - Enhanced styling */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3.5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="text-xs text-gray-600 mb-2 sm:mb-0">
                  {totalPages <= 1 ? (
                    <>Showing <span className="font-semibold text-teal-600">{totalBuyers}</span> of <span className="font-semibold text-teal-600">{totalBuyers}</span> buyers</>
                  ) : (
                    <>Showing <span className="font-semibold text-teal-600">{Math.min((currentPage - 1) * buyersPerPage + 1, totalBuyers)}-{Math.min(currentPage * buyersPerPage, totalBuyers)}</span> of <span className="font-semibold text-teal-600">{totalBuyers}</span> buyers <span className="text-gray-400">(Page {currentPage} of {totalPages})</span></>
                  )}
                </div>
                {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-sm h-8 min-w-[32px] border-gray-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-colors rounded-lg disabled:opacity-50"
                  >
                    ‹
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1 text-sm h-8 min-w-[32px] rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-teal-500 text-white hover:bg-teal-600 border-teal-500 shadow-sm"
                              : "border-gray-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600"
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      (page === currentPage - 3 && currentPage > 4) ||
                      (page === currentPage + 3 && currentPage < totalPages - 3)
                    ) {
                      return (
                        <span key={page} className="px-2 text-sm text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-sm h-8 min-w-[32px] border-gray-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-colors rounded-lg disabled:opacity-50"
                  >
                    ›
                  </Button>
                </div>
                )}
              </div>
              {(buyerCategory !== "all" ? buyers.length === 0 : totalBuyers === 0) && searchTerm !== "" && !loading && (
                <div className="py-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-gray-500">No buyers found matching "<span className="font-medium text-gray-700">{searchTerm}</span>"</p>
                </div>
              )}
              {(buyerCategory !== "all" ? buyers.length === 0 : totalBuyers === 0) && searchTerm === "" && !loading && (
                <div className="py-12 text-center">
                  <div className="text-gray-300 mb-2">
                    <User className="h-10 w-10 mx-auto" />
                  </div>
                  <p className="text-gray-500">
                    {showIncompleteOnly
                      ? "No buyers with incomplete profiles found."
                      : buyerCategory === "all"
                        ? "No buyers available."
                        : "No buyers available for the selected deal filter."}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>

      {/* Deal Info Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                modalStatus === "active" ? "bg-green-100" :
                modalStatus === "pending" ? "bg-amber-100" : "bg-red-100"
              }`}>
                <Handshake className={`h-5 w-5 ${
                  modalStatus === "active" ? "text-green-600" :
                  modalStatus === "pending" ? "text-amber-600" : "text-red-600"
                }`} />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-800">
                  {modalStatus && modalBuyer
                    ? `${modalStatus.charAt(0).toUpperCase() + modalStatus.slice(1)} Deals`
                    : "Deals"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {modalBuyer?.fullName} • {modalBuyer?.companyProfile?.companyName || modalBuyer?.companyName || "N/A"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {modalLoading ? (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500 text-sm">Loading deals...</span>
              </div>
            </div>
          ) : modalDeals.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Handshake className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No {modalStatus} deals found</p>
              <p className="text-gray-400 text-sm mt-1">This buyer has no {modalStatus} deals at the moment</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto py-1">
              {modalDeals.map((deal) => {
                // Determine the correct tab based on deal status
                const getTabForDeal = (status: string) => {
                  if (status === "loi") return "loi";
                  if (status === "completed" || status === "off-market") return "offMarket";
                  if (status === "active") return "active";
                  return "allDeals";
                };
                const tab = getTabForDeal(deal.status);
                return (
                  <Link
                    key={deal._id}
                    href={`/admin/dashboard?tab=${tab}&search=${encodeURIComponent(deal.title || '')}`}
                    className={`block p-2.5 rounded-lg hover:bg-gray-100 transition-colors border cursor-pointer ${
                      deal.status === "loi" ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"
                    }`}
                    onClick={() => setModalOpen(false)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h4 className="font-medium text-teal-600 hover:text-teal-700 text-sm truncate flex items-center gap-1.5">
                          {deal.title || "Untitled Deal"}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </h4>
                        {deal.status === "loi" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white flex-shrink-0">
                            LOI
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-100 text-teal-700 flex-shrink-0">
                        {deal.industrySector || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {deal.timeline?.updatedAt
                          ? new Date(deal.timeline.updatedAt).toLocaleDateString()
                          : "-"}
                      </span>
                      {deal.geographySelection && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {deal.geographySelection}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {modalDeals.length} {modalDeals.length === 1 ? "deal" : "deals"} found
            </span>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buyer Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Buyer Details</DialogTitle>
          </DialogHeader>
          {selectedBuyer && (
            <div className="space-y-4">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                  {selectedBuyer.profilePicture ? (
                    <img
                      src={getProfileImageSrc(selectedBuyer.profilePicture)}
                      alt={selectedBuyer.fullName || "Buyer"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {(selectedBuyer.fullName || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedBuyer.fullName || "N/A"}</h3>
                  <p className="text-sm font-medium text-teal-600">
                    {selectedBuyer.companyProfile?.companyName || selectedBuyer.companyName || "N/A"}
                  </p>
                  {selectedBuyer.companyProfile?.companyType && (
                    <p className="text-xs text-gray-500">{selectedBuyer.companyProfile.companyType}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedBuyer.email || "N/A"}</p>
                  </div>
                  {selectedBuyer.isEmailVerified && (
                    <CheckCircle className="h-4 w-4 text-green-500" aria-label="Email Verified" />
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBuyer.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Website</p>
                    {(selectedBuyer.website || selectedBuyer.companyProfile?.website) ? (
                      <a
                        href={(selectedBuyer.website || selectedBuyer.companyProfile?.website || "").startsWith('http')
                          ? (selectedBuyer.website || selectedBuyer.companyProfile?.website)
                          : `https://${selectedBuyer.website || selectedBuyer.companyProfile?.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline truncate block"
                      >
                        {selectedBuyer.website || selectedBuyer.companyProfile?.website}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">N/A</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Referral Source</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBuyer.referralSource || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Sign up for SMS</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBuyer.signUpForSms === undefined ? "-" : selectedBuyer.signUpForSms ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deal Statistics */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={() => { setDetailModalOpen(false); openDealModal(selectedBuyer, "active"); }}>
                  <p className="text-2xl font-bold text-green-600">{getDealCounts(selectedBuyer).active || 0}</p>
                  <p className="text-xs text-gray-500">Active Deals</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => { setDetailModalOpen(false); openDealModal(selectedBuyer, "pending"); }}>
                  <p className="text-2xl font-bold text-yellow-600">{getDealCounts(selectedBuyer).pending || 0}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" onClick={() => { setDetailModalOpen(false); openDealModal(selectedBuyer, "rejected"); }}>
                  <p className="text-2xl font-bold text-red-600">{getDealCounts(selectedBuyer).rejected || 0}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Joined: {selectedBuyer.createdAt ? new Date(selectedBuyer.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
                {selectedBuyer.isGoogleAccount && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <svg className="h-3 w-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google Account
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleEditBuyer(selectedBuyer);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-teal-600 border-teal-600 hover:bg-teal-50"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openDealModal(selectedBuyer, "active");
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Deals
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Buyer Modal */}
      {editBuyer && (
        <Dialog open={!!editBuyer} onOpenChange={() => setEditBuyer(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">Edit Buyer Profile</DialogTitle>
              <DialogDescription className="text-gray-500">
                Update buyer information for {editBuyer.fullName || editBuyer.email}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleEditFormChange}
                    placeholder="Enter full name"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    placeholder="Enter email"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <Input
                  name="companyName"
                  value={editForm.companyName}
                  onChange={handleEditFormChange}
                  placeholder="Enter company name"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditFormChange}
                    placeholder="Enter phone number"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <Input
                    name="website"
                    value={editForm.website}
                    onChange={handleEditFormChange}
                    placeholder="Enter website URL"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showEditPassword ? "text" : "password"}
                    value={editForm.password}
                    onChange={handleEditFormChange}
                    placeholder="Leave blank to keep unchanged"
                    autoComplete="new-password"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Only fill if you want to change the password</p>
              </div>
              {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                >
                  {editLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditBuyer(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </AdminProtectedRoute>
  );
}
