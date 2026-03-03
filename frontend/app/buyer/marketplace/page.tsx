"use client";
import Image from "next/image";
import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CompanyProfile } from "@/types/company-profile";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Briefcase,
  Store,
  Menu,
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

import {
  getGeoData,
  type GeoData,
  type Continent,
  type Region,
  type SubRegion,
} from "@/lib/geography-data";
import {
  getIndustryData,
  type IndustryData,
  type Sector,
  type IndustryGroup,
  type Industry,
} from "@/lib/industry-data";
import GeographySelector from "@/components/GeographySelector";
import { Country, State } from "country-state-city";

const COMPANY_TYPES = [
  "Buy Side Mandate",
  "Entrepreneurship through Acquisition",
  "Family Office",
  "Holding Company",
  "Independent Sponsor",
  "Private Equity",
  "Single Acquisition Search",
  "Strategic Operating Company",
];

const BUSINESS_MODELS = [
  "Recurring Revenue",
  "Project-Based",
  "Asset Light",
  "Asset Heavy",
];

// Default API URL
const DEFAULT_API_URL = "http://localhost:5001";

// Type for hierarchical selection
interface HierarchicalSelection {
  continents: Record<string, boolean>;
  regions: Record<string, boolean>;
  subRegions: Record<string, boolean>;
}

interface IndustrySelection {
  sectors: Record<string, boolean>;
  industryGroups: Record<string, boolean>;
  industries: Record<string, boolean>;
}

// Add BuyerProfile interface
interface BuyerProfile {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  profilePicture: string | null;
}

export default function MarketPlace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // API configuration
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  // Authentication state
  const [authToken, setAuthToken] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);

  // Add buyerProfile state
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);

  // Track per-deal request loading state
  const [requestLoading, setRequestLoading] = useState<Record<string, boolean>>({});

  // Track expanded descriptions for show more/less
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  // Hierarchical selection state
  const [geoSelection, setGeoSelection] = useState<HierarchicalSelection>({
    continents: {},
    regions: {},
    subRegions: {},
  });

  const [industrySelection, setIndustrySelection] = useState<IndustrySelection>(
    {
      sectors: {},
      industryGroups: {},
      industries: {},
    }
  );

  // UI state for expanded sections
  const [expandedContinents, setExpandedContinents] = useState<
    Record<string, boolean>
  >({});
  const [expandedRegions, setExpandedRegions] = useState<
    Record<string, boolean>
  >({});
  const [expandedSectors, setExpandedSectors] = useState<
    Record<string, boolean>
  >({});
  const [expandedIndustryGroups, setExpandedIndustryGroups] = useState<
    Record<string, boolean>
  >({});

  // Search terms
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");

  // Available currencies
  const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

  // Add a state variable to store the company profile ID
  const [profileId, setProfileId] = useState<string | null>(null);

  // Add a new state for field-specific errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Marketplace deals state
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notInterestedLoading, setNotInterestedLoading] = useState<Record<string, boolean>>({});

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatCurrencyDisplay = (amount?: number | null, currency?: string) => {
    if (amount === undefined || amount === null) return 'Not provided';
    const value = Number(amount);
    if (Number.isNaN(value)) return 'Not provided';
    // Extract symbol from formats like "USD($)" or use as-is
    let symbol = '$';
    if (currency) {
      const match = currency.match(/\((.+)\)/);
      symbol = match ? match[1] : currency;
    }
    return `${symbol}${value.toLocaleString()}`;
  };

  const formatPercentDisplay = (value?: number | null) => {
    if (value === undefined || value === null) return 'Not provided';
    return `${value}%`;
  };

  const getBusinessModelSummary = (businessModel: any) => {
    if (!businessModel) return 'Not provided';
    const labels: string[] = [];
    if (businessModel.recurringRevenue) labels.push('Recurring Revenue');
    if (businessModel.projectBased) labels.push('Project-Based');
    if (businessModel.assetLight) labels.push('Asset Light');
    if (businessModel.assetHeavy) labels.push('Asset Heavy');
    return labels.length ? labels.join(', ') : 'Not provided';
  };

  // Check for token on mount and from URL parameters
  useEffect(() => {
    if (!isClient) return;

    // Get token and userId from URL parameters
    const urlToken = searchParams?.get("token");
    const urlUserId = searchParams?.get("userId");

    // Set token from URL or localStorage
    if (urlToken) {
      const cleanToken = urlToken.trim();
      localStorage.setItem("token", cleanToken);
      setAuthToken(cleanToken);

    } else {
      const storedToken = sessionStorage.getItem("token");
      if (storedToken) {
        const cleanToken = storedToken.trim();
        setAuthToken(cleanToken);

      } else {

        toast({
          title: "Authentication Required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        router.push("/buyer/login");
        return;
      }
    }

    // Set userId from URL or localStorage
    if (urlUserId) {
      const cleanUserId = urlUserId.trim();
      localStorage.setItem("userId", cleanUserId);
      setBuyerId(cleanUserId);

    } else {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        const cleanUserId = storedUserId.trim();
        setBuyerId(cleanUserId);

      }
    }

    // Set API URL from localStorage or use default
    const storedApiUrl = localStorage.getItem("apiUrl");
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }
  }, [searchParams, router, isClient]);

  useEffect(() => {
    if (!isClient || !authToken) return;

    const fetchData = async () => {
      try {
        // Fetch geography data
        const geo = await getGeoData();
        setGeoData(geo);

        // Fetch industry data
        const industry = await getIndustryData();
        setIndustryData(industry);

        // After loading the reference data, fetch the user's profile
        await fetchUserProfile();
        await fetchBuyerProfile();

        // Fetch marketplace deals
        setDealsLoading(true);
        const resp = await fetch(`${apiUrl}/deals/marketplace`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setDeals(data || []);
        }
        setDealsLoading(false);
      } catch (error) {

        toast({
          title: "Data Loading Error",
          description: "Failed to load geography and industry data.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [authToken, isClient]);

  const handleRequestAccess = async (dealId: string) => {
    try {
      if (!authToken) return;
      setRequestLoading((p) => ({ ...p, [dealId]: true }));
      const resp = await fetch(`${apiUrl}/deals/${dealId}/request-access`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to request access');
      }
      toast({ 
        title: '✅ Success!', 
        description: 'Deal added to Active. You can now view full details and request more information.',
        duration: 4000
      });
      // Optimistically update card status to accepted (moved to Active)
      setDeals((prev: any[]) => prev.map((d) => d._id === dealId ? { ...d, currentBuyerRequested: true, currentBuyerStatus: 'accepted' } : d));
    } catch (e: any) {
      toast({ title: '❌ Request failed', description: e.message || 'Please try again.', variant: 'destructive', duration: 4000 });
    } finally {
      setRequestLoading((p) => ({ ...p, [dealId]: false }));
    }
  };

  const handleNotInterested = async (dealId: string) => {
    try {
      if (!authToken) return;
      setNotInterestedLoading((p) => ({ ...p, [dealId]: true }));
      const resp = await fetch(`${apiUrl}/deals/${dealId}/not-interested`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to mark as not interested');
      }
      toast({ 
        title: '🗑️ Deal Removed', 
        description: 'This deal has been removed from your marketplace and won\'t be shown again.',
        duration: 4000
      });
      // Remove the deal from the list locally
      setDeals((prev: any[]) => prev.filter((d) => d._id !== dealId));
    } catch (e: any) {
      toast({ title: '❌ Action failed', description: e.message || 'Please try again.', variant: 'destructive', duration: 4000 });
    } finally {
      setNotInterestedLoading((p) => ({ ...p, [dealId]: false }));
    }
  };

  // Form state
  const [formData, setFormData] = useState<
    CompanyProfile & {
      selectedCurrency: string;
      capitalAvailability: string;
      updatedAt?: string;
    }
  >({
    companyName: "",
    website: "",
    updatedAt: undefined,
    contacts: [{ name: "", email: "", phone: "" }],
    companyType: "",
    capitalEntity: "",
    dealsCompletedLast5Years: undefined,
    averageDealSize: undefined,
    preferences: {
      stopSendingDeals: false,
      doNotSendMarketedDeals: false,
      allowBuyerLikeDeals: false,
    },
    targetCriteria: {
      countries: [],
      industrySectors: [],
      revenueMin: undefined,
      revenueMax: undefined,
      ebitdaMin: undefined,
      ebitdaMax: undefined,
      transactionSizeMin: undefined,
      transactionSizeMax: undefined,
      revenueGrowth: undefined,
      minStakePercent: undefined,
      minYearsInBusiness: undefined,
      preferredBusinessModels: [],
      description: "",
    },
    agreements: {
      termsAndConditionsAccepted: false,
      ndaAccepted: false,
      feeAgreementAccepted: false,
    },
    selectedCurrency: "USD",
    capitalAvailability: "Need to raise",
  });

  // Fetch user's existing profile data
  const fetchUserProfile = async () => {
    if (!authToken || !isClient) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`${apiUrl}/company-profiles/my-profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
  
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const profileData = await response.json();


      if (profileData && profileData._id) {
        setProfileId(profileData._id);

      }

      if (profileData) {
        const updatedProfile = {
          ...formData,
          ...profileData,
          preferences: {
            ...formData.preferences,
            ...(profileData.preferences || {}),
          },
          targetCriteria: {
            ...formData.targetCriteria,
            ...(profileData.targetCriteria || {}),
          },
          agreements: {
            ...formData.agreements,
            ...(profileData.agreements || {}),
          },
          selectedCurrency: profileData.selectedCurrency || "USD",
          capitalEntity:
            profileData.capitalEntity ||
            profileData.capitalAvailability ||
            "Need to raise",
          capitalAvailability:
            profileData.capitalAvailability ||
            profileData.capitalEntity ||
            "Need to raise",
          updatedAt: profileData.updatedAt,
        };

        setFormData(updatedProfile);

        // Update geography selections
        if (profileData.targetCriteria?.countries?.length > 0 && geoData) {
          const newGeoSelection = { ...geoSelection };

          geoData.continents.forEach((continent) => {
            if (profileData.targetCriteria.countries.includes(continent.name)) {
              newGeoSelection.continents[continent.id] = true;
            }

            continent.regions.forEach((region) => {
              if (profileData.targetCriteria.countries.includes(region.name)) {
                newGeoSelection.regions[region.id] = true;
              }

              if (region.subRegions) {
                region.subRegions.forEach((subRegion) => {
                  if (
                    profileData.targetCriteria.countries.includes(
                      subRegion.name
                    )
                  ) {
                    newGeoSelection.subRegions[subRegion.id] = true;
                  }
                });
              }
            });
          });

          setGeoSelection(newGeoSelection);
        }

        // Update industry selections
        if (
          profileData.targetCriteria?.industrySectors?.length > 0 &&
          industryData
        ) {
          const newIndustrySelection = { ...industrySelection };

          industryData.sectors.forEach((sector) => {
            if (
              profileData.targetCriteria.industrySectors.includes(sector.name)
            ) {
              newIndustrySelection.sectors[sector.id] = true;
            }

            sector.industryGroups.forEach((group) => {
              if (
                profileData.targetCriteria.industrySectors.includes(group.name)
              ) {
                newIndustrySelection.industryGroups[group.id] = true;
              }

              group.industries.forEach((industry) => {
                if (
                  profileData.targetCriteria.industrySectors.includes(
                    industry.name
                  )
                ) {
                  newIndustrySelection.industries[industry.id] = true;
                }
              });
            });
          });

          setIndustrySelection(newIndustrySelection);
        }
      }
    } catch (error) {
      // Error fetching profile
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch buyer profile
  const fetchBuyerProfile = async () => {
    if (!isClient) return;

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {

        return;
      }

      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

      const response = await fetch(`${apiUrl}/buyers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.push("/buyer/login?session=expired");
          return;
        }
        throw new Error(`Failed to fetch buyer profile: ${response.status}`);
      }

      const data = await response.json();
      setBuyerProfile(data);
    } catch (error) {

    }
  };

  // Add a function to validate individual fields
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case "companyName":
        return !value?.trim() ? "Company name is required" : null;
      case "website":
        try {
          const websiteUrl = new URL(
            value.startsWith("http") ? value : `https://${value}`
          );
          if (!websiteUrl.hostname.includes(".")) {
            return "Please enter a valid website URL (e.g., example.com)";
          }
        } catch (e) {
          return "Please enter a valid website URL (e.g., example.com)";
        }
        return null;
      case "companyType":
        return !value ? "Please select a company type" : null;
      case "capitalEntity":
        return !value ? "Please select a capital entity" : null;
      case "contact.name":
        return !value?.trim() ? "Contact name is required" : null;
      case "contact.email":
        if (!value?.trim()) return "Contact email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value)
          ? "Please enter a valid email address (e.g., name@example.com)"
          : null;
      case "contact.phone":
        if (!value?.trim()) return "Contact phone is required";
        const phoneRegex =
          /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        return !phoneRegex.test(value)
          ? "Please enter a valid phone number (e.g., 123-456-7890)"
          : null;
      case "agreements.termsAndConditions":
        return value ? null : "You must accept the terms and conditions";
      case "agreements.nda":
        return value ? null : "You must accept the NDA";
      case "agreements.feeAgreement":
        return value ? null : "You must accept the fee agreement";
      case "targetCriteria.revenueMin":
        return value === undefined || value === ""
          ? "Minimum revenue is required"
          : null;
      case "targetCriteria.revenueMax":
        return value === undefined || value === ""
          ? "Maximum revenue is required"
          : null;
      case "targetCriteria.ebitdaMin":
        return value === undefined || value === ""
          ? "Minimum EBITDA is required"
          : null;
      case "targetCriteria.ebitdaMax":
        return value === undefined || value === ""
          ? "Maximum EBITDA is required"
          : null;
      case "targetCriteria.transactionSizeMin":
        return value === undefined || value === ""
          ? "Minimum transaction size is required"
          : null;
      case "targetCriteria.transactionSizeMax":
        return value === undefined || value === ""
          ? "Maximum transaction size is required"
          : null;
      case "targetCriteria.revenueGrowth":
        return value === undefined || value === ""
          ? "Minimum 3 Year Average Revenue Growth is required"
          : null;
      default:
        return null;
    }
  };

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    const error = validateField(field, value);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: error || "",
    }));
  };

  // Handle nested field changes
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(typeof prev[parent as keyof CompanyProfile] === "object" &&
        prev[parent as keyof CompanyProfile] !== null
          ? (prev[parent as keyof CompanyProfile] as Record<string, any>)
          : {}),
        [field]: value,
      },
    }));

    const error = validateField(`${parent}.${field}`, value);
    setFieldErrors((prev) => ({
      ...prev,
      [`${parent}.${field}`]: error || "",
    }));
  };

  // Handle contact changes
  const handleContactChange = (index: number, field: string, value: string) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    handleChange("contacts", updatedContacts);

    const error = validateField(`contact.${field}`, value);
    setFieldErrors((prev) => ({
      ...prev,
      [`contacts[${index}].${field}`]: error || "",
    }));
  };

  // Add new contact
  const addContact = () => {
    if (formData.contacts.length < 3) {
      handleChange("contacts", [
        ...formData.contacts,
        { name: "", email: "", phone: "" },
      ]);
    } else {
      // toast({
      //   title: "Maximum contacts reached",
      //   description: "You can only add up to 3 contacts.",
      //   variant: "destructive",
      // })
    }
  };

  // Remove contact
  const removeContact = (index: number) => {
    const updatedContacts = formData.contacts.filter((_, i) => i !== index);
    handleChange("contacts", updatedContacts);
  };

  // Toggle business model selection
  const toggleBusinessModel = (model: string) => {
    const currentModels = formData.targetCriteria.preferredBusinessModels;
    if (currentModels.includes(model)) {
      handleNestedChange(
        "targetCriteria",
        "preferredBusinessModels",
        currentModels.filter((m) => m !== model)
      );
    } else {
      handleNestedChange("targetCriteria", "preferredBusinessModels", [
        ...currentModels,
        model,
      ]);
    }
  };

  // Geography selection handlers
  const toggleContinent = (continent: Continent) => {
    const newGeoSelection = { ...geoSelection };
    const isSelected = !geoSelection.continents[continent.id];

    newGeoSelection.continents[continent.id] = isSelected;

    continent.regions.forEach((region) => {
      newGeoSelection.regions[region.id] = isSelected;

      if (region.subRegions) {
        region.subRegions.forEach((subRegion) => {
          newGeoSelection.subRegions[subRegion.id] = isSelected;
        });
      }
    });

    setGeoSelection(newGeoSelection);
    updateCountriesInFormData(newGeoSelection);
  };

  const toggleRegion = (region: Region, continent: Continent) => {
    const newGeoSelection = { ...geoSelection };
    const isSelected = !geoSelection.regions[region.id];

    newGeoSelection.regions[region.id] = isSelected;

    if (region.subRegions) {
      region.subRegions.forEach((subRegion) => {
        newGeoSelection.subRegions[subRegion.id] = isSelected;
      });
    }

    const allRegionsSelected = continent.regions.every((r) =>
      r.id === region.id ? isSelected : newGeoSelection.regions[r.id]
    );

    const allRegionsDeselected = continent.regions.every((r) =>
      r.id === region.id ? !isSelected : !newGeoSelection.regions[r.id]
    );

    if (allRegionsSelected) {
      newGeoSelection.continents[continent.id] = true;
    } else if (allRegionsDeselected) {
      newGeoSelection.continents[continent.id] = false;
    }

    setGeoSelection(newGeoSelection);
    updateCountriesInFormData(newGeoSelection);
  };

  const toggleSubRegion = (
    subRegion: SubRegion,
    region: Region,
    continent: Continent
  ) => {
    const newGeoSelection = { ...geoSelection };
    const isSelected = !geoSelection.subRegions[subRegion.id];

    newGeoSelection.subRegions[subRegion.id] = isSelected;

    const allSubRegionsSelected = region.subRegions?.every((sr) =>
      sr.id === subRegion.id ? isSelected : newGeoSelection.subRegions[sr.id]
    );

    if (allSubRegionsSelected) {
      newGeoSelection.regions[region.id] = true;
    } else {
      newGeoSelection.regions[region.id] = false;
    }

    const allRegionsSelected = continent.regions.every(
      (r) => newGeoSelection.regions[r.id]
    );

    if (allRegionsSelected) {
      newGeoSelection.continents[continent.id] = true;
    } else {
      newGeoSelection.continents[continent.id] = false;
    }

    setGeoSelection(newGeoSelection);
    updateCountriesInFormData(newGeoSelection);
  };

  // Update the countries array in formData based on the hierarchical selection
  const updateCountriesInFormData = (selection: HierarchicalSelection) => {
    if (!geoData) return;

    const selectedCountries: string[] = [];

    geoData.continents.forEach((continent) => {
      const continentSelected = selection.continents[continent.id];

      // Check if all regions in this continent are selected
      const allRegionsSelected = continent.regions.every((region) => {
        if (region.subRegions && region.subRegions.length > 0) {
          return region.subRegions.every(
            (subRegion) => selection.subRegions[subRegion.id]
          );
        }
        return selection.regions[region.id];
      });

      if (continentSelected && allRegionsSelected) {
        // If continent is selected and all its regions are selected, send only the continent
        selectedCountries.push(continent.name);
      } else {
        // Otherwise, check individual regions and subregions
        continent.regions.forEach((region) => {
          const regionSelected = selection.regions[region.id];

          if (region.subRegions && region.subRegions.length > 0) {
            // Check if all subregions in this region are selected
            const allSubRegionsSelected = region.subRegions.every(
              (subRegion) => selection.subRegions[subRegion.id]
            );

            if (regionSelected && allSubRegionsSelected) {
              // If region is selected and all its subregions are selected, send only the region
              selectedCountries.push(region.name);
            } else {
              // Otherwise, send only the selected subregions
              region.subRegions.forEach((subRegion) => {
                if (selection.subRegions[subRegion.id]) {
                  selectedCountries.push(subRegion.name);
                }
              });
            }
          } else {
            // Region has no subregions, add it if selected
            if (regionSelected) {
              selectedCountries.push(region.name);
            }
          }
        });
      }
    });

    handleNestedChange("targetCriteria", "countries", selectedCountries);
  };

  const removeCountry = (countryToRemove: string) => {
    if (!geoData) return;

    const newGeoSelection = { ...geoSelection };

    geoData.continents.forEach((continent) => {
      if (continent.name === countryToRemove) {
        newGeoSelection.continents[continent.id] = false;
      }

      continent.regions.forEach((region) => {
        if (region.name === countryToRemove) {
          newGeoSelection.regions[region.id] = false;
        }

        if (region.subRegions) {
          region.subRegions.forEach((subRegion) => {
            if (subRegion.name === countryToRemove) {
              newGeoSelection.subRegions[subRegion.id] = false;
            }
          });
        }
      });
    });

    setGeoSelection(newGeoSelection);
    updateCountriesInFormData(newGeoSelection);
  };

  // Industry selection handlers
  const toggleSector = (sector: Sector) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.sectors[sector.id];

    newIndustrySelection.sectors[sector.id] = isSelected;

    sector.industryGroups.forEach((group) => {
      newIndustrySelection.industryGroups[group.id] = isSelected;

      group.industries.forEach((industry) => {
        newIndustrySelection.industries[industry.id] = isSelected;
      });
    });

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  const toggleIndustryGroup = (group: IndustryGroup, sector: Sector) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.industryGroups[group.id];

    newIndustrySelection.industryGroups[group.id] = isSelected;

    group.industries.forEach((industry) => {
      newIndustrySelection.industries[industry.id] = isSelected;
    });

    const allGroupsSelected = sector.industryGroups.every((g) =>
      g.id === group.id ? isSelected : newIndustrySelection.industryGroups[g.id]
    );

    const allGroupsDeselected = sector.industryGroups.every((g) =>
      g.id === group.id
        ? !isSelected
        : !newIndustrySelection.industryGroups[g.id]
    );

    if (allGroupsSelected) {
      newIndustrySelection.sectors[sector.id] = true;
    } else if (allGroupsDeselected) {
      newIndustrySelection.sectors[sector.id] = false;
    }

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  const toggleIndustry = (
    industry: Industry,
    group: IndustryGroup,
    sector: Sector
  ) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.industries[industry.id];

    newIndustrySelection.industries[industry.id] = isSelected;

    const allIndustriesSelected = group.industries.every((i) =>
      i.id === industry.id ? isSelected : newIndustrySelection.industries[i.id]
    );

    const allIndustriesDeselected = group.industries.every((i) =>
      i.id === industry.id ? !isSelected : newIndustrySelection.industries[i.id]
    );

    if (allIndustriesSelected) {
      newIndustrySelection.industryGroups[group.id] = true;
    } else if (allIndustriesDeselected) {
      newIndustrySelection.industryGroups[group.id] = false;
    }

    const allGroupsSelected = sector.industryGroups.every((g) =>
      g.id === group.id
        ? newIndustrySelection.industryGroups[g.id]
        : newIndustrySelection.industryGroups[g.id]
    );

    const allGroupsDeselected = sector.industryGroups.every((g) =>
      g.id === group.id
        ? !newIndustrySelection.industryGroups[g.id]
        : !newIndustrySelection.industryGroups[g.id]
    );

    if (allGroupsSelected) {
      newIndustrySelection.sectors[sector.id] = true;
    } else if (allGroupsDeselected) {
      newIndustrySelection.sectors[sector.id] = false;
    }

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  const updateIndustriesInFormData = (selection: IndustrySelection) => {
    if (!industryData) return;

    const selectedIndustries: string[] = [];

    industryData.sectors.forEach((sector) => {
      const sectorSelected = selection.sectors[sector.id];

      if (sectorSelected) {
        selectedIndustries.push(sector.name); // ✅ include sector name
      }

      sector.industryGroups.forEach((group) => {
        const groupSelected = selection.industryGroups[group.id];

        if (groupSelected) {
          selectedIndustries.push(group.name); // ✅ include group name
        }

        group.industries.forEach((industry) => {
          if (selection.industries[industry.id]) {
            selectedIndustries.push(industry.name); // ✅ include each selected sub-industry
          }
        });
      });
    });

    const uniqueIndustries = [...new Set(selectedIndustries)]; // remove duplicates
    handleNestedChange("targetCriteria", "industrySectors", uniqueIndustries);
  };

  const removeIndustry = (industryToRemove: string) => {
    if (!industryData) return;

    const newIndustrySelection = { ...industrySelection };
    let found = false;

    industryData.sectors.forEach((sector) => {
      if (sector.name === industryToRemove) {
        newIndustrySelection.sectors[sector.id] = false;
        found = true;

        sector.industryGroups.forEach((group) => {
          newIndustrySelection.industryGroups[group.id] = false;

          group.industries.forEach((industry) => {
            newIndustrySelection.industries[industry.id] = false;
          });
        });
      }

      if (!found) {
        sector.industryGroups.forEach((group) => {
          if (group.name === industryToRemove) {
            newIndustrySelection.industryGroups[group.id] = false;
            found = true;

            group.industries.forEach((industry) => {
              newIndustrySelection.industries[industry.id] = false;
            });

            const allGroupsDeselected = sector.industryGroups.every(
              (g) => !newIndustrySelection.industryGroups[g.id]
            );

            if (allGroupsDeselected) {
              newIndustrySelection.sectors[sector.id] = false;
            }
          }

          if (!found) {
            group.industries.forEach((industry) => {
              if (industry.name === industryToRemove) {
                newIndustrySelection.industries[industry.id] = false;
                found = true;

                const allIndustriesDeselected = group.industries.every(
                  (i) => !newIndustrySelection.industries[i.id]
                );

                if (allIndustriesDeselected) {
                  newIndustrySelection.industryGroups[group.id] = false;

                  const allGroupsDeselected = sector.industryGroups.every(
                    (g) => !newIndustrySelection.industryGroups[g.id]
                  );

                  if (allGroupsDeselected) {
                    newIndustrySelection.sectors[sector.id] = false;
                  }
                }
              }
            });
          }
        });
      }
    });

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  // Toggle expansion of UI sections
  const toggleContinentExpansion = (continentId: string) => {
    setExpandedContinents((prev) => ({
      ...prev,
      [continentId]: !prev[continentId],
    }));
  };

  const toggleRegionExpansion = (regionId: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionId]: !prev[regionId],
    }));
  };

  const toggleSectorExpansion = (sectorId: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sectorId]: !prev[sectorId],
    }));
  };

  const toggleIndustryGroupExpansion = (groupId: string) => {
    setExpandedIndustryGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Filter geography data based on search term
  const filterGeographyData = () => {
    if (!geoData || !countrySearchTerm) return geoData;

    const filteredContinents: Continent[] = [];

    geoData.continents.forEach((continent) => {
      const filteredRegions = continent.regions.filter((region) =>
        region.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
      );

      if (filteredRegions.length > 0) {
        filteredContinents.push({
          ...continent,
          regions: filteredRegions,
        });
      }
    });

    return { continents: filteredContinents };
  };

  const selectSearchedCountry = (countryName: string) => {
    if (!geoData) return;

    let found = false;

    geoData.continents.forEach((continent) => {
      if (continent.name.toLowerCase().includes(countryName.toLowerCase())) {
        toggleContinent(continent);
        found = true;
        return;
      }

      continent.regions.forEach((region) => {
        if (region.name.toLowerCase().includes(countryName.toLowerCase())) {
          toggleRegion(region, continent);
          found = true;
          return;
        }

        if (region.subRegions) {
          region.subRegions.forEach((subRegion) => {
            if (
              subRegion.name.toLowerCase().includes(countryName.toLowerCase())
            ) {
              toggleSubRegion(subRegion, region, continent);
              found = true;
              return;
            }
          });
        }
      });
    });

    if (found) {
      setCountrySearchTerm("");
    }
  };

  // Filter industry data based on search term
  const filterIndustryData = () => {
    if (!industryData || !industrySearchTerm) return industryData;

    const filteredSectors: Sector[] = [];

    industryData.sectors.forEach((sector) => {
      const filteredGroups: IndustryGroup[] = [];

      sector.industryGroups.forEach((group) => {
        const filteredIndustries: Industry[] = [];

        group.industries.forEach((industry) => {
          if (
            industry.name
              .toLowerCase()
              .includes(industrySearchTerm.toLowerCase())
          ) {
            filteredIndustries.push(industry);
          }
        });

        if (
          filteredIndustries.length > 0 ||
          group.name.toLowerCase().includes(industrySearchTerm.toLowerCase())
        ) {
          filteredGroups.push({
            ...group,
            industries:
              filteredIndustries.length > 0
                ? filteredIndustries
                : group.industries,
          });
        }
      });

      if (
        filteredGroups.length > 0 ||
        sector.name.toLowerCase().includes(industrySearchTerm.toLowerCase())
      ) {
        filteredSectors.push({
          ...sector,
          industryGroups:
            filteredGroups.length > 0 ? filteredGroups : sector.industryGroups,
        });
      }
    });

    return { sectors: filteredSectors };
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    errors["companyName"] =
      validateField("companyName", formData.companyName) || "";
    errors["website"] = validateField("website", formData.website) || "";
    errors["companyType"] =
      validateField("companyType", formData.companyType) || "";
    errors["capitalEntity"] =
      validateField("capitalEntity", formData.capitalEntity) || "";

    // Contact validation
    if (formData.contacts.length === 0) {
      errors["contacts"] = "At least one contact is required";
    } else {
      const emailCount: Record<string, number> = {};

      // Step 1: Validate fields and count emails
      formData.contacts.forEach((contact, index) => {
        const nameError = validateField("contact.name", contact.name);
        const emailError = validateField("contact.email", contact.email);
        const phoneError = validateField("contact.phone", contact.phone);

        errors[`contacts[${index}].name`] = nameError || "";
        errors[`contacts[${index}].email`] = emailError || "";
        errors[`contacts[${index}].phone`] = phoneError || "";

        const email = contact.email?.trim().toLowerCase();
        if (email) {
          emailCount[email] = (emailCount[email] || 0) + 1;
        }
      });

      // Step 2: Add duplicate email errors
      formData.contacts.forEach((contact, index) => {
        const email = contact.email?.trim().toLowerCase();
        if (email && emailCount[email] > 1) {
          errors[`contacts[${index}].email`] = "Duplicate email is not allowed";
        }
      });
    }

    errors["agreements.termsAndConditionsAccepted"] =
      validateField(
        "agreements.termsAndConditions",
        formData.agreements.termsAndConditionsAccepted
      ) || "";
    errors["agreements.ndaAccepted"] =
      validateField("agreements.nda", formData.agreements.ndaAccepted) || "";
    errors["agreements.feeAgreementAccepted"] =
      validateField(
        "agreements.feeAgreement",
        formData.agreements.feeAgreementAccepted
      ) || "";

    if (
      formData.targetCriteria.revenueMin !== undefined &&
      formData.targetCriteria.revenueMax !== undefined &&
      formData.targetCriteria.revenueMin > formData.targetCriteria.revenueMax
    ) {
      errors["targetCriteria.revenueMin"] =
        "Minimum revenue cannot be greater than maximum revenue";
      errors["targetCriteria.revenueMax"] =
        "Maximum revenue cannot be less than minimum revenue";
    }

    if (
      formData.targetCriteria.ebitdaMin !== undefined &&
      formData.targetCriteria.ebitdaMax !== undefined &&
      formData.targetCriteria.ebitdaMin > formData.targetCriteria.ebitdaMax
    ) {
      errors["targetCriteria.ebitdaMin"] =
        "Minimum EBITDA cannot be greater than maximum EBITDA";
      errors["targetCriteria.ebitdaMax"] =
        "Maximum EBITDA cannot be less than minimum EBITDA";
    }

    if (
      formData.targetCriteria.transactionSizeMin !== undefined &&
      formData.targetCriteria.transactionSizeMax !== undefined &&
      formData.targetCriteria.transactionSizeMin >
        formData.targetCriteria.transactionSizeMax
    ) {
      errors["targetCriteria.transactionSizeMin"] =
        "Minimum transaction size cannot be greater than maximum transaction size";
      errors["targetCriteria.transactionSizeMax"] =
        "Maximum transaction size cannot be less than minimum transaction size";
    }

    errors["targetCriteria.revenueGrowth"] =
      validateField(
        "targetCriteria.revenueGrowth",
        formData.targetCriteria.revenueGrowth
      ) || "";

    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some((error) => error !== "");
    return hasErrors ? "Please correct the errors in the form" : null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken || !isClient) {
      toast({
        title: "Authentication Required",
        description: "Please log in again to submit your profile.",
        variant: "destructive",
      });
      router.push("/buyer/login");
      return;
    }

    if (!profileId) {
      toast({
        title: "Profile Not Found",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form before submitting.",
        variant: "destructive",
      });

      const firstErrorField = Object.keys(fieldErrors).find(
        (key) => fieldErrors[key]
      );
      if (firstErrorField) {
        const element = document.getElementById(
          firstErrorField.replace(/\[|\]|\./g, "-")
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }

      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const profileData = {
        ...formData,
      };



      const updateData = { ...profileData };
      delete (updateData as any)._id;
      delete (updateData as any).createdAt;
      delete (updateData as any).updatedAt;
      delete (updateData as any).__v;
      delete (updateData as any).buyer;
      delete (updateData as any).agreementsAcceptedAt; // <-- Prevent sending this field



      const response = await fetch(`${apiUrl}/company-profiles/${profileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });



      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));


        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });

          setTimeout(() => {
            router.push("/buyer/login?session=expired");
          }, 2000);

          throw new Error("Authentication expired. Please log in again.");
        }

        throw new Error(
          `API Error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const result = await response.json();


      setSubmitStatus("success");

      // ✅ Redirect to /buyer/deals directly
      setTimeout(() => {
        router.push("/buyer/deals");
      }, 2000);
    } catch (error: any) {

      setSubmitStatus("error");
      setErrorMessage(
        error.message || "An error occurred while updating your profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to load states and cities for a country
  const getStates = (countryCode: string) => {
    return State.getStatesOfCountry(countryCode);
  };

  // Render hierarchical geography selection
  const renderGeographySelection = () => {
    const allCountries = Country.getAllCountries();

    return (
      <div className="space-y-2 font-poppins">
        {allCountries.map((country) => (
          <div key={country.isoCode} className="border-b border-gray-100 pb-1">
            <div className="flex items-center">
              <input
                type="radio"
                id={`geo-${country.isoCode}`}
                name="geography"
                checked={formData.targetCriteria.countries.includes(
                  country.name
                )}
                onChange={() => {
                  setFormData((prev) => ({
                    ...prev,
                    targetCriteria: {
                      ...prev.targetCriteria,
                      countries: [country.name],
                    },
                  }));
                }}
                className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9] checked:bg-[#3aafa9] checked:border-[#3aafa9]"
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
                  <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                )}
                <Label
                  htmlFor={`geo-${country.isoCode}`}
                  className="text-[#344054] cursor-pointer font-medium"
                >
                  {country.name}
                </Label>
              </div>
            </div>
            {expandedCountries[country.isoCode] && (
              <div className="ml-6 mt-1 space-y-1">
                {getStates(country.isoCode).map((state) => (
                  <div key={state.isoCode} className="pl-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`geo-${country.isoCode}-${state.isoCode}`}
                        name="geography"
                        checked={formData.targetCriteria.countries.includes(
                          `${country.name} > ${state.name}`
                        )}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            targetCriteria: {
                              ...prev.targetCriteria,
                              countries: [`${country.name} > ${state.name}`],
                            },
                          }));
                        }}
                        className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9] checked:bg-[#3aafa9] checked:border-[#3aafa9]"
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
                        {expandedStates[
                          `${country.isoCode}-${state.isoCode}`
                        ] ? (
                          <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                        )}
                        <Label
                          htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                          className="text-[#344054] cursor-pointer"
                        >
                          {state.name}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render the hierarchical industry selection
  const renderIndustrySelection = () => {
    const filteredData = filterIndustryData();
    if (!filteredData) return <div>Loading industry data...</div>;

    return (
      <div className="space-y-2">
        {filteredData.sectors.map((sector) => (
          <div key={sector.id} className="border-b border-gray-100 pb-1">
            <div className="flex items-center">
              <Checkbox
                id={`sector-${sector.id}`}
                checked={!!industrySelection.sectors[sector.id]}
                onCheckedChange={(checked) => {
                  toggleSector(sector);
                }}
                className="mr-2 border-[#d0d5dd] data-[state=checked]:bg-[#3aafa9] data-[state=checked]:border-[#3aafa9] focus:ring-[#3aafa9]"
              />
              <div
                className="flex items-center cursor-pointer flex-1"
                onClick={() => toggleSectorExpansion(sector.id)}
              >
                {expandedSectors[sector.id] ? (
                  <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                )}
                <Label
                  htmlFor={`sector-${sector.id}`}
                  className="text-[#344054] cursor-pointer font-medium"
                >
                  {sector.name}
                </Label>
              </div>
            </div>

            {expandedSectors[sector.id] && (
              <div className="ml-6 mt-1 space-y-1">
                {sector.industryGroups.map((group) => (
                  <div key={group.id} className="pl-2">
                    <div className="flex items-center">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={!!industrySelection.industryGroups[group.id]}
                        onCheckedChange={(checked) => {
                          toggleIndustryGroup(group, sector);
                        }}
                        className="mr-2 border-[#d0d5dd] data-[state=checked]:bg-[#3aafa9] data-[state=checked]:border-[#3aafa9] focus:ring-[#3aafa9]"
                      />
                      <div
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => toggleIndustryGroupExpansion(group.id)}
                      >
                        {expandedIndustryGroups[group.id] ? (
                          <ChevronDown className="h-3 w-3 mr-1 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
                        )}
                        <Label
                          htmlFor={`group-${group.id}`}
                          className="text-[#344054] cursor-pointer"
                        >
                          {group.name}
                        </Label>
                      </div>
                    </div>

                    {expandedIndustryGroups[group.id] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {group.industries.map((industry) => (
                          <div key={industry.id} className="pl-2">
                            <div className="flex items-center">
                              <Checkbox
                                id={`industry-${industry.id}`}
                                checked={
                                  !!industrySelection.industries[industry.id]
                                }
                                onCheckedChange={(checked) => {
                                  toggleIndustry(industry, group, sector);
                                }}
                                className="mr-2 border-[#d0d5dd] data-[state=checked]:bg-[#3aafa9] data-[state=checked]:border-[#3aafa9] focus:ring-[#3aafa9]"
                              />
                              <Label
                                htmlFor={`industry-${industry.id}`}
                                className="text-[#344054] cursor-pointer text-sm"
                              >
                                {industry.name}
                              </Label>
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

  // Function to get the complete profile picture URL
  const getProfilePictureUrl = (path: string | null) => {
    if (!path) return null;
    // If it's a base64 image, return as-is
    if (path.startsWith("data:image")) return path;

    const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const formattedPath = path.replace(/\\/g, "/");

    return `${apiUrl}/${
      formattedPath.startsWith("/") ? formattedPath.substring(1) : formattedPath
    }`;
  };

  // Handle logout
  const handleLogout = () => {
    if (!isClient) return;


    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/buyer/login");
  };

  // Add expansion state for countries and states for the geography selector UI
  const [expandedCountries, setExpandedCountries] = useState<
    Record<string, boolean>
  >({});
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    {}
  );

  // Add after industryData and formData are defined
  useEffect(() => {
    if (!industryData || !formData.targetCriteria.industrySectors) return;
    const newIndustrySelection: IndustrySelection = {
      sectors: {},
      industryGroups: {},
      industries: {},
    };
    industryData.sectors.forEach((sector) => {
      if (formData.targetCriteria.industrySectors.includes(sector.name)) {
        newIndustrySelection.sectors[sector.id] = true;
      }
      sector.industryGroups.forEach((group) => {
        if (formData.targetCriteria.industrySectors.includes(group.name)) {
          newIndustrySelection.industryGroups[group.id] = true;
        }
        group.industries.forEach((industry) => {
          if (formData.targetCriteria.industrySectors.includes(industry.name)) {
            newIndustrySelection.industries[industry.id] = true;
          }
        });
      });
    });
    setIndustrySelection(newIndustrySelection);
  }, [industryData, formData.targetCriteria.industrySectors]);

  // Check if profile is complete
  const isProfileComplete = (profile: any): boolean => {
    if (!profile) return false;
    if (
      !profile.companyName ||
      !profile.website ||
      profile.contacts?.length === 0 ||
      !profile.companyType ||
      !profile.capitalEntity ||
      profile.dealsCompletedLast5Years === undefined ||
      profile.averageDealSize === undefined
    ) {
      return false;
    }
    const contactsComplete = profile.contacts?.every(
      (contact: any) => contact.name && contact.email && contact.phone
    );
    if (!contactsComplete) return false;
    if (
      !profile.targetCriteria ||
      profile.targetCriteria.countries?.length === 0 ||
      profile.targetCriteria.industrySectors?.length === 0 ||
      profile.targetCriteria.revenueMin === undefined ||
      profile.targetCriteria.revenueMax === undefined ||
      profile.targetCriteria.ebitdaMin === undefined ||
      profile.targetCriteria.ebitdaMax === undefined ||
      profile.targetCriteria.transactionSizeMin === undefined ||
      profile.targetCriteria.transactionSizeMax === undefined ||
      profile.targetCriteria.revenueGrowth === undefined ||
      profile.targetCriteria.minYearsInBusiness === undefined ||
      !profile.targetCriteria.preferredBusinessModels ||
      profile.targetCriteria.preferredBusinessModels.length === 0 ||
      !profile.targetCriteria.description
    ) {
      return false;
    }
    if (!profile.agreements || !profile.agreements.feeAgreementAccepted) {
      return false;
    }
    return true;
  };

  // Store profile completeness state
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  // Check profile completeness
  useEffect(() => {
    if (formData && formData.companyName) {
      setProfileComplete(isProfileComplete(formData));
    }
  }, [formData]);

  // Sort deals newest to oldest and filter - only show deals where buyer hasn't interacted yet
  const visibleMarketplaceDeals = deals
    .filter((deal) => {
      const status = (deal.currentBuyerStatus || 'none').toLowerCase();
      // Only show deals that the buyer hasn't added to Active yet
      return status === 'none';
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Newest first
    });

  // Helper to check if deal is LOI
  const isLOIDeal = (deal: any) => deal.status === 'loi';

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
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
                <nav className="flex flex-col space-y-2">
                  <Link
                    href="/buyer/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Briefcase className="mr-3 h-5 w-5" />
                    <span>All Deals</span>
                  </Link>
                  <Link
                    href="/buyer/marketplace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md bg-teal-500 px-4 py-3 text-white hover:bg-teal-600 transition-colors"
                  >
                    <Store className="mr-3 h-5 w-5" />
                    <span>MarketPlace</span>
                  </Link>
                  <Link
                    href="/buyer/company-profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    <span>Company Profile</span>
                  </Link>
                  <Link
                    href="/buyer/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="mr-3 h-5 w-5" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center rounded-md px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-left w-full transition-colors"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo - hidden on mobile, shown on desktop */}
            <Link href="https://cimamplify.com/" className="hidden md:flex items-center">
              <Image src="/logo.svg" width={150} height={40} alt="CIM Amplify" className="h-8 sm:h-10 w-auto" />
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">MarketPlace</h1>
          </div>

          {/* Right side: Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-medium text-sm sm:text-base truncate max-w-[150px]">
                {buyerProfile?.fullName || "User"}
              </div>
            </div>
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {buyerProfile?.profilePicture ? (
                <img
                  src={getProfilePictureUrl(buyerProfile.profilePicture) || "/placeholder.svg"}
                  alt={buyerProfile.fullName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {buyerProfile?.fullName?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] w-full box-border flex-1">
        {/* Sidebar - Sticky */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-[4rem] h-[calc(100vh-4rem)] border-r border-gray-200 bg-white overflow-y-auto">
            <nav className="flex flex-col p-4">
            <Link
              href="/buyer/deals"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Briefcase className="mr-3 h-5 w-5" />
              <span>All Deals</span>
            </Link>
            <Link
              href="/buyer/marketplace"
              className="mb-2 flex items-center rounded-md bg-teal-500 px-4 py-3 text-white hover:bg-teal-600 transition-colors"
            >
              <Store className="mr-3 h-5 w-5" />
              <span>MarketPlace</span>
            </Link>
            <Link
              href="/buyer/company-profile"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="mr-3 h-5 w-5" />
              <span>Company Profile</span>
            </Link>
            <Link
              href="/buyer/profile"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>My Profile</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center rounded-md px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-left w-full transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sign Out</span>
            </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-50">
          {/* Show warning if profile incomplete */}
          {profileComplete === false && (
            <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-yellow-800 border border-yellow-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Complete your Company Profile to access Marketplace deals
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You must fill out your company profile before browsing or requesting access to marketplace deals.
                  </p>
                </div>
                <Link href="/buyer/company-profile">
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {dealsLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AAFA9]"></div>
              <p className="text-gray-500">Loading marketplace deals...</p>
            </div>
          ) : profileComplete === false ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-600 font-medium">Marketplace Access Restricted</p>
                <p className="text-gray-500 text-sm mt-1">Please complete your company profile to view available deals.</p>
              </div>
              <Link href="/buyer/company-profile">
                <Button className="bg-[#3AAFA9] hover:bg-[#2d8f8a] text-white">
                  Complete Profile
                </Button>
              </Link>
            </div>
          ) : visibleMarketplaceDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <Store className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No public deals available right now.</p>
              <p className="text-gray-500 text-sm">Check back soon for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleMarketplaceDeals.map((deal) => {
                const isLoading = !!requestLoading[deal._id];
                const isLOI = isLOIDeal(deal);
                return (
                  <div
                    key={deal._id}
                    className={`border rounded-xl p-5 shadow-sm flex flex-col gap-4 transition-all duration-200 ${
                      isLOI 
                        ? 'bg-yellow-50 border-yellow-300 hover:shadow-md hover:border-yellow-400' 
                        : 'bg-white hover:shadow-lg hover:border-[#3AAFA9]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-lg leading-tight">Deal Overview</h3>
                          {isLOI && (
                            <span className="text-xs px-2 py-1 bg-yellow-500 text-white rounded-full font-semibold">
                              LOI
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className={`text-sm text-gray-600 ${!expandedDescriptions[deal._id] ? 'line-clamp-4' : ''}`}>
                            {deal.companyDescription || 'Summary coming soon.'}
                          </p>
                          {deal.companyDescription && deal.companyDescription.length > 200 && (
                            <button
                              type="button"
                              onClick={() => setExpandedDescriptions(prev => ({
                                ...prev,
                                [deal._id]: !prev[deal._id]
                              }))}
                              className="text-[#3AAFA9] hover:text-[#2d8f8a] text-sm font-medium mt-1 transition-colors"
                            >
                              {expandedDescriptions[deal._id] ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </div>
                      {deal.isFeatured && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0 font-medium">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-100">
                        <div className="text-xs uppercase text-gray-500 font-medium">Industry</div>
                        <div className="font-semibold text-gray-900 mt-1">{deal.industrySector || 'Not provided'}</div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-100">
                        <div className="text-xs uppercase text-gray-500 font-medium">Geography</div>
                        <div className="font-semibold text-gray-900 mt-1">{deal.geographySelection || 'Not provided'}</div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-100">
                        <div className="text-xs uppercase text-gray-500 font-medium">Years in Business</div>
                        <div className="font-semibold text-gray-900 mt-1">{deal.yearsInBusiness ?? 'Not provided'}</div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-100">
                        <div className="text-xs uppercase text-gray-500 font-medium">Business Model</div>
                        <div className="font-semibold text-gray-900 mt-1">{getBusinessModelSummary(deal.businessModel)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-gradient-to-br from-[#3AAFA9]/5 to-[#3AAFA9]/10 p-3 border border-[#3AAFA9]/20">
                        <div className="text-xs uppercase text-[#2B7A78] font-medium">T12 Revenue</div>
                        <div className="font-semibold text-gray-900 mt-1">
                          {formatCurrencyDisplay(
                            deal.financialDetails?.trailingRevenueAmount,
                            deal.financialDetails?.trailingRevenueCurrency
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-[#3AAFA9]/5 to-[#3AAFA9]/10 p-3 border border-[#3AAFA9]/20">
                        <div className="text-xs uppercase text-[#2B7A78] font-medium">T12 EBITDA</div>
                        <div className="font-semibold text-gray-900 mt-1">
                          {formatCurrencyDisplay(
                            deal.financialDetails?.trailingEBITDAAmount,
                            deal.financialDetails?.trailingEBITDACurrency
                          )}
                        </div>
                      </div>
                      {deal.financialDetails?.netIncome !== 0 && (
                        <div className="rounded-lg bg-gradient-to-br from-[#3AAFA9]/5 to-[#3AAFA9]/10 p-3 border border-[#3AAFA9]/20">
                          <div className="text-xs uppercase text-[#2B7A78] font-medium">Net Income</div>
                          <div className="font-semibold text-gray-900 mt-1">
                            {formatCurrencyDisplay(
                              deal.financialDetails?.netIncome,
                              deal.financialDetails?.netIncomeCurrency
                            )}
                          </div>
                        </div>
                      )}
                      {deal.financialDetails?.askingPrice !== 0 && (
                        <div className="rounded-lg bg-gradient-to-br from-[#3AAFA9]/5 to-[#3AAFA9]/10 p-3 border border-[#3AAFA9]/20">
                          <div className="text-xs uppercase text-[#2B7A78] font-medium">Asking Price</div>
                          <div className="font-semibold text-gray-900 mt-1">
                            {formatCurrencyDisplay(
                              deal.financialDetails?.askingPrice,
                              deal.financialDetails?.askingPriceCurrency
                            )}
                          </div>
                        </div>
                      )}
                      <div className="rounded-lg bg-gradient-to-br from-[#3AAFA9]/5 to-[#3AAFA9]/10 p-3 border border-[#3AAFA9]/20 col-span-2">
                        <div className="text-xs uppercase text-[#2B7A78] font-medium">Avg. 3-Year Revenue Growth</div>
                        <div className="font-semibold text-gray-900 mt-1">{formatPercentDisplay(deal.financialDetails?.avgRevenueGrowth)}</div>
                      </div>
                    </div>

                    {isLOI ? (
                      <div className="rounded-lg bg-yellow-100 border border-yellow-300 p-4 text-center">
                        <p className="text-sm font-semibold text-yellow-800">
                          🔒 This deal is currently paused for LOI negotiations
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          The advisor will notify you when it becomes available again
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 text-center">
                          Click below to add this deal to your Active deals
                        </p>

                        <div className="flex flex-col gap-2">
                          <Button
                            disabled={isLoading || !!notInterestedLoading[deal._id]}
                            onClick={() => handleRequestAccess(deal._id)}
                            className={`w-full bg-[#3AAFA9] hover:bg-[#2d8f8a] text-white font-medium py-3 h-auto whitespace-normal text-center leading-tight transition-all duration-200 ${isLoading ? 'opacity-70 cursor-wait' : 'hover:shadow-md'}`}
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Adding...
                              </span>
                            ) : (
                              <span>Request More Information and<br className="hidden sm:inline md:hidden lg:inline" /> Move to Active</span>
                            )}
                          </Button>
                          <Button
                            disabled={isLoading || !!notInterestedLoading[deal._id]}
                            onClick={() => handleNotInterested(deal._id)}
                            className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 transition-all duration-200 ${notInterestedLoading[deal._id] ? 'opacity-70 cursor-wait' : 'hover:shadow-md'}`}
                          >
                            {notInterestedLoading[deal._id] ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Removing...
                              </span>
                            ) : (
                              'Not Interested'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
