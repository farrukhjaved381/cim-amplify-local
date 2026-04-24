"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import {
  UserPlus,
  Trash2,
  Pencil,
  KeyRound,
  Loader2,
  Users,
  Shield,
  Mail,
  Check,
} from "lucide-react"
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  resetTeamMemberPassword,
} from "@/services/team-api"
import { SELLER_PERMISSIONS, BUYER_PERMISSIONS } from "@/hooks/use-permissions"

interface TeamMember {
  _id: string
  fullName: string
  email: string
  profilePicture: string | null
  ownerType: "seller" | "buyer"
  role: string
  permissions: string[]
  isTemporaryPassword: boolean
  isActive: boolean
  createdAt: string
}

interface TeamManagementProps {
  ownerType: "seller" | "buyer"
}

const SELLER_PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard / My Deals",
  "create-deal": "Create Deal",
  "edit-deal": "Edit Deal",
  "deal-history": "Deal History / Off Market",
  "loi-deals": "LOI Deals",
  "view-profile": "View Profile",
  emails: "Emails",
}

const BUYER_PERMISSION_LABELS: Record<string, string> = {
  dashboard: "All Deals",
  marketplace: "Marketplace",
  "company-profile": "Company Profile",
  emails: "Emails",
}

const PERMISSION_LABELS: Record<string, string> = {
  ...SELLER_PERMISSION_LABELS,
  ...BUYER_PERMISSION_LABELS,
}

export function TeamManagement({ ownerType }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPermissions, setFormPermissions] = useState<string[]>([])

  const availablePermissions = ownerType === "seller" ? SELLER_PERMISSIONS : BUYER_PERMISSIONS

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const data = await getTeamMembers()
      setMembers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleAdd = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" })
      return
    }
    if (formPermissions.length === 0) {
      toast({ title: "Error", description: "Select at least one permission", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      await createTeamMember({
        fullName: formName,
        email: formEmail,
        ownerType,
        permissions: formPermissions,
      })
      toast({ title: "Success", description: "Team member added. An invitation email has been sent." })
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
      await updateTeamMember(selectedMember._id, {
        fullName: formName,
        permissions: formPermissions,
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
      await deleteTeamMember(selectedMember._id)
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

  const handleResetPassword = async (member: TeamMember) => {
    try {
      await resetTeamMemberPassword(member._id)
      toast({ title: "Success", description: `Password reset email sent to ${member.email}` })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setFormName(member.fullName)
    setFormEmail(member.email)
    setFormPermissions([...member.permissions])
    setEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPermissions([])
    setSelectedMember(null)
  }

  const togglePermission = (perm: string) => {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <span className="ml-3 text-gray-500">Loading team members...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-xl">
            <Users className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? "s" : ""} in your team
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setAddDialogOpen(true)
          }}
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Team Members Yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Add team members to give them access to your {ownerType === "seller" ? "advisor" : "buyer"} dashboard.
          </p>
          <Button
            onClick={() => {
              resetForm()
              setAddDialogOpen(true)
            }}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Your First Member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.fullName}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(member)}
                    className="text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member)
                      setDeleteDialogOpen(true)
                    }}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {member.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-100"
                  >
                    {PERMISSION_LABELS[perm] || perm}
                  </span>
                ))}
              </div>

              {/* Status indicators */}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                {member.isTemporaryPassword && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <KeyRound className="h-3 w-3" />
                    Pending password change
                  </span>
                )}
                <span>Added {new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[94vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-500" />
              Add Team Member
            </DialogTitle>
          </DialogHeader>
           <div className="flex-1 px-1 min-h-0 overflow-y-auto space-y-4 my-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-teal-500" />
                Permissions *
              </Label>
              <p className="text-xs text-gray-500 mb-3">
                Select which pages this member can access.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map((perm) => (
                  perm === "emails" ? (
                      <div
                        key={perm}
                        className="col-span-2 flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white border-gray-200"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-700 block">
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            When ON, this member receives deal invites and team notification emails.
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formPermissions.includes(perm) ? "On" : "Off"}
                          </span>
                          <Switch
                            checked={formPermissions.includes(perm)}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                        </div>
                      </div>
                  ) : (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formPermissions.includes(perm)
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          formPermissions.includes(perm)
                            ? "bg-teal-500 border-teal-500"
                            : "border-gray-300"
                        }`}
                      >
                        {formPermissions.includes(perm) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      {PERMISSION_LABELS[perm] || perm}
                    </button>
                  )
                ))}
              </div>
            </div>
            
          </div>
          <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Member
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-teal-500" />
              Edit Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 mt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input value={formEmail} disabled className="mt-1 bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-teal-500" />
                Permissions
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map((perm) => (
                  perm === "emails" ? (
                    <div
                      key={perm}
                      className="col-span-2 flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white border-gray-200"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {PERMISSION_LABELS[perm] || perm}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formPermissions.includes(perm) ? "On" : "Off"}
                        </span>
                        <Switch
                          checked={formPermissions.includes(perm)}
                          onCheckedChange={() => togglePermission(perm)}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formPermissions.includes(perm)
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          formPermissions.includes(perm)
                            ? "bg-teal-500 border-teal-500"
                            : "border-gray-300"
                        }`}
                      >
                        {formPermissions.includes(perm) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      {PERMISSION_LABELS[perm] || perm}
                    </button>
                  )
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to remove{" "}
            <strong>{selectedMember?.fullName}</strong> from your team? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>

  )
}
