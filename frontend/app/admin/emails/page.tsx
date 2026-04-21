"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AdminProtectedRoute } from "@/components/admin/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  Mail,
  Search,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

type EmailLog = {
  _id: string;
  recipientEmail: string;
  recipientType: string;
  subject: string;
  status: string;
  sentAt: string;
  relatedDealId?: string;
  dealName?: string;
  bodyPreview: string;
};

type EmailLogsResponse = {
  data: EmailLog[];
  total: number;
  page: number;
  lastPage: number;
  summary: {
    totalLogged: number;
    sent: number;
    failed: number;
    pendingQueue: number;
    deadQueue: number;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app";

const formatDateTime = (value: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export default function AdminEmailsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [summary, setSummary] = useState<EmailLogsResponse["summary"]>({
    totalLogged: 0,
    sent: 0,
    failed: 0,
    pendingQueue: 0,
    deadQueue: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [recipientTypeFilter, setRecipientTypeFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/admin/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchEmailLogs = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(perPage),
      });
      if (debouncedSearchTerm.trim()) params.set("search", debouncedSearchTerm.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (recipientTypeFilter) params.set("recipientType", recipientTypeFilter);

      const res = await fetch(`${apiUrl}/mail/admin/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch email logs");
      }

      const data: EmailLogsResponse = await res.json();
      setLogs(data.data || []);
      setSummary(data.summary || {
        totalLogged: 0,
        sent: 0,
        failed: 0,
        pendingQueue: 0,
        deadQueue: 0,
      });
      setTotalLogs(Number(data.total || 0));
      setTotalPages(Math.max(1, Number(data.lastPage || 1)));
      if (data.page && data.page !== currentPage) setCurrentPage(Number(data.page));
    } catch (error: any) {
      setLogs([]);
      toast({
        title: "Unable to load emails",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted || authLoading || !isLoggedIn) return;
    fetchEmailLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, authLoading, isLoggedIn, currentPage, debouncedSearchTerm, statusFilter, recipientTypeFilter, perPage]);

  const statusBadge = (status: string) => {
    if (status === "sent") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "failed") return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const filteredInfo = useMemo(() => {
    const parts = [];
    if (statusFilter) parts.push(`status: ${statusFilter}`);
    if (recipientTypeFilter) parts.push(`recipient: ${recipientTypeFilter}`);
    return parts.join(" | ");
  }, [statusFilter, recipientTypeFilter]);

  if (!mounted || authLoading) {
    return <div className="p-4 lg:p-6">Loading...</div>;
  }

  return (
    <AdminProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gradient-to-r from-white to-teal-50 border-b border-teal-100 p-3 px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-800">Emails</h1>
              <p className="text-xs text-teal-700">System email delivery records, retries, and failures</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/emails/send">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={fetchEmailLogs}
                className="border-teal-200 text-teal-700 hover:bg-teal-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Logged</p><p className="text-2xl font-bold text-gray-800">{summary.totalLogged}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Sent</p><p className="text-2xl font-bold text-emerald-600">{summary.sent}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Failed</p><p className="text-2xl font-bold text-red-600">{summary.failed}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Queue Pending</p><p className="text-2xl font-bold text-amber-600">{summary.pendingQueue}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Queue Dead</p><p className="text-2xl font-bold text-rose-700">{summary.deadQueue}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search recipient, subject, deal ID..."
                    className="h-9 pl-9 bg-gray-50 border-gray-200 text-xs sm:text-sm"
                  />
                </div>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    setStatusFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-gray-50 border-gray-200 text-xs sm:text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={recipientTypeFilter || "all"}
                  onValueChange={(value) => {
                    setRecipientTypeFilter(value === "all" ? "" : value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-gray-50 border-gray-200 text-xs sm:text-sm">
                    <SelectValue placeholder="All recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All recipients</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={String(perPage)}
                  onValueChange={(value) => {
                    setPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-gray-50 border-gray-200 text-xs sm:text-sm">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Per page: 10</SelectItem>
                    <SelectItem value="50">Per page: 50</SelectItem>
                    <SelectItem value="100">Per page: 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filteredInfo && (
                <p className="text-xs text-gray-500 mt-3">Active filters: {filteredInfo}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-700">Email Records</CardTitle>
              <Badge variant="outline">{totalLogs} total</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Mail className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No email records found</p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-3">Sent At</th>
                          <th className="py-2 pr-3">Recipient</th>
                          <th className="py-2 pr-3">Type</th>
                          <th className="py-2 pr-3">Subject</th>
                          <th className="py-2 pr-3">Deal Name</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log._id} className="border-b last:border-0">
                            <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">{formatDateTime(log.sentAt)}</td>
                            <td className="py-3 pr-3 text-gray-800">{log.recipientEmail}</td>
                            <td className="py-3 pr-3"><Badge variant="outline">{log.recipientType}</Badge></td>
                            <td className="py-3 pr-3 max-w-[320px] truncate" title={log.subject}>{log.subject}</td>
                            <td className="py-3 pr-3 text-gray-700 max-w-[220px] truncate" title={log.dealName || "-"}>
                              {log.dealName || "-"}
                            </td>
                            <td className="py-3 pr-3"><Badge className={statusBadge(log.status)}>{log.status}</Badge></td>
                            <td className="py-3">
                              <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-3">
                    {logs.map((log) => (
                      <div key={log._id} className="border rounded-lg p-3 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-gray-500">{formatDateTime(log.sentAt)}</p>
                          <Badge className={statusBadge(log.status)}>{log.status}</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1">{log.subject}</p>
                        {log.dealName && <p className="text-xs text-teal-700 mt-1">Deal: {log.dealName}</p>}
                        <p className="text-xs text-gray-600 mt-1">{log.recipientEmail} ({log.recipientType})</p>
                        <p className="text-xs text-gray-500 mt-2">{log.bodyPreview || "-"}</p>
                        <Button className="mt-3 w-full" variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                      <Select
                        value={String(currentPage)}
                        onValueChange={(value) => setCurrentPage(Number(value))}
                      >
                        <SelectTrigger className="w-[110px] h-9">
                          <SelectValue placeholder="Go to page" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <SelectItem key={page} value={String(page)}>
                              Page {page}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">How to read this page</p>
                <p>
                  Sent and Failed are communication logs. Queue Pending and Queue Dead are retry queue states.
                  Dead means max retries reached and manual investigation is required.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Record Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><p className="text-gray-500">Recipient</p><p className="font-medium">{selectedLog.recipientEmail}</p></div>
                <div><p className="text-gray-500">Recipient Type</p><p className="font-medium">{selectedLog.recipientType}</p></div>
                <div><p className="text-gray-500">Sent At</p><p className="font-medium">{formatDateTime(selectedLog.sentAt)}</p></div>
                <div><p className="text-gray-500">Status</p><Badge className={statusBadge(selectedLog.status)}>{selectedLog.status}</Badge></div>
              </div>
              <div>
                <p className="text-gray-500">Subject</p>
                <p className="font-medium">{selectedLog.subject}</p>
              </div>
              <div>
                <p className="text-gray-500">Deal Name</p>
                <p className="font-medium">{selectedLog.dealName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Body Preview</p>
                <p className="text-gray-700 bg-gray-50 border rounded-md p-3 whitespace-pre-wrap">{selectedLog.bodyPreview || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminProtectedRoute>
  );
}
