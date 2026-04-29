"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSellerProfile } from "@/services/api";
import { buildApiUrl } from "@/lib/api-config";
import {
  Pencil,
  Eye,
  EyeOff,
  Camera,
  Loader2,
  Menu,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import SellerProtectedRoute from "@/components/seller/protected-route";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SellerNav } from "@/components/seller/seller-nav";

interface SellerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  title?: string;
  companyName?: string;
  website?: string;
  location?: string;
  profilePicture?: string;
  preferences?: {
    receiveDealEmails?: boolean;
  };
}

// Define which fields are editable based on backend DTO
const EDITABLE_FIELDS = [
  "fullName",
  "email",
  "companyName",
  "phoneNumber",
  "website",
  "title",
] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

export default function ViewProfilePage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Partial<SellerProfile>>({});
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const router = useRouter();
  const { logout } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    // If it's a base64 image, return as-is
    if (profilePicture.startsWith("data:image")) return profilePicture;
    // If it's already a full URL, return as-is
    if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) return profilePicture;

    const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app";
    const formattedPath = profilePicture.replace(/\\/g, "/");

    return `${apiUrl}/${
      formattedPath.startsWith("/") ? formattedPath.substring(1) : formattedPath
    }`;
  };

  // Validation function for website URL
  const validateWebsite = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (optional field)

    try {
      const trimmedUrl = url.trim();
      // Accept URLs with http/https, www prefix, or plain domain names
      // Pattern accepts: https://example.com, http://example.com, www.example.com, example.com
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+\/?.*$/;
      return urlPattern.test(trimmedUrl);
    } catch {
      return false;
    }
  };

  // Validate all fields
  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate email
    if (
      editValues.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValues.email.trim())
    ) {
      errors.email = "Please enter a valid email address";
    }

    // Validate website
    if (editValues.website && !validateWebsite(editValues.website)) {
      errors.website =
        "Website must be a valid URL (e.g., www.example.com or https://example.com)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem("token");
        if (!token) {
          router.push("/seller/login?error=no_token");
          return;
        }

        const data = await getSellerProfile();
        setProfile(data);
        setEditValues(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
        toast({
          title: "Error",
          description: err.message || "Failed to load profile",
          variant: "destructive",
        });

        if (
          err.message === "Authentication expired" ||
          err.message === "No authentication token found" ||
          err.message === "Failed to fetch profile: 403"
        ) {
          router.push("/seller/login?error=auth_failed");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleEditToggle = () => {
    if (editMode) {
      // Reset values when canceling
      setEditValues(profile || {});
      setValidationErrors({});
    }
    setEditMode(!editMode);
  };

  const handleSaveAll = async () => {
    // Validate fields before saving
    if (!validateFields()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const token = sessionStorage.getItem("token");

      // Always send all editable fields including website
      const updatePayload: any = {
        fullName: editValues.fullName?.trim() || "",
        email: editValues.email?.trim() || "",
        companyName: editValues.companyName?.trim() || "",
        phoneNumber: editValues.phoneNumber?.trim() || "",
        website: editValues.website?.trim() || "",
        title: editValues.title?.trim() || "",
        preferences: {
          receiveDealEmails:
            editValues.preferences?.receiveDealEmails ??
            profile?.preferences?.receiveDealEmails ??
            true,
        },
      };

      const response = await fetch(buildApiUrl("/sellers/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditValues(updatedProfile);
      setEditMode(false);
      setValidationErrors({});

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const token = sessionStorage.getItem("token");

      // Send all editable fields + password including website
      const updatePayload: any = {
        fullName: editValues.fullName?.trim() || profile?.fullName || "",
        email: editValues.email?.trim() || profile?.email || "",
        companyName:
          editValues.companyName?.trim() || profile?.companyName || "",
        phoneNumber:
          editValues.phoneNumber?.trim() || profile?.phoneNumber || "",
        website: editValues.website?.trim() || profile?.website || "",
        title: editValues.title?.trim() || profile?.title || "",
        password: passwordData.newPassword,
      };

      const response = await fetch(buildApiUrl("/sellers/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to change password");
      }

      setIsPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
      toast({
        title: "Invalid file type",
        description: "Only image files (JPG, JPEG, PNG, GIF) are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should not exceed 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        const token = sessionStorage.getItem("token");
        // Get API URL from localStorage or use default
        const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app";

        // Send base64 image to backend
        const response = await fetch(`${apiUrl}/sellers/upload-profile-picture`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profilePicture: base64Image }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            router.push("/seller/login?session=expired");
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(`Failed to upload profile picture: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Update the seller profile with the new profile picture
        if (profile) {
          setProfile({
            ...profile,
            profilePicture: data.profilePicture || profile.profilePicture,
          });
          setEditValues({
            ...editValues,
            profilePicture: data.profilePicture || profile.profilePicture,
          });
        }

        toast({
          title: "Success",
          description: "Profile picture uploaded successfully",
        });

        // Refresh the profile data to get the updated profile picture
        fetchSellerProfile();
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload profile picture");
      toast({
        title: "Error",
        description: err.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Add a function to fetch just the seller profile
  const fetchSellerProfile = async () => {
    try {
      const data = await getSellerProfile();
      setProfile(data);
      setEditValues(data);
    } catch (err) {
      // Error fetching seller profile
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    logout(); // logout() from useAuth already handles redirect
  };

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col">
          <SellerNav activePage="view-profile" onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-3 sm:p-6 flex justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] flex flex-col h-full overflow-hidden">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex-1 overflow-y-auto pb-6">
                    <SellerNav activePage="view-profile" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-gray-800">Profile</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                {!editMode ? (
                  <Button
                    onClick={handleEditToggle}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Edit</span>
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button onClick={handleSaveAll} disabled={updating} size="sm" className="text-xs sm:text-sm">
                      {updating ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={updating}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {loading ? (
                  <>
                    <Skeleton className="hidden sm:block h-5 w-32" />
                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                  </>
                ) : (
                  <>
                    <div className="text-right hidden sm:block">
                      <div className="font-medium text-sm">
                        {profile?.fullName || "User"}
                      </div>
                    </div>
                    <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-white font-medium">
                      {profile?.profilePicture ? (
                        <img
                          src={
                            getProfilePictureUrl(profile.profilePicture) ||
                            undefined
                          }
                          alt={profile.fullName || "User"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <span>
                          {profile?.fullName ? profile.fullName.charAt(0) : "U"}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Profile content */}
          <div className="p-3 sm:p-6 md:p-8">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <Skeleton className="h-32 w-32 sm:h-40 sm:w-40 rounded-lg mx-auto sm:mx-0" />
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
                    <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 sm:h-5 w-40 sm:w-48" />
                      <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                  <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Skeleton className="h-4 sm:h-5 w-full" />
                    <Skeleton className="h-4 sm:h-5 w-full" />
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="text-center py-6 sm:py-8">
                  <div className="text-red-500 text-base sm:text-lg mb-2">
                    Error loading profile
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">{error}</p>
                  <Button
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Profile Picture */}
                  <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-lg bg-gray-200 overflow-hidden shrink-0 mx-auto sm:mx-0">
                    {profile?.profilePicture ? (
                      <img
                        src={
                          getProfilePictureUrl(profile.profilePicture) ||
                          "/placeholder.svg"
                        }
                        alt={profile?.fullName || "Profile"}
                        className="h-32 w-32 sm:h-40 sm:w-40 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <img
                        src="/placeholder.svg"
                        alt="Profile"
                        className="h-32 w-32 sm:h-40 sm:w-40 rounded-lg object-cover"
                      />
                    )}
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-2 right-2 bg-teal-500 hover:bg-teal-600 text-white p-1.5 sm:p-2 rounded-full shadow-md"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-3 text-gray-800 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium sm:w-24">Name:</span>
                      {editMode ? (
                        <div className="flex-1">
                          <Input
                            value={editValues.fullName || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                fullName: e.target.value,
                              }))
                            }
                            placeholder="Enter your full name"
                            className={
                              validationErrors.fullName ? "border-red-500" : ""
                            }
                          />
                          {validationErrors.fullName && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.fullName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>{profile?.fullName}</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium sm:w-24">Company:</span>
                      {editMode ? (
                        <div className="flex-1">
                          <Input
                            value={editValues.companyName || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                companyName: e.target.value,
                              }))
                            }
                            placeholder="Enter company name"
                            className={
                              validationErrors.companyName
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {validationErrors.companyName && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.companyName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>{profile?.companyName}</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium sm:w-24">Title:</span>
                      {editMode ? (
                        <div className="flex-1">
                          <Input
                            value={editValues.title || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Enter your title"
                            className={
                              validationErrors.title ? "border-red-500" : ""
                            }
                          />
                          {validationErrors.title && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.title}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>{profile?.title}</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium sm:w-24">Email:</span>
                      {editMode ? (
                        <div className="flex-1">
                          <Input
                            type="email"
                            value={editValues.email || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="Enter email"
                            className={
                              validationErrors.email ? "border-red-500" : ""
                            }
                          />
                          {validationErrors.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>
                          {profile?.email}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium sm:w-24">Phone:</span>
                      {editMode ? (
                        <div className="flex-1">
                          <Input
                            value={editValues.phoneNumber || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                phoneNumber: e.target.value,
                              }))
                            }
                            placeholder="Enter phone number"
                            className={
                              validationErrors.phoneNumber
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {validationErrors.phoneNumber && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.phoneNumber}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>{profile?.phoneNumber}</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium sm:w-24">Website:</span>
                      {editMode ? (
                        <div className="flex-1">
                          <Input
                            value={editValues.website || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                website: e.target.value,
                              }))
                            }
                            placeholder="Enter website (e.g., https://example.com)"
                            className={
                              validationErrors.website ? "border-red-500" : ""
                            }
                          />
                          {validationErrors.website && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.website}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>
                          {profile?.website ? (
                            <a
                              href={
                                profile.website.startsWith("http")
                                  ? profile.website
                                  : `https://${profile.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-800 underline"
                            >
                              {profile.website}
                            </a>
                          ) : (
                            <span className="text-gray-500"></span>
                          )}{" "}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <Label className="text-gray-700 text-sm flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              Receive Deal Emails
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                              Buyer interest and deal activity notifications.
                            </p>
                          </div>
                          {editMode ? (
                            <Switch
                              checked={
                                editValues.preferences?.receiveDealEmails ??
                                profile?.preferences?.receiveDealEmails ??
                                true
                              }
                              onCheckedChange={(checked) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  preferences: {
                                    ...(prev.preferences || {}),
                                    receiveDealEmails: checked,
                                  },
                                }))
                              }
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {(profile?.preferences?.receiveDealEmails ?? true)
                                ? "On"
                                : "Off"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Dialog
                        open={isPasswordDialogOpen}
                        onOpenChange={setIsPasswordDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={showPasswords.new ? "text" : "password"}
                                  value={passwordData.newPassword}
                                  onChange={(e) =>
                                    setPasswordData((prev) => ({
                                      ...prev,
                                      newPassword: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter new password (min 6 characters)"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                  onClick={() =>
                                    setShowPasswords((prev) => ({
                                      ...prev,
                                      new: !prev.new,
                                    }))
                                  }
                                >
                                  {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="confirmPassword">
                                Confirm New Password
                              </Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={
                                    showPasswords.confirm ? "text" : "password"
                                  }
                                  value={passwordData.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordData((prev) => ({
                                      ...prev,
                                      confirmPassword: e.target.value,
                                    }))
                                  }
                                  placeholder="Confirm new password"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                  onClick={() =>
                                    setShowPasswords((prev) => ({
                                      ...prev,
                                      confirm: !prev.confirm,
                                    }))
                                  }
                                >
                                  {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsPasswordDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={changePassword}
                                disabled={updating}
                              >
                                {updating ? "Changing..." : "Change Password"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </SellerProtectedRoute>
  );
}
