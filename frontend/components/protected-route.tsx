"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context";

// Get login page based on current path
const getLoginPageFromPath = (pathname: string): string => {
  if (pathname.startsWith("/seller")) return "/seller/login"
  if (pathname.startsWith("/admin")) return "/admin/login"
  if (pathname.startsWith("/buyer")) return "/buyer/login"
  return "/login"
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn && !hasRedirected) {
      setHasRedirected(true);
      const loginPage = getLoginPageFromPath(pathname);
      router.push(`${loginPage}?session=expired`);
    }
  }, [isLoading, isLoggedIn, router, pathname, hasRedirected]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#3aafa9] border-r-[#3aafa9] border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#344054]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
