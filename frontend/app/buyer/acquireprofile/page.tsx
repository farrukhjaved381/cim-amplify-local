"use client";

import type React from "react";
import Link from "next/link";
import { useToast, toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Toaster } from "@/components/ui/toaster";
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
  Store,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Define the CompanyProfile type to match formData structure
interface CompanyProfile {
  companyName: string;
  website: string;
  contacts: { name: string; email: string; phone: string }[];
  companyType: string;
  capitalEntity: string | undefined;
  dealsCompletedLast5Years?: number;
  averageDealSize?: number;
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
    description: string;
  };
  agreements: {
    feeAgreementAccepted: boolean;
  };
  selectedCurrency: string;
}

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

const CAPITAL_ENTITIES = ["Fund", "Holding Company", "SPV", "Direct Investment"];

const BUSINESS_MODELS = [
  "Recurring Revenue",
  "Project-Based",
  "Asset Light",
  "Asset Heavy",
];

const DEFAULT_API_URL = "https://cim-backend.vercel.app";

export default function AcquireProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [authToken, setAuthToken] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);
  const [geoSelection, setGeoSelection] = useState<HierarchicalSelection>({
    continents: {},
    regions: {},
    subRegions: {},
  });
  const [industrySelection, setIndustrySelection] = useState<IndustrySelection>({
    sectors: {},
    industryGroups: {},
    industries: {},
  });
  const [expandedContinents, setExpandedContinents] = useState<Record<string, boolean>>({});
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [expandedIndustryGroups, setExpandedIndustryGroups] = useState<Record<string, boolean>>({});
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

  // Form state with proper initialization
  const [formData, setFormData] = useState<CompanyProfile>({
    companyName: "",
    website: "",
    contacts: [{ name: "", email: "", phone: "" }],
    companyType: "",
    capitalEntity: undefined,
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
      preferredBusinessModels: [], // Ensure this is always an array
      description: "",
    },
    agreements: {
      feeAgreementAccepted: false,
    },
    selectedCurrency: "USD",
  });

  // Format number with commas
  const formatNumberWithCommas = (value: number | undefined) => {
    if (value === undefined) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Check for token and userId on mount
  useEffect(() => {
    const urlToken = searchParams?.get("token");
    const urlUserId = searchParams?.get("userId");

    if (urlToken) {
      const cleanToken = urlToken.trim();
      localStorage.setItem("token", cleanToken);
      setAuthToken(cleanToken);
      console.log("Token set from URL:", cleanToken.substring(0, 10) + "...");
    } else {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const cleanToken = storedToken.trim();
        setAuthToken(cleanToken);
        console.log("Token set from localStorage:", cleanToken.substring(0, 10) + "...");
      } else {
        console.warn("No token found, redirecting to login");
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        router.push("/buyer/login");
        return;
      }
    }

    if (urlUserId) {
      const cleanUserId = urlUserId.trim();
      localStorage.setItem("userId", cleanUserId);
      setBuyerId(cleanUserId);
      console.log("Buyer ID set from URL:", cleanUserId);
    } else {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        const cleanUserId = storedUserId.trim();
        setBuyerId(cleanUserId);
        console.log("Buyer ID set from localStorage:", cleanUserId);
      }
    }

    const storedApiUrl = localStorage.getItem("apiUrl");
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }
  }, [searchParams, router]);

  // Fetch data and initialize industrySelection
  useEffect(() => {
    const fetchData = async () => {
      try {
        const geo = await getGeoData();
        setGeoData(geo);
        const industry = await getIndustryData();
        console.log("Fetched industryData:", JSON.stringify(industry, null, 2));
        setIndustryData(industry);

        const initialIndustrySelection: IndustrySelection = {
          sectors: {},
          industryGroups: {},
          industries: {},
        };
        industry?.sectors.forEach((sector) => {
          initialIndustrySelection.sectors[sector.id] = false;
          sector.industryGroups.forEach((group) => {
            initialIndustrySelection.industryGroups[group.id] = false;
            group.industries.forEach((industry) => {
              initialIndustrySelection.industries[industry.id] = false;
            });
          });
        });
        setIndustrySelection(initialIndustrySelection);

        if (authToken) {
          await fetchUserProfile();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Data Loading Error",
          description: "Failed to load geography and industry data.",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [authToken]);

  // Fetch user's existing profile data
  const fetchUserProfile = async () => {
    if (!authToken || !buyerId) {
      console.warn("No authToken or buyerId, cannot fetch profile", { authToken, buyerId });
      return;
    }
    try {
      const apiUrl = localStorage.getItem("apiUrl") || DEFAULT_API_URL;
      console.log("Fetching buyer details from:", `${apiUrl}/buyers/me`, "with token:", authToken.substring(0, 10) + "...", "buyerId:", buyerId);

      const buyerRes = await fetch(`${apiUrl}/buyers/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!buyerRes.ok) {
        const errorBody = await buyerRes.text();
        console.error("Failed to fetch buyer details:", {
          status: buyerRes.status,
          statusText: buyerRes.statusText,
          body: errorBody,
        });
        throw new Error(`Failed to fetch buyer details: ${buyerRes.status} ${buyerRes.statusText}`);
      }

      const buyerDetails = await buyerRes.json();
      console.log("Fetched buyerDetails:", buyerDetails);

      const profileRes = await fetch(`${apiUrl}/company-profiles/my-profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log("Existing profile loaded:", profileData);
        console.log("profileData.capitalEntity:", profileData.capitalEntity);

        // Map industrySectors to industrySelection
        const newIndustrySelection: IndustrySelection = {
          sectors: { ...industrySelection.sectors },
          industryGroups: { ...industrySelection.industryGroups },
          industries: { ...industrySelection.industries },
        };
        if (industryData && profileData.targetCriteria?.industrySectors?.length) {
          profileData.targetCriteria.industrySectors.forEach((industryName: string) => {
            industryData.sectors.forEach((sector) => {
              if (sector.name === industryName) {
                newIndustrySelection.sectors[sector.id] = true;
              }
              sector.industryGroups.forEach((group) => {
                if (group.name === industryName) {
                  newIndustrySelection.industryGroups[group.id] = true;
                }
                group.industries.forEach((industry) => {
                  if (industry.name === industryName) {
                    newIndustrySelection.industries[industry.id] = true;
                  }
                });
              });
            });
          });
          setIndustrySelection(newIndustrySelection);
        }

        // Ensure preferredBusinessModels is an array
        const preferredBusinessModels = Array.isArray(profileData.targetCriteria?.preferredBusinessModels)
          ? profileData.targetCriteria.preferredBusinessModels
          : Array.isArray(profileData.targetCriteria?.businessModels)
            ? profileData.targetCriteria.businessModels
            : [];

        setFormData({
          ...formData,
          companyName: buyerDetails.companyName || profileData.companyName || "",
          website: buyerDetails.website || profileData.companyWebsite || profileData.website || "",
          companyType: profileData.companyType || "",
          capitalEntity: profileData.capitalEntity || undefined,
          dealsCompletedLast5Years: profileData.dealsCompletedLast5Years || undefined,
          averageDealSize: profileData.averageDealSize || undefined,
          contacts: buyerDetails.fullName && buyerDetails.email
            ? [{ name: buyerDetails.fullName, email: buyerDetails.email, phone: buyerDetails.phone || "" }]
            : (profileData.contacts?.length
                ? profileData.contacts
                : [{ name: "", email: "", phone: "" }]),
          targetCriteria: {
            countries: profileData.targetCriteria?.countries || [],
            industrySectors: profileData.targetCriteria?.industrySectors || [],
            revenueMin: profileData.targetCriteria?.revenueMin || undefined,
            revenueMax: profileData.targetCriteria?.revenueMax || undefined,
            ebitdaMin: profileData.targetCriteria?.ebitdaMin || undefined,
            ebitdaMax: profileData.targetCriteria?.ebitdaMax || undefined,
            transactionSizeMin: profileData.targetCriteria?.transactionSizeMin || undefined,
            transactionSizeMax: profileData.targetCriteria?.transactionSizeMax || undefined,
            revenueGrowth: profileData.targetCriteria?.revenueGrowth || undefined,
            minStakePercent: profileData.targetCriteria?.minStakePercent || undefined,
            minYearsInBusiness: profileData.targetCriteria?.minYearsInBusiness || undefined,
            preferredBusinessModels, // Use the ensured array
            description: profileData.targetCriteria?.description || "",
          },
          preferences: {
            stopSendingDeals: profileData.preferences?.stopSendingDeals || false,
            doNotSendMarketedDeals: profileData.preferences?.doNotSendMarketedDeals || false,
            allowBuyerLikeDeals: profileData.preferences?.allowBuyerLikeDeals || false,
          },
          agreements: {
            termsAndConditionsAccepted: profileData.agreements?.termsAndConditionsAccepted || false,
            ndaAccepted: profileData.agreements?.ndaAccepted || false,
            feeAgreementAccepted: profileData.agreements?.feeAgreementAccepted || false,
          },
          selectedCurrency: profileData.selectedCurrency || "USD",
        });
        setGeoSelection(profileData.targetCriteria?.countries || []);
        toast({ title: "Profile Loaded", description: "Your existing profile has been loaded." });
      } else if (profileRes.status === 404) {
        console.log("No existing profile found, setting formData from buyerDetails:", buyerDetails);
        setFormData({
          ...formData,
          companyName: buyerDetails.companyName || "",
          website: buyerDetails.website || "",
          contacts: buyerDetails.fullName && buyerDetails.email
            ? [{ name: buyerDetails.fullName, email: buyerDetails.email, phone: buyerDetails.phone || "" }]
            : [{ name: "", email: "", phone: "" }],
        });
        toast({ title: "New Profile", description: "Please fill out your company profile details." });
      } else {
        const errorBody = await profileRes.text();
        console.error("Failed to fetch company profile:", {
          status: profileRes.status,
          statusText: profileRes.statusText,
          body: errorBody,
        });
        throw new Error(`Failed to fetch company profile: ${profileRes.status} ${profileRes.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching profile:", error, {
        apiUrl: localStorage.getItem("apiUrl") || DEFAULT_API_URL,
        authToken: authToken?.substring(0, 10) + "...",
        buyerId,
      });
      toast({ title: "Error", description: "Failed to load your profile. Please try again.", variant: "destructive" });
    }
  };

  // Validate individual fields
const validateField = (field: string, value: any): string | null => {
  switch (field) {
    case "companyName":
      return !value?.trim() ? "Company name is required" : null;
    case "website":
      // Remove strict URL validation, allow simple domains
      if (!value?.trim()) return null; // Allow empty for optional fields
      if (!value.includes(".")) {
        return "Please enter a valid website (e.g., example.com)";
      }
      return null;
    case "companyType":
      return !value ? "Please select a company type" : null;
    case "capitalEntity":
      return !value ? "Please select capital availability" : null;
    case "contact.name":
      return !value?.trim() ? "Contact name is required" : null;
    case "contact.email":
      if (!value?.trim()) return "Contact email is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(value) ? "Please enter a valid email address (e.g., name@example.com)" : null;
    case "contact.phone":
      if (!value?.trim()) return "Contact phone is required";
      // Simplified phone regex to allow more formats without starting with +
      const phoneRegex = /^\+?[0-9\s.\-()]{7,20}$/; // Allows optional +, spaces, dots, dashes, parentheses, 7-20 digits
      return !phoneRegex.test(value)
        ? "Please enter a valid phone number"
        : null;
    case "agreements.feeAgreement":
      return value ? null : "You must accept the fee agreement";
    case "dealsCompletedLast5Years":
      return value === undefined || value === "" ? "This field is required" : null;
    case "averageDealSize":
      return value === undefined || value === "" ? "This field is required" : null;
    case "targetCriteria.revenueMin":
      return value === undefined || value === "" ? "Minimum revenue is required" : null;
    case "targetCriteria.revenueMax":
      return value === undefined || value === "" ? "Maximum revenue is required" : null;
    case "targetCriteria.ebitdaMin":
      return value === undefined || value === "" ? "Minimum EBITDA is required" : null;
    case "targetCriteria.ebitdaMax":
      return value === undefined || value === "" ? "Maximum EBITDA is required" : null;
    case "targetCriteria.transactionSizeMin":
      return value === undefined || value === "" ? "Minimum transaction size is required" : null;
    case "targetCriteria.transactionSizeMax":
      return value === undefined || value === "" ? "Maximum transaction size is required" : null;
    case "targetCriteria.revenueGrowth":
      return value === undefined || value === "" ? "Minimum 3 Year Average Revenue Growth is required" : null;
    case "targetCriteria.minYearsInBusiness":
      return value === undefined || value === "" ? "Minimum years in business is required" : null;
    case "targetCriteria.minStakePercent":
      return null; // This field is now optional
    case "targetCriteria.countries":
      return value.length === 0 ? "Please select at least one country" : null;
    case "targetCriteria.industrySectors":
      return value.length === 0 ? "Please select at least one industry sector" : null;
    case "targetCriteria.preferredBusinessModels":
      return value.length === 0 ? "Please select at least one business model" : null;
    case "targetCriteria.description":
      return !value?.trim() ? "Description is required" : null;
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
        ...((prev[parent as keyof CompanyProfile] as Record<string, any>) || {}),
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
      handleChange("contacts", [...formData.contacts, { name: "", email: "", phone: "" }]);
    } else {
      toast({
        title: "Maximum contacts reached",
        description: "You can only add up to 3 contacts.",
        variant: "destructive",
      });
    }
  };

  // Remove contact
  const removeContact = (index: number) => {
    const updatedContacts = formData.contacts.filter((_, i) => i !== index);
    handleChange("contacts", updatedContacts);
  };

  // Toggle business model selection
  const toggleBusinessModel = (model: string) => {
    const currentModels = formData.targetCriteria.preferredBusinessModels || [];
    if (currentModels.includes(model)) {
      handleNestedChange(
        "targetCriteria",
        "preferredBusinessModels",
        currentModels.filter((m) => m !== model)
      );
    } else {
      handleNestedChange("targetCriteria", "preferredBusinessModels", [...currentModels, model]);
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

  const toggleSubRegion = (subRegion: SubRegion, region: Region, continent: Continent) => {
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
    const allRegionsSelected = continent.regions.every((r) => newGeoSelection.regions[r.id]);
    if (allRegionsSelected) {
      newGeoSelection.continents[continent.id] = true;
    } else {
      newGeoSelection.continents[continent.id] = false;
    }
    setGeoSelection(newGeoSelection);
    updateCountriesInFormData(newGeoSelection);
  };

  const updateCountriesInFormData = (selection: HierarchicalSelection) => {
    if (!geoData) return;
    const selectedCountries: string[] = [];
    geoData.continents.forEach((continent) => {
      const continentSelected = selection.continents[continent.id];
      const allRegionsSelected = continent.regions.every((region) => {
        if (region.subRegions && region.subRegions.length > 0) {
          return region.subRegions.every((subRegion) => selection.subRegions[subRegion.id]);
        }
        return selection.regions[region.id];
      });
      if (continentSelected && allRegionsSelected) {
        selectedCountries.push(continent.name);
      } else {
        continent.regions.forEach((region) => {
          const regionSelected = selection.regions[region.id];
          if (region.subRegions && region.subRegions.length > 0) {
            const allSubRegionsSelected = region.subRegions.every(
              (subRegion) => selection.subRegions[subRegion.id]
            );
            if (regionSelected && allSubRegionsSelected) {
              selectedCountries.push(region.name);
            } else {
              region.subRegions.forEach((subRegion) => {
                if (selection.subRegions[subRegion.id]) {
                  selectedCountries.push(subRegion.name);
                }
              });
            }
          } else {
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
    let found = false;
    geoData.continents.forEach((continent) => {
      if (continent.name === countryToRemove) {
        newGeoSelection.continents[continent.id] = false;
        found = true;
      }
      continent.regions.forEach((region) => {
        if (region.name === countryToRemove) {
          newGeoSelection.regions[region.id] = false;
          found = true;
        }
        if (region.subRegions) {
          region.subRegions.forEach((subRegion) => {
            if (subRegion.name === countryToRemove) {
              newGeoSelection.subRegions[subRegion.id] = false;
              found = true;
            }
          });
        }
      });
    });
    if (found) {
      setGeoSelection(newGeoSelection);
      updateCountriesInFormData(newGeoSelection);
    }
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
      g.id === group.id ? !isSelected : !newIndustrySelection.industryGroups[g.id]
    );
    if (allGroupsSelected) {
      newIndustrySelection.sectors[sector.id] = true;
    } else if (allGroupsDeselected) {
      newIndustrySelection.sectors[sector.id] = false;
    }
    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  const toggleIndustry = (industry: Industry, group: IndustryGroup, sector: Sector) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.industries[industry.id];
    newIndustrySelection.industries[industry.id] = isSelected;
    const allIndustriesSelected = group.industries.every((i) =>
      i.id === industry.id ? isSelected : newIndustrySelection.industries[i.id]
    );
    const allIndustriesDeselected = group.industries.every((i) =>
      i.id === industry.id ? !isSelected : !newIndustrySelection.industries[i.id]
    );
    if (allIndustriesSelected) {
      newIndustrySelection.industryGroups[group.id] = true;
    } else if (allIndustriesDeselected) {
      newIndustrySelection.industryGroups[group.id] = false;
    }
    const allGroupsSelected = sector.industryGroups.every((g) =>
      g.id === group.id ? newIndustrySelection.industryGroups[g.id] : newIndustrySelection.industryGroups[g.id]
    );
    const allGroupsDeselected = sector.industryGroups.every((g) =>
      g.id === group.id ? !newIndustrySelection.industryGroups[g.id] : !newIndustrySelection.industryGroups[g.id]
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
        selectedIndustries.push(sector.name);
      }
      sector.industryGroups.forEach((group) => {
        const groupSelected = selection.industryGroups[group.id];
        if (groupSelected) {
          selectedIndustries.push(group.name);
        }
        group.industries.forEach((industry) => {
          if (selection.industries[industry.id]) {
            selectedIndustries.push(industry.name);
          }
        });
      });
    });
    const uniqueIndustries = [...new Set(selectedIndustries)];
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

  const scrollToFirstError = (errors: Record<string, string>) => {
  // Define field priority order (top to bottom of form)
  const fieldPriority = [
    "companyName",
    "website", 
    "companyType",
    "capitalEntity",
    "contacts[0].name",
    "contacts[0].email", 
    "contacts[0].phone",
    "contacts[1].name",
    "contacts[1].email",
    "contacts[1].phone", 
    "contacts[2].name",
    "contacts[2].email",
    "contacts[2].phone",
    "dealsCompletedLast5Years",
    "averageDealSize",
    "targetCriteria.countries",
    "targetCriteria.industrySectors", 
    "targetCriteria.revenueMin",
    "targetCriteria.revenueMax",
    "targetCriteria.ebitdaMin",
    "targetCriteria.ebitdaMax",
    "targetCriteria.transactionSizeMin",
    "targetCriteria.transactionSizeMax",
    "targetCriteria.revenueGrowth",
    "targetCriteria.minYearsInBusiness",
    "targetCriteria.preferredBusinessModels",
    "targetCriteria.description",
    "agreements.feeAgreementAccepted"
  ];
  
  // Find the first field with an error based on priority
  const firstErrorField = fieldPriority.find(field => errors[field] && errors[field] !== "");
  
  if (firstErrorField) {
    // Generate element ID from field name
    let elementId = firstErrorField;
    
    // Handle special cases for element IDs
    if (firstErrorField.includes("contacts[")) {
      const match = firstErrorField.match(/contacts\[(\d+)\]\.(\w+)/);
      if (match) {
        const [, index, fieldName] = match;
        elementId = `contact-${fieldName}-${index}`;
      }
    } else if (firstErrorField.startsWith("targetCriteria.")) {
      elementId = firstErrorField.replace("targetCriteria.", "");
    } else if (firstErrorField === "agreements.feeAgreementAccepted") {
      elementId = "feeAgreement";
    }
    
    console.log(`Scrolling to field: ${firstErrorField} with element ID: ${elementId}`);
    
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the element after a short delay
      setTimeout(() => {
        element.focus();
        // If it's a checkbox or radio, highlight its container
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.classList.add('ring-2', 'ring-red-500');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500');
          }, 3000);
        }
      }, 500);
    } else {
      console.warn(`Element with ID ${elementId} not found`);
    }
  }
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
            if (subRegion.name.toLowerCase().includes(countryName.toLowerCase())) {
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

  const { dismiss } = useToast();
  const handleLogout = () => {
    console.log("Logging out");
    dismiss();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/buyer/login");
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
          if (industry.name.toLowerCase().includes(industrySearchTerm.toLowerCase())) {
            filteredIndustries.push(industry);
          }
        });
        if (
          filteredIndustries.length > 0 ||
          group.name.toLowerCase().includes(industrySearchTerm.toLowerCase())
        ) {
          filteredGroups.push({
            ...group,
            industries: filteredIndustries.length > 0 ? filteredIndustries : group.industries,
          });
        }
      });
      if (
        filteredGroups.length > 0 ||
        sector.name.toLowerCase().includes(industrySearchTerm.toLowerCase())
      ) {
        filteredSectors.push({
          ...sector,
          industryGroups: filteredGroups.length > 0 ? filteredGroups : sector.industryGroups,
        });
      }
    });
    return { sectors: filteredSectors };
  };

  // Form validation
  const validateForm = () => {
  const errors: Record<string, string> = {};
  
  // Basic company info
  errors["companyName"] = validateField("companyName", formData.companyName) || "";
  errors["website"] = validateField("website", formData.website) || "";
  errors["companyType"] = validateField("companyType", formData.companyType) || "";
  errors["capitalEntity"] = validateField("capitalEntity", formData.capitalEntity) || "";
  errors["dealsCompletedLast5Years"] = validateField("dealsCompletedLast5Years", formData.dealsCompletedLast5Years) || "";
  errors["averageDealSize"] = validateField("averageDealSize", formData.averageDealSize) || "";
  
  // Contact validation
  if (formData.contacts.length === 0) {
    errors["contacts"] = "At least one contact is required";
  } else {
    const emailCount: Record<string, number> = {};
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
    
    formData.contacts.forEach((contact, index) => {
      const email = contact.email?.trim().toLowerCase();
      if (email && emailCount[email] > 1) {
        errors[`contacts[${index}].email`] = "Duplicate email is not allowed";
      }
    });
  }
  
  // Target criteria validation
  errors["targetCriteria.revenueMin"] = validateField("targetCriteria.revenueMin", formData.targetCriteria.revenueMin) || "";
  errors["targetCriteria.revenueMax"] = validateField("targetCriteria.revenueMax", formData.targetCriteria.revenueMax) || "";
  errors["targetCriteria.ebitdaMin"] = validateField("targetCriteria.ebitdaMin", formData.targetCriteria.ebitdaMin) || "";
  errors["targetCriteria.ebitdaMax"] = validateField("targetCriteria.ebitdaMax", formData.targetCriteria.ebitdaMax) || "";
  errors["targetCriteria.transactionSizeMin"] = validateField("targetCriteria.transactionSizeMin", formData.targetCriteria.transactionSizeMin) || "";
  errors["targetCriteria.transactionSizeMax"] = validateField("targetCriteria.transactionSizeMax", formData.targetCriteria.transactionSizeMax) || "";
  errors["targetCriteria.revenueGrowth"] = validateField("targetCriteria.revenueGrowth", formData.targetCriteria.revenueGrowth) || "";
  errors["targetCriteria.minYearsInBusiness"] = validateField("targetCriteria.minYearsInBusiness", formData.targetCriteria.minYearsInBusiness) || "";
  errors["targetCriteria.minStakePercent"] = validateField("targetCriteria.minStakePercent", formData.targetCriteria.minStakePercent) || "";
  errors["targetCriteria.countries"] = validateField("targetCriteria.countries", formData.targetCriteria.countries) || "";
  errors["targetCriteria.industrySectors"] = validateField("targetCriteria.industrySectors", formData.targetCriteria.industrySectors) || "";
  errors["targetCriteria.preferredBusinessModels"] = validateField("targetCriteria.preferredBusinessModels", formData.targetCriteria.preferredBusinessModels) || "";
  errors["targetCriteria.description"] = validateField("targetCriteria.description", formData.targetCriteria.description) || "";
  
  // Range validations
  if (
    formData.targetCriteria.revenueMin !== undefined &&
    formData.targetCriteria.revenueMax !== undefined &&
    formData.targetCriteria.revenueMin > formData.targetCriteria.revenueMax
  ) {
    errors["targetCriteria.revenueMin"] = "Minimum revenue cannot be greater than maximum revenue";
    errors["targetCriteria.revenueMax"] = "Maximum revenue cannot be less than minimum revenue";
  }
  
  if (
    formData.targetCriteria.ebitdaMin !== undefined &&
    formData.targetCriteria.ebitdaMax !== undefined &&
    formData.targetCriteria.ebitdaMin > formData.targetCriteria.ebitdaMax
  ) {
    errors["targetCriteria.ebitdaMin"] = "Minimum EBITDA cannot be greater than maximum EBITDA";
    errors["targetCriteria.ebitdaMax"] = "Maximum EBITDA cannot be less than minimum EBITDA";
  }
  
  if (
    formData.targetCriteria.transactionSizeMin !== undefined &&
    formData.targetCriteria.transactionSizeMax !== undefined &&
    formData.targetCriteria.transactionSizeMin > formData.targetCriteria.transactionSizeMax
  ) {
    errors["targetCriteria.transactionSizeMin"] = "Minimum transaction size cannot be greater than maximum transaction size";
    errors["targetCriteria.transactionSizeMax"] = "Maximum transaction size cannot be less than minimum transaction size";
  }
  
  // Agreement validation
  errors["agreements.feeAgreementAccepted"] = validateField("agreements.feeAgreement", formData.agreements.feeAgreementAccepted) || "";
  
  setFieldErrors(errors);
  return Object.values(errors).some((error) => error !== "") ? "Please correct the errors in the form" : null;
};


  // Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!authToken || !buyerId) {
    toast({
      title: "Authentication Required",
      description: "Please log in again to submit your profile.",
      variant: "destructive",
    });
    router.push("/buyer/login");
    return;
  }
  
  const errorMessage = validateForm();
  if (errorMessage) {
    toast({
      title: "Validation Error", 
      description: errorMessage,
      variant: "destructive",
    });
    
    // Navigate to first error field
    setTimeout(() => {
      scrollToFirstError(fieldErrors);
    }, 100);
    return;
  }
  
  // Rest of your existing submit logic...
  setIsSubmitting(true);
  setSubmitStatus("idle");
  setErrorMessage("");
  
  try {
    // Your existing submission code remains the same
    const profileData = {
      companyName: formData.companyName,
      website: formData.website,
      selectedCurrency: formData.selectedCurrency,
      contacts: formData.contacts,
      companyType: formData.companyType,
      capitalEntity: formData.capitalEntity,
      dealsCompletedLast5Years: formData.dealsCompletedLast5Years,
      averageDealSize: formData.averageDealSize,
      preferences: {
        stopSendingDeals: formData.preferences.stopSendingDeals,
        doNotSendMarketedDeals: formData.preferences.doNotSendMarketedDeals,
        allowBuyerLikeDeals: formData.preferences.allowBuyerLikeDeals,
      },
      targetCriteria: {
        countries: formData.targetCriteria.countries,
        industrySectors: formData.targetCriteria.industrySectors,
        revenueMin: formData.targetCriteria.revenueMin,
        revenueMax: formData.targetCriteria.revenueMax,
        ebitdaMin: formData.targetCriteria.ebitdaMin,
        ebitdaMax: formData.targetCriteria.ebitdaMax,
        transactionSizeMin: formData.targetCriteria.transactionSizeMin,
        transactionSizeMax: formData.targetCriteria.transactionSizeMax,
        revenueGrowth: formData.targetCriteria.revenueGrowth,
        minStakePercent: formData.targetCriteria.minStakePercent,
        minYearsInBusiness: formData.targetCriteria.minYearsInBusiness,
        preferredBusinessModels: formData.targetCriteria.preferredBusinessModels,
        description: formData.targetCriteria.description,
      },
      agreements: {
        feeAgreementAccepted: formData.agreements.feeAgreementAccepted,
      },
    };
    
      const cleanProfileData = JSON.parse(
        JSON.stringify(profileData, (key, value) => (value === undefined ? null : value))
      );
      let profileId: string | null = null;
      try {
        const profileResponse = await fetch(`${apiUrl}/company-profiles/my-profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          profileId = profile._id;
        }
      } catch (error) {
        console.log("No existing profile found, will create new one");
      }
      const method = profileId ? "PATCH" : "POST";
      const url = profileId ? `${apiUrl}/company-profiles/${profileId}` : `${apiUrl}/company-profiles`;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(cleanProfileData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log(`Profile ${profileId ? "updated" : "created"} successfully:`, result);
      setSubmitStatus("success");
      toast({
        title: `Profile ${profileId ? "Updated" : "Submitted"}`,
        description: `Your company profile has been successfully ${profileId ? "updated" : "submitted"}.`,
        variant: "default",
      });
      setTimeout(() => {
        router.push("/buyer/deals?profileSubmitted=true");
      }, 1000);
    } catch (error: any) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
      setErrorMessage(error.message || "An error occurred while submitting your profile.");
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred while submitting your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render hierarchical industry selection
  const renderIndustrySelection = () => {
    const filteredData = filterIndustryData();
    if (!filteredData || !industryData) return <div>Loading industry data...</div>;
    return (
      <div className="space-y-2">
        {filteredData.sectors.map((sector) => (
          <div key={sector.id} className="border-b border-gray-100 pb-1">
            <div className="flex items-center">
              <Checkbox
                id={`sector-${sector.id}`}
                checked={industrySelection.sectors[sector.id] || false}
                onCheckedChange={() => toggleSector(sector)}
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
                        checked={industrySelection.industryGroups[group.id] || false}
                        onCheckedChange={() => toggleIndustryGroup(group, sector)}
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
                        {/* Show group description if present */}
                        {group.description && (
                          <div className="text-xs text-gray-500 mb-2 pl-2 font-poppins italic">
                            {group.description}
                          </div>
                        )}
                        {group.industries.map((industry) => (
                          <div key={industry.id} className="pl-2">
                            <div className="flex items-center">
                              <Checkbox
                                id={`industry-${industry.id}`}
                                checked={industrySelection.industries[industry.id] || false}
                                onCheckedChange={() => toggleIndustry(industry, group, sector)}
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
                checked={(formData.targetCriteria.countries || []).includes(country.name)}
                onChange={() => {
                  setFormData((prev) => ({
                    ...prev,
                    targetCriteria: { ...prev.targetCriteria, countries: [country.name] },
                  }));
                }}
                className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9] checked:bg-[#3aafa9] checked:border-[#3aafa9]"
              />
              <div
                className="flex items-center cursor-pointer flex-1"
                onClick={() => setExpandedCountries((prev) => ({ ...prev, [country.isoCode]: !prev[country.isoCode] }))}
              >
                {expandedCountries[country.isoCode] ? (
                  <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                )}
                <Label htmlFor={`geo-${country.isoCode}`} className="text-[#344054] cursor-pointer font-medium">
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
                        checked={(formData.targetCriteria.countries || []).includes(`${country.name} > ${state.name}`)}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            targetCriteria: { ...prev.targetCriteria, countries: [`${country.name} > ${state.name}`] },
                          }));
                        }}
                        className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9] checked:bg-[#3aafa9] checked:border-[#3aafa9]"
                      />
                      <Label
                        htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                        className="text-[#344054] cursor-pointer"
                      >
                        {state.name}
                      </Label>
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

  // Helper to load states for a country
  const getStates = (countryCode: string) => {
    return State.getStatesOfCountry(countryCode);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] py-8 px-4 font-poppins">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-[#2f2b43] font-poppins">
            Buyer Profile Form
          </h1>
        </div>

        {submitStatus === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Your company profile has been successfully submitted.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-[#2f2b43] text-lg font-poppins font-semibold mb-4">
              About Your Company
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="companyName" className="text-[#667085] text-sm mb-1.5 block">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                {formData.companyName === "" && (
                  <div className="text-red-500 text-xs mb-1">Warning: companyName is empty!</div>
                )}
                <Input
                  id="companyName"
                  placeholder="Company Name"
                  className={`border-[#d0d5dd] ${fieldErrors["companyName"] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
                {fieldErrors["companyName"] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors["companyName"]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="website" className="text-[#667085] text-sm mb-1.5 block">
                  Company Website <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="website"
                  placeholder="example.com"
                  className={`border-[#d0d5dd] ${
                    fieldErrors["website"]
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  required
                />
                {fieldErrors["website"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors["website"]}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Enter a valid website (e.g., example.com)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <Label htmlFor="companyType" className="text-[#667085] text-sm mb-1.5 block">
                  Company Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.companyType}
                  onValueChange={(value) => handleChange("companyType", value)}
                >
                  <SelectTrigger
                    id="companyType"
                    className={`border-[#d0d5dd] ${fieldErrors["companyType"] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select Company Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors["companyType"] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors["companyType"]}</p>
                )}
              </div>
            <div>
  <Label className="text-[#667085] text-sm mb-1.5 block">
    Capital Availability <span className="text-red-500">*</span>
  </Label>
  <div className="flex flex-col space-y-2 mt-1">
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="capital_fund"
        name="capitalEntity"
        value="Ready to deploy immediately"
        checked={formData.capitalEntity !== undefined && formData.capitalEntity === "Ready to deploy immediately"}
        onChange={(e) => handleChange("capitalEntity", e.target.value)}
        className="text-[#3aafa9] focus:ring-[#3aafa9] h-4 w-4"
      />
      <Label htmlFor="capital_fund" className="text-[#344054] cursor-pointer">
        Ready to deploy immediately
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="capital_holding"
        name="capitalEntity"
        value="Need to raise"
        checked={formData.capitalEntity !== undefined && formData.capitalEntity === "Need to raise"}
        onChange={(e) => handleChange("capitalEntity", e.target.value)}
        className="text-[#3aafa9] focus:ring-[#3aafa9] h-4 w-4"
      />
      <Label htmlFor="capital_holding" className="text-[#344054] cursor-pointer">
        Need to raise
      </Label>
    </div>
  </div>
  {fieldErrors["capitalEntity"] && (
    <p className="text-red-500 text-sm mt-1">
      {fieldErrors["capitalEntity"]}
    </p>
  )}
</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dealsCompletedLast5Years" className="text-[#667085] text-sm mb-1.5 block">
                  Number of deals completed in last 5 years <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dealsCompletedLast5Years"
                  type="number"
                  min={0}
                  className={`border-[#d0d5dd] ${
                    fieldErrors["dealsCompletedLast5Years"]
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  value={formData.dealsCompletedLast5Years ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "dealsCompletedLast5Years",
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value)
                    )
                  }
                  required
                />
                {fieldErrors["dealsCompletedLast5Years"] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors["dealsCompletedLast5Years"]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="averageDealSize" className="text-[#667085] text-sm mb-1.5 block">
                  Average Transaction Value <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="averageDealSize"
                  type="text"
                  className={`border-[#d0d5dd] ${fieldErrors["averageDealSize"] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={formatNumberWithCommas(formData.averageDealSize)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    if (value === "" || /^\d+$/.test(value)) {
                      handleChange("averageDealSize", value ? Number(value) : undefined);
                    }
                  }}
                  required
                />
                {fieldErrors["averageDealSize"] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors["averageDealSize"]}</p>
                )}
              </div>
            </div>
            <div className="mb-4 mt-4">
              <Label className="text-[#667085] text-sm mb-1.5 block">
                Contact Information <span className="text-red-500">*</span>
              </Label>
              <div className="border border-[#d0d5dd] rounded-md p-4">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="mb-4">
                    {index > 0 && <div className="h-px bg-gray-200 my-4"></div>}
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Contact {index + 1}</h3>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(index)}
                          className="text-red-500 hover:text-red-700 p-0 h-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`contact-name-${index}`} className="text-[#667085] text-sm mb-1.5 block">
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`contact-name-${index}`}
                          className={`border-[#d0d5dd] ${fieldErrors[`contacts[${index}].name`] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, "name", e.target.value)}
                          required
                        />
                        {fieldErrors[`contacts[${index}].name`] && (
                          <p className="text-red-500 text-sm mt-1">{fieldErrors[`contacts[${index}].name`]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`contact-email-${index}`} className="text-[#667085] text-sm mb-1.5 block">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`contact-email-${index}`}
                          type="email"
                          className={`border-[#d0d5dd] ${fieldErrors[`contacts[${index}].email`] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, "email", e.target.value)}
                          required
                        />
                        {fieldErrors[`contacts[${index}].email`] && (
                          <p className="text-red-500 text-sm mt-1">{fieldErrors[`contacts[${index}].email`]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`contact-phone-${index}`} className="text-[#667085] text-sm mb-1.5 block">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`contact-phone-${index}`}
                          className={`border-[#d0d5dd] ${fieldErrors[`contacts[${index}].phone`] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                          required
                        />
                        {fieldErrors[`contacts[${index}].phone`] && (
                          <p className="text-red-500 text-sm mt-1">{fieldErrors[`contacts[${index}].phone`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* {formData.contacts.length < 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addContact}
                    className="text-[#3aafa9] hover:text-[#3aafa9] hover:bg-[#f0f4f8] p-0 h-auto"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add More Contacts
                  </Button>
                )} */}
              </div>
            </div>
          </div>
          {/* Target Criteria */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
              Target Criteria
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* geo graphy */}
              <div>
  <Label className="text-[#667085] text-sm mb-1.5 block">
    Geographies
  </Label>
  <div className="border border-[#d0d5dd] rounded-md p-4 h-80 flex flex-col">
    {/* Search bar for geographies */}
    <div className="relative mb-4">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#667085]" />
      <Input
        placeholder="Search country or state/province"
        className="pl-8 border-[#d0d5dd]"
        value={countrySearchTerm}
        onChange={e => setCountrySearchTerm(e.target.value)}
      />
    </div>
    {/* Pills block below search bar */}
    {/* {formData.targetCriteria.countries.length > 0 && (
      <div className="mb-4">
        <div className="text-sm text-[#667085] mb-1">Selected</div>
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {formData.targetCriteria.countries.map((country, index) => (
            <span
              key={`selected-country-${index}`}
              className="bg-gray-100 text-[#344054] text-xs rounded-full px-2 py-0.5 flex items-center group"
            >
              {country}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    targetCriteria: {
                      ...prev.targetCriteria,
                      countries: prev.targetCriteria.countries.filter((c, i) => i !== index),
                    },
                  }))
                }
                className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>
    )} */}
    {/* Dropdown (GeographySelector) */}
    <GeographySelector
      selectedCountries={formData.targetCriteria.countries}
      onChange={countries => setFormData(prev => ({
        ...prev,
        targetCriteria: { ...prev.targetCriteria, countries },
      }))}
      searchTerm={countrySearchTerm}
    />
    {fieldErrors["targetCriteria.countries"] && (
  <p className="text-red-500 text-sm mt-1">
    {fieldErrors["targetCriteria.countries"]}
  </p>
)}
  </div>
</div>
              {/* industry sector */}
              <div>
                <Label className="text-[#667085] text-sm mb-1.5 block">
                  Industry Sectors
                </Label>
                <div className="border border-[#d0d5dd] rounded-md p-4 h-80 flex flex-col">
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#667085]" />
                    <Input
                      placeholder="Search industries..."
                      className="pl-8 border-[#d0d5dd]"
                      value={industrySearchTerm}
                      onChange={(e) => setIndustrySearchTerm(e.target.value)}
                    />
                    {fieldErrors["targetCriteria.industrySectors"] && (
  <p className="text-red-500 text-sm mt-1">
    {fieldErrors["targetCriteria.industrySectors"]}
  </p>
)}
                  </div>

                  {/* {formData.targetCriteria.industrySectors.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-[#667085] mb-1">
                        Selected Industries
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {formData.targetCriteria.industrySectors.map(
                          (industry, index) => (
                            <span
                              key={`selected-industry-${index}`}
                              className="bg-gray-100 text-[#344054] text-xs rounded-full px-2 py-0.5 flex items-center group"
                            >
                              {industry}
                              <button
                                type="button"
                                onClick={() => removeIndustry(industry)}
                                className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )} */}

                  <div className="flex-1 overflow-y-auto">
                    {renderIndustrySelection()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Financials Section */}
        <section className="bg-[#F9F9F9] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Financials</h2>
          <p className="text-sm text-gray-600 mb-6">Please use full numbers (e.g., 5,000,000 not 5M)</p>
            </section>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-[#667085] text-sm">
                    Revenue Size Range
                  </Label>
                  <Select
                    value={formData.selectedCurrency}
                    onValueChange={(value) =>
                      handleChange("selectedCurrency", value)
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Label
                      htmlFor="revenueMin"
                      className="text-[#667085] text-sm w-10"
                    >
                      Min <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        {formData.selectedCurrency === "USD"
                          ? "$"
                          : formData.selectedCurrency === "EUR"
                          ? "€"
                          : formData.selectedCurrency === "GBP"
                          ? "£"
                          : formData.selectedCurrency}
                      </div>
                      <Input
                        id="revenueMin"
                        type="text"
                        className={`border-[#d0d5dd] ${
                          formData.selectedCurrency.length > 2
                            ? "pl-12"
                            : "pl-8"
                        } ${
                          fieldErrors["targetCriteria.revenueMin"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                        value={formatNumberWithCommas(
                          formData.targetCriteria.revenueMin
                        )}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d+$/.test(value)) {
                            handleNestedChange(
                              "targetCriteria",
                              "revenueMin",
                              value ? Number(value) : undefined
                            );
                          }
                        }}
                        required
                      />
                      {fieldErrors["targetCriteria.revenueMin"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.revenueMin"]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Label
                      htmlFor="revenueMax"
                      className="text-[#667085] text-sm w-10"
                    >
                      Max <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        {formData.selectedCurrency === "USD"
                          ? "$"
                          : formData.selectedCurrency === "EUR"
                          ? "€"
                          : formData.selectedCurrency === "GBP"
                          ? "£"
                          : formData.selectedCurrency}
                      </div>
                      <Input
                        id="revenueMax"
                        type="text"
                        className={`border-[#d0d5dd] ${
                          formData.selectedCurrency.length > 2
                            ? "pl-12"
                            : "pl-8"
                        } ${
                          fieldErrors["targetCriteria.revenueMax"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                        value={formatNumberWithCommas(
                          formData.targetCriteria.revenueMax
                        )}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d+$/.test(value)) {
                            handleNestedChange(
                              "targetCriteria",
                              "revenueMax",
                              value ? Number(value) : undefined
                            );
                          }
                        }}
                        required
                      />
                      {fieldErrors["targetCriteria.revenueMax"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.revenueMax"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {formData.targetCriteria.revenueMin !== undefined &&
                  formData.targetCriteria.revenueMax !== undefined &&
                  formData.targetCriteria.revenueMin >
                    formData.targetCriteria.revenueMax && (
                    <p className="text-red-500 text-sm mt-1">
                      Minimum revenue cannot be greater than maximum revenue
                    </p>
                  )}
              </div>

              <div>
                <Label className="text-[#667085] text-sm mb-1.5 block">
                  EBITDA Range (0 Allows for negative EBITDA)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Label
                      htmlFor="ebitdaMin"
                      className="text-[#667085] text-sm w-10"
                    >
                      Min <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        {formData.selectedCurrency === "USD"
                          ? "$"
                          : formData.selectedCurrency === "EUR"
                          ? "€"
                          : formData.selectedCurrency === "GBP"
                          ? "£"
                          : formData.selectedCurrency}
                      </div>
                      <Input
                        id="ebitdaMin"
                        type="text"
                        className={`border-[#d0d5dd] ${
                          formData.selectedCurrency.length > 2
                            ? "pl-12"
                            : "pl-8"
                        } ${
                          fieldErrors["targetCriteria.ebitdaMin"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                        value={formatNumberWithCommas(
                          formData.targetCriteria.ebitdaMin
                        )}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d+$/.test(value)) {
                            handleNestedChange(
                              "targetCriteria",
                              "ebitdaMin",
                              value ? Number(value) : undefined
                            );
                          }
                        }}
                        required
                      />
                      {fieldErrors["targetCriteria.ebitdaMin"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.ebitdaMin"]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Label
                      htmlFor="ebitdaMax"
                      className="text-[#667085] text-sm w-10"
                    >
                      Max <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        {formData.selectedCurrency === "USD"
                          ? "$"
                          : formData.selectedCurrency === "EUR"
                          ? "€"
                          : formData.selectedCurrency === "GBP"
                          ? "£"
                          : formData.selectedCurrency}
                      </div>
                      <Input
                        id="ebitdaMax"
                        required
                        type="text"
                        className={`border-[#d0d5dd] ${
                          formData.selectedCurrency.length > 2
                            ? "pl-12"
                            : "pl-8"
                        } ${
                          fieldErrors["targetCriteria.ebitdaMax"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                        value={formatNumberWithCommas(
                          formData.targetCriteria.ebitdaMax
                        )}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d+$/.test(value)) {
                            handleNestedChange(
                              "targetCriteria",
                              "ebitdaMax",
                              value ? Number(value) : undefined
                            );
                          }
                        }}
                        required
                      />
                      {fieldErrors["targetCriteria.ebitdaMax"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.ebitdaMax"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {formData.targetCriteria.ebitdaMin !== undefined &&
                  formData.targetCriteria.ebitdaMax !== undefined &&
                  formData.targetCriteria.ebitdaMin >
                    formData.targetCriteria.ebitdaMax && (
                    <p className="text-red-500 text-sm mt-1">
                      Minimum EBITDA cannot be greater than maximum EBITDA
                    </p>
                  )}
              </div>

              <div>
                <Label className="text-[#667085] text-sm mb-1.5 block">
                  Transaction Size Range
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Label
                      htmlFor="transactionSizeMin"
                      className="text-[#667085] text-sm w-10"
                    >
                      Min <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        {formData.selectedCurrency === "USD"
                          ? "$"
                          : formData.selectedCurrency === "EUR"
                          ? "€"
                          : formData.selectedCurrency === "GBP"
                          ? "£"
                          : formData.selectedCurrency}
                      </div>
                      <Input
                        id="transactionSizeMin"
                        type="text"
                        className={`border-[#d0d5dd] ${
                          formData.selectedCurrency.length > 2
                            ? "pl-12"
                            : "pl-8"
                        } ${
                          fieldErrors["targetCriteria.transactionSizeMin"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                        value={formatNumberWithCommas(
                          formData.targetCriteria.transactionSizeMin
                        )}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d+$/.test(value)) {
                            handleNestedChange(
                              "targetCriteria",
                              "transactionSizeMin",
                              value ? Number(value) : undefined
                            );
                          }
                        }}
                        required
                      />
                      {fieldErrors["targetCriteria.transactionSizeMin"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.transactionSizeMin"]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Label
                      htmlFor="transactionSizeMax"
                      className="text-[#667085] text-sm w-10"
                    >
                      Max <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        {formData.selectedCurrency === "USD"
                          ? "$"
                          : formData.selectedCurrency === "EUR"
                          ? "€"
                          : formData.selectedCurrency === "GBP"
                          ? "£"
                          : formData.selectedCurrency}
                      </div>
                      <Input
                        id="transactionSizeMax"
                        required
                        type="text"
                        className={`border-[#d0d5dd] ${
                          formData.selectedCurrency.length > 2
                            ? "pl-12"
                            : "pl-8"
                        } ${
                          fieldErrors["targetCriteria.transactionSizeMax"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                        value={formatNumberWithCommas(
                          formData.targetCriteria.transactionSizeMax
                        )}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, "");
                          if (value === "" || /^\d+$/.test(value)) {
                            handleNestedChange(
                              "targetCriteria",
                              "transactionSizeMax",
                              value ? Number(value) : undefined
                            );
                          }
                        }}
                        required
                      />
                      {fieldErrors["targetCriteria.transactionSizeMax"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.transactionSizeMax"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {formData.targetCriteria.transactionSizeMin !== undefined &&
                  formData.targetCriteria.transactionSizeMax !== undefined &&
                  formData.targetCriteria.transactionSizeMin >
                    formData.targetCriteria.transactionSizeMax && (
                    <p className="text-red-500 text-sm mt-1">
                      Minimum transaction size cannot be greater than maximum
                      transaction size
                    </p>
                  )}
              </div>

              <div>
                <Label className="text-[#667085] text-sm mb-1.5 block">
                  Minimum 3 Year Average Revenue Growth (%) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center">
                  <Input
                    id="revenueGrowth"
                    type="text"
                    className={`border-[#d0d5dd] ${fieldErrors["targetCriteria.revenueGrowth"] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    value={formatNumberWithCommas(formData.targetCriteria.revenueGrowth)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, "");
                      if (value === "" || /^\d+$/.test(value)) {
                        handleNestedChange("targetCriteria", "revenueGrowth", value ? Number(value) : undefined);
                      }
                    }}
                    required
                  />
                </div>
                {fieldErrors["targetCriteria.revenueGrowth"] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors["targetCriteria.revenueGrowth"]}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="minYearsInBusiness"
                  className="text-[#667085] text-sm mb-1.5 block"
                >
                  Minimum Years in Business
                  <span className="text-red-500">*</span>
                </Label>
               <Input
  id="minYearsInBusiness"
  type="number"
  className={`border-[#d0d5dd] ${
    fieldErrors["targetCriteria.minYearsInBusiness"]
      ? "border-red-500 focus-visible:ring-red-500"
      : ""
  }`}
  value={formData.targetCriteria.minYearsInBusiness ?? ""}
  onChange={(e) =>
    handleNestedChange(
      "targetCriteria",
      "minYearsInBusiness",
      e.target.value === ""
        ? undefined
        : Number(e.target.value)
    )
  }
  required
/>
{fieldErrors["targetCriteria.minYearsInBusiness"] && (
  <p className="text-red-500 text-sm mt-1">
    {fieldErrors["targetCriteria.minYearsInBusiness"]}
  </p>
)}

                
              </div>
            </div>
            {/* Preferred Business Models */}
            <div className="rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
                Preferred Business Models
              </h2>
              <div className="flex flex-wrap gap-6">
                {BUSINESS_MODELS.map((model) => (
                  <div key={model} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model}`}
                      className="border-[#d0d5dd]"
                      checked={formData.targetCriteria.preferredBusinessModels.includes(
                        model
                      )}
                      onCheckedChange={() => toggleBusinessModel(model)}
                    />
                    <Label
                      htmlFor={`model-${model}`}
                      className="text-[#344054]"
                    >
                      {model}
                    </Label>
                    {fieldErrors["targetCriteria.preferredBusinessModels"] && (
  <p className="text-red-500 text-sm mt-1">
    {fieldErrors["targetCriteria.preferredBusinessModels"]}
  </p>
)}

                  </div>
                ))}
              </div>
            </div>

            {/* Description of Ideal Target(s) */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
                Description of Ideal Target(s)
              </h2>
              <Textarea
                placeholder="Add additional information about company types you are pursuing especially specific industries and activities."
                className="min-h-[100px] border-[#d0d5dd]"
                value={formData.targetCriteria.description || ""}
                onChange={(e) =>
                  handleNestedChange(
                    "targetCriteria",
                    "description",
                    e.target.value
                  )
                }
              />
              {fieldErrors["targetCriteria.description"] && (
  <p className="text-red-500 text-sm mt-1">
    {fieldErrors["targetCriteria.description"]}
  </p>
)}
            </div>

          </div>
          {/* General Preferences */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
              General Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-end space-x-2">
                <Checkbox
                  id="stopSendingDeals"
                  className="mt-1 border-[#d0d5dd]"
                  checked={formData.preferences.stopSendingDeals}
                  onCheckedChange={(checked) =>
                    handleNestedChange(
                      "preferences",
                      "stopSendingDeals",
                      checked === true
                    )
                  }
                />
                <Label htmlFor="stopSendingDeals" className="text-[#344054]">
                  Stop sending deals
                </Label>
              </div>

              <div className="flex items-end space-x-2">
                <Checkbox
                  id="doNotSendMarketedDeals"
                  className="mt-1 border-[#d0d5dd]"
                  checked={formData.preferences.doNotSendMarketedDeals}
                  onCheckedChange={(checked) =>
                    handleNestedChange(
                      "preferences",
                      "doNotSendMarketedDeals",
                      checked === true
                    )
                  }
                />
                <Label
                  htmlFor="doNotSendMarketedDeals"
                  className="text-[#344054]"
                >
                  Do not send deals that are currently marketed on other deal
                  marketplaces
                </Label>
              </div>

              <div className="flex items-end space-x-2">
                <Checkbox
                  id="allowBuyerLikeDeals"
                  className="mt-1 border-[#d0d5dd]"
                  checked={formData.preferences.allowBuyerLikeDeals}
                  onCheckedChange={(checked) =>
                    handleNestedChange(
                      "preferences",
                      "allowBuyerLikeDeals",
                      checked === true
                    )
                  }
                />
                <Label htmlFor="allowBuyerLikeDeals" className="text-[#344054]">
                  Allow buy side fee deals (charged by seller above CIM Amplify
                  Fees)
                </Label>
              </div>
            </div>
          </div>
          {/* Agreements */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
              Agreement
            </h2>
            <div className="flex flex-col">
              <div className="flex items-end space-x-2">
                <Checkbox
                  id="feeAgreement"
                  className={`mt-1 ${
                    fieldErrors["agreements.feeAgreementAccepted"]
                      ? "border-red-500"
                      : "border-[#d0d5dd]"
                  }`}
                  checked={formData.agreements.feeAgreementAccepted}
                  onCheckedChange={(checked) =>
                    handleNestedChange(
                      "agreements",
                      "feeAgreementAccepted",
                      checked === true
                    )
                  }
                  required
                />
                <Label htmlFor="feeAgreement" className="text-[#344054]">
                  I have read and agree to the{' '}
                  <Link
                    href="/buyer/masterfeeagreement"
                    className="text-[#38A4F1] hover:text-[#2a9d8f] cursor-pointer"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Master Fee Agreement
                  </Link>
                </Label>
              </div>
              {fieldErrors["agreements.feeAgreementAccepted"] && (
                <p className="text-red-500 text-sm mt-1 ml-6">
                  {fieldErrors["agreements.feeAgreementAccepted"]}
                </p>
              )}
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#3aafa9] hover:bg-[#2a9d8f] text-white px-8 py-2 text-base font-medium"
              disabled={isSubmitting}
              onClick={(e) => {
                console.log("Submit button clicked");
                handleSubmit(e);
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Profile"
              )}
            </Button>
          </div>
        </form>
      </div>
      <Toaster />
    </div>
  );
}