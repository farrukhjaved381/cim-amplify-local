"use client"

import { useAuth } from "@/contexts/auth-context"

export const SELLER_PERMISSIONS = [
  "dashboard",
  "create-deal",
  "edit-deal",
  "deal-history",
  "loi-deals",
  "view-profile",
  "emails",
] as const

export const BUYER_PERMISSIONS = [
  "dashboard",
  "marketplace",
  "company-profile",
  "emails",
] as const

export type SellerPermission = (typeof SELLER_PERMISSIONS)[number]
export type BuyerPermission = (typeof BUYER_PERMISSIONS)[number]

export function usePermissions() {
  const { permissions, isTeamMember, userRole, ownerId, ownerType } = useAuth()

  const hasPermission = (permission: string): boolean => {
    // Owners and admins have all permissions
    if (!isTeamMember) return true
    return permissions.includes(permission)
  }

  const hasAnyPermission = (...perms: string[]): boolean => {
    if (!isTeamMember) return true
    return perms.some((p) => permissions.includes(p))
  }

  const hasAllPermissions = (...perms: string[]): boolean => {
    if (!isTeamMember) return true
    return perms.every((p) => permissions.includes(p))
  }

  // Get the effective user ID for data queries
  // Members should use their owner's ID to access owner's data
  const getEffectiveUserId = (currentUserId: string | null): string | null => {
    if (isTeamMember && ownerId) return ownerId
    return currentUserId
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getEffectiveUserId,
    isTeamMember,
    permissions,
    userRole,
    ownerId,
    ownerType,
  }
}
