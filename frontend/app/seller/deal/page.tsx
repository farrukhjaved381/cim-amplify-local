"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Users,
  Clock3,
  XCircle,
  X,
  Loader2,
  Menu,
  PauseCircle,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import SellerProtectedRoute from "@/components/seller/protected-route";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Country, State, City } from "country-state-city";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SellerNav } from "@/components/seller/seller-nav";

// Helper to get API URL - uses environment variable with localStorage fallback
const getApiUrl = () => {
  // First try environment variable (works in production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "https://cim-backend.vercel.app";
};

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
  industrySectors?: string[];
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
  const [sending, setSending] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedCompanyProfile, setSelectedCompanyProfile] =
    useState<CompanyProfile | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loadingCompanyProfile, setLoadingCompanyProfile] = useState(false);
  const [showBuyersForNewDeal, setShowBuyersForNewDeal] = useState(false);
  const [hasFetchedBuyers, setHasFetchedBuyers] = useState(false);
  const [selectAllDropdownOpen, setSelectAllDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Action button states
  const [isPausingLOI, setIsPausingLOI] = useState(false);
  const [loiDialogOpen, setLoiDialogOpen] = useState(false);
  const [loiDialogStep, setLoiDialogStep] = useState(1);
  const [selectedLoiBuyer, setSelectedLoiBuyer] = useState<string>("");
  const [loiBuyerActivity, setLoiBuyerActivity] = useState<any[]>([]);
  const [loiBuyerActivityLoading, setLoiBuyerActivityLoading] = useState(false);
  const [offMarketDialogOpen, setOffMarketDialogOpen] = useState(false);
  const [currentDialogStep, setCurrentDialogStep] = useState(1);
  const [offMarketData, setOffMarketData] = useState({
    dealSold: null as boolean | null,
    transactionValue: "",
    buyerFromCIM: null as boolean | null,
  });
  const [buyerActivity, setBuyerActivity] = useState<any[]>([]);
  const [selectedWinningBuyer, setSelectedWinningBuyer] = useState<string>("");
  const [buyerActivityLoading, setBuyerActivityLoading] = useState(false);
  const [isClosingDeal, setIsClosingDeal] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const dealId = searchParams.get("id");

  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const apiUrl =
          getApiUrl();
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
        // Error fetching seller profile
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
        const token = sessionStorage.getItem("token");
        const apiUrl =
          getApiUrl();
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
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/company-profiles/public/${companyProfileId}`
      );

      if (response.ok) {
        const companyData = await response.json();
        setSelectedCompanyProfile(companyData);
      } else {
        setSelectedCompanyProfile(null);
      }
    } catch (error) {
      setSelectedCompanyProfile(null);
    } finally {
      setLoadingCompanyProfile(false);
    }
  };

  // Fetch status summary
  const fetchStatusSummary = async () => {
    try {
      setLoadingBuyers(true);
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();
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
                return null;
              }
            } catch (error) {
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
      }
    } catch (error) {
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
          const token = sessionStorage.getItem("token");
          const apiUrl =
            getApiUrl();
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
    logout(); // logout() from useAuth already handles redirect
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
    // If it's a base64 image, return as-is
    if (path.startsWith("data:image")) return path;
    // If it's already a full URL, return as-is
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const apiUrl = getApiUrl();
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

  // Action button handlers
  const handlePauseForLOI = async () => {
    setLoiDialogStep(1);
    setSelectedLoiBuyer("");
    setLoiBuyerActivity([]);
    setLoiDialogOpen(true);
  };

  const fetchLoiEligibleBuyers = async () => {
    if (!deal) return [];
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/deals/${deal._id}/ever-active-buyers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return [];
      const buyers = await response.json();
      const transformed = buyers.map((buyer: any) => ({
        buyerId: buyer._id,
        buyerName: buyer.fullName || "Unknown Buyer",
        companyName: buyer.companyName || "Unknown Company",
        buyerEmail: buyer.email || "",
      }));
      setLoiBuyerActivity(transformed);
      if (transformed.length > 0) {
        setSelectedLoiBuyer(transformed[0].buyerId);
      }
      return transformed;
    } catch {
      return [];
    }
  };

  const handlePauseForLOISubmit = async (isCimBuyer: boolean) => {
    if (!deal) return;
    setIsPausingLOI(true);
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();
      const body = isCimBuyer && selectedLoiBuyer ? { loiBuyerId: selectedLoiBuyer } : {};
      const response = await fetch(`${apiUrl}/deals/${deal._id}/pause-for-loi`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to pause deal for LOI");
      }

      toast({
        title: "Deal Paused for LOI",
        description: "The deal has been moved to LOI - Deals. You can find it in the LOI - Deals section.",
      });
      setLoiDialogOpen(false);
      router.push("/seller/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pause deal for LOI",
        variant: "destructive",
      });
    } finally {
      setIsPausingLOI(false);
    }
  };

  const handleOffMarketClick = () => {
    setCurrentDialogStep(1);
    setOffMarketDialogOpen(true);
    setSelectedWinningBuyer("");
    setOffMarketData({
      dealSold: null,
      transactionValue: "",
      buyerFromCIM: null,
    });
  };

  const formatTransactionValue = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Fetch buyers who have ever had this deal in Active
  const fetchEverActiveBuyers = async () => {
    if (!deal) return [];
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/deals/${deal._id}/ever-active-buyers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const buyers = await response.json();
        const transformedBuyers = buyers.map((buyer: any) => ({
          buyerId: buyer._id,
          buyerName: buyer.fullName || "Unknown Buyer",
          companyName: buyer.companyName || "Unknown Company",
          buyerEmail: buyer.email || "",
          status: "active",
          currentStatus: buyer.currentStatus,
          isCurrentlyActive: buyer.isCurrentlyActive,
        }));
        setBuyerActivity(transformedBuyers);
        if (transformedBuyers.length > 0) {
          setSelectedWinningBuyer(transformedBuyers[0].buyerId);
        }
        return transformedBuyers;
      }
    } catch (error) {
      // Error fetching ever active buyers
    }
    return [];
  };

  // Fetch buyers when entering step 3
  useEffect(() => {
    if (offMarketDialogOpen && deal && currentDialogStep === 3) {
      setBuyerActivity([]);
      setSelectedWinningBuyer("");
      setBuyerActivityLoading(true);
      fetchEverActiveBuyers().finally(() => setBuyerActivityLoading(false));
    }
  }, [offMarketDialogOpen, deal, currentDialogStep]);

  const activeBuyerOptions = buyerActivity.filter((buyer) => buyer?.status === "active");

  useEffect(() => {
    if (loiDialogOpen && loiDialogStep === 2) {
      setLoiBuyerActivityLoading(true);
      fetchLoiEligibleBuyers().finally(() => setLoiBuyerActivityLoading(false));
    }
  }, [loiDialogOpen, loiDialogStep]);

  const handleDialogResponse = async (key: string, value: boolean) => {
    setOffMarketData((prev) => ({ ...prev, [key]: value }));
    if (key === "dealSold") {
      if (value === false) {
        // Mark deal as off-market without sale
        await handleCloseWithoutSale();
      } else {
        setCurrentDialogStep(2);
      }
    }
  };

  const handleCloseWithoutSale = async () => {
    if (!deal) return;
    setIsClosingDeal(true);
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/deals/${deal._id}/close-deal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to close deal");
      }
      setOffMarketDialogOpen(false);
      toast({
        title: "Deal marked as off-market",
        description: "The deal has been removed from your active deals.",
      });
      router.push("/seller/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark deal off-market.",
        variant: "destructive",
      });
    } finally {
      setIsClosingDeal(false);
    }
  };

  const handleOffMarketSubmit = async () => {
    if (!deal) return;
    setIsClosingDeal(true);
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();
      const transactionValueNumeric = offMarketData.transactionValue.replace(/,/g, "");

      const response = await fetch(`${apiUrl}/deals/${deal._id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalSalePrice: transactionValueNumeric ? Number(transactionValueNumeric) : undefined,
          winningBuyerId: selectedWinningBuyer || undefined,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to close deal");
      }
      setOffMarketDialogOpen(false);
      toast({
        title: "Deal Completed",
        description: "The deal has been marked as completed and removed from your active deals",
      });
      router.push("/seller/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete deal.",
        variant: "destructive",
      });
    } finally {
      setIsClosingDeal(false);
    }
  };

  const handleImmediateCloseNoCIM = async () => {
    if (!deal) return;
    setIsClosingDeal(true);
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = getApiUrl();
      const transactionValueNumeric = offMarketData.transactionValue.replace(/,/g, "");

      const response = await fetch(`${apiUrl}/deals/${deal._id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalSalePrice: transactionValueNumeric ? Number(transactionValueNumeric) : undefined,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to close deal");
      }
      setOffMarketDialogOpen(false);
      toast({
        title: "Deal Completed",
        description: "The deal has been marked as closed and removed from your active deals",
      });
      router.push("/seller/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close deal.",
        variant: "destructive",
      });
    } finally {
      setIsClosingDeal(false);
    }
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
      const apiUrl = getApiUrl();
      const token = sessionStorage.getItem("token");
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
        const token = sessionStorage.getItem("token");
        const apiUrl =
          getApiUrl();
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
        setMatchedBuyers([]);
      } finally {
        setLoadingBuyers(false);
        setHasFetchedBuyers(true);
      }
    };
    await fetchMatchingBuyers();
  };

  return (
    <SellerProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col">
          <SellerNav activePage="dashboard" onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-3 sm:p-6 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
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
                    <SellerNav activePage="dashboard" onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => router.push("/seller/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                {showBuyersForNewDeal
                  ? "Choose Buyers"
                  : "Buyer Status Summary"}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <div className="font-medium text-sm sm:text-base truncate max-w-[120px]">
                  {userProfile?.fullName || sellerProfile?.fullName || "User"}
                </div>
              </div>
              <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium overflow-hidden">
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
            <div className="p-3 sm:p-6">
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
                                {buyer.companyName || "Anonymous Company"}
                              </h3>
                            </div>
                            <div className="mb-6">
                              <h4 className="font-medium mb-2">Overview</h4>
                              <div className="space-y-1 text-sm">
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
          <div className="p-3 sm:p-6">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h3 className="text-lg text-[#0D9488] font-medium">
                        {deal.title}
                      </h3>
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/seller/edit-deal?id=${deal._id}`)}
                          className="py-2 text-xs sm:text-sm border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="py-2 text-xs sm:text-sm bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 whitespace-nowrap disabled:opacity-70 transition-all duration-200"
                          onClick={handlePauseForLOI}
                          disabled={isPausingLOI}
                        >
                          {isPausingLOI ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <PauseCircle className="h-4 w-4 mr-1" />
                              <span>Pause for LOI</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="py-2 text-xs sm:text-sm bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:border-red-400 whitespace-nowrap transition-all duration-200"
                          onClick={handleOffMarketClick}
                        >
                          Off Market
                        </Button>
                      </div>
                    </div>
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
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                </colgroup>
                                <thead>
                                  <tr className="text-left border-b border-gray-200">
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
                                      <td className="py-4 pr-4">
                                        <div className="flex items-center">
                                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
                                            <User className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium truncate">
                                              {buyer.companyName && buyer.companyName !== "Company not available"
                                                ? buyer.companyName
                                                : "Anonymous Company"}
                                            </p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 pr-4">
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap ${getStatusColor(buyer.status || 'pending')}`}
                                        >
                                          {buyer.status || 'pending'}
                                        </span>
                                      </td>
                                      <td className="py-4 text-sm whitespace-nowrap">{formatDate(buyer.invitedAt)}</td>
                                      <td className="py-4 pr-4">
                                        <span className="text-gray-400 text-sm">Awaiting response</span>
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
                                        {/* Basic Information - Only show contact details for Active buyers */}
                                        <div className="mb-6">
                                          <h4 className="text-lg font-medium mb-4 text-gray-800">
                                            Basic Information
                                          </h4>
                                          <div className="space-y-3 text-sm">
                                            {/* Only show contact name and email for Active buyers */}
                                            {(selectedBuyer.status === 'accepted' || selectedBuyer.status === 'interested' || selectedBuyer.sellerApproved) ? (
                                              <>
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
                                              </>
                                            ) : (
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-gray-500 text-sm italic">
                                                  Contact details will be available once the buyer accepts the deal invitation.
                                                </p>
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
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                  <col className="w-1/4" />
                                </colgroup>
                                <thead>
                                  <tr className="text-left border-b border-gray-200">
                                    <th className="pb-3 font-medium text-gray-600">Company</th>
                                    <th className="pb-3 font-medium text-gray-600">Status</th>
                                    <th className="pb-3 font-medium text-gray-600">Date</th>
                                    <th className="pb-3 font-medium text-gray-600">Reason</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {statusSummary.buyersByStatus.rejected.map((buyer) => (
                                    <tr key={buyer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                      <td className="py-4 pr-4">
                                        <div className="flex items-center">
                                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3 flex-shrink-0">
                                            <User className="h-5 w-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-medium truncate">
                                              {buyer.companyName && buyer.companyName !== "Company not available"
                                                ? buyer.companyName
                                                : "Anonymous Company"}
                                            </p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 pr-4">
                                        {(() => {
                                          const isMarketplaceDenial = !!statusSummary?.deal?.isPublic && buyer.decisionBy === 'seller';
                                          if (isMarketplaceDenial) {
                                            return (
                                              <span className="px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap bg-red-100 text-red-700">
                                                request denied
                                              </span>
                                            );
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
                                            return <span className="text-gray-500 text-sm">Denied by advisor</span>;
                                          }
                                          return <span className="text-gray-500 text-sm">Passed on deal</span>;
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

      {/* LOI Dialog */}
      <Dialog open={loiDialogOpen} onOpenChange={setLoiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {loiDialogStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-teal-500 text-lg font-medium">
                  Is the LOI buyer from CIM Amplify?
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Button
                  onClick={() => setLoiDialogStep(2)}
                  className="w-full bg-teal-500 hover:bg-teal-600"
                  disabled={isPausingLOI}
                >
                  Yes, choose CIM buyer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePauseForLOISubmit(false)}
                  disabled={isPausingLOI}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {isPausingLOI ? <Loader2 className="h-4 w-4 animate-spin" /> : "No, not from CIM Amplify"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-teal-500 text-lg font-medium">
                  Select CIM buyer for LOI
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {loiBuyerActivityLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></span>
                      Loading buyers...
                    </div>
                  ) : loiBuyerActivity.length > 0 ? (
                    loiBuyerActivity.map((buyer) => (
                      <div
                        key={buyer.buyerId}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLoiBuyer === buyer.buyerId
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedLoiBuyer(buyer.buyerId)}
                      >
                        <div>
                          <div className="font-medium text-sm">{buyer.buyerName || "Unknown Buyer"}</div>
                          <div className="text-xs text-gray-500">{buyer.companyName || "Unknown Company"}</div>
                        </div>
                        {selectedLoiBuyer === buyer.buyerId && (
                          <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No CIM Amplify buyers are available for this deal.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={() => handlePauseForLOISubmit(true)}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                    disabled={!selectedLoiBuyer || isPausingLOI}
                  >
                    {isPausingLOI ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pause for LOI"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLoiDialogStep(1)}
                    disabled={isPausingLOI}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Off Market Dialog */}
      <Dialog open={offMarketDialogOpen} onOpenChange={setOffMarketDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {currentDialogStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-teal-500 text-lg font-medium">Did the deal sell?</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="flex gap-4">
                  <Button
                    variant={offMarketData.dealSold === false ? "default" : "outline"}
                    onClick={() => handleDialogResponse("dealSold", false)}
                    disabled={isClosingDeal}
                    className={
                      offMarketData.dealSold === false
                        ? "flex-1 bg-red-500 text-white hover:bg-red-600 border-red-500"
                        : "flex-1 bg-white text-red-500 border border-red-500 hover:bg-red-50"
                    }
                  >
                    {isClosingDeal ? <Loader2 className="h-4 w-4 animate-spin" /> : "No"}
                  </Button>
                  <Button
                    variant={offMarketData.dealSold === true ? "default" : "outline"}
                    onClick={() => handleDialogResponse("dealSold", true)}
                    className={
                      offMarketData.dealSold === true
                        ? "flex-1 bg-teal-500 text-white hover:bg-teal-600 border-teal-500"
                        : "flex-1 bg-white text-teal-500 border border-teal-500 hover:bg-teal-50"
                    }
                  >
                    Yes
                  </Button>
                </div>
              </div>
            </>
          ) : currentDialogStep === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-teal-500 text-lg font-medium">What was the transaction value?</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-value">Transaction Value ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="transaction-value"
                      type="text"
                      placeholder="Enter amount"
                      value={offMarketData.transactionValue}
                      onChange={(e) =>
                        setOffMarketData((prev) => ({
                          ...prev,
                          transactionValue: formatTransactionValue(e.target.value),
                        }))
                      }
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentDialogStep(3)} className="bg-teal-500 hover:bg-teal-600">
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : currentDialogStep === 3 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-teal-500 text-lg font-medium">Select the buyer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {buyerActivityLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                      <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></span>
                      Loading buyers...
                    </div>
                  ) : activeBuyerOptions.length > 0 ? (
                    activeBuyerOptions.map((buyer) => (
                      <div
                        key={buyer.buyerId}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedWinningBuyer === buyer.buyerId
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedWinningBuyer(buyer.buyerId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{buyer.buyerName || "Unknown Buyer"}</div>
                            <div className="text-xs text-gray-500">{buyer.companyName || "Unknown Company"}</div>
                          </div>
                        </div>
                        {selectedWinningBuyer === buyer.buyerId && (
                          <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No buyers have interacted with this deal yet
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setOffMarketData((prev) => ({ ...prev, buyerFromCIM: true }));
                      handleOffMarketSubmit();
                    }}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                    disabled={!selectedWinningBuyer || isClosingDeal}
                  >
                    {isClosingDeal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleImmediateCloseNoCIM}
                    disabled={isClosingDeal}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {isClosingDeal ? <Loader2 className="h-4 w-4 animate-spin" /> : "The buyer did not come from CIM Amplify"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <DialogHeader>
              <DialogTitle className="sr-only">Off Market Dialog</DialogTitle>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </SellerProtectedRoute>
  );
}
