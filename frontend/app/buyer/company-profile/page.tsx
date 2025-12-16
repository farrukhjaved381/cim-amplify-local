"use client";
import Image from "next/image";
import type React from "react";
import { useToast, toast } from "@/hooks/use-toast";
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
  Briefcase,Store
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
  phone?: string; // Add this line
}

export default function CompanyProfilePage() {
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

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Format number with commas
  const formatNumberWithCommas = (value: number | undefined) => {
    if (value === undefined) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      console.log(
        "Company Profile - Token set from URL:",
        cleanToken.substring(0, 10) + "..."
      );
    } else {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const cleanToken = storedToken.trim();
        setAuthToken(cleanToken);
        console.log(
          "Company Profile - Token set from localStorage:",
          cleanToken.substring(0, 10) + "..."
        );
      } else {
        console.warn("Company Profile - No token found, redirecting to login");
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
      console.log("Company Profile - Buyer ID set from URL:", cleanUserId);
    } else {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        const cleanUserId = storedUserId.trim();
        setBuyerId(cleanUserId);
        console.log(
          "Company Profile - Buyer ID set from localStorage:",
          cleanUserId
        );
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
  }, [authToken, isClient]);
 

useEffect(() => {
  if (!buyerProfile) return;
  
  // Only populate if the first contact is completely empty
  if (formData.contacts.length > 0) {
    const firstContact = formData.contacts[0];
    
    if (!firstContact.name && !firstContact.email && !firstContact.phone) {
      console.log("Populating contact with buyer profile data");
      
      setFormData(prevData => ({
        ...prevData,
        contacts: [
          {
            name: buyerProfile.fullName || "",
            email: buyerProfile.email || "",
            phone: buyerProfile.phone || ""
          },
          ...prevData.contacts.slice(1) // Keep any additional contacts
        ]
      }));
    }
  }
}, [buyerProfile]); // Only depend on buyerProfile

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
  contacts: [{ name: "", email: "", phone: "" }], // Always start with one empty contact
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
        console.log("No existing profile found, showing empty form");
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const profileData = await response.json();
    console.log("Existing profile loaded:", profileData);

    if (profileData && profileData._id) {
      setProfileId(profileData._id);
      console.log("Company Profile ID stored for updates:", profileData._id);
    }

    if (profileData) {
      // Handle contacts - ensure we always have at least one contact
      let contactsToUse = profileData.contacts && profileData.contacts.length > 0 
        ? profileData.contacts 
        : [{ name: "", email: "", phone: "" }];

      const updatedProfile = {
        ...formData,
        ...profileData,
        contacts: contactsToUse,
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
      console.error("Error fetching profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // Fetch buyer profile
  const fetchBuyerProfile = async () => {
    if (!isClient) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Company Profile - Missing token for profile fetch");
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
      console.log("Company Profile - Buyer profile fetched:", data);
    } catch (error) {
      console.error("Error fetching buyer profile:", error);
    }
  };

  // Add a function to validate individual fields
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
        return value === undefined || value === "" ? "Minimum stake percentage is required" : null;
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
    setFormData((prev) => {
      const newState = {
        ...prev,
        [parent]: {
          ...(typeof prev[parent as keyof CompanyProfile] === "object" &&
          prev[parent as keyof CompanyProfile] !== null
            ? (prev[parent as keyof CompanyProfile] as Record<string, any>)
            : {}),
          [field]: value,
        },
      };

      // If feeAgreementAccepted is being set to true, set agreementsAcceptedAt
      if (parent === "agreements" && field === "feeAgreementAccepted" && value === true) {
        newState.agreements.agreementsAcceptedAt = new Date().toISOString();
      }

      return newState;
    });

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

    errors["targetCriteria.revenueGrowth"] = validateField("targetCriteria.revenueGrowth", formData.targetCriteria.revenueGrowth) || "";

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

    // If no profile exists yet, create it instead of failing
    // We gracefully POST to /company-profiles when profileId is missing

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

      console.log(
        "Company Profile - Updating profile at:",
        `${apiUrl}/company-profiles/${profileId}`
      );
      console.log(
        "Company Profile - Using token:",
        authToken.substring(0, 10) + "..."
      );
      console.log("Company Profile - Profile ID:", profileId);

      const updateData = { ...profileData };
      // Normalize website to include protocol for backend IsUrl validation
      const ensureProtocol = (url: string | undefined) => {
        if (!url) return url;
        const trimmed = url.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed}`;
      };
      if (typeof (updateData as any).website === 'string') {
        (updateData as any).website = ensureProtocol((updateData as any).website);
      }
      delete (updateData as any)._id;
      delete (updateData as any).createdAt;
      delete (updateData as any).updatedAt;
      delete (updateData as any).__v;
      delete (updateData as any).buyer;
      // Remove agreementsAcceptedAt from the nested agreements object
      if (updateData.agreements && (updateData.agreements as any).agreementsAcceptedAt) {
        delete (updateData.agreements as any).agreementsAcceptedAt;
      }

      console.log(
        "Company Profile - Update data:",
        JSON.stringify(updateData, null, 2)
      );

      let response: Response;
      if (!profileId) {
        // Create new profile
        response = await fetch(`${apiUrl}/company-profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        });
      } else {
        // Update existing profile
        response = await fetch(`${apiUrl}/company-profiles/${profileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        });
      }

      console.log("Company Profile - Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", errorData);

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
      console.log("Company Profile - Update successful:", result);

      setSubmitStatus("success");

      // ✅ Redirect to /buyer/deals directly
      setTimeout(() => {
        router.push("/buyer/deals");
      }, 2000);
    } catch (error: any) {
      console.error("Update error:", error);
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
                checked={formData.targetCriteria.countries.includes(country.name)}
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
                        checked={formData.targetCriteria.countries.includes(`${country.name} > ${state.name}`)}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            targetCriteria: { ...prev.targetCriteria, countries: [`${country.name} > ${state.name}`] },
                          }));
                        }}
                        className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9] checked:bg-[#3aafa9] checked:border-[#3aafa9]"
                      />
                      <div
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => setExpandedStates((prev) => ({ ...prev, [`${country.isoCode}-${state.isoCode}`]: !prev[`${country.isoCode}-${state.isoCode}`] }))}
                      >
                        {expandedStates[`${country.isoCode}-${state.isoCode}`] ? (
                          <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                        )}
                        <Label htmlFor={`geo-${country.isoCode}-${state.isoCode}`} className="text-[#344054] cursor-pointer">
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
                                checked={!!industrySelection.industries[industry.id]}
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
  const { dismiss } = useToast();
  const handleLogout = () => {
    if (!isClient) return;

    console.log("Company Profile - Logging out");
    dismiss();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/buyer/login");
  };

  // Add expansion state for countries and states for the geography selector UI
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  // Add after industryData and formData are defined
  useEffect(() => {
    if (!industryData || !formData.targetCriteria.industrySectors) return;
    const newIndustrySelection: IndustrySelection = { sectors: {}, industryGroups: {}, industries: {} };
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

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-10 pt-3 pb-1">
            <Link href="/buyer/deals">
              <div className="flex items-center">
                <Image
                  src="/logo.svg"
                  width={200}
                  height={400}
                  alt="CIM Amplify"
                  className="h-10"
                />
              </div>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">
              Company Profile
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="mr-2 text-right">
                <div className="text-sm font-medium">
                  {buyerProfile?.fullName || "User"}
                </div>
                {/* <div className="text-xs text-gray-500">{buyerProfile?.companyName || "Company"}</div> */}
              </div>
              <div className="relative">
                {buyerProfile?.profilePicture ? (
                  <img
                    src={
                      getProfilePictureUrl(buyerProfile.profilePicture) ||
                      "/placeholder.svg"
                    }
                    alt={buyerProfile.fullName}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">
                      {buyerProfile?.fullName?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-gray-200 bg-white">
          <nav className="flex flex-col p-4">
            <Link
              href="/buyer/deals"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <Briefcase className="mr-3 h-5 w-5" />
              <span>All Deals</span>
            </Link>
            <Link
              href="/buyer/marketplace"
              className="mb-2 flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <Store className="mr-3 h-5 w-5" />
              <span>MarketPlace</span>
            </Link>
            <Link
              href="/buyer/company-profile"
              className="mb-2 flex items-center rounded-md bg-teal-500 px-4 py-3 text-white hover:bg-teal-600"
            >
              <Settings className="mr-3 h-5 w-5" />
              <span>Company Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100 text-left w-full"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {submitStatus === "success" && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your company profile has been successfully updated.
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
                    <Label
                      htmlFor="companyName"
                      className="text-[#667085] text-sm mb-1.5 block"
                    >
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Company Name"
                      className={`border-[#d0d5dd] ${
                        fieldErrors["companyName"]
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      value={formData.companyName}
                      onChange={(e) =>
                        handleChange("companyName", e.target.value)
                      }
                      required
                    />
                    {fieldErrors["companyName"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors["companyName"]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="website"
                      className="text-[#667085] text-sm mb-1.5 block"
                    >
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
                    <Label
                      htmlFor="companyType"
                      className="text-[#667085] text-sm mb-1.5 block"
                    >
                      Company Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.companyType}
                      onValueChange={(value) =>
                        handleChange("companyType", value)
                      }
                    >
                      <SelectTrigger
                        id="companyType"
                        className={`border-[#d0d5dd] ${
                          fieldErrors["companyType"]
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
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
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors["companyType"]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-[#667085] text-sm mb-1.5 block">
                      Capital Availability{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex flex-col space-y-2 mt-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="capital_ready"
                          name="capitalAvailability"
                          value="Ready to deploy immediately"
                          checked={
                            formData.capitalEntity === "Ready to deploy immediately" ||
                            formData.capitalAvailability === "Ready to deploy immediately"
                          }
                          onChange={(e) => {
                            handleChange("capitalEntity", e.target.value);
                            handleChange("capitalAvailability", e.target.value);
                          }}
                          className="text-[#3aafa9] focus:ring-[#3aafa9] h-4 w-4"
                        />
                        <Label
                          htmlFor="capital_ready"
                          className="text-[#344054] cursor-pointer"
                        >
                          Ready to deploy immediately
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="capital_need"
                          name="capitalAvailability"
                          value="Need to raise"
                          checked={
                            formData.capitalEntity === "Need to raise" ||
                            formData.capitalAvailability === "Need to raise"
                          }
                          onChange={(e) => {
                            handleChange("capitalEntity", e.target.value);
                            handleChange("capitalAvailability", e.target.value);
                          }}
                          className="text-[#3aafa9] focus:ring-[#3aafa9] h-4 w-4"
                        />
                        <Label
                          htmlFor="capital_need"
                          className="text-[#344054] cursor-pointer"
                        >
                          Need to raise
                        </Label>
                      </div>
                    </div>
                    {fieldErrors["capitalEntity"] && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors["capitalEntity"]}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <Label
                          htmlFor="dealsCompletedLast5Years"
                          className="text-[#667085] text-sm mb-1.5 block"
                        >
                          Number of deals completed in last 5 years{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dealsCompletedLast5Years"
                          type="number"
                          min={0} // <-- allow 0 as a valid value
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
                          <p className="text-red-500 text-sm mt-1">
                            {fieldErrors["dealsCompletedLast5Years"]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="averageDealSize"
                          className="text-[#667085] text-sm mb-1.5 block"
                        >
                          Average Transaction Value{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="averageDealSize"
                          type="text"
                          className={`border-[#d0d5dd] ${
                            fieldErrors["averageDealSize"]
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }`}
                          value={formatNumberWithCommas(
                            formData.averageDealSize
                          )}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, "");
                            if (value === "" || /^\d+$/.test(value)) {
                              handleChange(
                                "averageDealSize",
                                value ? Number(value) : undefined
                              );
                            }
                          }}
                          required
                        />
                        {fieldErrors["averageDealSize"] && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldErrors["averageDealSize"]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              <div className="mb-4 mt-4">
  <Label className="text-[#667085] text-sm mb-1.5 block">
    Contact Information{" "}
    <span className="text-red-500">*</span>
  </Label>
  <div className="border border-[#d0d5dd] rounded-md p-4">
    {formData.contacts.map((contact, index) => (
      <div key={index} className="mb-4">
        {index > 0 && (
          <div className="h-px bg-gray-200 my-4"></div>
        )}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">
            Contact {index + 1}
          </h3>
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
            <Label
              htmlFor={`contact-name-${index}`}
              className="text-[#667085] text-sm mb-1.5 block"
            >
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`contact-name-${index}`}
              placeholder="Enter full name"
              className={`border-[#d0d5dd] ${
                fieldErrors[`contacts[${index}].name`]
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
              value={contact.name || ""}
              onChange={(e) =>
                handleContactChange(
                  index,
                  "name",
                  e.target.value
                )
              }
              required
            />
            {fieldErrors[`contacts[${index}].name`] && (
              <p className="text-red-500 text-sm mt-1">
                {fieldErrors[`contacts[${index}].name`]}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor={`contact-email-${index}`}
              className="text-[#667085] text-sm mb-1.5 block"
            >
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`contact-email-${index}`}
              type="email"
              placeholder="Enter email address"
              className={`border-[#d0d5dd] ${
                fieldErrors[`contacts[${index}].email`]
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
              value={contact.email || ""}
              onChange={(e) =>
                handleContactChange(
                  index,
                  "email",
                  e.target.value
                )
              }
              required
            />
            {fieldErrors[`contacts[${index}].email`] && (
              <p className="text-red-500 text-sm mt-1">
                {fieldErrors[`contacts[${index}].email`]}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor={`contact-phone-${index}`}
              className="text-[#667085] text-sm mb-1.5 block"
            >
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`contact-phone-${index}`}
              type="tel"
              placeholder="Enter phone number"
              className={`border-[#d0d5dd] ${
                fieldErrors[`contacts[${index}].phone`]
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
              value={contact.phone || ""}
              onChange={(e) =>
                handleContactChange(
                  index,
                  "phone",
                  e.target.value
                )
              }
              required
            />
            {fieldErrors[`contacts[${index}].phone`] && (
              <p className="text-red-500 text-sm mt-1">
                {fieldErrors[`contacts[${index}].phone`]}
              </p>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
              </div>

              {/* Target Criteria */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
                  Target Criteria
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="text-[#667085] text-sm mb-1.5 block">
                      Geographies <span className="text-red-500">*</span>
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

                  <div>
                    <Label className="text-[#667085] text-sm mb-1.5 block">
                      Industry Sectors <span className="text-red-500">*</span>
                    </Label>
                    <div className="border border-[#d0d5dd] rounded-md p-4 h-80 flex flex-col">
                      <div className="relative mb-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#667085]" />
                        <Input
                          placeholder="Search industries..."
                          className="pl-8 border-[#d0d5dd]"
                          value={industrySearchTerm}
                          onChange={(e) =>
                            setIndustrySearchTerm(e.target.value)
                          }
                        />
                      </div>
{/* 
                      {formData.targetCriteria.industrySectors.length > 0 && (
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
                      {fieldErrors["targetCriteria.industrySectors"] && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldErrors["targetCriteria.industrySectors"]}
                        </p>
                      )}
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
                      Minimum Years in Business <span className="text-red-500">*</span>
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
              </div>

              {/* Preferred Business Models */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
                  Preferred Business Models <span className="text-red-500">*</span>
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
                    </div>
                  ))}
                </div>
                {fieldErrors["targetCriteria.preferredBusinessModels"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors["targetCriteria.preferredBusinessModels"]}
                  </p>
                )}
              </div>

              {/* Description of Ideal Target(s) */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h2 className="text-[#2f2b43] text-lg font-medium mb-4">
                  Description of Ideal Target(s) <span className="text-red-500">*</span>
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
                  required
                />
                {fieldErrors["targetCriteria.description"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors["targetCriteria.description"]}
                  </p>
                )}
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
                    <Label
                      htmlFor="stopSendingDeals"
                      className="text-[#344054]"
                    >
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
                      Do not send deals that are currently marketed on other
                      deal marketplaces
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
                    <Label
                      htmlFor="allowBuyerLikeDeals"
                      className="text-[#344054]"
                    >
                      Allow buy side fee deals (charged by seller above CIM
                      Amplify Fees)
                    </Label>
                  </div>
                  {/* Removed duplicate Master Fee Agreement confirmation block */}
                </div>
              </div>

              {/* Master Fee Agreement Section */}
              {formData.agreements.feeAgreementAccepted ? (
                <div className="mt-4 text-sm text-[#667085] border-t pt-4">
                  <p>
                    The <Link
                      href="/buyer/masterfeeagreement"
                      className="text-[#3aafa9] underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Master Fee Agreement
                    </Link> was agreed to by {buyerProfile?.fullName || "(insert buyer's name)"} on {(() => {
                      let dateStr = formData.agreementsAcceptedAt ?? formData.updatedAt;
                      if (dateStr && !isNaN(Date.parse(dateStr))) {
                        const date = new Date(dateStr);
                        const time = date.toLocaleTimeString("en-US", {
                          timeZone: "America/New_York",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                        const day = date.toLocaleDateString("en-US", {
                          timeZone: "America/New_York",
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        });
                        return `${time}\n${day}\nEastern Time (ET)`;
                      }
                      return "(insert date and time of submission)";
                    })()}
                    .
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="feeAgreementAccepted"
                      checked={formData.agreements.feeAgreementAccepted}
                      onChange={e => handleNestedChange("agreements", "feeAgreementAccepted", e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="feeAgreementAccepted" className="text-gray-700">
                      I have read and agree to the{' '}
                      <a
                        href="/buyer/masterfeeagreement"
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Master Fee Agreement
                      </a>
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#3aafa9] hover:bg-[#2a9d8f] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
