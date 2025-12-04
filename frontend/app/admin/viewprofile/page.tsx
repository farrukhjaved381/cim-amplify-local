"use client"
 import { useEffect } from "react";
import React, { useState, useRef } from "react";
import {
     Users,
  Pencil,
  Handshake,
  History,
  LogOut,
  Eye,
  EyeOff,
  Camera,
  Loader2,
} from "lucide-react";

import {
  
  Building2,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  
  Clock,
 
  Plus,
  UserPlus,
  Shield,
  Database,
  Activity
} from "lucide-react";

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { Tag, ShoppingCart, Eye as EyeIcon } from "lucide-react";



const EDITABLE_FIELDS = [
  "fullName",
  "email",
  "companyName",
  "phoneNumber",
  "website",
  "title",
];

// Types for profile and editValues
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

export default function ViewProfilePage() {
const [profile, setProfile] = useState<AdminProfile | null>(null);
const [editValues, setEditValues] = useState<AdminProfile | null>(null);
const [loading, setLoading] = useState(true);

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
  const [validationErrors, setValidationErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const fileInputRef = useRef(null);
    const router = useRouter()
    const { logout } = useAuth()
   

// Utility to fetch admin profile
const fetchAdminProfile = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5001/admin/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    const data = await res.json();
    setProfile(data);
    setEditValues(data);
  } catch (error) {
    setProfile(null);
    setEditValues(null);
  } finally {
    setLoading(false);
  }
};

// useEffect to fetch profile on mount
useEffect(() => {
  fetchAdminProfile();
}, []);

  const showToast = (message: string, type: string = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
      setToastType("");
    }, 3000);
  };

  const validateWebsite = (url: string) => {
    if (!url.trim()) return true;
    try {
      const urlPattern = /^https?:\/\/.+/;
      return urlPattern.test(url.trim());
    } catch {
      return false;
    }
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};
    if (editValues && editValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValues.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    if (editValues && editValues.website && !validateWebsite(editValues.website)) {
      errors.website = "Website must be a valid URL (e.g., https://example.com)";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Removed unused handleEditToggle and editMode

  // Removed unused handleSaveAll

  

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
      showToast("Only image files (JPG, JPEG, PNG, GIF) are allowed.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size should not exceed 5MB.", "error");
      return;
    }

    setUploadingImage(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result;
        // Prevent uploading the same image
        if (profile?.profilePicture && profile.profilePicture === base64Image) {
          showToast("This image is already set as your profile picture.", "error");
          setUploadingImage(false);
          return;
        }
        // Send to backend
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5001/admin/profile", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profilePicture: base64Image }),
        });
        if (!res.ok) {
          showToast("Failed to update profile picture", "error");
          setUploadingImage(false);
          return;
        }
        // Always re-fetch profile after upload to get the latest image
        await fetchAdminProfile();
        setUploadingImage(false);
        showToast("Profile picture uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingImage(false);
      showToast("Failed to upload image", "error");
    }
  };

  const triggerFileInput = () => {
    (fileInputRef.current as HTMLInputElement | null)?.click();
  };

   const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

// Helper to get image src with cache busting only for real URLs
function getProfileImageSrc(src?: string | null) {
  if (!src) return undefined;
  if (src.startsWith('data:')) return src;
  return src + `?cb=${Date.now()}`;
}

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toastType === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}>
          {toastMessage}
        </div>
      )}

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
              <span>  Deals</span>
            </Button>
          </Link>
          <Link href="/admin/buyers">
            <Button variant="ghost" className="w-full justify-start gap-3 font-normal">
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
            className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
            onClick={() => router.push('/admin/viewprofile')}
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

      {/* Main content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h1 className="text-4xl font-semibold text-gray-800">Profile</h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {/* {!editMode ? (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveAll}
                    disabled={updating}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    disabled={updating}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )} */}

              <div className="text-right">
                <div className="font-medium">{profile?.fullName || "User"}</div>
              </div>
              <div className="relative h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-white font-medium">
                {profile?.profilePicture ? (
                  <img
                    src={getProfileImageSrc(profile.profilePicture)}
                    alt={profile.fullName || "User"}
                    className="h-full w-full object-cover"
                    key={profile.profilePicture}
                  />
                ) : (
                  <span>
                    {profile?.fullName ? profile.fullName.charAt(0) : "U"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Profile content */}
        <div className="p-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="relative h-40 w-40 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                {profile?.profilePicture ? (
                  <img
                    src={getProfileImageSrc(profile.profilePicture)}
                    alt={profile?.fullName || "Profile"}
                    className="h-40 w-40 rounded-lg object-cover"
                    key={profile.profilePicture}
                  />
                ) : (
                  <div className="h-40 w-40 rounded-lg bg-gray-300 flex items-center justify-center text-gray-500 text-4xl font-bold">
                    {profile?.fullName ? profile.fullName.charAt(0) : "U"}
                  </div>
                )}
                <button
                  onClick={triggerFileInput}
                  className="absolute bottom-2 right-2 bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-full shadow-md transition-colors"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
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
           <div className="flex-1 flex flex-col justify-center space-y-3 text-gray-800 text-sm">
             <div className="flex items-center gap-2">
    <span className="font-medium w-24">Name</span>
    <span>Admin</span>
  </div>
  
  
  <div className="flex items-center gap-2">
    <span className="font-medium w-24">Email:</span>
    <span>{profile?.email}</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="font-medium w-24">Role:</span>
    <span>{profile?.role}</span>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
}