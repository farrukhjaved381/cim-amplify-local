"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Handshake,
  Tag,
  ShoppingCart,
  Eye,
  LogOut,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/dashboard", label: "Deals", icon: Handshake },
  { href: "/admin/buyers", label: "Buyers", icon: Tag },
  { href: "/admin/sellers", label: "Sellers", icon: ShoppingCart },
  { href: "/admin/viewprofile", label: "View Profile", icon: Eye },
];

export function AdminSidebar({ isMobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    window.location.href = "/admin/login";
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <div className={`flex flex-col h-full ${isMobile ? "p-6" : ""}`}>
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      )}

      <div className="mb-8">
        <Link href="/admin/overview" onClick={onClose} prefetch={true}>
          <Image
            src="/logo.svg"
            alt="CIM Amplify Logo"
            width={150}
            height={50}
            className="h-auto"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              prefetch={true}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 font-normal transition-colors ${
                  active
                    ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            onClose?.();
            handleLogout();
          }}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
      </nav>
    </div>
  );
}
