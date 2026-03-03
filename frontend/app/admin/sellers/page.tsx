"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Search, Edit, Trash2, AlertTriangle, Building2, User, Mail, Phone, Globe, Briefcase, Calendar, CheckCircle, XCircle, Eye, Handshake, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminProtectedRoute } from "@/components/admin/protected-route";

// Seller interface
interface Seller {
  _id?: string;
  id?: string;
  companyName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  title?: string;
  role?: string;
  password?: string;
  activeDealsCount: number;
  offMarketDealsCount: number;
  loiDealsCount?: number;
  allDealsCount?: number;
  referralSource?: string;
  profilePicture?: string | null;
  isEmailVerified?: boolean;
  isGoogleAccount?: boolean;
  managementPreferences?: string;
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

// Helper function to get the complete profile picture URL
function getProfilePictureUrl(path: string | null | undefined) {
  if (!path) return null;
  // If it's a base64 image (used by admin profiles), return as-is
  if (path.startsWith('data:image')) {
    return path;
  }
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const apiUrl = typeof window !== 'undefined'
    ? (localStorage.getItem("apiUrl") || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001");
  const formattedPath = path.replace(/\\/g, "/");
  return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.slice(1) : formattedPath}`;
}

export default function SellersManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortByActiveDeals, setSortByActiveDeals] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSeller, setEditSeller] = useState<Seller | null>(null);
  const [editForm, setEditForm] = useState<(Seller & { password: string })>({
    fullName: "",
    email: "",
    companyName: "",
    phoneNumber: "",
    website: "",
    title: "",
    password: "",
    activeDealsCount: 0,
    offMarketDealsCount: 0,
    allDealsCount: 0,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [totalSellers, setTotalSellers] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDeals, setModalDeals] = useState<any[]>([]);
  const [modalStatus, setModalStatus] = useState<"active" | "completed" | "loi" | "all" | null>(null);
  const [modalSeller, setModalSeller] = useState<Seller | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const router = useRouter();
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Define sellersPerPage before useEffect hooks
  const [sellersPerPage, setSellersPerPage] = useState(10);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error("No authentication token found");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
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
    const fetchSellers = async () => {
      // Use pageLoading for pagination, loading for initial load
      if (!loading) setPageLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error("No authentication token found");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: sellersPerPage.toString(),
          search: searchTerm,
        });
        const sortParam = `name:${sortOrder}`;
        queryParams.append("sortBy", sortParam);
        if (sortByActiveDeals) {
          queryParams.append("activeOnly", "true");
        }
        const res = await fetch(`${apiUrl}/admin/sellers?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to fetch sellers");
        }
        const data = await res.json();
        const sellersData = Array.isArray(data.data)
          ? data.data.map((seller: Seller) => ({
              ...seller,
              activeDealsCount: seller.activeDealsCount ?? 0,
              offMarketDealsCount: seller.offMarketDealsCount ?? 0,
              allDealsCount: seller.allDealsCount ?? 0,
            }))
          : [];
        setSellers(sellersData);
        setTotalSellers(data.total || 0);
      } catch (error: any) {
        setError(error.message);
        setSellers([]);
        setTotalSellers(0);
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };
    fetchSellers();
  }, [currentPage, searchTerm, sellersPerPage, sortByActiveDeals, sortOrder]);

  // Sort sellers based on active deals or general sorting
  const sortedSellers = useMemo(() => {
    const base = sortByActiveDeals ? sellers.filter((s) => (s.activeDealsCount || 0) > 0) : sellers;
    return [...base].sort((a, b) => {
      const aName = (a.companyName || '').toLowerCase();
      const bName = (b.companyName || '').toLowerCase();
      return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    });
  }, [sellers, sortByActiveDeals, sortOrder]);

  // REMOVED THE PROBLEMATIC useEffect THAT WAS CAUSING INFINITE LOOP

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDetails = (seller: Seller) => {
    setSelectedSeller(seller);
    setDetailModalOpen(true);
  };

  const handleViewActiveDeals = (sellerId: string) => {
    if (sellerId) router.push(`/admin/dashboard?sellerId=${sellerId}&status=active`);
  };

  const handleViewOffMarketDeals = (sellerId: string) => {
    if (sellerId) router.push(`/admin/dashboard?sellerId=${sellerId}&status=completed`);
  };

  const handleEdit = (sellerId: string) => {
    const seller = sellers.find((s) => (s._id || s.id) === sellerId);
    if (seller) {
      setEditSeller(seller);
      setEditForm({
        fullName: seller.fullName || "",
        email: seller.email || "",
        companyName: seller.companyName || "",
        phoneNumber: seller.phoneNumber || "",
        website: seller.website || "",
        title: seller.title || "",
        password: "",
        _id: seller._id,
        id: seller.id,
        role: seller.role,
        activeDealsCount: seller.activeDealsCount,
        offMarketDealsCount: seller.offMarketDealsCount,
        allDealsCount: seller.allDealsCount,
      });
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditLoading(true);
    setError(null);
    if (!editForm.title || editForm.title.trim() === "") {
      setError("Title is required.");
      setEditLoading(false);
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");
      const body: Partial<Seller> & { password?: string } = { ...editForm };
      if (Object.prototype.hasOwnProperty.call(body, "password") && !body.password) delete (body as any).password;
      delete (body as any)._id;
      delete (body as any).id;
      delete (body as any).role;
      delete (body as any).activeDealsCount;
      delete (body as any).offMarketDealsCount;
      delete (body as any).allDealsCount;
      if (!editSeller) throw new Error("No seller selected");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/admin/sellers/${editSeller._id || editSeller.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to update seller");
      }
      const updated = await res.json();
      setSellers(
        sellers.map((s) =>
          (s._id || s.id) === (updated._id || updated.id)
            ? { ...updated, activeDealsCount: s.activeDealsCount, offMarketDealsCount: s.offMarketDealsCount, allDealsCount: s.allDealsCount }
            : s
        )
      );
      setEditSeller(null);
    } catch (error: any) {
      setError(`Failed to update seller: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (sellerId: string) => {
    if (!sellerId || !window.confirm("Are you sure you want to delete this seller?")) return;
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/admin/sellers/${sellerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to delete seller");
      }
      setCurrentPage(1);
      const queryParams = new URLSearchParams({
        page: "1",
        limit: sellersPerPage.toString(),
        search: searchTerm,
      });
      const resFetch = await fetch(`${apiUrl}/admin/sellers?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!resFetch.ok) {
        const errorText = await resFetch.text();
        throw new Error(errorText || "Failed to fetch sellers after deletion");
      }
      const data = await resFetch.json();
      setSellers(
        Array.isArray(data.data)
          ? data.data.map((seller: Seller) => ({
              ...seller,
              activeDealsCount: seller.activeDealsCount ?? 0,
              offMarketDealsCount: seller.offMarketDealsCount ?? 0,
            }))
          : []
      );
      setTotalSellers(data.total || 0);
    } catch (error: any) {
      setError(`Failed to delete seller: ${error.message}`);
    }
  };

  const openDealModal = async (seller: Seller, status: "active" | "completed" | "loi" | "all") => {
    setModalSeller(seller);
    setModalStatus(status);
    setModalLoading(true);
    setModalOpen(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = status === "all"
        ? `${apiUrl}/deals/admin/seller/${seller._id || seller.id}/deals`
        : `${apiUrl}/deals/admin/seller/${seller._id || seller.id}/deals?status=${status}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const totalPages = Math.ceil(totalSellers / sellersPerPage);
  const startIndex = (currentPage - 1) * sellersPerPage;
  const currentSellers = sortedSellers;

  return (
    <AdminProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
      <header className="bg-white border-b border-gray-200 p-3 px-4 lg:px-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h1 className="text-lg lg:text-2xl font-bold text-gray-800">All Sellers</h1>
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
                    src={getProfilePictureUrl(adminProfile.profilePicture) || ""}
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
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-700" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          {dataWarning && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <span className="text-yellow-700">{dataWarning}</span>
            </div>
          )}

          {/* Page Title and Search */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-10 w-full sm:w-64 bg-white border border-gray-200"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button
                variant={sortByActiveDeals ? "default" : "outline"}
                onClick={() => {
                  setSortByActiveDeals(!sortByActiveDeals);
                  if (!sortByActiveDeals) setSortOrder("desc");
                  setCurrentPage(1);
                }}
                className={`text-xs sm:text-sm px-2 sm:px-4 ${sortByActiveDeals ? "bg-[#3aafa9] hover:bg-[#359a94]" : ""}`}
              >
                <span className="hidden sm:inline">{sortByActiveDeals ? "Sorted by Active Deals" : "Sort by Active Deals"}</span>
                <span className="sm:hidden">{sortByActiveDeals ? "Active ✓" : "Sort Active"}</span>
              </Button>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as "asc" | "desc");
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
              >
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Per page:</span>
              <select
                value={sellersPerPage}
                onChange={(e) => {
                  setSellersPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
              >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Sellers Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-sm">Loading sellers...</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
              {/* Page transition loading overlay */}
              {pageLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Loading sellers...</span>
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
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden md:table-cell">
                        Website
                      </th>
                      <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden md:table-cell">
                        Referral
                      </th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden lg:table-cell">
                        Active
                      </th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden lg:table-cell">
                        LOI
                      </th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden lg:table-cell">
                        Off-Market
                      </th>
                      <th className="text-center py-3.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider hidden lg:table-cell">
                        All
                      </th>
                      <th className="text-center py-3.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentSellers.map((seller, index) => {
                      const sellerId = seller._id || seller.id || "";
                      return (
                        <tr key={sellerId} className={`hover:bg-teal-50/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0 overflow-hidden">
                                {getProfilePictureUrl(seller.profilePicture) ? (
                                  <img src={getProfilePictureUrl(seller.profilePicture) || ""} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  (seller.companyName || "N")?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="font-medium text-gray-900 text-sm truncate max-w-[130px]" title={seller.companyName || "N/A"}>
                                {seller.companyName || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700 text-sm truncate max-w-[120px]" title={seller.fullName || "N/A"}>
                              {seller.fullName || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <div className="text-gray-600 text-sm truncate max-w-[160px]" title={seller.email || "N/A"}>
                                {seller.email || "N/A"}
                              </div>
                              {seller.isEmailVerified && (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" title="Verified" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <div className="text-gray-600 text-sm truncate" title={seller.phoneNumber || "-"}>{seller.phoneNumber || "-"}</div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {seller.website ? (
                              <a
                                href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors inline-block truncate max-w-[100px]"
                                title={seller.website}
                              >
                                {seller.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full inline-block truncate max-w-[100px]" title={seller.referralSource || "-"}>
                              {seller.referralSource || "-"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center hidden lg:table-cell">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(seller, "active")}
                            >
                              {seller.activeDealsCount}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center hidden lg:table-cell">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(seller, "loi")}
                            >
                              {seller.loiDealsCount || 0}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center hidden lg:table-cell">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(seller, "completed")}
                            >
                              {seller.offMarketDealsCount}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center hidden lg:table-cell">
                            <button
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                              onClick={() => openDealModal(seller, "all")}
                            >
                              {seller.allDealsCount}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                onClick={() => handleViewDetails(seller)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-8 w-8 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                onClick={() => handleEdit(sellerId)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={() => handleDelete(sellerId)}
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
                    <>Showing <span className="font-semibold text-teal-600">{totalSellers}</span> of <span className="font-semibold text-teal-600">{totalSellers}</span> sellers</>
                  ) : (
                    <>Showing <span className="font-semibold text-teal-600">{Math.min(startIndex + 1, totalSellers)}-{Math.min(startIndex + sellersPerPage, totalSellers)}</span> of <span className="font-semibold text-teal-600">{totalSellers}</span> sellers <span className="text-gray-400">(Page {currentPage} of {totalPages})</span></>
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
              {totalSellers === 0 && searchTerm !== "" && !loading && (
                <div className="py-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-gray-500">No sellers found matching "<span className="font-medium text-gray-700">{searchTerm}</span>"</p>
                </div>
              )}
              {totalSellers === 0 && searchTerm === "" && !loading && (
                <div className="py-12 text-center">
                  <div className="text-gray-300 mb-2">
                    <User className="h-10 w-10 mx-auto" />
                  </div>
                  <p className="text-gray-500">No sellers available.</p>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Edit Modal */}
      {editSeller && (
        <Dialog open={!!editSeller} onOpenChange={() => setEditSeller(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">Edit Seller Profile</DialogTitle>
              <DialogDescription className="text-gray-500">
                Update seller information for {editSeller.fullName || editSeller.email}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <Input
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleEditFormChange}
                    placeholder="Enter full name"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <Input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditFormChange}
                    placeholder="Enter title"
                    required
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <Input
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  placeholder="Enter email"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                <Input
                  name="companyName"
                  value={editForm.companyName}
                  onChange={handleEditFormChange}
                  placeholder="Enter company name"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <Input
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={handleEditFormChange}
                    placeholder="Enter phone"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <Input
                    name="website"
                    value={editForm.website}
                    onChange={handleEditFormChange}
                    placeholder="Enter website"
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <Input
                  name="password"
                  type="password"
                  value={editForm.password}
                  onChange={handleEditFormChange}
                  placeholder="Leave blank to keep unchanged"
                  autoComplete="new-password"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                />
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
                  onClick={() => setEditSeller(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Deal Info Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                modalStatus === "active" ? "bg-green-100" :
                modalStatus === "loi" ? "bg-amber-100" :
                modalStatus === "completed" ? "bg-blue-100" : "bg-purple-100"
              }`}>
                <Handshake className={`h-5 w-5 ${
                  modalStatus === "active" ? "text-green-600" :
                  modalStatus === "loi" ? "text-amber-600" :
                  modalStatus === "completed" ? "text-blue-600" : "text-purple-600"
                }`} />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-800">
                  {modalStatus && modalSeller
                    ? `${modalStatus === "active" ? "Active" : modalStatus === "loi" ? "LOI" : modalStatus === "completed" ? "Off-Market" : "All"} Deals`
                    : "Deals"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {modalSeller?.fullName} • {modalSeller?.companyName || "N/A"}
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
              <p className="text-gray-500 font-medium">No {modalStatus === "completed" ? "off-market" : modalStatus === "loi" ? "LOI" : modalStatus} deals found</p>
              <p className="text-gray-400 text-sm mt-1">This seller has no {modalStatus === "completed" ? "off-market" : modalStatus === "loi" ? "LOI" : modalStatus} deals at the moment</p>
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
                    deal.status === "loi"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-gray-50 border-gray-100"
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

      {/* Seller Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Seller Details</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-4">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                  {getProfilePictureUrl(selectedSeller.profilePicture) ? (
                    <Image
                      src={getProfilePictureUrl(selectedSeller.profilePicture) || ""}
                      alt={selectedSeller.fullName || "Seller"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {(selectedSeller.fullName || "S").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedSeller.fullName || "N/A"}</h3>
                  <p className="text-sm text-gray-500">{selectedSeller.title || "No title"}</p>
                  <p className="text-sm font-medium text-teal-600">{selectedSeller.companyName || "N/A"}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedSeller.email || "N/A"}</p>
                  </div>
                  {selectedSeller.isEmailVerified && (
                    <CheckCircle className="h-4 w-4 text-green-500" title="Email Verified" />
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedSeller.phoneNumber || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Website</p>
                    {selectedSeller.website ? (
                      <a
                        href={selectedSeller.website.startsWith('http') ? selectedSeller.website : `https://${selectedSeller.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline truncate block"
                      >
                        {selectedSeller.website}
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
                    <p className="text-sm font-medium text-gray-900">{selectedSeller.referralSource || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Deal Statistics */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                <div
                  className="text-center p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => { setDetailModalOpen(false); openDealModal(selectedSeller, "active"); }}
                >
                  <p className="text-2xl font-bold text-green-600">{selectedSeller.activeDealsCount || 0}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div
                  className="text-center p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => { setDetailModalOpen(false); openDealModal(selectedSeller, "loi"); }}
                >
                  <p className="text-2xl font-bold text-amber-600">{selectedSeller.loiDealsCount || 0}</p>
                  <p className="text-xs text-gray-500">LOI</p>
                </div>
                <div
                  className="text-center p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => { setDetailModalOpen(false); openDealModal(selectedSeller, "completed"); }}
                >
                  <p className="text-2xl font-bold text-blue-600">{selectedSeller.offMarketDealsCount || 0}</p>
                  <p className="text-xs text-gray-500">Off-Market</p>
                </div>
                <div
                  className="text-center p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => { setDetailModalOpen(false); openDealModal(selectedSeller, "all"); }}
                >
                  <p className="text-2xl font-bold text-purple-600">{selectedSeller.allDealsCount || 0}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Joined: {selectedSeller.createdAt ? new Date(selectedSeller.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
                {selectedSeller.isGoogleAccount && (
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
                    handleEdit(selectedSeller._id || selectedSeller.id || "");
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Seller
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-teal-600 border-teal-600 hover:bg-teal-50"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openDealModal(selectedSeller, "all");
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
    </div>
    </AdminProtectedRoute>
  );
}
