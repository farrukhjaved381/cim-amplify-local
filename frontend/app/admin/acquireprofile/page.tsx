"use client";

import { Toaster } from "@/components/ui/sonner";

import type React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
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
import { Country, State, City } from "country-state-city";

// Add a direct import for the API service at the top of the file
// Remove: `import { submitCompanyProfile } from "@/services/api"`

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

const CAPITAL_ENTITIES = [
  "Fund",
  "Holding Company",
  "SPV",
  "Direct Investment",
];

const BUSINESS_MODELS = [
  "Recurring Revenue",
  "Project-Based",
  "Asset Light",
  "Asset Heavy",
];

// Default API URL
const DEFAULT_API_URL = "https://cim-backend.vercel.app";

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

export default function AcquireProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
 const [isAdminEdit, setIsAdminEdit] = useState(false);
const [profileId, setProfileId] = useState<string | null>(null);;
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

  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);

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
  const [expandedIndustries, setExpandedIndustries] = useState<
    Record<string, boolean>
  >({});

  // Search terms
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");

  // Available currencies
  const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

  // Add a new state for field-specific errors after the other state declarations (around line 100)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Format number with commas
  const formatNumberWithCommas = (value: number | undefined) => {
    if (value === undefined) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Check for token on mount and from URL parameters
useEffect(() => {
  // Get token and userId from URL parameters
  const urlToken = searchParams?.get("token");
  const urlUserId = searchParams?.get("userId");
const urlProfileId = searchParams?.get("id");
if (urlProfileId) {
  setProfileId(urlProfileId);
  setIsAdminEdit(true);
} else {
  setIsAdminEdit(false);
}
  // Set token from URL or localStorage
  if (urlToken) {
    const cleanToken = urlToken.trim();
    localStorage.setItem("token", cleanToken);
    setAuthToken(cleanToken);
  } else {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setAuthToken(storedToken.trim());
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
    localStorage.setItem("userId", urlUserId.trim());
    setBuyerId(urlUserId.trim());
  } else {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) setBuyerId(storedUserId.trim());
  }

  // Set API URL from localStorage or use default
  const storedApiUrl = localStorage.getItem("apiUrl");
  if (storedApiUrl) setApiUrl(storedApiUrl);

  // --- ADMIN MODE: If id param is present, fetch admin profile ---
  if (urlProfileId) {
    setProfileId(urlProfileId);
    setIsAdminEdit(true);
  
  } else {
    setIsAdminEdit(false);
    // fallback: fetchUserProfile(); // (optional, for buyer)
  }
}, [searchParams, router]);
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch geography data
      const geo = await getGeoData();
      setGeoData(geo);

      // Fetch industry data  
      const industry = await getIndustryData();
      setIndustryData(industry);

    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  fetchData();
}, []);
useEffect(() => {
  const fetchProfileData = async () => {
    if (!authToken || !geoData || !industryData) return;

    if (isAdminEdit && profileId) {
      await fetchAdminProfile(profileId);
    } else {
      await fetchUserProfile();
    }
  };

  fetchProfileData();
}, [authToken, geoData, industryData, isAdminEdit, profileId]);
  useEffect(() => {
  if (isAdminEdit && profileId && authToken && apiUrl) {
    fetchAdminProfile(profileId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAdminEdit, profileId, authToken, apiUrl]);
useEffect(() => {
  if (isAdminEdit && profileId && authToken && apiUrl) {
    fetchAdminProfile(profileId);
  }
}, [isAdminEdit, profileId, authToken, apiUrl]);
const fetchAdminProfile = async (id: string) => {
  try {
    const res = await fetch(`${apiUrl}/admin/company-profiles/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch company profile");
    const data = await res.json();
    
    const updatedFormData = {
      ...formData,
      ...data,
      website: data.buyer?.website || data.website,
      selectedCurrency: data.selectedCurrency || "USD",
      contacts: data.contacts && data.contacts.length > 0 ? data.contacts : [{ name: "", email: "", phone: "" }],
      preferences: { ...formData.preferences, ...(data.preferences || {}) },
      targetCriteria: { ...formData.targetCriteria, ...(data.targetCriteria || {}) },
      agreements: { ...formData.agreements, ...(data.agreements || {}) },
    };
    
    setFormData(updatedFormData);

    // FIXED: Synchronize geography selections
    if (data.targetCriteria?.countries?.length > 0 && geoData) {
      const newGeoSelection = { 
        continents: {},
        regions: {},
        subRegions: {}
      };

      geoData.continents.forEach((continent) => {
        if (data.targetCriteria.countries.includes(continent.name)) {
          newGeoSelection.continents[continent.id] = true;
        }

        continent.regions.forEach((region) => {
          if (data.targetCriteria.countries.includes(region.name)) {
            newGeoSelection.regions[region.id] = true;
          }

          if (region.subRegions) {
            region.subRegions.forEach((subRegion) => {
              if (data.targetCriteria.countries.includes(subRegion.name)) {
                newGeoSelection.subRegions[subRegion.id] = true;
              }
            });
          }
        });
      });

      setGeoSelection(newGeoSelection);
    }

    // FIXED: Synchronize industry selections
    if (data.targetCriteria?.industrySectors?.length > 0 && industryData) {
      const newIndustrySelection = {
        sectors: {},
        industryGroups: {},
        industries: {}
      };

      industryData.sectors.forEach((sector) => {
        if (data.targetCriteria.industrySectors.includes(sector.name)) {
          newIndustrySelection.sectors[sector.id] = true;
        }

        sector.industryGroups.forEach((group) => {
          if (data.targetCriteria.industrySectors.includes(group.name)) {
            newIndustrySelection.industryGroups[group.id] = true;
          }

          group.industries.forEach((industry) => {
            if (data.targetCriteria.industrySectors.includes(industry.name)) {
              newIndustrySelection.industries[industry.id] = true;
            }
          });
        });
      });

      setIndustrySelection(newIndustrySelection);
    }

  } catch (err) {
    toast({
      title: "Error",
      description: "Could not load company profile for editing.",
      variant: "destructive",
    });
  }
};
  // Fetch user's existing profile data
 // 1. REPLACE the existing fetchUserProfile function with this complete version:
const fetchUserProfile = async () => {
  if (!authToken) return;

  let buyerDetails = null;
  try {
    const buyerRes = await fetch(`${apiUrl}/buyers/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (buyerRes.ok) {
      buyerDetails = await buyerRes.json();
      console.log("Fetched buyerDetails:", buyerDetails);
    }
  } catch (err) {
    // handle error
  }

  const response = await fetch(`${apiUrl}/company-profiles/my-profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      setFormData((prev) => {
        const newForm = {
          ...prev,
          companyName: buyerDetails?.companyName || "",
          website: buyerDetails?.website || "",
          contacts: [
            {
              name: buyerDetails?.fullName || "",
              email: buyerDetails?.email || "",
              phone: buyerDetails?.phone || "",
            },
          ],
        };
        console.log("Setting formData from buyerDetails (404):", newForm);
        return newForm;
      });
      return;
    }
    // ...handle other errors
  }

  const profileData = await response.json();
  console.log("Existing profile loaded:", profileData);

  // Update form data with the fetched profile
  if (profileData) {
    const updatedProfile = {
      ...formData,
      ...profileData,
      website: buyerDetails?.website || profileData.website || "",
      contacts: profileData.contacts && profileData.contacts.length > 0
        ? profileData.contacts
        : [
            {
              name: buyerDetails?.fullName || "",
              email: buyerDetails?.email || "",
              phone: buyerDetails?.phone || "",
            },
          ],
      companyName: profileData.companyName || buyerDetails?.companyName || "",
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
      capitalEntity: profileData.capitalEntity || undefined,
    };
    console.log("Setting formData from profileData:", updatedProfile);
    setFormData(updatedProfile);

    // Update geography selections
    if (profileData.targetCriteria?.countries?.length > 0 && geoData) {
      const newGeoSelection = { ...geoSelection };

      // Mark selected countries in the hierarchical selection
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
                profileData.targetCriteria.countries.includes(subRegion.name)
              ) {
                newGeoSelection.subRegions[subRegion.id] = true;
              }
            });
          }
        });
      });

      setGeoSelection(newGeoSelection);
    }

    // FIXED: Update industry selections with proper state initialization
    if (profileData.targetCriteria?.industrySectors?.length > 0 && industryData) {
      const newIndustrySelection = {
        sectors: {},
        industryGroups: {},
        industries: {}
      };

      // Mark selected industries in the hierarchical selection
      industryData.sectors.forEach((sector) => {
        if (profileData.targetCriteria.industrySectors.includes(sector.name)) {
          newIndustrySelection.sectors[sector.id] = true;
        }

        sector.industryGroups.forEach((group) => {
          if (profileData.targetCriteria.industrySectors.includes(group.name)) {
            newIndustrySelection.industryGroups[group.id] = true;
          }

          group.industries.forEach((industry) => {
            if (profileData.targetCriteria.industrySectors.includes(industry.name)) {
              newIndustrySelection.industries[industry.id] = true;
            }
          });
        });
      });

      setIndustrySelection(newIndustrySelection);
    }

    toast({
      title: "Profile Loaded",
      description: "Your existing profile has been loaded.",
    });
  }
};

  // Form state
  const [formData, setFormData] = useState<
    CompanyProfile & { selectedCurrency: string }
  >({
    companyName: "",
    website: "",
    contacts: [{ name: "", email: "", phone: "" }],
    companyType: "",
    capitalEntity: undefined, // Default value
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
  });

  // --- 1. Update validateField function to handle these fields ---
  // Add a function to validate individual fields (after the validateForm function)
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
      return value === undefined || value === ""
        ? "This field is required"
        : null;
    case "averageDealSize":
      return value === undefined || value === ""
        ? "This field is required"
        : null;
    case "targetCriteria.countries":
      return value.length === 0 ? "Please select at least one country" : null;
    case "targetCriteria.industrySectors":
      return value.length === 0 ? "Please select at least one industry sector" : null;
    case "targetCriteria.revenueMin":
    case "targetCriteria.revenueMax":
    case "targetCriteria.ebitdaMin":
    case "targetCriteria.ebitdaMax":
    case "targetCriteria.transactionSizeMin":
    case "targetCriteria.transactionSizeMax":
    case "targetCriteria.revenueGrowth":
      return value === undefined || value === "" ? "This field is required" : null;
    case "targetCriteria.minStakePercent":
      return null; // This field is now optional
    case "targetCriteria.minYearsInBusiness":
      return value === undefined || value === "" ? "This field is required" : null;
    case "targetCriteria.preferredBusinessModels":
      return value.length === 0 ? "Please select at least one business model" : null;
    case "targetCriteria.description":
      return !value?.trim() ? "Description is required" : null;
    default:
      return null;
  }
};

  // --- 2. Update validateForm to include these fields ---
  // Handle form field changes
  // Update the handleChange function to validate fields on change
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate the field and update errors
    const error = validateField(field, value);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: error || "",
    }));
  };

  // Handle nested field changes
  // Update the handleNestedChange function to validate fields on change
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...((prev[parent as keyof CompanyProfile] as Record<string, any>) ||
          {}),
        [field]: value,
      },
    }));

    // Validate the field and update errors
    const error = validateField(`${parent}.${field}`, value);
    setFieldErrors((prev) => ({
      ...prev,
      [`${parent}.${field}`]: error || "",
    }));
  };

  // Handle contact changes
  // Update the handleContactChange function to validate fields on change
  const handleContactChange = (index: number, field: string, value: string) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    handleChange("contacts", updatedContacts);

    // Validate the field and update errors
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

    // Update continent selection
    newGeoSelection.continents[continent.id] = isSelected;

    // Update all regions in this continent
    continent.regions.forEach((region) => {
      newGeoSelection.regions[region.id] = isSelected;

      // Update all subregions in this region
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

    // Update region selection
    newGeoSelection.regions[region.id] = isSelected;

    // Update all subregions in this region
    if (region.subRegions) {
      region.subRegions.forEach((subRegion) => {
        newGeoSelection.subRegions[subRegion.id] = isSelected;
      });
    }

    // Check if all regions in the continent are selected/deselected
    const allRegionsSelected = continent.regions.every((r) =>
      r.id === region.id ? isSelected : newGeoSelection.regions[r.id]
    );

    const allRegionsDeselected = continent.regions.every((r) =>
      r.id === region.id ? !isSelected : !newGeoSelection.regions[r.id]
    );

    // Update continent selection based on regions
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

    // Update only the subregion selection
    newGeoSelection.subRegions[subRegion.id] = isSelected;

    // Update parent region selection based on all subregions
    const allSubRegionsSelected = region.subRegions?.every((sr) =>
      sr.id === subRegion.id ? isSelected : newGeoSelection.subRegions[sr.id]
    );

    // Only mark region as selected if ALL subregions are selected
    if (allSubRegionsSelected) {
      newGeoSelection.regions[region.id] = true;
    } else {
      // If any subregion is deselected, the region is not fully selected
      newGeoSelection.regions[region.id] = false;
    }

    // Update continent selection based on all regions
    const allRegionsSelected = continent.regions.every(
      (r) => newGeoSelection.regions[r.id]
    );

    // Only mark continent as selected if ALL regions are selected
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

    // Find and unselect the region that matches this country
    geoData.continents.forEach((continent) => {
      if (continent.name === countryToRemove) {
        newGeoSelection.continents[continent.id] = false;
      }

      continent.regions.forEach((region) => {
        if (region.name === countryToRemove) {
          newGeoSelection.regions[region.id] = false;
        }

        // Check subregions
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
  // Let's also update the industry selection functions to cascade selections

  // Update the toggleSector function to select all children when a sector is selected
  const toggleSector = (sector: Sector) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.sectors[sector.id];

    // Update sector selection
    newIndustrySelection.sectors[sector.id] = isSelected;

    // Update all industry groups in this sector
    sector.industryGroups.forEach((group) => {
      newIndustrySelection.industryGroups[group.id] = isSelected;

      // Update all industries in this group
      group.industries.forEach((industry) => {
        newIndustrySelection.industries[industry.id] = isSelected;
      });
    });

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  // Update the toggleIndustryGroup function to select all children when a group is selected
  const toggleIndustryGroup = (group: IndustryGroup, sector: Sector) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.industryGroups[group.id];

    // Update industry group selection
    newIndustrySelection.industryGroups[group.id] = isSelected;

    // Update all industries in this group
    group.industries.forEach((industry) => {
      newIndustrySelection.industries[industry.id] = isSelected;
    });

    // Check if all groups in the sector are selected/deselected
    const allGroupsSelected = sector.industryGroups.every((g) =>
      g.id === group.id ? isSelected : newIndustrySelection.industryGroups[g.id]
    );

    const allGroupsDeselected = sector.industryGroups.every((g) =>
      g.id === group.id
        ? !isSelected
        : !newIndustrySelection.industryGroups[g.id]
    );

    // Update sector selection based on groups
    if (allGroupsSelected) {
      newIndustrySelection.sectors[sector.id] = true;
    } else if (allGroupsDeselected) {
      newIndustrySelection.sectors[sector.id] = false;
    }

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  // Update the toggleIndustry function to select all children when an industry is selected
  const toggleIndustry = (
    industry: Industry,
    group: IndustryGroup,
    sector: Sector
  ) => {
    const newIndustrySelection = { ...industrySelection };
    const isSelected = !industrySelection.industries[industry.id];

    // Update industry selection
    newIndustrySelection.industries[industry.id] = isSelected;

    // Check if all industries in the group are selected/deselected
    const allIndustriesSelected = group.industries.every((i) =>
      i.id === industry.id ? isSelected : newIndustrySelection.industries[i.id]
    );

    const allIndustriesDeselected = group.industries.every((i) =>
      i.id === industry.id ? !isSelected : newIndustrySelection.industries[i.id]
    );

    // Update group selection based on industries
    if (allIndustriesSelected) {
      newIndustrySelection.industryGroups[group.id] = true;
    } else if (allIndustriesDeselected) {
      newIndustrySelection.industryGroups[group.id] = false;
    }

    // Check if all groups in the sector are selected/deselected
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

    // Update sector selection based on groups
    if (allGroupsSelected) {
      newIndustrySelection.sectors[sector.id] = true;
    } else if (allGroupsDeselected) {
      newIndustrySelection.sectors[sector.id] = false;
    }

    setIndustrySelection(newIndustrySelection);
    updateIndustriesInFormData(newIndustrySelection);
  };

  // Update the industries array in formData based on the hierarchical selection
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
            selectedIndustries.push(industry.name); // ✅ include individual industries
          }
        });
      });
    });
  
    // Remove duplicates just in case
    const uniqueIndustries = [...new Set(selectedIndustries)];
  
    handleNestedChange("targetCriteria", "industrySectors", uniqueIndustries);
  };
  

  const removeIndustry = (industryToRemove: string) => {
    if (!industryData) return;

    const newIndustrySelection = { ...industrySelection };
    let found = false;

    // Search through all levels to find and unselect the matching item
    industryData.sectors.forEach((sector) => {
      if (sector.name === industryToRemove) {
        newIndustrySelection.sectors[sector.id] = false;
        found = true;

        // Unselect all children
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

            // Unselect all children
            group.industries.forEach((industry) => {
              newIndustrySelection.industries[industry.id] = false;
            });

            // Check if all groups in the sector are now deselected
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

                // Check parent selections
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
    setExpandedRegions((prev) => {
      const newState = {
        ...prev,
        [regionId]: !prev[regionId],
      };
      return newState;
    });
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

  // Add this new function:
  const selectSearchedCountry = (countryName: string) => {
    if (!geoData) return;

    let found = false;

    // Search through all continents, regions, and subregions
    geoData.continents.forEach((continent) => {
      if (continent.name.toLowerCase().includes(countryName.toLowerCase())) {
        // Toggle the continent if it matches
        toggleContinent(continent);
        found = true;
        return;
      }

      continent.regions.forEach((region) => {
        if (region.name.toLowerCase().includes(countryName.toLowerCase())) {
          // Toggle the region if it matches
          toggleRegion(region, continent);
          found = true;
          return;
        }

        if (region.subRegions) {
          region.subRegions.forEach((subRegion) => {
            if (
              subRegion.name.toLowerCase().includes(countryName.toLowerCase())
            ) {
              // Toggle the subregion if it matches
              toggleSubRegion(subRegion, region, continent);
              found = true;
              return;
            }
          });
        }
      });
    });

    if (found) {
      // Clear the search term after selection
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
  // Update the validateForm function to populate all field errors at once
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Basic validation
    errors["companyName"] =
      validateField("companyName", formData.companyName) || "";
    errors["website"] = validateField("website", formData.website) || "";
    errors["companyType"] =
      validateField("companyType", formData.companyType) || "";
    errors["capitalEntity"] =
      validateField("capitalEntity", formData.capitalEntity) || "";
    errors["dealsCompletedLast5Years"] =
      validateField(
        "dealsCompletedLast5Years",
        formData.dealsCompletedLast5Years
      ) || "";
    errors["averageDealSize"] =
      validateField("averageDealSize", formData.averageDealSize) || "";
    errors["targetCriteria.countries"] =
      validateField("targetCriteria.countries", formData.targetCriteria.countries) || "";
    errors["targetCriteria.industrySectors"] =
      validateField("targetCriteria.industrySectors", formData.targetCriteria.industrySectors) || "";
    errors["targetCriteria.revenueMin"] =
      validateField("targetCriteria.revenueMin", formData.targetCriteria.revenueMin) || "";
    errors["targetCriteria.revenueMax"] =
      validateField("targetCriteria.revenueMax", formData.targetCriteria.revenueMax) || "";
    errors["targetCriteria.ebitdaMin"] =
      validateField("targetCriteria.ebitdaMin", formData.targetCriteria.ebitdaMin) || "";
    errors["targetCriteria.ebitdaMax"] =
      validateField("targetCriteria.ebitdaMax", formData.targetCriteria.ebitdaMax) || "";
    errors["targetCriteria.transactionSizeMin"] =
      validateField("targetCriteria.transactionSizeMin", formData.targetCriteria.transactionSizeMin) || "";
    errors["targetCriteria.transactionSizeMax"] =
      validateField("targetCriteria.transactionSizeMax", formData.targetCriteria.transactionSizeMax) || "";
    errors["targetCriteria.revenueGrowth"] =
      validateField("targetCriteria.revenueGrowth", formData.targetCriteria.revenueGrowth) || "";
    errors["targetCriteria.minStakePercent"] =
      validateField("targetCriteria.minStakePercent", formData.targetCriteria.minStakePercent) || "";
    errors["targetCriteria.minYearsInBusiness"] =
      validateField("targetCriteria.minYearsInBusiness", formData.targetCriteria.minYearsInBusiness) || "";
    errors["targetCriteria.preferredBusinessModels"] =
      validateField("targetCriteria.preferredBusinessModels", formData.targetCriteria.preferredBusinessModels) || "";
    errors["targetCriteria.description"] =
      validateField("targetCriteria.description", formData.targetCriteria.description) || "";

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

    // Agreements validation
    errors["agreements.termsAndConditionsAccepted"] =
      validateField(
        "agreements.termsAndConditions",
        formData.agreements.termsAndConditionsAccepted
      ) || "";
    errors["agreements.feeAgreementAccepted"] =
      validateField(
        "agreements.feeAgreement",
        formData.agreements.feeAgreementAccepted
      ) || "";

    // Number range validations
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

    // Update the fieldErrors state
    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((error) => error !== "");
    return hasErrors ? "Please correct the errors in the form" : null;
  };

  // Handle form submission
  // Update the handleSubmit function to scroll to the first error
 // Handle form submission
const getExistingProfileId = async (currentBuyerId: string): Promise<string | null> => {
  if (!authToken) return null;
  try {
    const response = await fetch(`${apiUrl}/company-profiles/my-profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (response.ok) {
      const profileData = await response.json();
      return profileData._id;
    }
    return null;
  } catch (error) {
    console.error("Error checking for existing profile:", error);
    return null;
  }
};
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Check for token
  if (!authToken) {
    toast({
      title: "Authentication Required",
      description: "Please log in again to submit your profile.",
      variant: "destructive",
    });
    router.push("/buyer/login");
    return;
  }

  // Validate and get errors
  const errors: Record<string, string> = {};
  
  // Basic field validation
  errors["companyName"] = validateField("companyName", formData.companyName) || "";
  errors["website"] = validateField("website", formData.website) || "";
  errors["companyType"] = validateField("companyType", formData.companyType) || "";
  errors["capitalEntity"] = validateField("capitalEntity", formData.capitalEntity) || "";
  errors["dealsCompletedLast5Years"] = validateField("dealsCompletedLast5Years", formData.dealsCompletedLast5Years) || "";
  errors["averageDealSize"] = validateField("averageDealSize", formData.averageDealSize) || "";
  errors["targetCriteria.countries"] = validateField("targetCriteria.countries", formData.targetCriteria.countries) || "";
  errors["targetCriteria.industrySectors"] = validateField("targetCriteria.industrySectors", formData.targetCriteria.industrySectors) || "";
  errors["targetCriteria.revenueMin"] = validateField("targetCriteria.revenueMin", formData.targetCriteria.revenueMin) || "";
  errors["targetCriteria.revenueMax"] = validateField("targetCriteria.revenueMax", formData.targetCriteria.revenueMax) || "";
  errors["targetCriteria.ebitdaMin"] = validateField("targetCriteria.ebitdaMin", formData.targetCriteria.ebitdaMin) || "";
  errors["targetCriteria.ebitdaMax"] = validateField("targetCriteria.ebitdaMax", formData.targetCriteria.ebitdaMax) || "";
  errors["targetCriteria.transactionSizeMin"] = validateField("targetCriteria.transactionSizeMin", formData.targetCriteria.transactionSizeMin) || "";
  errors["targetCriteria.transactionSizeMax"] = validateField("targetCriteria.transactionSizeMax", formData.targetCriteria.transactionSizeMax) || "";
  errors["targetCriteria.revenueGrowth"] = validateField("targetCriteria.revenueGrowth", formData.targetCriteria.revenueGrowth) || "";
  errors["targetCriteria.minStakePercent"] = validateField("targetCriteria.minStakePercent", formData.targetCriteria.minStakePercent) || "";
  errors["targetCriteria.minYearsInBusiness"] = validateField("targetCriteria.minYearsInBusiness", formData.targetCriteria.minYearsInBusiness) || "";
  errors["targetCriteria.preferredBusinessModels"] = validateField("targetCriteria.preferredBusinessModels", formData.targetCriteria.preferredBusinessModels) || "";
  errors["targetCriteria.description"] = validateField("targetCriteria.description", formData.targetCriteria.description) || "";

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

  // Agreements validation
  errors["agreements.termsAndConditionsAccepted"] = validateField("agreements.termsAndConditions", formData.agreements.termsAndConditionsAccepted) || "";
  errors["agreements.feeAgreementAccepted"] = validateField("agreements.feeAgreement", formData.agreements.feeAgreementAccepted) || "";
 
  // Number range validations
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

  // Update the fieldErrors state
  setFieldErrors(errors);

  // Check if there are any errors - only non-empty error messages count
  const hasErrors = Object.values(errors).some((error) => error !== "");
  
  if (hasErrors) {
    console.log("Validation errors found:", errors);
    toast({
      title: "Validation Error",
      description: "Please correct the errors in the form before submitting.",
      variant: "destructive",
    });

    // Scroll to the first error field after DOM updates
    setTimeout(() => {
      const firstErrorField = Object.keys(errors).find((key) => errors[key]);
      if (firstErrorField) {
        const elementId = firstErrorField.replace(/\[|\]|\./g, "-");
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
    }, 100);

    return; // Early return only if there are actual errors
  }

  // Continue with submission if no errors
  setIsSubmitting(true);
  setSubmitStatus("idle");
  setErrorMessage("");

  try {
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
        termsAndConditionsAccepted: formData.agreements.termsAndConditionsAccepted,
        ndaAccepted: formData.agreements.ndaAccepted,
        feeAgreementAccepted: formData.agreements.feeAgreementAccepted,
      },
    };

    const cleanProfileData = JSON.parse(
      JSON.stringify(profileData, (key, value) => (value === undefined ? null : value))
    );

    console.log("Submitting profile data:", cleanProfileData);

    let response;
    if (isAdminEdit && profileId) {
      // PATCH for admin
      response = await fetch(`${apiUrl}/admin/company-profiles/${profileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(cleanProfileData),
      });
    } else {
      const existingProfileId = profileId || (await getExistingProfileId(buyerId));
      if (existingProfileId) {
        response = await fetch(`${apiUrl}/company-profiles/${existingProfileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(cleanProfileData),
        });
      } else {
        response = await fetch(`${apiUrl}/company-profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(cleanProfileData),
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    setSubmitStatus("success");
    toast({
      title: isAdminEdit ? "Profile Updated" : "Profile Submitted",
      description: isAdminEdit
        ? "Company profile has been updated successfully."
        : "Your company profile has been successfully submitted.",
      variant: "default",
    });

    setTimeout(() => {
      if (isAdminEdit) {
        router.push("/admin/buyers");
      } else {
        router.push("/buyer/deals?profileSubmitted=true");
      }
    }, 1000);
  } catch (error: any) {
    console.error("Submission error:", error);
    setSubmitStatus("error");
    setErrorMessage(
      error.message || "An error occurred while updating the profile."
    );
    toast({
      title: "Update Failed",
      description: error.message || "An error occurred while updating the profile.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
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
                className="mr-2 border-[#d0d5dd]"
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
                        className="mr-2 border-[#d0d5dd]"
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
                              <Label className="text-[#344054] cursor-pointer text-sm">
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

  // Add expansion state for countries and states
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  // Helper to load states and cities for a country
  const getStatesAndCities = (countryCode: string) => {
    const states = State.getStatesOfCountry(countryCode);
    return states.map((state) => ({
      ...state,
      cities: City.getCitiesOfState(countryCode, state.isoCode),
    }));
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
                className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
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
                {getStatesAndCities(country.isoCode).map((state) => (
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
                        className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
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
                    {expandedStates[`${country.isoCode}-${state.isoCode}`] && state.cities.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {state.cities.slice(0, 10).map((city, cityIndex) => (
                          <div key={`city-${city.name}-${cityIndex}`} className="pl-4">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={`geo-${country.isoCode}-${state.isoCode}-${city.name}`}
                                name="geography"
                                checked={formData.targetCriteria.countries.includes(`${country.name} > ${state.name} > ${city.name}`)}
                                onChange={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    targetCriteria: { ...prev.targetCriteria, countries: [`${country.name} > ${state.name} > ${city.name}`] },
                                  }));
                                }}
                                className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
                              />
                              <Label htmlFor={`geo-${country.isoCode}-${state.isoCode}-${city.name}`} className="text-[#344054] cursor-pointer">
                                {city.name}
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
            <h2 className="text-[#2f2b43] text-lg font-poppins font-seminold mb-4">
              About Your Company
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Update the company name input (find the company name input in the JSX) */}
              {/* Replace: */}
              {/* <div>
                <Label htmlFor="companyName" className="text-[#667085] text-sm mb-1.5 block">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Company Name"
                  className="border-[#d0d5dd]"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
              </div> */}

              {/* With: */}
              <div>
                <Label
                  htmlFor="companyName"
                  className="text-[#667085] text-sm mb-1.5 block"
                >
                  Company Name <span className="text-red-500">*</span>
                </Label>
                {formData.companyName === "" && (
                  <div className="text-red-500 text-xs mb-1">
                    Warning: companyName is empty!
                  </div>
                )}
                <Input
                  id="companyName"
                  placeholder="Company Name"
                  className={`border-[#d0d5dd] ${
                    fieldErrors["companyName"]
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
                {fieldErrors["companyName"] && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors["companyName"]}
                  </p>
                )}
              </div>
              {/* Update the website input (find the website input in the JSX) */}
              {/* Replace: */}
              {/* <div>
                <Label htmlFor="website" className="text-[#667085] text-sm mb-1.5 block">
                  Company Website <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  className="border-[#d0d5dd]"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  required
                />
              </div> */}

              {/* With: */}
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
              {/* Update the company type select (find the company type select in the JSX) */}
              {/* Replace: */}
              {/* <div>
                <Label htmlFor="companyType" className="text-[#667085] text-sm mb-1.5 block">
                  Company Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.companyType} onValueChange={(value) => handleChange("companyType", value)}>
                  <SelectTrigger className="border-[#d0d5dd]">
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
              </div> */}

              {/* With: */}
              <div>
                <Label
                  htmlFor="companyType"
                  className="text-[#667085] text-sm mb-1.5 block"
                >
                  Company Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.companyType}
                  onValueChange={(value) => handleChange("companyType", value)}
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
                  Capital Availability <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-col space-y-2 mt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="capital_fund"
                      name="capitalEntity"
                      value="Ready to deploy immediately"
                      checked={formData.capitalEntity === "Ready to deploy immediately"}
                      onChange={(e) =>
                        handleChange("capitalEntity", e.target.value)
                      }
                      className="text-[#3aafa9] focus:ring-[#3aafa9] h-4 w-4 "
                    />
                    <Label
                      htmlFor="capital_fund"
                      className="text-[#344054] cursor-pointer"
                    >
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
                      onChange={(e) =>
                        handleChange("capitalEntity", e.target.value)
                      }
                      className="text-[#3aafa9] focus:ring-[#3aafa9] h-4 w-4"
                    />
                    <Label
                      htmlFor="capital_holding"
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className={`border-[#d0d5dd] ${
                    fieldErrors["dealsCompletedLast5Years"]
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  value={formData.dealsCompletedLast5Years ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "dealsCompletedLast5Years",
                      e.target.value === "" ? undefined : Number(e.target.value)
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
                  value={formatNumberWithCommas(formData.averageDealSize)}
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
            <div className="mb-4 mt-4">
              <Label className="text-[#667085] text-sm mb-1.5 block">
                Contact Information{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="border border-[#d0d5dd] rounded-md p-4">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="mb-4">
                    {index > 0 && <div className="h-px bg-gray-200 my-4"></div>}
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
                      {/* Update the contact inputs (find the contact inputs in the JSX) */}
                      {/* For each contact field, update the input to show errors */}
                      {/* For example, for the contact name input: */}
                      {/* Replace: */}
                      {/* <Input
                        id={`contact-name-${index}`}
                        className="border-[#d0d5dd]"
                        value={contact.name}
                        onChange={(e) => handleContactChange(index, "name", e.target.value)}
                        required
                      /> */}

                      {/* With: */}
                      <div>
                        <Label
                          htmlFor={`contact-name-${index}`}
                          className="text-[#667085] text-sm mb-1.5 block"
                        >
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`contact-name-${index}`}
                          className={`border-[#d0d5dd] ${
                            fieldErrors[`contacts[${index}].name`]
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }`}
                          value={contact.name}
                          onChange={(e) =>
                            handleContactChange(index, "name", e.target.value)
                          }
                          required
                        />
                        {fieldErrors[`contacts[${index}].name`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldErrors[`contacts[${index}].name`]}
                          </p>
                        )}
                      </div>
                      {/* Similarly, update the email and phone inputs for contacts */}
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
                          className={`border-[#d0d5dd] ${
                            fieldErrors[`contacts[${index}].email`]
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }`}
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
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
                          className={`border-[#d0d5dd] ${
                            fieldErrors[`contacts[${index}].phone`]
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }`}
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
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
        placeholder="Search country, state, or city"
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
                      Min
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
                      Max
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
                      Min
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
                      Max
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
                      Min
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
                      Max
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
                  Minimum 3 Year Average Revenue Growth (%)
                </Label>
                <div className="flex items-center">
                  <Input
                    id="revenueGrowth"
                    type="text"
                    className="border-[#d0d5dd]"
                    value={formatNumberWithCommas(
                      formData.targetCriteria.revenueGrowth
                    )}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, "");
                      if (value === "" || /^\d+$/.test(value)) {
                        handleNestedChange(
                          "targetCriteria",
                          "revenueGrowth",
                          value ? Number(value) : undefined
                        );
                      }
                    }}
                  />
                </div>
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
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
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