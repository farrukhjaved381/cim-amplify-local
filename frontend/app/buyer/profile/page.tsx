"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { BuyerProtectedRoute } from "@/components/buyer/protected-route";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Settings,
  User,
  Camera,
  Mail,
  Phone,
  Globe,
  Building,
  Save,
  X,
  Edit2,
  Check,
  Loader2,
  Menu,
} from "lucide-react";
import { BuyerNav } from "@/components/buyer/buyer-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  useBuyerProfile,
  useUpdateBuyerProfile,
  useUploadProfilePicture,
} from "@/hooks/use-buyer-deals";

export default function BuyerProfilePage() {
  const router = useRouter();
  const { logout: authLogout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, error, refetch } = useBuyerProfile();
  const updateProfile = useUpdateBuyerProfile();
  const uploadPicture = useUploadProfilePicture();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    fullName: "",
    email: "",
    companyName: "",
    phoneNumber: "",
    website: "",
  });
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize edited profile when data loads
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        fullName: profile.fullName || "",
        email: profile.email || "",
        companyName: profile.companyName || "",
        phoneNumber: profile.phoneNumber || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  // Handle unauthorized
  useEffect(() => {
    if (error?.message === "UNAUTHORIZED") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/buyer/login?session=expired");
    }
  }, [error, router]);

  const getApiUrl = () => {
    return localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app";
  };

  const getProfilePictureUrl = (path: string | null) => {
    if (!path) return null;
    // If it's a base64 image, return as-is
    if (path.startsWith("data:image")) return path;
    // If it's already a full URL, return as-is
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const apiUrl = getApiUrl();
    const formattedPath = path.replace(/\\/g, "/");
    return `${apiUrl}/${formattedPath.startsWith("/") ? formattedPath.substring(1) : formattedPath}`;
  };

  const handleLogout = () => {
    authLogout();
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(editedProfile);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditedProfile({
        fullName: profile.fullName || "",
        email: profile.email || "",
        companyName: profile.companyName || "",
        phoneNumber: profile.phoneNumber || "",
        website: profile.website || "",
      });
    }
    setIsEditing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowImageDialog(true);
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) return;

    try {
      await uploadPicture.mutateAsync(selectedFile);
      toast({
        title: "Photo Updated",
        description: "Your profile picture has been updated.",
      });
      setShowImageDialog(false);
      setSelectedFile(null);
      setPreviewImage(null);
      refetch();
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload your profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#3AAFA9]" />
          <p className="text-gray-500">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <BuyerProtectedRoute>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
          {/* Left side: Hamburger + Logo (desktop) + Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button - on the LEFT */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                {/* Logo inside the sidebar */}
                <div className="mt-6 mb-6">
                  <Link href="https://cimamplify.com/" onClick={() => setMobileMenuOpen(false)}>
                    <Image src="/logo.svg" width={150} height={40} alt="CIM Amplify" className="h-10 w-auto" />
                  </Link>
                </div>
                <BuyerNav activePage="profile" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Logo - hidden on mobile, shown on desktop */}
            <Link href="https://cimamplify.com/" className="hidden md:flex items-center">
              <Image src="/logo.svg" width={150} height={40} alt="CIM Amplify" className="h-8 sm:h-10 w-auto" />
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Profile</h1>
          </div>

          {/* Right side: Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-medium text-sm sm:text-base">
                {profile?.fullName || "User"}
              </div>
            </div>
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {profile?.profilePicture ? (
                <img
                  src={getProfilePictureUrl(profile.profilePicture) || "/placeholder.svg"}
                  alt={profile.fullName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {profile?.fullName?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden md:block md:w-56 border-r border-gray-200 bg-white h-[calc(100vh-4rem)] sticky top-[4rem] overflow-y-auto flex-shrink-0">
          <BuyerNav activePage="profile" onLogout={handleLogout} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Profile Header */}
              <div className="relative h-32 bg-gradient-to-r from-[#3AAFA9] to-[#2d8f8a]">
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                      {profile?.profilePicture ? (
                        <img
                          src={getProfilePictureUrl(profile.profilePicture) || "/placeholder.svg"}
                          alt={profile.fullName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <User className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 p-2 bg-[#3AAFA9] rounded-full text-white hover:bg-[#2d8f8a] transition-colors shadow-md"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="pt-20 pb-6 px-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {profile?.fullName || "Your Name"}
                  </h2>
                  <p className="text-gray-500">{profile?.email}</p>
                </div>

                {/* Edit/Save Buttons */}
                <div className="flex justify-center mb-6">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex gap-3"
                      >
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={updateProfile.isPending}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updateProfile.isPending}
                          className="bg-[#3AAFA9] hover:bg-[#2d8f8a]"
                        >
                          {updateProfile.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {updateProfile.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedProfile.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile?.fullName || "-"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-600 text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedProfile.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile?.email || "-"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-600 text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedProfile.companyName}
                          onChange={(e) => handleInputChange("companyName", e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile?.companyName || "-"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-600 text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={editedProfile.phoneNumber}
                          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                          className="mt-1"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile?.phoneNumber || "-"}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-gray-600 text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      {isEditing ? (
                        <Input
                          type="url"
                          value={editedProfile.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          className="mt-1"
                          placeholder="https://example.com"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900 font-medium">
                          {profile?.website ? (
                            <a
                              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#3AAFA9] hover:underline"
                            >
                              {profile.website}
                            </a>
                          ) : (
                            "-"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-4">Quick Links</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      href="/buyer/company-profile"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-5 w-5 text-[#3AAFA9]" />
                      <div>
                        <p className="font-medium text-gray-900">Company Profile</p>
                        <p className="text-sm text-gray-500">Update your company details</p>
                      </div>
                    </Link>
                    <Link
                      href="/buyer/deals"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Briefcase className="h-5 w-5 text-[#3AAFA9]" />
                      <div>
                        <p className="font-medium text-gray-900">My Deals</p>
                        <p className="text-sm text-gray-500">View all your deals</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Profile Picture Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Preview your new profile picture before uploading.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {previewImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-[#3AAFA9]"
              >
                <img
                  src={previewImage}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowImageDialog(false);
                setSelectedFile(null);
                setPreviewImage(null);
              }}
              disabled={uploadPicture.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadPicture}
              disabled={uploadPicture.isPending}
              className="bg-[#3AAFA9] hover:bg-[#2d8f8a]"
            >
              {uploadPicture.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </BuyerProtectedRoute>
  );
}
