import { API_ENDPOINTS, buildApiUrl } from "@/lib/api-config";

interface UpdateDealStatusParams {
  dealId: string
  status: "completed" | "off-market" | "active"
  finalSalePrice?: number
}

export async function updateDealStatus({ dealId, status, finalSalePrice }: UpdateDealStatusParams) {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("Authentication required")
  }

  const requestBody: any = { status }

  // If marking as completed and final sale price is provided, update financial details
  if (status === "completed" && finalSalePrice) {
    requestBody.financialDetails = {
      finalSalePrice,
    }
  }

  const response = await fetch(buildApiUrl(API_ENDPOINTS.deals.byId(dealId)), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Failed to update deal status")
  }

  return response.json()
}
