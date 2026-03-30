"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Loader2,
  User,
  Mail,
  Shield,
  KeyRound,
  Camera,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  getMyMemberProfile,
  updateMyMemberProfile,
  changeMemberPassword,
  uploadMemberProfilePicture,
} from "@/services/team-api"
import { useAuth } from "@/contexts/auth-context"

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard / All Deals",
  "create-deal": "Create Deal",
  "edit-deal": "Edit Deal",
  "deal-history": "Deal History / Off Market",
  "loi-deals": "LOI Deals",
  "view-profile": "View Profile",
  marketplace: "Marketplace",
  "company-profile": "Company Profile",
}

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "https://cim-backend.vercel.app"

export function MemberProfileForm() {
  const { isTemporaryPassword, clearTemporaryPassword } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await getMyMemberProfile()
      setProfile(data)
      setFullName(data.fullName || "")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const updated = await updateMyMemberProfile({ fullName })
      setProfile(updated)
      toast({ title: "Success", description: "Profile updated successfully." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }
    if (!isTemporaryPassword && !currentPassword) {
      toast({ title: "Error", description: "Current password is required", variant: "destructive" })
      return
    }

    setChangingPassword(true)
    try {
      await changeMemberPassword({
        currentPassword: isTemporaryPassword ? undefined : currentPassword,
        newPassword,
      })
      toast({ title: "Success", description: "Password changed successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      // Update auth context and sessionStorage
      clearTemporaryPassword()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const updated = await uploadMemberProfilePicture(file)
      setProfile(updated)
      toast({ title: "Success", description: "Profile picture updated." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <span className="ml-3 text-gray-500">Loading profile...</span>
      </div>
    )
  }

  if (!profile) return null

  const profilePictureUrl = profile.profilePicture
    ? profile.profilePicture.startsWith("http")
      ? profile.profilePicture
      : `${getApiUrl()}${profile.profilePicture}`
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Temp password warning */}
      {isTemporaryPassword && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Please change your temporary password
            </p>
            <p className="text-xs text-amber-600 mt-1">
              For security, update your password before continuing.
            </p>
          </div>
        </div>
      )}

      {/* Profile Picture & Name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-teal-500" />
          Profile Information
        </h3>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={profile.fullName}
                className="h-20 w-20 rounded-full object-cover border-2 border-teal-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                {profile.fullName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <label
              htmlFor="profile-pic-upload"
              className="absolute bottom-0 right-0 p-1.5 bg-white border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 shadow-sm"
            >
              <Camera className="h-3.5 w-3.5 text-gray-600" />
            </label>
            <input
              id="profile-pic-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureUpload}
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.fullName}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} disabled className="mt-1 bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Profile
          </Button>
        </div>
      </div>

      {/* Permissions (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-teal-500" />
          Your Permissions
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          These are set by your organization owner. Contact them to request changes.
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.permissions?.map((perm: string) => (
            <span
              key={perm}
              className="px-3 py-1.5 bg-teal-50 text-teal-700 text-sm font-medium rounded-full border border-teal-100"
            >
              {PERMISSION_LABELS[perm] || perm}
            </span>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-teal-500" />
          Change Password
        </h3>
        <div className="space-y-4">
          {!isTemporaryPassword && (
            <div>
              <Label>Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <Label>New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
          >
            {changingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Change Password
          </Button>
        </div>
      </div>
    </div>
  )
}
