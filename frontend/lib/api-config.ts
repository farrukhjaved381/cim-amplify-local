const rawApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();

if (!rawApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required.");
}

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  deals: {
    byId: (dealId: string) => `/deals/${dealId}`,
    admin: "/deals/admin",
    adminStats: "/deals/admin/stats",
    myDeals: "/deals/my-deals",
    loiDeals: "/deals/loi-deals",
    completed: "/deals/completed",
    marketplace: "/deals/marketplace",
    requestAccess: (dealId: string) => `/deals/${dealId}/request-access`,
    statusSummary: (dealId: string) => `/deals/${dealId}/status-summary`,
    close: (dealId: string) => `/deals/${dealId}/close`,
  },
  buyers: {
    profile: "/buyers/profile",
    companyProfile: "/company-profiles/my-profile",
    publicById: (buyerId: string) => `/buyers/${buyerId}`,
    dealsPending: "/buyers/deals/pending",
    dealsActive: "/buyers/deals/active",
    dealsRejected: "/buyers/deals/rejected",
    activateDeal: (dealId: string) => `/buyers/deals/${dealId}/activate`,
    rejectDeal: (dealId: string) => `/buyers/deals/${dealId}/reject`,
    setPendingDeal: (dealId: string) => `/buyers/deals/${dealId}/set-pending`,
    uploadProfilePicture: "/buyers/upload-profile-picture",
  },
  sellers: {
    profile: "/sellers/profile",
    publicById: (sellerId: string) => `/sellers/public/${sellerId}`,
  },
  admin: {
    profile: "/admin/profile",
    sellers: "/admin/sellers",
  },
  team: {
    // Owner endpoints
    members: "/team/members",
    memberById: (id: string) => `/team/members/${id}`,
    resetMemberPassword: (id: string) => `/team/members/${id}/reset-password`,
    // Member self-service
    me: "/team/me",
    changePassword: "/team/me/change-password",
    uploadProfilePicture: "/team/me/upload-profile-picture",
    // Admin endpoints
    adminAll: "/team/admin/all",
    adminByOwner: (ownerId: string) => `/team/admin/by-owner/${ownerId}`,
    adminMembers: "/team/admin/members",
    adminMemberById: (id: string) => `/team/admin/members/${id}`,
  },
} as const;

export const buildApiUrl = (endpoint: string): string => `${API_BASE_URL}${endpoint}`;

