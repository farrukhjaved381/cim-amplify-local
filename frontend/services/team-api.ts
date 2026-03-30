import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from "@/lib/api-config"

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

// ─── Owner endpoints ────────────────────────────────

export async function getTeamMembers() {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.members), {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch team members")
  return res.json()
}

export async function getTeamMemberById(id: string) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.memberById(id)), {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch team member")
  return res.json()
}

export async function createTeamMember(data: {
  fullName: string
  email: string
  ownerType: "seller" | "buyer"
  permissions: string[]
  profilePicture?: string
  ownerId?: string
}) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.members), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to create team member")
  return res.json()
}

export async function updateTeamMember(
  id: string,
  data: {
    fullName?: string
    profilePicture?: string
    permissions?: string[]
    isActive?: boolean
  },
) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.memberById(id)), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update team member")
  return res.json()
}

export async function deleteTeamMember(id: string) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.memberById(id)), {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to delete team member")
  return res.json()
}

export async function resetTeamMemberPassword(id: string) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.resetMemberPassword(id)), {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to reset password")
  return res.json()
}

// ─── Member self-service ────────────────────────────

export async function getMyMemberProfile() {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.me), {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch profile")
  return res.json()
}

export async function updateMyMemberProfile(data: { fullName?: string; profilePicture?: string }) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.me), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update profile")
  return res.json()
}

export async function changeMemberPassword(data: { currentPassword?: string; newPassword: string }) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.changePassword), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to change password")
  return res.json()
}

export async function uploadMemberProfilePicture(file: File) {
  const token = sessionStorage.getItem("token")
  const formData = new FormData()
  formData.append("profilePicture", file)

  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.uploadProfilePicture), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to upload picture")
  return res.json()
}

// ─── Admin endpoints ────────────────────────────────

export async function adminGetAllMembers(page = 1, limit = 50) {
  const res = await fetch(
    buildApiUrl(`${API_ENDPOINTS.team.adminAll}?page=${page}&limit=${limit}`),
    { headers: getAuthHeaders() },
  )
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch all members")
  return res.json()
}

export async function adminGetMembersByOwner(ownerId: string) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.adminByOwner(ownerId)), {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch members")
  return res.json()
}

export async function adminCreateTeamMember(data: {
  fullName: string
  email: string
  ownerType: "seller" | "buyer"
  permissions: string[]
  ownerId: string
  profilePicture?: string
}) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.adminMembers), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to create team member")
  return res.json()
}

export async function adminUpdateTeamMember(
  id: string,
  data: {
    fullName?: string
    profilePicture?: string
    permissions?: string[]
    isActive?: boolean
  },
) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.adminMemberById(id)), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update team member")
  return res.json()
}

export async function adminDeleteTeamMember(id: string) {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.team.adminMemberById(id)), {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message || "Failed to delete team member")
  return res.json()
}
