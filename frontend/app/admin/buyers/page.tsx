"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Tag, ShoppingCart, Handshake, Eye, LogOut, Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Add Buyer interface
interface CompanyProfile {
  companyName?: string;
  _id?: string;
  id?: string;
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

// Helper to get image src with cache busting only for real URLs
function getProfileImageSrc(src?: string | null) {
  if (!src) return undefined;
  if (src.startsWith("data:")) return src;
  return `${src}?cb=${Date.now()}`;
}

export default function BuyersManagementDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyerDealCounts, setBuyerDealCounts] = useState<Record<string, BuyerDealStatusCounts>>({});
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDeals, setModalDeals] = useState<any[]>([]);
  const [modalStatus, setModalStatus] = useState<"active" | "pending" | "rejected" | null>(null);
  const [modalBuyer, setModalBuyer] = useState<Buyer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);


  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [buyerCategory, setBuyerCategory] = useState<"all" | "active" | "pending" | "rejected">("all");
  const [buyersPerPage, setBuyersPerPage] = useState(10);

  const router = useRouter();
  const { logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  // Define buyersPerPage before useEffect hooks

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        const res = await fetch("http://localhost:5001/admin/profile", {
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
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
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
      }
    };
    fetchBuyers();
  }, [currentPage, searchTerm, buyersPerPage, showIncompleteOnly, buyerCategory]);

  useEffect(() => {
    const fetchDealCounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const counts: Record<string, BuyerDealStatusCounts> = {};
      await Promise.all(
        buyers.map(async (buyer) => {
          const buyerId = buyer._id || buyer.id;
          if (!buyerId) return;
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/deals/admin/buyer/${buyerId}/status-counts`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!res.ok) throw new Error("Failed to fetch deal status counts");
            const data = await res.json();
            counts[buyerId] = {
              active: data.active || 0,
              pending: data.pending || 0,
              rejected: data.rejected || 0,
            };
          } catch {
            counts[buyerId] = { active: 0, pending: 0, rejected: 0 };
          }
        })
      );
      setBuyerDealCounts(counts);
    };
    if (buyers.length > 0) fetchDealCounts();
  }, [buyers]);

  const openDealModal = async (buyer: Buyer, status: "active" | "pending" | "rejected") => {
    setModalBuyer(buyer);
    setModalStatus(status);
    setModalLoading(true);
    setModalOpen(true);
    try {
      const token = localStorage.getItem("token");
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

  const handleEdit = (buyer: Buyer) => {
    const companyProfileId =
      typeof buyer.companyProfileId === "string"
        ? buyer.companyProfileId
        : buyer.companyProfileId?.$oid ||
          buyer.companyProfile?._id ||
          buyer.companyProfile?.id ||
          "";
    if (companyProfileId) {
      router.push(`/admin/acquireprofile?id=${companyProfileId}`);
    } else {
      alert("No company profile found for this buyer.");
    }
  };

  const handleDelete = async (buyerId: string) => {
    if (!buyerId || !window.confirm("Are you sure you want to delete this buyer?")) return;
    try {
      const token = localStorage.getItem("token");
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

  const totalPages = Math.ceil(totalBuyers / buyersPerPage);
  
  const getDealCounts = (buyer: Buyer) => {
    const buyerId = String(buyer._id || buyer.id || "");
    // If we're filtering by deal status, use the counts from the backend response
    if (buyerCategory !== "all" && buyer.activeDealsCount !== undefined) {
      return {
        active: buyer.activeDealsCount || 0,
        pending: buyer.pendingDealsCount || 0,
        rejected: buyer.rejectedDealsCount || 0,
      };
    }
    // Otherwise, use the separate fetch
    return buyerId && buyerDealCounts[buyerId] ? buyerDealCounts[buyerId] : { active: 0, pending: 0, rejected: 0 };
  };

  const currentBuyers = buyers;

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
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
            >
              <Tag className="h-5 w-5" />
              <span>Buyers</span>
            </Button>
          </Link>
          <Link href="/admin/sellers">
            <Button variant="ghost" className="w-full justify-start gap-3 font-normal">
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
          <h1 className="text-2xl font-bold text-gray-800">
            {showIncompleteOnly ? "Buyers with Incomplete Profiles" : 
             buyerCategory === "all" ? "All Buyers" :
             buyerCategory === "active" ? "Buyers with Active Deals" :
             buyerCategory === "pending" ? "Buyers with Pending Deals" :
             "Buyers with Rejected Deals"}
          </h1>
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
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {/* Page Title & Sorting */}
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
                variant={showIncompleteOnly ? "default" : "outline"}
                onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                className={showIncompleteOnly ? "bg-[#3aafa9] hover:bg-[#359a94]" : ""}
              >
                {showIncompleteOnly ? "Show All Buyers" : "Incomplete Profile Buyers"}
              </Button>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4 md:mt-0">
              <div>
                <label className="mr-2 text-sm font-medium text-gray-700">Categorize by Deals:</label>
                <select
                  value={buyerCategory}
                  onChange={(e) => setBuyerCategory(e.target.value as "all" | "active" | "pending" | "rejected")}
                  className="border border-gray-300 rounded px-2 py-1 text-sm mr-4"
                >
                  <option value="all">All Buyers</option>
                  <option value="active">Active Deals Only</option>
                  <option value="pending">Pending Deals Only</option>
                  <option value="rejected">Rejected Deals Only</option>
                </select>
                <label className="mr-2 text-sm font-medium text-gray-700">Sort Order:</label>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
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
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Default</option>
                  <option value="name-asc">Company Name A-Z</option>
                  <option value="name-desc">Company Name Z-A</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select
                  value={buyersPerPage}
                  onChange={(e) => {
                    setBuyersPerPage(Number(e.target.value));
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
          </div>

          {/* Buyers Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-gray-600 text-lg">Loading buyers...</span>
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Active</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Pending</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Rejected</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentBuyers.map((buyer) => {
                      const buyerId = String(buyer._id || buyer.id || "");
                      const dealCounts = getDealCounts(buyer);
                      
                      return (
                        <tr key={buyerId} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
                              {buyer.companyProfile?.companyName || buyer.companyName || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700 text-sm truncate max-w-[120px]">
                              {buyer.fullName || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-600 text-sm truncate max-w-[180px]">
                              {buyer.email || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <div className="text-gray-600 text-sm truncate">{buyer.phone || "-"}</div>
                          </td>
                          <td
                            className="py-3 px-4 text-green-700 font-semibold cursor-pointer underline"
                            onClick={() => openDealModal(buyer, "active")}
                          >
                            {dealCounts.active}
                          </td>
                          <td
                            className="py-3 px-4 text-yellow-700 font-semibold cursor-pointer underline"
                            onClick={() => openDealModal(buyer, "pending")}
                          >
                            {dealCounts.pending}
                          </td>
                          <td
                            className="py-3 px-4 text-red-700 font-semibold cursor-pointer underline"
                            onClick={() => openDealModal(buyer, "rejected")}
                          >
                            {dealCounts.rejected}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-7 w-7 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                onClick={() => handleEdit(buyer)}
                                title="Edit"
                                disabled={
                                  !(
                                    buyer.companyProfile &&
                                    (buyer.companyProfile._id || buyer.companyProfile.id || buyer.companyProfileId)
                                  )
                                }
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1.5 h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                onClick={() => handleDelete(buyerId)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                    Showing {Math.min((currentPage - 1) * buyersPerPage + 1, totalBuyers)} to{" "}
                    {Math.min(currentPage * buyersPerPage, totalBuyers)} of {totalBuyers} entries
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
              {(buyerCategory !== "all" ? buyers.length === 0 : totalBuyers === 0) && searchTerm !== "" && !loading && (
                <div className="py-12 text-center text-gray-500">
                  No buyers found matching "{searchTerm}".
                </div>
              )}
              {(buyerCategory !== "all" ? buyers.length === 0 : totalBuyers === 0) && searchTerm === "" && !loading && (
                <div className="py-12 text-center text-gray-500">
                  {showIncompleteOnly
                    ? "No buyers with incomplete profiles found."
                    : buyerCategory === "all"
                      ? "No buyers available."
                      : "No buyers available for the selected deal filter."}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Deal Info Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalStatus && modalBuyer
                ? `${modalStatus.charAt(0).toUpperCase() + modalStatus.slice(1)} Deals for ${
                    modalBuyer.fullName || "Buyer"
                  }`
                : "Deals"}
            </DialogTitle>
            <DialogDescription>
              {modalBuyer?.companyProfile?.companyName || modalBuyer?.companyName || "N/A"}
            </DialogDescription>
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
                  <div className="text-xs text-gray-400">
                    Industry: {deal.industrySector || "N/A"}
                  </div>
                  <div className="text-xs text-gray-400">
                    Last Updated:{" "}
                    {deal.timeline?.updatedAt
                      ? new Date(deal.timeline.updatedAt).toLocaleString()
                      : "-"}
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
