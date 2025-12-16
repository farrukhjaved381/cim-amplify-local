"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  Clock,
  LogOut,
  ArrowLeft,
  User,
  Users,
  Clock3,
  XCircle,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import SellerProtectedRoute from "@/components/seller/protected-route";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Country, State, City } from "country-state-city";

// Updated interfaces to match API structure
interface SellerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  profilePicture: string | null;
}

interface DealDocument {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface InvitationStatus {
  [buyerId: string]: {
    invitedAt: string;
    respondedAt?: string;
    response?: string;
    notes?: string;
    _id: string;
  };
}

interface Deal {
  _id: string;
  id?: string;
  title: string;
  companyDescription: string;
  dealType: string;
  status: string;
  visibility?: string;
  industrySector: string;
  geographySelection: string;
  employeeCount?: number;
  financialDetails: {
    trailingRevenueCurrency?: string;
    trailingRevenueAmount?: number;
    trailingEBITDACurrency?: string;
    trailingEBITDAAmount?: number;
    avgRevenueGrowth?: number;
    netIncome?: number;
    askingPrice?: number;
    finalSalePrice?: number;
  };
  businessModel: {
    recurringRevenue?: boolean;
    projectBased?: boolean;
    assetLight?: boolean;
    assetHeavy?: boolean;
  };

  buyerFit: {
    capitalAvailability?: string;
    minPriorAcquisitions?: number;
    minTransactionSize?: number;
  };
  targetedBuyers: string[];
  interestedBuyers: string[];
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  stakePercentage?: number;
  documents: DealDocument[];
  timeline: {
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    completedAt?: string;
  };
  invitationStatus?: InvitationStatus;
}

interface Buyer {
  _id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  companyName?: string; // (optional, for legacy)
  buyerCompany?: string; // <-- add this line
  companyProfileId?: string;
  website?: string;
  status: string;
  invitedAt: string;
  lastActivity?: string;
  decisionBy?: string;
  sellerApproved?: boolean;
}

interface CompanyProfile {
  _id: string;
  companyName: string;
  companyType: string;
  description?: string;
  website:string;
  capitalEntity?: string;
  dealsCompletedLast5Years: number;
  averageDealSize: number;
  preferences: {
    stopSendingDeals: boolean;
    dontShowMyDeals: boolean;
    dontSendDealsToMyCompetitors: boolean;
    allowBuyerLikeDeals: boolean;
  };
  targetCriteria: {
    countries: string[];
    industrySectors: string[];
    revenueMin?: number;
    revenueMax?: number;
    ebitdaMin?: number;
    ebitdaMax?: number;
    transactionSizeMin?: number;
    transactionSizeMax?: number;
    revenueGrowth?: number;
    minStakePercent?: number;
    minYearsInBusiness?: number;
    preferredBusinessModels: string[];
    description?: string;
  };
}

interface StatusSummary {
  deal: Deal;
  buyersByStatus: {
    active: Buyer[];
    pending: Buyer[];
    rejected: Buyer[];
  };
  summary: {
    totalTargeted: number;
    totalActive: number;
    totalPending: number;
    totalRejected: number;
  };
}

interface MatchedBuyer {
  _id: string;
  buyerId: string;
  buyerName: string;
  website:string;
  buyerEmail: string;
  companyName: string;
  companyType: string;
  description?: string;
  capitalEntity?: string;
  dealsCompletedLast5Years: number;
  averageDealSize: number;
  preferences: {
    stopSendingDeals: boolean;
    doNotSendMarketedDeals: boolean;
    allowBuyerLikeDeals: boolean;
  };
  targetCriteria: {
    countries: string[];
    industrySectors: string[];
    revenueMin?: number;
    revenueMax?: number;
    ebitdaMin?: number;
    ebitdaMax?: number;
    transactionSizeMin?: number;
    transactionSizeMax?: number;
    revenueGrowth?: number;
    minStakePercent?: number;
    minYearsInBusiness?: number;
    preferredBusinessModels: string[];
    description?: string;
  };
  totalMatchScore: number;
  matchPercentage: number;
  matchDetails: {
    industryMatch: boolean;
    geographyMatch: boolean;
    revenueMatch: boolean;
    ebitdaMatch: boolean;
    transactionSizeMatch: boolean;
    businessModelMatch: boolean;
    yearsMatch: boolean;
  };
}

interface GeographySelectorProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
}

const GeographySelector: React.FC<GeographySelectorProps> = ({
  selectedCountries,
  onChange,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<
    Record<string, boolean>
  >({});
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    {}
  );

  // Helper to get all state and city names for a country
  const getAllStateAndCityNames = (country: any) => {
    const states = State.getStatesOfCountry(country.isoCode);
    let allNames: string[] = [];
    states.forEach((state) => {
      allNames.push(`${country.name} > ${state.name}`);
      const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
      cities.forEach((city) => {
        allNames.push(`${country.name} > ${state.name} > ${city.name}`);
      });
    });
    return allNames;
  };
  


  // Handler for country checkbox
  const handleCountryToggle = (country: any) => {
    const countryName = country.name;
    const allChildren = getAllStateAndCityNames(country);
    const isSelected = selectedCountries.includes(countryName);

    let newSelected: string[];
    if (isSelected) {
      // Deselect country and all children
      newSelected = selectedCountries.filter(
        (item) => item !== countryName && !allChildren.includes(item)
      );
    } else {
      // Select country and all children
      newSelected = [
        ...selectedCountries.filter(
          (item) => item !== countryName && !allChildren.includes(item)
        ),
        countryName,
        ...allChildren,
      ];
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for state checkbox
  const handleStateToggle = (country: any, state: any) => {
    const stateName = `${country.name} > ${state.name}`;
    const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
    const allChildren = cities.map(
      (city) => `${country.name} > ${state.name} > ${city.name}`
    );
    const isSelected = selectedCountries.includes(stateName);

    let newSelected: string[];
    if (isSelected) {
      // Deselect state and all its cities
      newSelected = selectedCountries.filter(
        (item) => item !== stateName && !allChildren.includes(item)
      );
    } else {
      // Select state and all its cities
      newSelected = [
        ...selectedCountries.filter(
          (item) => item !== stateName && !allChildren.includes(item)
        ),
        stateName,
        ...allChildren,
      ];
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for city checkbox
  const handleCityToggle = (country: any, state: any, city: any) => {
    const cityName = `${country.name} > ${state.name} > ${city.name}`;
    const isSelected = selectedCountries.includes(cityName);
    let newSelected: string[];
    if (isSelected) {
      newSelected = selectedCountries.filter((item) => item !== cityName);
    } else {
      newSelected = [...selectedCountries, cityName];
    }
    onChange([...new Set(newSelected)]);
  };

  const allCountries = Country.getAllCountries();

  return (
    <div className="space-y-2 font-poppins">
      {allCountries.map((country) => (
        <div key={country.isoCode} className="border-b border-gray-100 pb-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`geo-${country.isoCode}`}
              checked={selectedCountries.includes(country.name)}
              onChange={() => handleCountryToggle(country)}
              className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
            />
            <div
              className="flex items-center cursor-pointer flex-1"
              onClick={() =>
                setExpandedCountries((prev) => ({
                  ...prev,
                  [country.isoCode]: !prev[country.isoCode],
                }))
              }
            >
              {expandedCountries[country.isoCode] ? (
                <span>▼</span>
              ) : (
                <span>▶</span>
              )}
              <label
                htmlFor={`geo-${country.isoCode}`}
                className="text-[#344054] cursor-pointer font-medium ml-1"
              >
                {country.name}
              </label>
            </div>
          </div>
          {expandedCountries[country.isoCode] && (
            <div className="ml-6 mt-1 space-y-1">
              {State.getStatesOfCountry(country.isoCode).map((state) => (
                <div key={state.isoCode} className="pl-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`geo-${country.isoCode}-${state.isoCode}`}
                      checked={selectedCountries.includes(
                        `${country.name} > ${state.name}`
                      )}
                      onChange={() => handleStateToggle(country, state)}
                      className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
                    />
                    <div
                      className="flex items-center cursor-pointer flex-1"
                      onClick={() =>
                        setExpandedStates((prev) => ({
                          ...prev,
                          [`${country.isoCode}-${state.isoCode}`]:
                            !prev[`${country.isoCode}-${state.isoCode}`],
                        }))
                      }
                    >
                      {expandedStates[`${country.isoCode}-${state.isoCode}`] ? (
                        <span>▼</span>
                      ) : (
                        <span>▶</span>
                      )}
                      <label
                        htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                        className="text-[#344054] cursor-pointer ml-1"
                      >
                        {state.name}
                      </label>
                    </div>
                  </div>
                  {expandedStates[`${country.isoCode}-${state.isoCode}`] && (
                    <div className="ml-6 mt-1 space-y-1">
                      {City.getCitiesOfState(
                        country.isoCode,
                        state.isoCode
                      ).map((city, cityIndex) => (
                        <div
                          key={`city-${city.name}-${cityIndex}`}
                          className="pl-4"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`geo-${country.isoCode}-${state.isoCode}-${city.name}`}
                              checked={selectedCountries.includes(
                                `${country.name} > ${state.name} > ${city.name}`
                              )}
                              onChange={() =>
                                handleCityToggle(country, state, city)
                              }
                              className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
                            />
                            <label
                              htmlFor={`geo-${country.isoCode}-${state.isoCode}-${city.name}`}
                              className="text-[#344054] cursor-pointer"
                            >
                              {city.name}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function DealDetailsPage() {
  const [showAllIndustries, setShowAllIndustries] = useState(false);
const [showAllCountries, setShowAllCountries] = useState(false);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null
  );
  const [matchedBuyers, setMatchedBuyers] = useState<MatchedBuyer[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [rowActionLoading, setRowActionLoading] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedCompanyProfile, setSelectedCompanyProfile] =
    useState<CompanyProfile | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loadingCompanyProfile, setLoadingCompanyProfile] = useState(false);
  const [showBuyersForNewDeal, setShowBuyersForNewDeal] = useState(false);
  const [hasFetchedBuyers, setHasFetchedBuyers] = useState(false);
  const [selectAllDropdownOpen, setSelectAllDropdownOpen] = useState(false);
  const [confirmDenyBuyer, setConfirmDenyBuyer] = useState<Buyer | null>(null);
  const [confirmDenyLoading, setConfirmDenyLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const dealId = searchParams.get("id");

  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl =
          localStorage.getItem("apiUrl") || "http://localhost:5001";
        const response = await fetch(`${apiUrl}/sellers/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSellerProfile(data);
          setUserProfile({
            fullName: data.fullName,
            location: data.companyName,
            phone: data.email,
            profilePicture: data.profilePicture,
          });
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error);
      }
    };
    fetchSellerProfile();
  }, []);

  // Fetch deal details
  useEffect(() => {
    if (!dealId) {
      router.push("/seller/dashboard");
      return;
    }
    const fetchDealDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const apiUrl =
          localStorage.getItem("apiUrl") || "http://localhost:5001";
        if (!token) {
          router.push("/seller/login?error=no_token");
          return;
        }
        const response = await fetch(`${apiUrl}/deals/${dealId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setDeal(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching deal details:", err);
        setError(err.message || "Failed to load deal details");
        if (
          err.message.includes("Authentication") ||
          err.message.includes("Forbidden")
        ) {
          router.push("/seller/login?error=auth_failed");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDealDetails();
  }, [dealId, router]);

  // Fetch company profile
  const fetchCompanyProfile = async (companyProfileId: string) => {
    try {
      setLoadingCompanyProfile(true);
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/company-profiles/public/${companyProfileId}`
      );

      if (response.ok) {
        const companyData = await response.json();
        setSelectedCompanyProfile(companyData);
      } else {
        console.error("Failed to fetch company profile:", response.status);
        setSelectedCompanyProfile(null);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      setSelectedCompanyProfile(null);
    } finally {
      setLoadingCompanyProfile(false);
    }
  };

  // Fetch status summary
  const fetchStatusSummary = async () => {
    try {
      setLoadingBuyers(true);
      const token = localStorage.getItem("token");
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/deals/${dealId}/status-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const processedBuyers: Buyer[] = [];
        if (data.deal?.invitationStatus) {
          const buyerIds = Object.keys(data.deal.invitationStatus);
          const buyerDetailsPromises = buyerIds.map(async (buyerId) => {
            try {
              const buyerResponse = await fetch(`${apiUrl}/buyers/${buyerId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });
              if (buyerResponse.ok) {
                const buyerInfo = await buyerResponse.json();
                return buyerInfo;
              } else {
                console.error(
                  `Failed to fetch buyer ${buyerId}:`,
                  buyerResponse.status
                );
                return null;
              }
            } catch (error) {
              console.error(`Error fetching buyer ${buyerId}:`, error);
              return null;
            }
          });
          const buyerDetails = await Promise.all(buyerDetailsPromises);

          // Fetch all company profiles once
          const companyProfilesResponse = await fetch(`${apiUrl}/company-profiles/public`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          let allCompanyProfiles: CompanyProfile[] = [];
          if (companyProfilesResponse.ok) {
            allCompanyProfiles = await companyProfilesResponse.json();
          } else {
            console.error("Failed to fetch all company profiles:", companyProfilesResponse.status);
          }

          for (let i = 0; i < buyerIds.length; i++) {
            const buyerId = buyerIds[i];
            const invitation = data.deal.invitationStatus[buyerId];
            const buyerInfo = buyerDetails[i];
            
            // Ensure companyProfileId is a string before using it to find the company profile
            const companyProfileIdString = buyerInfo?.companyProfileId ? (typeof buyerInfo.companyProfileId === 'object' ? (buyerInfo.companyProfileId as any)._id.toString() : buyerInfo.companyProfileId) : undefined;

            const companyProfile = allCompanyProfiles.find(cp => cp._id === companyProfileIdString);

            processedBuyers.push({
              _id: buyerId,
              buyerId: buyerId,
              buyerName:
                buyerInfo?.fullName ||
                buyerInfo?.name ||
                `Buyer ${buyerId.slice(-4)}`,
              buyerEmail: buyerInfo?.email || "Email not available",
              companyName:
                companyProfile?.companyName ||
                buyerInfo?.companyName ||
                buyerInfo?.company ||
                "Company not available",
              buyerCompany:
                companyProfile?.companyName ||
                buyerInfo?.companyName ||
                buyerInfo?.company,
              companyProfileId: companyProfileIdString,
              website: companyProfile?.website || "Unknown", // Add website here
              status: invitation?.response || "pending",
              invitedAt: invitation?.invitedAt,
              lastActivity: invitation?.respondedAt,
              decisionBy: invitation?.decisionBy,
              sellerApproved: invitation?.response === 'pending' && invitation?.decisionBy === 'seller',
            });
          }
        }
        const categorizedBuyers = {
          active: processedBuyers.filter(
            (buyer) =>
              buyer.status === "accepted" || buyer.status === "interested" || buyer.sellerApproved
          ),
          pending: processedBuyers.filter(
            (buyer) => buyer.status === "requested" || (buyer.status === "pending" && !buyer.sellerApproved) || !buyer.status
          ),
          rejected: processedBuyers.filter(
            (buyer) =>
              buyer.status === "rejected" || buyer.status === "declined"
          ),
        };
        const updatedData = {
          ...data,
          buyersByStatus: categorizedBuyers,
          summary: {
            totalTargeted: processedBuyers.length,
            totalActive: categorizedBuyers.active.length,
            totalPending: categorizedBuyers.pending.length,
            totalRejected: categorizedBuyers.rejected.length,
          },
        };
        setStatusSummary(updatedData);
      } else {
        console.error("Failed to fetch status summary:", response.status);
      }
    } catch (error) {
      console.error("Error fetching status summary:", error);
    } finally {
      setLoadingBuyers(false);
    }
  };

  useEffect(() => {
    if (!dealId) return;
    fetchStatusSummary();
  }, [dealId]);

  // Check for newly created deal and fetch matching buyers
  useEffect(() => {
    const isNewDeal = searchParams.get("newDeal");
    if (isNewDeal === "true" && deal) {
      setLoadingBuyers(true);
      setShowBuyersForNewDeal(true);
      const fetchMatchingBuyers = async () => {
        try {
          const token = localStorage.getItem("token");
          const apiUrl =
            localStorage.getItem("apiUrl") || "http://localhost:5001";
          const response = await fetch(
            `${apiUrl}/deals/${dealId}/matching-buyers`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            const buyers = await response.json();
            setMatchedBuyers(buyers);
          } else {
            setMatchedBuyers([]);
          }
        } catch (error) {
          console.error("Error fetching matching buyers:", error);
          setMatchedBuyers([]);
        } finally {
          setLoadingBuyers(false);
          setHasFetchedBuyers(true);
        }
      };
      fetchMatchingBuyers();
    }
  }, [deal, dealId, searchParams]);

  const handleLogout = () => {
    logout();
    router.push("/seller/login");
  };

  const industries = selectedCompanyProfile?.targetCriteria?.industrySectors || [];
  const countries = selectedCompanyProfile?.targetCriteria?.countries || [];
  
  const visibleIndustries = showAllIndustries ? industries : industries.slice(0, 5);
  const visibleCountries = showAllCountries ? countries : countries.slice(0, 5);
  

  // Helper functions
  const handleBuyerClick = async (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setIsPopupOpen(true);

    // Fetch company profile if companyProfileId exists
    if (buyer.companyProfileId) {
      const companyProfileIdString = typeof buyer.companyProfileId === 'object' && buyer.companyProfileId !== null
        ? (buyer.companyProfileId as any)._id.toString()
        : buyer.companyProfileId;
      await fetchCompanyProfile(companyProfileIdString);
    } else if (buyer.website) {
      setSelectedCompanyProfile({ ...selectedCompanyProfile, website: buyer.website } as CompanyProfile);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedBuyer(null);
    setSelectedCompanyProfile(null);
  };

  const getProfilePictureUrl = (path: string | null) => {
    if (!path) return null;
    const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";
    const formattedPath = path.replace(/\\/g, "/");
    return `${apiUrl}/${
      formattedPath.startsWith("/") ? formattedPath.slice(1) : formattedPath
    }`;
  };

  const formatCurrency = (amount = 0, currency = "USD($)"): string => {
    const currencySymbol = currency.includes("USD")
      ? "$"
      : currency.includes("EUR")
      ? "€"
      : currency.includes("GBP")
      ? "£"
      : "$";
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string): string => {
    if (!status) {
      return "bg-gray-100 text-gray-700";
    }
    switch (status.toLowerCase()) {
      case "active":
      case "accepted":
      case "interested":
      case "request accepted":
        return "bg-green-100 text-green-700";
      case "requested":
      case "pending":
      case "invited":
      case "viewed":
      case "request pending":
        return "bg-blue-100 text-blue-700";
      case "rejected":
      case "passed":
      case "request denied":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const toggleBuyerSelection = (buyerId: string) => {
    setSelectedBuyers((prev) => {
      const newSelection = prev.includes(buyerId)
        ? prev.filter((id) => id !== buyerId)
        : [...prev, buyerId];
      return newSelection;
    });
  };

  const selectAllBuyers = () => {
    const allBuyerIds = matchedBuyers.map((buyer) => buyer._id);
    setSelectedBuyers(allBuyerIds);
    setSelectAllDropdownOpen(false);
  };

  const deselectAllBuyers = () => {
    setSelectedBuyers([]);
    setSelectAllDropdownOpen(false);
  };

  const handleSendInvite = async (buyerIds?: string[]) => {
    const targetBuyers = buyerIds || selectedBuyers;
    if (targetBuyers.length === 0) {
      toast({
        title: "No buyers selected",
        description: "Please select at least one buyer to send an invite",
        variant: "destructive",
      });
      return;
    }
    if (!dealId) {
      toast({
        title: "No deal available",
        description: "No deal ID found to send invites for.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSending(true);
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in again",
          variant: "destructive",
        });
        router.push("/seller/login");
        return;
      }
      const actualBuyerIds = targetBuyers
        .map((selectedProfileId) => {
          const buyerProfile = matchedBuyers.find(
            (b) => b._id === selectedProfileId
          );
          if (!buyerProfile || !buyerProfile.buyerId) {
            return null;
          }
          return buyerProfile.buyerId;
        })
        .filter(Boolean);
      if (actualBuyerIds.length === 0) {
        toast({
          title: "Error",
          description: "No valid buyer IDs found. Please try again.",
          variant: "destructive",
        });
        return;
      }
      const requestBody = { buyerIds: actualBuyerIds };
      const response = await fetch(`${apiUrl}/deals/${dealId}/target-buyers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(
          errorData.message ||
            `API Error: ${response.status} ${response.statusText}`
        );
      }
      const result = await response.json();
      toast({
        title: "Invites sent successfully",
        description: `Sent invites to ${actualBuyerIds.length} buyer(s)`,
      });
      setShowBuyersForNewDeal(false);
      setSelectedBuyers([]);
      fetchStatusSummary();
      // Always re-fetch matching buyers after sending invites
      await handleInviteBuyersClick();
    } catch (error: any) {
      console.error("Error sending invites:", error);
      toast({
        title: "Error sending invites",
        description:
          error.message || "Failed to send invites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleInviteBuyersClick = async () => {
    setLoadingBuyers(true);
    setShowBuyersForNewDeal(true);
    const fetchMatchingBuyers = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl =
          localStorage.getItem("apiUrl") || "http://localhost:5001";
        const response = await fetch(
          `${apiUrl}/deals/${dealId}/matching-buyers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const buyers = await response.json();
          setMatchedBuyers(buyers);
        } else {
          setMatchedBuyers([]);
        }
      } catch (error) {
        console.error("Error fetching matching buyers:", error);
        setMatchedBuyers([]);
      } finally {
        setLoadingBuyers(false);
        setHasFetchedBuyers(true);
      }
    };
    await fetchMatchingBuyers();
  };

  const approveBuyerToPending = async (buyerId: string) => {
    try {
      setRowActionLoading((p) => ({ ...p, [buyerId]: true }));
      const token = localStorage.getItem('token');
      const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/deals/${dealId}/approve-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerId }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchStatusSummary();
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setRowActionLoading((p) => ({ ...p, [buyerId]: false }));
    }
  };

  const denyBuyer = async (buyerId: string) => {
    try {
      setConfirmDenyLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/deals/${dealId}/deny-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ buyerId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Access denied', description: 'Buyer has been notified.' });
      setConfirmDenyBuyer(null);
      await fetchStatusSummary();
    } catch (err: any) {
      toast({ title: 'Denial failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setConfirmDenyLoading(false);
    }
  };

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
          <div className="mb-8">
            <Link href="/seller/dashboard">
              <Image
                src="/logo.svg"
                alt="CIM Amplify Logo"
                width={150}
                height={50}
                className="h-auto"
              />
            </Link>
          </div>
          <nav className="flex-1 space-y-6">
            <Button
              variant="secondary"
              className="w-full justify-start gap-3 font-normal bg-teal-100 text-teal-700 hover:bg-teal-200"
              onClick={() => router.push("/seller/dashboard")}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.5 6L12 1.5L7.5 6M3.75 8.25H20.25M5.25 8.25V19.5C5.25 19.9142 5.58579 20.25 6 20.25H18C18.4142 20.25 18.75 19.9142 18.75 19.5V8.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Deals</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal"
              onClick={() => router.push("/seller/view-profile")}
            >
              <Eye className="h-5 w-5" />
              <span>View Profile</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal"
              onClick={() => router.push("/seller/history")}
            >
              <Clock className="h-5 w-5" />
              <span>Off Market</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 font-normal text-red-600 hover:text-red-700 hover:bg-red-50 mt-auto"
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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-4"
                onClick={() => router.push("/seller/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">
                {showBuyersForNewDeal
                  ? "Choose Buyers"
                  : "Buyer Status Summary"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium">
                  {userProfile?.fullName || sellerProfile?.fullName || "User"}
                </div>
              </div>
              <div className="relative h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium overflow-hidden">
                {sellerProfile?.profilePicture ? (
                  <img
                    src={
                      getProfilePictureUrl(sellerProfile.profilePicture) ||
                      "/placeholder.svg"
                    }
                    alt={sellerProfile.fullName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/placeholder.svg";
                    }}
                  />
                ) : (
                  (sellerProfile?.fullName || "U").charAt(0)
                )}
              </div>
            </div>
          </header>

          {/* Matched Buyers Section - Show only for new deals */}
          {showBuyersForNewDeal && (
            <div className="p-6">
              {loadingBuyers ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3aafa9] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading matching buyers...</p>
                  </div>
                </div>
              ) : matchedBuyers.length > 0 ? (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex justify-between items-center mb-6 space-x-4">
                    <h2 className="text-lg font-medium">
                      Your deal has been matched to the following buyers. Please
                      pick the buyers you wish to engage
                    </h2>
                    <div className="flex items-center space-x-4">
                      <div className="space-x-4 flex">
                        <Button
                          variant="default"
                          className="bg-teal-500 hover:bg-teal-600"
                          onClick={() => handleSendInvite()}
                          disabled={selectedBuyers.length === 0 || sending}
                        >
                          {sending
                            ? "Sending..."
                            : `Send Invite${
                                selectedBuyers.length > 1 ? "s" : ""
                              }`}
                          {selectedBuyers.length > 0 &&
                            ` (${selectedBuyers.length})`}
                        </Button>
                        <div className="relative">
                          <Button
                            variant="outline"
                            className="flex items-center bg-transparent"
                            onClick={() =>
                              setSelectAllDropdownOpen(!selectAllDropdownOpen)
                            }
                          >
                            Select All{" "}
                            <svg
                              className="ml-2 h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </Button>
                          {selectAllDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <div className="py-1">
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={selectAllBuyers}
                                >
                                  Select All
                                </button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={deselectAllBuyers}
                                >
                                  Deselect All
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matchedBuyers.map((buyer) => (
                      <div
                        key={buyer._id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="p-4 flex items-start">
                          <Checkbox
                            id={`buyer-${buyer._id}`}
                            checked={selectedBuyers.includes(buyer._id)}
                            onCheckedChange={() =>
                              toggleBuyerSelection(buyer._id)
                            }
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-medium text-teal-500">
                                {buyer.companyName || "Anonymous"}
                              </h3>
                            </div>
                            <div className="mb-6">
                              <h4 className="font-medium mb-2">Overview</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">Name: </span>
                                  {buyer.buyerName || "Unknown"}
                                </div>
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                  {buyer.buyerEmail || "Not provided"}
                                </div>
                                <div>
                                  <span className="text-gray-500">Website: </span>
                                  {buyer.website || "Unknown"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Company Type:{" "}
                                  </span>
                                  {buyer.companyType || "N/A"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Deals Completed (5 years):{" "}
                                  </span>
                                  {buyer.dealsCompletedLast5Years !==
                                    undefined &&
                                  buyer.dealsCompletedLast5Years !== null
                                    ? buyer.dealsCompletedLast5Years
                                    : "N/A"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Avg Transaction Value:{" "}
                                  </span>
                                  {buyer.averageDealSize !== undefined &&
                                  buyer.averageDealSize !== null
                                    ? `$${buyer.averageDealSize.toLocaleString()}`
                                    : "$N/A"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Capital Availability:{" "}
                                  </span>
                                  {buyer.capitalEntity || "N/A"}
                                </div>
                              </div>
                            </div>
                            <div className="mb-6">
                              <h4 className="font-medium mb-2">
                                Target Criteria
                              </h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">
                                    Revenue Range:{" "}
                                  </span>
                                  $
                                  {buyer.targetCriteria?.revenueMin?.toLocaleString() ??
                                    "N/A"}{" "}
                                  - $
                                  {buyer.targetCriteria?.revenueMax?.toLocaleString() ??
                                    "N/A"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    EBITDA Range:{" "}
                                  </span>
                                  $
                                  {buyer.targetCriteria?.ebitdaMin?.toLocaleString() ??
                                    "N/A"}{" "}
                                  - $
                                  {buyer.targetCriteria?.ebitdaMax?.toLocaleString() ??
                                    "N/A"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Transaction Size:{" "}
                                  </span>
                                  $
                                  {buyer.targetCriteria?.transactionSizeMin?.toLocaleString() ??
                                    "N/A"}{" "}
                                  - $
                                  {buyer.targetCriteria?.transactionSizeMax?.toLocaleString() ??
                                    "N/A"}
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Minimum Years in Business:{" "}
                                  </span>
                                  {buyer.targetCriteria?.minYearsInBusiness ??
                                    "N/A"}
                                </div>

                                <div>
                                  <span className="text-gray-500">
                                    Minimum 5-Years Avg Revenue Growth:{" "}
                                  </span>
                                  {buyer.targetCriteria?.revenueGrowth !==
                                    undefined &&
                                  buyer.targetCriteria?.revenueGrowth !== null
                                    ? `${buyer.targetCriteria.revenueGrowth}%`
                                    : "N/A"}
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">
                                    Preferred Business Models:{" "}
                                  </span>
                                  {buyer.targetCriteria?.preferredBusinessModels
                                    ?.length
                                    ? buyer.targetCriteria.preferredBusinessModels.join(
                                        ", "
                                      )
                                    : "Not specified"}
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">
                                    Description of ideal targets:{" "}
                                  </span>
                                  {buyer.targetCriteria?.description ||
                                    "Not provided"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !loadingBuyers && hasFetchedBuyers && matchedBuyers.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600 mb-6">
                  No buyers are matched for this deal
                </div>
              ) : null}
            </div>
          )}

          {/* Deal Details Content */}
          <div className="p-6">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-6">
                <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-red-500 text-lg mb-2">
                  Error loading deal details
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => router.push("/seller/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            ) : deal ? (
              <div>
                {/* Buyer Status Summary */}
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg text-[#0D9488] font-medium">
                      {deal.title}
                    </h3>
                  </div>
                  <div className="p-6">
                    {loadingBuyers ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3aafa9] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading buyer status...</p>
                      </div>
                    ) : statusSummary ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-500 text-sm">
                                Total Targeted
                              </span>
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="text-2xl font-semibold">
                              {statusSummary.summary.totalTargeted}
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-green-600 text-sm">
                                Active
                              </span>
                              <Users className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="text-2xl font-semibold">
                              {statusSummary.summary.totalActive}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-600 text-sm">
                                Pending
                              </span>
                              <Clock3 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="text-2xl font-semibold">
                              {statusSummary.summary.totalPending}
                            </div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-red-600 text-sm">
                                Rejected
                              </span>
                              <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="text-2xl font-semibold">
                              {statusSummary.summary.totalRejected}
                            </div>
                          </div>
                        </div>

{/* Active Buyers */}  
{statusSummary.buyersByStatus.active.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-md font-medium mb-3 text-green-700">Active Buyers</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full table-fixed">
                                <colgroup>
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                </colgroup>
                                <thead>
                                  <tr className="text-left border-b border-gray-200">
                                    <th className="pb-3 font-medium text-gray-600">Buyer</th>
                                    <th className="pb-3 font-medium text-gray-600">Company</th>
                                    <th className="pb-3 font-medium text-gray-600">Status</th>
                                    <th className="pb-3 font-medium text-gray-600">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {statusSummary.buyersByStatus.active.map((buyer) => (
                                    <tr key={buyer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                      <td className="py-4 pr-4">
                                        <div className="flex items-center">
                                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3 flex-shrink-0">
                                            {buyer.buyerName &&
                                            buyer.buyerName !== `Buyer ${buyer.buyerId.slice(-4)}` ? (
                                              buyer.buyerName.charAt(0).toUpperCase()
                                            ) : (
                                              <User className="h-5 w-5" />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium truncate cursor-pointer" onClick={() => handleBuyerClick(buyer)}>{buyer.buyerName}</p>
                                            <p className="text-sm text-gray-500 truncate">{buyer.buyerEmail}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 pr-4">
                                        <span
                                          className={`truncate block ${
                                            buyer.companyName === "Company not available" ? "text-gray-500 text-sm" : ""
                                          }`}
                                        >
                                          {buyer.companyName}
                                        </span>
                                      </td>
                                      <td className="py-4 pr-4">
                                        {(() => {
                                          const isMarketplace = !!statusSummary?.deal?.isPublic;
                                          const displayStatus = isMarketplace && buyer.sellerApproved
                                            ? 'request accepted'
                                            : (buyer.status || 'pending');
                                          return (
                                            <span
                                              className={`px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap ${getStatusColor(displayStatus)}`}
                                            >
                                              {displayStatus}
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-4 text-sm whitespace-nowrap">{formatDate(buyer.invitedAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Pending Buyers */}
                        {statusSummary.buyersByStatus.pending.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-md font-medium mb-3 text-blue-700">Pending Buyers</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full table-fixed">
                                <colgroup>
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                </colgroup>
                                <thead>
                                  <tr className="text-left border-b border-gray-200">
                                    <th className="pb-3 font-medium text-gray-600">Buyer</th>
                                    <th className="pb-3 font-medium text-gray-600">Company</th>
                                    <th className="pb-3 font-medium text-gray-600">Status</th>
                                    <th className="pb-3 font-medium text-gray-600">Date</th>
                                    <th className="pb-3 font-medium text-gray-600">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {statusSummary.buyersByStatus.pending.map((buyer) => (
                                    <tr
                                      key={buyer._id}
                                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                      <td className="py-4 pr-4 cursor-pointer" onClick={() => handleBuyerClick(buyer)}>
                                        <div className="flex items-center">
                                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3 flex-shrink-0">
                                            {buyer.buyerName &&
                                            buyer.buyerName !== `Buyer ${buyer.buyerId.slice(-4)}` ? (
                                              buyer.buyerName.charAt(0).toUpperCase()
                                            ) : (
                                              <User className="h-5 w-5" />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium truncate">{buyer.buyerName}</p>
                                            <p className="text-sm text-gray-500 truncate">{buyer.buyerEmail}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 pr-4 cursor-pointer" onClick={() => handleBuyerClick(buyer)}>
                                        <span
                                          className={`truncate block ${
                                            buyer.companyName === "Company not available" ? "text-gray-500 text-sm" : ""
                                          }`}
                                        >
                                          {buyer.companyName}
                                        </span>
                                      </td>
                                      <td className="py-4 pr-4">
                                        {(() => {
                                          const isMarketplace = !!statusSummary?.deal?.isPublic;
                                          const label = isMarketplace && buyer.status === 'requested' ? 'request pending' : (buyer.status || 'pending');
                                          return (
                                            <span
                                              className={`px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap ${getStatusColor(label)}`}
                                            >
                                              {label}
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-4 text-sm whitespace-nowrap">{formatDate(buyer.invitedAt)}</td>
                                      <td className="py-4 pr-4 flex items-center gap-2">
                                        {statusSummary?.deal?.isPublic && buyer.status === 'requested' ? (
                                          <>
                                            <Button
                                              className="bg-teal-500 hover:bg-teal-600"
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                const id = buyer.buyerId || buyer._id;
                                                await approveBuyerToPending(id);
                                              }}
                                              disabled={!!rowActionLoading[buyer.buyerId || buyer._id]}
                                            >
                                              {rowActionLoading[buyer.buyerId || buyer._id] ? (
                                                <span className="inline-flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-1" />Approving…</span>
                                              ) : (
                                                'Approve Access'
                                              )}
                                            </Button>
                                            <Button
                                              variant="outline"
                                              className="border-red-200 text-red-600 hover:bg-red-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDenyBuyer(buyer);
                                              }}
                                            >
                                              Deny
                                            </Button>
                                          </>
                                        ) : (
                                          <span className="text-gray-400 text-sm">n/a</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Buyer Details Popup */}
                        {isPopupOpen && selectedBuyer && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">
                                  Buyer Details
                                </h2>
                                <button
                                  onClick={closePopup}
                                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                              <div className="p-6">
                                {loadingCompanyProfile ? (
                                  <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3aafa9] mx-auto mb-4"></div>
                                    <p className="text-gray-600">
                                      Loading company profile...
                                    </p>
                                  </div>
                                ) : (
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="p-6">
                                      <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-2xl font-medium text-teal-500">
                                          {selectedCompanyProfile?.companyName ||
                                            selectedBuyer.companyName ||
                                            "Anonymous"}
                                        </h3>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Basic Information */}
                                        <div className="mb-6">
                                          <h4 className="text-lg font-medium mb-4 text-gray-800">
                                            Basic Information
                                          </h4>
                                          <div className="space-y-3 text-sm">
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Contact Name:{" "}
                                              </span>
                                              <span className="text-gray-900">
                                                {selectedBuyer.buyerName ||
                                                  "Unknown"}
                                              </span>
                                            </div>
                                            
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Email:{" "}
                                              </span>
                                              <span className="text-gray-900">
                                                {selectedBuyer.buyerEmail ||
                                                  "Not provided"}
                                              </span>
                                            </div>
                                            {selectedCompanyProfile?.website && (
                                              <div>
                                                <span className="text-gray-500 font-medium">
                                                  Website:{" "}
                                                </span>
                                                <span className="text-gray-900">
                                                  <a href={selectedCompanyProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {selectedCompanyProfile.website}
                                                  </a>
                                                </span>
                                              </div>
                                            )}
                                            {selectedCompanyProfile?.description && (
                                              <div>
                                                <span className="text-gray-500 font-medium">
                                                  Company Description:{" "}
                                                </span>
                                                <span className="text-gray-900">
                                                  {
                                                    selectedCompanyProfile.description
                                                  }
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Deal Experience */}
                                        <div className="mb-6">
                                          <h4 className="text-lg font-medium mb-4 text-gray-800">
                                            Deal Experience
                                          </h4>
                                          <div className="space-y-3 text-sm">
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Deals Completed (Last 5 years):{" "}
                                              </span>
                                              <span className="text-gray-900 font-semibold">
                                                {selectedCompanyProfile?.dealsCompletedLast5Years?.toLocaleString() ||
                                                  "Not provided"}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Average Deal Size:{" "}
                                              </span>
                                              <span className="text-gray-900 font-semibold">
                                                $
                                                {selectedCompanyProfile?.averageDealSize?.toLocaleString() ||
                                                  "Not provided"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Target Criteria */}
                                      {selectedCompanyProfile?.targetCriteria && (
                                        <div className="mb-6 border-t pt-6">
                                          <h4 className="text-lg font-medium mb-4 text-gray-800">
                                            Target Investment Criteria
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Revenue Range:{" "}
                                              </span>
                                              <div className="text-gray-900 font-semibold">
                                                $
                                                {selectedCompanyProfile.targetCriteria.revenueMin?.toLocaleString() ||
                                                  0}{" "}
                                                - $
                                                {selectedCompanyProfile.targetCriteria.revenueMax?.toLocaleString() ||
                                                  "∞"}
                                              </div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                EBITDA Range:{" "}
                                              </span>
                                              <div className="text-gray-900 font-semibold">
                                                $
                                                {selectedCompanyProfile.targetCriteria.ebitdaMin?.toLocaleString() ||
                                                  0}{" "}
                                                - $
                                                {selectedCompanyProfile.targetCriteria.ebitdaMax?.toLocaleString() ||
                                                  "∞"}
                                              </div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Transaction Size:{" "}
                                              </span>
                                              <div className="text-gray-900 font-semibold">
                                                $
                                                {selectedCompanyProfile.targetCriteria.transactionSizeMin?.toLocaleString() ||
                                                  0}{" "}
                                                - $
                                                {selectedCompanyProfile.targetCriteria.transactionSizeMax?.toLocaleString() ||
                                                  "∞"}
                                              </div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Min Years in Business:{" "}
                                              </span>
                                              <div className="text-gray-900 font-semibold">
                                                {selectedCompanyProfile
                                                  .targetCriteria
                                                  .minYearsInBusiness || "Any"}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            <div>
                                              <span className="text-gray-500 font-medium">
                                                Preferred Business Models:{" "}
                                              </span>
                                              <div className="text-gray-900 mt-1">
                                                {selectedCompanyProfile
                                                  .targetCriteria
                                                  .preferredBusinessModels
                                                  ?.length > 0
                                                  ? selectedCompanyProfile.targetCriteria.preferredBusinessModels.join(
                                                      ", "
                                                    )
                                                  : "Not specified"}
                                              </div>
                                            </div>
<div>
  <span className="text-gray-500 font-medium">Target Industries: </span>
  <div className="text-gray-900 mt-1">
    {visibleIndustries.length > 0 ? (
      <>
        {visibleIndustries.join(", ")}
        {industries.length > 5 && (
          <button
            onClick={() => setShowAllIndustries(!showAllIndustries)}
            className="ml-2 text-blue-600 underline text-xs"
          >
            {showAllIndustries
              ? "Show less"
              : `+${industries.length - 5} more`}
          </button>
        )}
      </>
    ) : (
      "Not specified"
    )}
  </div>
</div>

<div>
  <span className="text-gray-500 font-medium">Target Geographies: </span>
  <div className="text-gray-900 mt-1">
    {visibleCountries.length > 0 ? (
      <>
        {visibleCountries.join(", ")}
        {countries.length > 5 && (
          <button
            onClick={() => setShowAllCountries(!showAllCountries)}
            className="ml-2 text-blue-600 underline text-xs"
          >
            {showAllCountries
              ? "Show less"
              : `+${countries.length - 5} more`}
          </button>
        )}
      </>
    ) : (
      "Not specified"
    )}
  </div>
</div>

                                          </div>

                                          {selectedCompanyProfile.targetCriteria
                                            .description && (
                                            <div className="mt-6">
                                              <span className="text-gray-500 font-medium">
                                                Investment Focus Description:{" "}
                                              </span>
                                              <div className="text-gray-900 mt-2 p-4 bg-gray-50 rounded-lg">
                                                {
                                                  selectedCompanyProfile
                                                    .targetCriteria.description
                                                }
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Preferences
                                      {selectedCompanyProfile?.preferences && (
                                        <div className="border-t pt-6">
                                          <h4 className="text-lg font-medium mb-4 text-gray-800">
                                            Communication Preferences
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center">
                                              <span className="text-gray-500 font-medium">
                                                Stop Sending Deals:{" "}
                                              </span>
                                              <span
                                                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                  selectedCompanyProfile
                                                    .preferences
                                                    .stopSendingDeals
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-green-100 text-green-700"
                                                }`}
                                              >
                                                {selectedCompanyProfile
                                                  .preferences.stopSendingDeals
                                                  ? "Yes"
                                                  : "No"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )} */}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

{/* Rejected Buyers */}
{statusSummary.buyersByStatus.rejected.length > 0 && (
                          <div>
                            <h4 className="text-md font-medium mb-3 text-red-700">Rejected Buyers</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full table-fixed">
                                <colgroup>
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                  <col className="w-1/5" />
                                </colgroup>
                                <thead>
                                  <tr className="text-left border-b border-gray-200">
                                    <th className="pb-3 font-medium text-gray-600">Buyer</th>
                                    <th className="pb-3 font-medium text-gray-600">Company</th>
                                    <th className="pb-3 font-medium text-gray-600">Status</th>
                                    <th className="pb-3 font-medium text-gray-600">Date</th>
                                    <th className="pb-3 font-medium text-gray-600">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {statusSummary.buyersByStatus.rejected.map((buyer) => (
                                    <tr key={buyer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                      <td className="py-4 pr-4">
                                        <div className="flex items-center">
                                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3 flex-shrink-0">
                                            {buyer.buyerName &&
                                            buyer.buyerName !== `Buyer ${buyer.buyerId.slice(-4)}` ? (
                                              buyer.buyerName.charAt(0).toUpperCase()
                                            ) : (
                                              <User className="h-5 w-5" />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium truncate cursor-pointer" onClick={() => handleBuyerClick(buyer)}>{buyer.buyerName}</p>
                                            <p className="text-sm text-gray-500 truncate">{buyer.buyerEmail}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 pr-4">
                                        <span
                                          className={`truncate block ${
                                            buyer.companyName === "Company not available" ? "text-gray-500 text-sm" : ""
                                          }`}
                                        >
                                          {buyer.companyName}
                                        </span>
                                      </td>
                                      <td className="py-4 pr-4">
                                        {(() => {
                                          const isMarketplaceDenial = !!statusSummary?.deal?.isPublic && buyer.decisionBy === 'seller';
                                          if (isMarketplaceDenial) {
                                            return <span className="text-gray-400 text-sm">n/a</span>;
                                          }
                                          const label = buyer.status || 'rejected';
                                          return (
                                            <span
                                              className={`px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap ${getStatusColor(label)}`}
                                            >
                                              {label}
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-4 text-sm whitespace-nowrap">{formatDate(buyer.invitedAt)}</td>
                                      <td className="py-4 pr-4">
                                        {(() => {
                                          const isMarketplaceDenial = !!statusSummary?.deal?.isPublic && buyer.decisionBy === 'seller';
                                          if (isMarketplaceDenial) {
                                            return <span className="text-red-600 font-medium">Request Denied</span>;
                                          }
                                          return <span className="text-gray-400 text-sm">n/a</span>;
                                        })()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Invite More Buyers Button */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <Button
                            onClick={handleInviteBuyersClick}
                            className="bg-teal-500 hover:bg-teal-600 text-white"
                          >
                            Invite More Buyers
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        No buyer status data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {confirmDenyBuyer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Deny Access?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deny access for{' '}
              <span className="font-medium">{confirmDenyBuyer.buyerName}</span>?
              This will notify the buyer and move them to Rejected.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDenyBuyer(null)} disabled={confirmDenyLoading}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => denyBuyer(confirmDenyBuyer.buyerId || confirmDenyBuyer._id)}
                disabled={confirmDenyLoading}
              >
                {confirmDenyLoading ? (
                  <span className="inline-flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-1" />Denying…</span>
                ) : (
                  'Deny'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SellerProtectedRoute>
  );
}
