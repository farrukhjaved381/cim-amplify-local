"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ShoppingCart, Tag, Handshake, Eye, LogOut, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  allDealsCount?: number;
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

// Helper to get image src with cache busting only for real URLs
function getProfileImageSrc(src?: string | null) {
  if (!src) return undefined;
  if (src.startsWith("data:")) return src;
  return `${src}?cb=${Date.now()}`;
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
  const [modalStatus, setModalStatus] = useState<"active" | "completed" | "all" | null>(null);
  const [modalSeller, setModalSeller] = useState<Seller | null>(null);
  const [modalLoading, setModalLoading] = useState(false);


  const router = useRouter();
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Define sellersPerPage before useEffect hooks
  const [sellersPerPage, setSellersPerPage] = useState(10);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem("token");
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
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
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

  const handleView = (sellerId: string) => {
    if (sellerId) router.push(`/admin/sellers/${sellerId}`);
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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const body: Partial<Seller> & { password?: string } = { ...editForm };
      if (Object.prototype.hasOwnProperty.call(body, "password") && !body.password) delete (body as any).password;
      delete (body as any)._id;
      delete (body as any).id;
      delete (body as any).role;
      delete (body as any).activeDealsCount;
      delete (body as any).offMarketDealsCount;
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
      const token = localStorage.getItem("token");
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

  const openDealModal = async (seller: Seller, status: "active" | "completed" | "all") => {
    setModalSeller(seller);
    setModalStatus(status);
    setModalLoading(true);
    setModalOpen(true);
    try {
      const token = localStorage.getItem("token");
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <Link href="/seller/dashboard">
            <Image src="/logo.svg" alt="CIM Amplify Logo" width={150} height={50} className="h-auto" />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3 font-normal">
              <Handshake className="h-5 w-5" />
              <span>Deals</span>
            </Button>
          </Link>
          <Link href="/admin/buyers">
            <Button variant="ghost" className="w-full justify-start gap-3 font-normal">
              <Tag className="h-5 w-5" />
              <span>Buyers</span>
            </Button>
          </Link>
          <Link href="/admin/sellers">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-3 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">All Sellers</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search here..."
                className="pl-10 w-80 bg-gray-100 border-0"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium flex items-center">{adminProfile?.fullName || "Admin"}</div>
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

        {/* Content Area */}
        <div className="flex-1 p-6">
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
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-10 w-64 bg-white border border-gray-200"
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
                className={sortByActiveDeals ? "bg-[#3aafa9] hover:bg-[#359a94]" : ""}
              >
                {sortByActiveDeals ? "Sorted by Active Deals" : "Sort by Active Deals"}
              </Button>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as "asc" | "desc");
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm ml-2"
              >
                <option value="asc">A to Z</option>
                <option value="desc">Z to A</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <span className="text-sm text-gray-700">Items per page:</span>
              <select
                value={sellersPerPage}
                onChange={(e) => {
                  setSellersPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
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
              <span className="text-gray-600 text-lg">Loading sellers...</span>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Full Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm hidden sm:table-cell">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm hidden md:table-cell">
                        Website
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">
                        Active Deals
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">
                        Off-Market Deals
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm hidden lg:table-cell">
                        All Deals
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentSellers.map((seller) => {
                      const sellerId = seller._id || seller.id || "";
                      return (
                        <tr key={sellerId} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
                              {seller.companyName || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700 text-sm truncate max-w-[120px]">
                              {seller.fullName || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-600 text-sm truncate max-w-[180px]">
                              {seller.email || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <div className="text-gray-600 text-sm truncate">{seller.phoneNumber || "-"}</div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="text-blue-600 text-sm truncate max-w-[140px] hover:underline cursor-pointer">
                              {seller.website ? (
                                <a href={seller.website} target="_blank" rel="noopener noreferrer">
                                  {seller.website}
                                </a>
                              ) : "-"}
                            </div>
                          </td>
                          <td
                            className="py-3 px-4 hidden lg:table-cell cursor-pointer"
                            onClick={() => openDealModal(seller, "active")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDealModal(seller, "active"); }}
                          >
                            <div className="text-gray-600 text-sm hover:text-blue-600 hover:underline">
                              {seller.activeDealsCount}
                            </div>
                          </td>
                          <td
                            className="py-3 px-4 hidden lg:table-cell cursor-pointer"
                            onClick={() => openDealModal(seller, "completed")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDealModal(seller, "completed"); }}
                          >
                            <div className="text-gray-600 text-sm hover:text-blue-600 hover:underline">
                              {seller.offMarketDealsCount}
                            </div>
                          </td>
                          <td
                            className="py-3 px-4 hidden lg:table-cell cursor-pointer"
                            onClick={() => openDealModal(seller, "all")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDealModal(seller, "all"); }}
                          >
                            <div className="text-gray-600 text-sm hover:text-blue-600 hover:underline">
                              {seller.allDealsCount}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-7 w-7 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                onClick={() => handleEdit(sellerId)}
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                onClick={() => handleDelete(sellerId)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                    Showing {Math.min(startIndex + 1, totalSellers)} to{" "}
                    {Math.min(startIndex + sellersPerPage, totalSellers)} of {totalSellers} entries
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm h-8 min-w-[32px] border-gray-300 hover:bg-gray-100"
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
                            className={`px-2 py-1 text-sm h-8 min-w-[32px] ${
                              currentPage === page
                                ? "bg-[#3aafa9] text-white hover:bg-[#359a94] border-[#3aafa9]"
                                : "border-gray-300 hover:bg-gray-100"
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
                      className="px-2 py-1 text-sm h-8 min-w-[32px] border-gray-300 hover:bg-gray-100"
                    >
                      ›
                    </Button>
                  </div>
                </div>
              )}
              {totalSellers === 0 && searchTerm !== "" && !loading && (
                <div className="py-12 text-center text-gray-500">
                  No sellers found matching "{searchTerm}".
                </div>
              )}
              {totalSellers === 0 && searchTerm === "" && !loading && (
                <div className="py-12 text-center text-gray-500">No sellers available.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editSeller && (
        <Dialog open={!!editSeller} onOpenChange={() => setEditSeller(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Seller</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <Input name="fullName" value={editForm.fullName} onChange={handleEditFormChange} />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input name="email" value={editForm.email} onChange={handleEditFormChange} />
              </div>
              <div>
                <label className="block text-sm mb-1">Company Name</label>
                <Input name="companyName" value={editForm.companyName} onChange={handleEditFormChange} />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone Number</label>
                <Input name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditFormChange} />
              </div>
              <div>
                <label className="block text-sm mb-1">Website</label>
                <Input name="website" value={editForm.website} onChange={handleEditFormChange} />
              </div>
              <div>
                <label className="block text-sm mb-1">Title</label>
                <Input name="title" value={editForm.title} onChange={handleEditFormChange} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Password (leave blank to keep unchanged)</label>
                <Input
                  name="password"
                  type="password"
                  value={editForm.password}
                  onChange={handleEditFormChange}
                  autoComplete="new-password"
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex gap-2 mt-4">
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditSeller(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Deal Info Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalStatus && modalSeller
                ? `${modalStatus === "active" ? "Active" : "Off-Market"} Deals for ${modalSeller.fullName || "Seller"}`
                : "Deals"}
            </DialogTitle>
            <DialogDescription>{modalSeller?.companyName || "N/A"}</DialogDescription>
          </DialogHeader>
          {modalLoading ? (
            <div className="py-6 text-center">Loading deals...</div>
          ) : modalDeals.length === 0 ? (
            <div className="py-6 text-center text-gray-500">No deals found.</div>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {modalDeals.map((deal) => (
                <li key={deal._id} className="py-2 px-1">
                  <div className="font-medium text-gray-900">{deal.title || "Untitled Deal"}</div>
                  <div className="text-xs text-gray-500">Status: {deal.status || "N/A"}</div>
                  <div className="text-xs text-gray-400">Industry: {deal.industrySector || "N/A"}</div>
                  <div className="text-xs text-gray-400">
                    Last Updated: {deal.timeline?.updatedAt ? new Date(deal.timeline.updatedAt).toLocaleString() : "-"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
