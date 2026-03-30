"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AdminProtectedRoute } from "@/components/admin/protected-route"
import {
  Users,
  UserPlus,
  Trash2,
  Pencil,
  KeyRound,
  Loader2,
  Shield,
  Mail,
  Building2,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react"
import {
  adminGetAllMembers,
  adminCreateTeamMember,
  adminUpdateTeamMember,
  adminDeleteTeamMember,
  adminGetMembersByOwner,
} from "@/services/team-api"
import { SELLER_PERMISSIONS, BUYER_PERMISSIONS } from "@/hooks/use-permissions"

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "create-deal": "Create Deal",
  "edit-deal": "Edit Deal",
  "deal-history": "Deal History / Off Market",
  "loi-deals": "LOI Deals",
  "view-profile": "View Profile",
  marketplace: "Marketplace",
  deals: "All Deals",
  "company-profile": "Company Profile",
}

interface TeamMember {
  _id: string
  fullName: string
  email: string
  profilePicture: string | null
  ownerType: "seller" | "buyer"
  ownerId: string
  role: string
  permissions: string[]
  isTemporaryPassword: boolean
  isActive: boolean
  createdAt: string
  ownerCompanyName?: string
  ownerFullName?: string
}

export default function AdminTeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Add form
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formOwnerType, setFormOwnerType] = useState<"seller" | "buyer">("seller")
  const [formOwnerId, setFormOwnerId] = useState("")
  const [formPermissions, setFormPermissions] = useState<string[]>([])

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const data = await adminGetAllMembers(page, 50)
      setMembers(data.members || [])
      setTotalPages(data.totalPages || 1)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [page])

  const availablePermissions = formOwnerType === "seller" ? SELLER_PERMISSIONS : BUYER_PERMISSIONS

  const filteredMembers = searchQuery
    ? members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.ownerCompanyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.ownerFullName?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : members

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePermission = (perm: string) => {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormOwnerType("seller")
    setFormOwnerId("")
    setFormPermissions([])
    setSelectedMember(null)
  }

  const handleAdd = async () => {
    if (!formName.trim() || !formEmail.trim() || !formOwnerId.trim()) {
      toast({ title: "Error", description: "Name, email, and Owner ID are required", variant: "destructive" })
      return
    }
    if (formPermissions.length === 0) {
      toast({ title: "Error", description: "Select at least one permission", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await adminCreateTeamMember({
        fullName: formName,
        email: formEmail,
        ownerType: formOwnerType,
        ownerId: formOwnerId,
        permissions: formPermissions,
      })
      toast({ title: "Success", description: "Team member created. Invitation email sent." })
      setAddDialogOpen(false)
      resetForm()
      fetchMembers()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedMember) return
    setSubmitting(true)
    try {
      await adminUpdateTeamMember(selectedMember._id, {
        fullName: formName,
        permissions: formPermissions,
        isActive: selectedMember.isActive,
      })
      toast({ title: "Success", description: "Team member updated." })
      setEditDialogOpen(false)
      resetForm()
      fetchMembers()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMember) return
    setSubmitting(true)
    try {
      await adminDeleteTeamMember(selectedMember._id)
      toast({ title: "Success", description: "Team member removed." })
      setDeleteDialogOpen(false)
      setSelectedMember(null)
      fetchMembers()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setFormName(member.fullName)
    setFormEmail(member.email)
    setFormOwnerType(member.ownerType)
    setFormPermissions([...member.permissions])
    setEditDialogOpen(true)
  }

  return (
    <AdminProtectedRoute>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-500">
              Manage team members across all organizations
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setAddDialogOpen(true) }}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-teal-500" />
              All Team Members
              <span className="ml-2 px-2.5 py-0.5 bg-teal-50 text-teal-700 text-sm font-medium rounded-full">
                {filteredMembers.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No team members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member._id}
                    className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{member.fullName}</h4>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                member.ownerType === "seller"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {member.ownerType === "seller" ? "Advisor" : "Buyer"}
                            </span>
                            {!member.isActive && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {member.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {member.ownerCompanyName || "N/A"} ({member.ownerFullName || "N/A"})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(member._id)} className="text-gray-500">
                          {expandedRows.has(member._id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)} className="text-gray-600 hover:text-teal-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedMember(member); setDeleteDialogOpen(true) }}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedRows.has(member._id) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Shield className="h-4 w-4 text-gray-400" />
                          {member.permissions.map((perm) => (
                            <span key={perm} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-100">
                              {PERMISSION_LABELS[perm] || perm}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                          <span>Added: {new Date(member.createdAt).toLocaleDateString()}</span>
                          {member.isTemporaryPassword && (
                            <span className="text-amber-500 flex items-center gap-1">
                              <KeyRound className="h-3 w-3" /> Pending password change
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Member Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-teal-500" />
                Add Team Member (Admin)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Full Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Enter full name" className="mt-1" />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Enter email" className="mt-1" />
              </div>
              <div>
                <Label>Owner Type *</Label>
                <div className="flex gap-2 mt-1">
                  {(["seller", "buyer"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setFormOwnerType(type); setFormPermissions([]) }}
                      className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        formOwnerType === type
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {type === "seller" ? "Advisor" : "Buyer"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Owner ID *</Label>
                <Input value={formOwnerId} onChange={(e) => setFormOwnerId(e.target.value)} placeholder="Enter the owner's user ID" className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">The ID of the seller/buyer this member belongs to</p>
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-teal-500" />
                  Permissions *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        formPermissions.includes(perm)
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        formPermissions.includes(perm) ? "bg-teal-500 border-teal-500" : "border-gray-300"
                      }`}>
                        {formPermissions.includes(perm) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {PERMISSION_LABELS[perm] || perm}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={submitting} className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-teal-500" />
                Edit Team Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Full Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formEmail} disabled className="mt-1 bg-gray-50 text-gray-500" />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-teal-500" />
                  Permissions
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedMember?.ownerType === "seller" ? SELLER_PERMISSIONS : BUYER_PERMISSIONS).map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        formPermissions.includes(perm)
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        formPermissions.includes(perm) ? "bg-teal-500 border-teal-500" : "border-gray-300"
                      }`}>
                        {formPermissions.includes(perm) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {PERMISSION_LABELS[perm] || perm}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEdit} disabled={submitting} className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">Remove Team Member</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to remove <strong>{selectedMember?.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDelete} disabled={submitting} className="bg-red-500 hover:bg-red-600 text-white gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </AdminProtectedRoute>
  )
}
