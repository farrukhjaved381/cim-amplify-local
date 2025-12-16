"use client";
import Image from "next/image";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
  FileText,
  X,
  Download,
  DollarSign,
  Users,
  Briefcase,
  Info,
} from "lucide-react";
import { Country, State, City } from "country-state-city";
import {
  getIndustryData,
  type Sector,
  type IndustryGroup,
  type Industry,
  type SubIndustry,
  type IndustryData,
} from "@/lib/industry-data";
import SellerProtectedRoute from "@/components/seller/protected-route";
import FloatingChatbot from "@/components/seller/FloatingChatbot";

// Helper for required field star
const RequiredStar = () => <span className="text-red-500">*</span>;

const CAPITAL_AVAILABILITY_OPTIONS = {
  READY: "Ready to deploy immediately",
  NEED: "Need to raise",
} as const;

type CapitalAvailabilityType =
  (typeof CAPITAL_AVAILABILITY_OPTIONS)[keyof typeof CAPITAL_AVAILABILITY_OPTIONS];

interface SellerFormData {
  dealTitle: string;
  companyDescription: string;
  geographySelections: string[];
  industrySelections: string[];
  selectedIndustryDisplay?: string; 
  yearsInBusiness: number;
  trailingRevenue: number;
  trailingEBITDA: number;
  revenueGrowth: number;
  currency: string;
  netIncome: number;
  askingPrice: number;
  businessModels: string[];
  managementPreferences: string;
  capitalAvailability: CapitalAvailabilityType[];
  companyType: string[];
  minPriorAcquisitions: number;
  minTransactionSize: number;
  documents: File[];
  t12FreeCashFlow?: number;
  t12NetIncome?: number;
  isPublic?: boolean;
  hideGuidelines?: boolean;
}

interface GeoItem {
  id: string;
  name: string;
  path: string;
  type: "country" | "state" | "city";
  countryCode?: string;
  stateCode?: string;
}

interface CountryData {
  isoCode: string;
  name: string;
  states: StateData[];
}

interface StateData {
  isoCode: string;
  name: string;
  countryCode: string;
  cities: CityData[];
}

interface CityData {
  name: string;
  stateCode: string;
  countryCode: string;
}

interface IndustryItem {
  id: string;
  name: string;
  path: string;
}

interface GeographySelection {
  selectedId: string | null;
  selectedName: string | null;
}

interface IndustrySelection {
  sectors: Record<string, boolean>;
  industryGroups: Record<string, boolean>;
  industries: Record<string, boolean>;
  subIndustries: Record<string, boolean>;
  activities: Record<string, boolean>;
}

interface DealDocument {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface Deal {
  _id: string;
  title: string;
  companyDescription: string;
  dealType?: string;
  companyType?: string[];
  status: string;
  visibility?: string;
  industrySector: string;
  geographySelection: string;
  yearsInBusiness: number;
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
    t12FreeCashFlow?: number;
    t12NetIncome?: number;
  };
  businessModel: {
    recurringRevenue?: boolean;
    projectBased?: boolean;
    assetLight?: boolean;
    assetHeavy?: boolean;
  };
  managementPreferences: string;
  buyerFit: {
    capitalAvailability?: CapitalAvailabilityType[];
    minPriorAcquisitions?: number;
    minTransactionSize?: number;
  };
  targetedBuyers: string[];
  interestedBuyers: string[];
  tags?: string[];
  isPublic: boolean;
  isFeatured?: boolean;
  stakePercentage?: number;
  documents: DealDocument[];
  timeline: {
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    completedAt?: string;
  };
  invitationStatus?: Map<string, any>;
  seller: string;
  hideGuidelines?: boolean;
}

const formatNumberWithCommas = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const validateFinancials = (
  revenue: number,
  ebitda: number
): { trailingRevenue?: string; trailingEBITDA?: string } => {
  const errors: { trailingRevenue?: string; trailingEBITDA?: string } = {};
  
  const minEBITDA = 1000000;
  const minRevenue = 5000000;

  const isEBITDAGood = ebitda >= minEBITDA;
  const isRevenueGoodAsFallback = revenue >= minRevenue;

  // The main condition for a deal to be valid is: (EBITDA >= 1M) OR (Revenue >= 5M)
  // If this condition is NOT met, then we need to show errors.
  if (!isEBITDAGood && !isRevenueGoodAsFallback) {
    // Both EBITDA and Revenue are too low to satisfy the main rule.
    // Provide specific guidance for each field.
    errors.trailingEBITDA = `EBITDA must be at least $${formatNumberWithCommas(minEBITDA)} to qualify.`;
    errors.trailingRevenue = `Revenue must be at least $${formatNumberWithCommas(minRevenue)} if EBITDA is below $${formatNumberWithCommas(minEBITDA)}.`;
  }

  // Existing check: EBITDA must be less than Revenue
  if (revenue > 0 && ebitda >= revenue) {
    // This is an independent rule, can coexist with the above.
    errors.trailingEBITDA = errors.trailingEBITDA 
      ? errors.trailingEBITDA + " Also, EBITDA must be less than Revenue."
      : "EBITDA must be less than Revenue";
  }
  
  return errors;
};

export default function EditDealPageFixed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);
  const [flatIndustryData, setFlatIndustryData] = useState<IndustryItem[]>([]);
  const [geoSearchTerm, setGeoSearchTerm] = useState("");
  const [industrySearchTerm, setIndustrySearchTerm] = useState("");
  const [geoOpen, setGeoOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [existingDocuments, setExistingDocuments] = useState<DealDocument[]>(
    []
  );
  
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const updateSellerPreferences = async () => {
    if (!dontShowAgain) return;
    
    try {
      const token = localStorage.getItem('token');
      const sellerId = localStorage.getItem('userId');
      const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:5001';
      
      const response = await fetch(`${apiUrl}/sellers/${sellerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hideGuidelines: true }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`);
      }
      
      console.log('Seller preferences updated successfully');
    } catch (error) {
      console.error('Failed to update seller preferences:', error);
      toast({
        title: "Warning",
        description: "Failed to save preference. Modal may appear again next time.",
        variant: "destructive",
      });
    }
  };

  const [geoSelection, setGeoSelection] = useState<GeographySelection>({
    selectedId: null,
    selectedName: null,
  });

  const [industrySelection, setIndustrySelection] = useState<IndustrySelection>(
    {
      sectors: {},
      industryGroups: {},
      industries: {},
      subIndustries: {},
      activities: {},
    }
  );

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

  const [formData, setFormData] = useState<SellerFormData>({
    dealTitle: "",
    companyDescription: "",
    geographySelections: [],
    industrySelections: [],
    yearsInBusiness: 0,
    trailingRevenue: 0,
    trailingEBITDA: 0,
    revenueGrowth: 0,
    currency: "USD($)",
    netIncome: 0,
    askingPrice: 0,
    businessModels: [],
    managementPreferences: "",
    capitalAvailability: [],
    companyType: [],
    minPriorAcquisitions: 0,
    minTransactionSize: 0,
    documents: [],
    t12FreeCashFlow: 0,
    t12NetIncome: 0,
    isPublic: false,
    hideGuidelines: false,
  });

  const [dealData, setDealData] = useState<Deal | null>(null);
  const [flatGeoData, setFlatGeoData] = useState<GeoItem[]>([]);

  const [debouncedGeoSearch, setDebouncedGeoSearch] = useState("");
  const [debouncedIndustrySearch, setDebouncedIndustrySearch] = useState("");

  const [expandedSubIndustries, setExpandedSubIndustries] = useState<
    Record<string, boolean>
  >({});

  const [geoRefresh, setGeoRefresh] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [realtimeErrors, setRealtimeErrors] = useState<{
    [key: string]: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) {
      toast({ title: 'Missing deal ID', variant: 'destructive' });
      return;
    }
    
    // Validate financials
    const errors: { [key: string]: string } = {};
    const financialErrors = validateFinancials(
      formData.trailingRevenue,
      formData.trailingEBITDA
    );
    Object.assign(errors, financialErrors);
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ title: 'Validation Error', description: 'Please fix the errors below.', variant: 'destructive' });
      return;
    }
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:5001';
      if (!token) {
        toast({ title: 'Authentication required', description: 'Please log in again.', variant: 'destructive' });
        router.push('/seller/login');
        return;
      }

      // Build Update payload (matches UpdateDealDto on backend)
      const updatePayload: any = {
        title: formData.dealTitle,
        companyDescription: formData.companyDescription,
        companyType: formData.companyType || [],
        visibility: selectedReward || undefined,
        industrySector:
          (formData.industrySelections && formData.industrySelections[0]) ||
          dealData?.industrySector || 'Other',
        geographySelection:
          (formData.geographySelections && formData.geographySelections[0]) ||
          geoSelection.selectedName ||
          dealData?.geographySelection || 'Global',
        yearsInBusiness: formData.yearsInBusiness ?? dealData?.yearsInBusiness ?? 0,
        financialDetails: {
          trailingRevenueCurrency: formData.currency || 'USD($)',
          trailingRevenueAmount: Number(formData.trailingRevenue) || 0,
          trailingEBITDACurrency: formData.currency || 'USD($)',
          trailingEBITDAAmount: Number(formData.trailingEBITDA) || 0,
          avgRevenueGrowth: Number(formData.revenueGrowth) || 0,
          netIncome: Number(formData.netIncome) || 0,
          askingPrice: Number(formData.askingPrice) || 0,
          t12FreeCashFlow: Number(formData.t12FreeCashFlow) || 0,
          t12NetIncome: Number(formData.t12NetIncome) || 0,
        },
        businessModel: {
          recurringRevenue: formData.businessModels.includes('recurring-revenue'),
          projectBased: formData.businessModels.includes('project-based'),
          assetLight: formData.businessModels.includes('asset-light'),
          assetHeavy: formData.businessModels.includes('asset-heavy'),
        },
        managementPreferences: formData.managementPreferences || '',
        buyerFit: {
          capitalAvailability: formData.capitalAvailability || [],
          minPriorAcquisitions: formData.minPriorAcquisitions || 0,
          minTransactionSize: formData.minTransactionSize || 0,
        },
        isPublic: !!formData.isPublic,
        hideGuidelines: formData.hideGuidelines,
      };

      const resp = await fetch(`${apiUrl}/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Failed to update deal (${resp.status})`);
      }
      toast({ title: 'Deal updated', description: 'Your changes have been saved.' });
      router.push('/seller/dashboard');
    } catch (err: any) {
      console.error('Update deal failed:', err);
      toast({ title: 'Update failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const flattenIndustryData = (
    items: Sector[] | IndustryGroup[] | Industry[] | SubIndustry[],
    parentPath = "",
    result: IndustryItem[] = []
  ) => {
    items.forEach((item) => {
      const path = parentPath ? `${parentPath} > ${item.name}` : item.name;
      result.push({ id: item.id, name: item.name, path });

      if ("industryGroups" in item && item.industryGroups) {
        flattenIndustryData(item.industryGroups, path, result);
      }
      if ("industries" in item && item.industries) {
        flattenIndustryData(item.industries, path, result);
      }
      if ("subIndustries" in item && item.subIndustries) {
        flattenIndustryData(item.subIndustries, path, result);
      }
    });
    return result;
  };

  const normalizeCapitalAvailability = (
    value: string
  ): CapitalAvailabilityType | null => {
    const trimmedValue = value.trim();
    if (trimmedValue === CAPITAL_AVAILABILITY_OPTIONS.READY) {
      return CAPITAL_AVAILABILITY_OPTIONS.READY;
    }
    if (trimmedValue === CAPITAL_AVAILABILITY_OPTIONS.NEED) {
      return CAPITAL_AVAILABILITY_OPTIONS.NEED;
    }
    return null;
  };

  const fetchDealData = async () => {
  if (!dealId) {
    toast({
      title: "Error",
      description: "No deal ID provided",
      variant: "destructive",
    });
    router.push("/seller/dashboard");
    return;
  }


    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

    const response = await fetch(`${apiUrl}/deals/${dealId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deal: ${response.statusText}`);
    }

    const dealData = await response.json();

    let capitalAvailabilityArray: CapitalAvailabilityType[] = [];
    if (Array.isArray(dealData.buyerFit?.capitalAvailability)) {
      capitalAvailabilityArray = dealData.buyerFit.capitalAvailability
        .map(normalizeCapitalAvailability)
        .filter(
          (item: unknown): item is CapitalAvailabilityType => item !== null
        );
    } else if (typeof dealData.buyerFit?.capitalAvailability === "string") {
      const normalized = normalizeCapitalAvailability(
        dealData.buyerFit.capitalAvailability
      );
      if (normalized) {
        capitalAvailabilityArray = [normalized];
      }
    }

    let companyTypeArray: string[] = [];
    if (Array.isArray(dealData.companyType)) {
      companyTypeArray = dealData.companyType.filter(Boolean);
    } else if (
      typeof dealData.companyType === "string" &&
      dealData.companyType.trim()
    ) {
      companyTypeArray = dealData.companyType
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    setFormData({
      dealTitle: dealData.title || "",
      companyDescription: dealData.companyDescription || "",
      geographySelections: dealData.geographySelection
        ? [dealData.geographySelection]
        : [],
      industrySelections: dealData.industrySector
        ? [dealData.industrySector]
        : [],
      selectedIndustryDisplay: dealData.industrySector || undefined,
      yearsInBusiness: dealData.yearsInBusiness || 0,
      trailingRevenue: dealData.financialDetails?.trailingRevenueAmount || 0,
      trailingEBITDA: dealData.financialDetails?.trailingEBITDAAmount || 0,
      revenueGrowth: dealData.financialDetails?.avgRevenueGrowth || 0,
      currency:
        dealData.financialDetails?.trailingRevenueCurrency || "USD($)",
      netIncome: dealData.financialDetails?.netIncome || 0,
      askingPrice: dealData.financialDetails?.askingPrice || 0,
      businessModels: [
        ...(dealData.businessModel?.recurringRevenue
          ? ["recurring-revenue"]
          : []),
        ...(dealData.businessModel?.projectBased ? ["project-based"] : []),
        ...(dealData.businessModel?.assetLight ? ["asset-light"] : []),
        ...(dealData.businessModel?.assetHeavy ? ["asset-heavy"] : []),
      ],
      managementPreferences: dealData.managementPreferences || "",
      capitalAvailability: capitalAvailabilityArray,
      companyType: [...new Set(companyTypeArray)],
      minPriorAcquisitions:
        dealData.buyerFit?.minPriorAcquisitions ?? undefined,
      minTransactionSize: dealData.buyerFit?.minTransactionSize ?? undefined,
      documents: [],
      t12FreeCashFlow: dealData.financialDetails?.t12FreeCashFlow || 0,
      t12NetIncome: dealData.financialDetails?.t12NetIncome || 0,
      isPublic: !!dealData.isPublic,
      hideGuidelines: !!dealData.hideGuidelines,
    });

    setDealData(dealData);
    setExistingDocuments(dealData.documents || []);
    setSelectedReward(dealData.visibility || "seed");
    
    // Fetch seller data to check hideGuidelines preference
    try {
      const sellerResponse = await fetch(`${apiUrl}/sellers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (sellerResponse.ok) {
        const seller = await sellerResponse.json();
        setSellerData(seller);
        setShowGuidelines(!seller.hideGuidelines);
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setShowGuidelines(true);
    }

    if (dealData.geographySelection) {
      const savedGeography = dealData.geographySelection;
      
      const parts = savedGeography.split(' > ');
      if (parts.length > 1) {
        const countryName = parts[0];
        const stateName = parts[1];
        
        const country = Country.getAllCountries().find(c => c.name === countryName);
        if (country) {
          await loadStatesAndCities(country.isoCode);
          
          setExpandedContinents(prev => ({
            ...prev,
            [country.isoCode]: true
          }));
          
          setTimeout(() => {
            const matchingGeoItem = flatGeoData.find(item => 
              item.path === savedGeography || 
              (item.name === stateName && item.countryCode === country.isoCode)
            );
            
            if (matchingGeoItem) {
              setGeoSelection({
                selectedId: matchingGeoItem.id,
                selectedName: savedGeography,
              });
            } else {
              setGeoSelection({
                selectedId: null,
                selectedName: savedGeography,
              });
            }
          }, 100);
        }
      } else {
        setGeoSelection({
          selectedId: null,
          selectedName: savedGeography,
        });
      }
    }
  } catch (error: any) {
    console.error("Error fetching deal:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to load deal data",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

 const loadStatesAndCities = async (countryCode: string) => {
  const states = State.getStatesOfCountry(countryCode);
  const countryName = Country.getCountryByCode(countryCode)?.name;
  
  setFlatGeoData(prevGeoData => {
    const newGeoData = [...prevGeoData];
    const existingIds = new Set(newGeoData.map((item) => item.id));

    states.forEach((state) => {
      const stateId = `${countryCode}-${state.isoCode}`;
      const statePath = `${countryName} > ${state.name}`;

      if (!existingIds.has(stateId)) {
        newGeoData.push({
          id: stateId,
          name: state.name,
          path: statePath,
          type: "state",
          countryCode: countryCode,
          stateCode: state.isoCode,
        });
        existingIds.add(stateId);
      }
    });

    return newGeoData;
  });
};

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof SellerFormData
  ) => {
    const value =
      e.target.value === "" ? undefined : Number.parseFloat(e.target.value);
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSelectChange = (value: string, fieldName: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCheckboxChange = (
    checked: boolean,
    value: string,
    fieldName: "companyType" | "businessModels" | "managementPreferences"
  ) => {
    setFormData((prev) => {
      const currentValues = Array.isArray(prev[fieldName])
        ? prev[fieldName]
        : [];
      const newValues = checked
        ? [...new Set([...currentValues, value])]
        : currentValues.filter((v) => v !== value);
      return {
        ...prev,
        [fieldName]: newValues,
      };
    });
  };

  const handleMultiSelectChange = (
    option: string,
    fieldName: string
  ) => {
    setFormData((prev) => {
      const arr = Array.isArray((prev as any)[fieldName])
        ? (prev as any)[fieldName]
        : [];
      return {
        ...prev,
        [fieldName]: arr.includes(option)
          ? arr.filter((v: string) => v !== option)
          : [...arr, option],
      };
    });
  };

  const handleCapitalAvailabilityChange = (
    checked: boolean,
    value: CapitalAvailabilityType
  ) => {
    setFormData((prev) => {
      const currentValues = Array.isArray(prev.capitalAvailability)
        ? prev.capitalAvailability
        : [];

      const newValues = checked
        ? [...new Set([...currentValues, value])]
        : currentValues.filter((v) => v !== value);

      return {
        ...prev,
        capitalAvailability: newValues,
      };
    });
  };

  const selectGeography = (id: string, name: string) => {
    setGeoSelection({
      selectedId: id,
      selectedName: name,
    });

    setFormData((prev) => ({
      ...prev,
      geographySelections: [name],
    }));
  };

  const clearGeographySelection = () => {
    setGeoSelection({
      selectedId: null,
      selectedName: null,
    });

    setFormData((prev) => ({
      ...prev,
      geographySelections: [],
    }));
  };

  const removeCountry = (countryToRemove: string) => {
    clearGeographySelection();
  };

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
      i.id === industry.id
        ? !isSelected
        : !newIndustrySelection.industries[i.id]
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

      const allGroupsSelected = sector.industryGroups.every((group) => {
        return group.industries.every(
          (industry) => selection.industries[industry.id]
        );
      });

      if (sectorSelected && allGroupsSelected) {
        selectedIndustries.push(sector.name);
      } else {
        sector.industryGroups.forEach((group) => {
          const groupSelected = selection.industryGroups[group.id];

          const allIndustriesSelected = group.industries.every(
            (industry) => selection.industries[industry.id]
          );

          if (groupSelected && allIndustriesSelected) {
            selectedIndustries.push(group.name);
          } else {
            group.industries.forEach((industry) => {
              if (selection.industries[industry.id]) {
                selectedIndustries.push(industry.name);
              }
            });
          }
        });
      }
    });

    setFormData((prev) => ({
      ...prev,
      industrySelections: selectedIndustries,
    }));
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

  const toggleContinentExpansion = async (continentId: string) => {
    const isCurrentlyExpanded = expandedContinents[continentId];
    if (!isCurrentlyExpanded) {
      await loadStatesAndCities(continentId);
      setExpandedContinents((prev) => ({
        ...prev,
        [continentId]: true,
      }));
      setGeoRefresh((v) => v + 1);
    } else {
      setExpandedContinents((prev) => ({
        ...prev,
        [continentId]: false,
      }));
    }
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

  const toggleSubIndustryExpansion = (subIndustryId: string) => {
    setExpandedSubIndustries((prev) => ({
      ...prev,
      [subIndustryId]: !prev[subIndustryId],
    }));
  };

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

  const handleIndustryRadioChange = (industryName: string) => {
    if (!industryData) return;

    const subIndustryNames: string[] = [];
    let selectedIndustryType = "industry";

    industryData.sectors.forEach((sector) => {
      if (sector.name === industryName) {
        selectedIndustryType = "sector";
        sector.industryGroups.forEach((group) => {
          group.industries.forEach((industry) => {
            industry.subIndustries.forEach((subIndustry) => {
              subIndustryNames.push(subIndustry.name);
            });
          });
        });
      } else {
        sector.industryGroups.forEach((group) => {
          if (group.name === industryName) {
            selectedIndustryType = "industryGroup";
            group.industries.forEach((industry) => {
              industry.subIndustries.forEach((subIndustry) => {
                subIndustryNames.push(subIndustry.name);
              });
            });
          } else {
            group.industries.forEach((industry) => {
              if (industry.name === industryName) {
                selectedIndustryType = "industry";
                industry.subIndustries.forEach((subIndustry) => {
                  subIndustryNames.push(subIndustry.name);
                });
              } else {
                industry.subIndustries.forEach((subIndustry) => {
                  if (subIndustry.name === industryName) {
                    selectedIndustryType = "subIndustry";
                    subIndustryNames.push(subIndustry.name);
                  }
                });
              }
            });
          }
        });
      }
    });

    setFormData((prev) => ({
      ...prev,
      industrySelections:
        subIndustryNames.length > 0 ? subIndustryNames : [industryName],
      selectedIndustryDisplay: industryName,
    }));

    console.log(`Selected ${selectedIndustryType}: ${industryName}`);
    console.log(
      `Sending ${subIndustryNames.length} sub-industries to backend:`,
      subIndustryNames
    );
  };

  const renderIndustrySelection = () => {
    const filteredData = filterIndustryData();
    if (!filteredData) return <div>Loading industry data...</div>;

    return (
      <div className="space-y-2">
        {filteredData.sectors.map((sector) => (
          <div key={sector.id} className="border-b border-gray-100 pb-1">
            <div className="flex items-center">
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
                      <input
                        type="radio"
                        id={`group-${group.id}`}
                        name="industry"
                        checked={
                          formData.selectedIndustryDisplay === group.name
                        }
                        onChange={() => handleIndustryRadioChange(group.name)}
                        className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
                      />
                      <div
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => toggleIndustryGroupExpansion(group.id)}
                      >
                        <Label
                          htmlFor={`group-${group.id}`}
                          className="text-[#344054] cursor-pointer"
                        >
                          {group.name}
                        </Label>
                      </div>
                    </div>
                    {group.description && (
                      <div className="ml-6 mt-1 text-xs text-gray-500 font-poppins italic">
                        {group.description}
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

const renderGeographySelection = () => {
  const filteredGeoData = flatGeoData.filter(
    (item) =>
      !debouncedGeoSearch ||
      item.name.toLowerCase().includes(debouncedGeoSearch.toLowerCase()) ||
      item.path.toLowerCase().includes(debouncedGeoSearch.toLowerCase())
  );

  const groupedData = filteredGeoData.reduce((acc, item) => {
    const countryCode = item.countryCode || item.id;
    if (!acc[countryCode]) {
      acc[countryCode] = {
        country: null,
        states: [],
      };
    }

    if (item.type === "country") {
      acc[countryCode].country = item;
    } else if (item.type === "state") {
      acc[countryCode].states.push(item);
    }

    return acc;
  }, {} as Record<string, { country: GeoItem | null; states: GeoItem[] }>);

  const priorityCountryCodes = ['CA', 'US', 'MX'];
  
  const usMinorOutlyingIslands = [
    'American Samoa',
    'Baker Island', 
    'Guam',
    'Howland Island',
    'Jarvis Island',
    'Johnston Atoll',
    'Kingman Reef',
    'Midway Atoll',
    'Navassa Island',
    'Northern Mariana Islands',
    'United States Virgin Islands',
    'Palmyra Atoll'
  ];

  const priorityGroups: { country: GeoItem | null; states: GeoItem[] }[] = [];
  const otherGroups: { country: GeoItem | null; states: GeoItem[] }[] = [];

  Object.values(groupedData)
    .filter((group) => group.country || group.states.length > 0)
    .forEach((group) => {
      if (!group.country) return;
      
      const countryCode = group.country.id;
      
      if (group.country.name === 'Puerto Rico') {
        return;
      }
      
      if (countryCode === 'US') {
        const usStates = group.states.filter(state => 
          !usMinorOutlyingIslands.includes(state.name) && 
          state.name !== 'United States Minor Outlying Islands'
        );
        group.states = usStates;
      }
      
      if (priorityCountryCodes.includes(countryCode)) {
        priorityGroups.push(group);
      } else {
        otherGroups.push(group);
      }
    });

  const usMinorOutlyingIslandsGroup = {
    country: {
      id: 'UM',
      name: 'United States Minor Outlying Islands',
      path: 'United States Minor Outlying Islands',
      type: 'country' as const,
      countryCode: 'UM'
    },
    states: usMinorOutlyingIslands.map((island, index) => ({
      id: `UM-${index}`,
      name: island,
      path: `United States Minor Outlying Islands > ${island}`,
      type: 'state' as const,
      countryCode: 'UM',
      stateCode: index.toString()
    }))
  };

  priorityGroups.sort((a, b) => {
    const aIndex = priorityCountryCodes.indexOf(a.country?.id || '');
    const bIndex = priorityCountryCodes.indexOf(b.country?.id || '');
    return aIndex - bIndex;
  });

  otherGroups.sort((a, b) => {
    const aName = a.country?.name || '';
    const bName = b.country?.name || '';
    return aName.localeCompare(bName);
  });

  const sortedGroups = [...priorityGroups, usMinorOutlyingIslandsGroup, ...otherGroups];

  return (
    <div className="space-y-2 font-poppins">
      {sortedGroups.map((group, groupIndex) => {
        if (!group.country) return null;
        const country = group.country;
        const filteredStates = group.states;

        return (
          <div
            key={`country-${country.id}-${groupIndex}`}
            className="border-b border-gray-100 pb-1"
          >
            <div className="flex items-center">
              <div
                className="flex items-center cursor-pointer flex-1"
                onClick={() => toggleContinentExpansion(country.id)}
              >
                {expandedContinents[country.id] ? (
                  <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                )}
                <Label className="text-[#344054] cursor-pointer font-medium">
                  {country.name}
                </Label>
              </div>
            </div>

            {expandedContinents[country.id] &&
              filteredStates.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {filteredStates.map((state: GeoItem, stateIndex: number) => (
                    <div
                      key={`state-${state.id}-${stateIndex}`}
                      className="pl-2"
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`geo-${state.id}`}
                          name="geography"
                          checked={
                            geoSelection.selectedId === state.id || 
                            geoSelection.selectedName === state.path ||
                            formData.geographySelections.includes(state.path)
                          }
                          onChange={() => selectGeography(state.id, state.path)}
                          className="mr-2 h-4 w-4 text-[#3aafa9] focus:ring-[#3aafa9]"
                        />
                        <Label
                          htmlFor={`geo-${state.id}`}
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
        );
      })}
    </div>
  );
};
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");

      if (!token || userRole !== "seller") {
        router.push("/seller/login");
        return;
      }

      const allCountries = Country.getAllCountries();
      const geoData: GeoItem[] = [];

      const priorityCountryCodes = ['CA', 'US', 'MX'];
      const priorityCountries = allCountries.filter(country => 
        priorityCountryCodes.includes(country.isoCode)
      );
      const otherCountries = allCountries.filter(country => 
        !priorityCountryCodes.includes(country.isoCode)
      );

      priorityCountries.sort((a, b) => {
        return priorityCountryCodes.indexOf(a.isoCode) - priorityCountryCodes.indexOf(b.isoCode);
      });

      otherCountries.sort((a, b) => a.name.localeCompare(b.name));

      [...priorityCountries, ...otherCountries].forEach((country) => {
        geoData.push({
          id: country.isoCode,
          name: country.name,
          path: country.name,
          type: "country",
          countryCode: country.isoCode,
        });
      });

      setFlatGeoData(geoData);

      const industryResponse = await getIndustryData();
      setIndustryData(industryResponse);
      setFlatIndustryData(flattenIndustryData(industryResponse.sectors));

      await fetchDealData();
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load form data. Please refresh the page.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  fetchInitialData();

}, [router, dealId]);

useEffect(() => {
  const handleGeographySelection = async () => {
    if (dealData?.geographySelection && flatGeoData.length > 0) {
      const savedGeography = dealData.geographySelection;
      
      const parts = savedGeography.split(' > ');
      if (parts.length > 1) {
        const countryName = parts[0];
        const stateName = parts[1];
        
        const country = Country.getAllCountries().find(c => c.name === countryName);
        if (country) {
          await loadStatesAndCities(country.isoCode);
          
          setExpandedContinents(prev => ({
            ...prev,
            [country.isoCode]: true
          }));
          
          setTimeout(() => {
            const stateId = `${country.isoCode}-${State.getStatesOfCountry(country.isoCode).find(s => s.name === stateName)?.isoCode}`;
            setGeoSelection({
              selectedId: stateId,
              selectedName: savedGeography,
            });
          }, 100);
        }
      }
    }
  };

  handleGeographySelection();
}, [dealData?.geographySelection, flatGeoData.length]);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3aafa9]"></div>
      </div>
    );
  }

  return (
    <>
      <SellerProtectedRoute>
        <div className="container mx-auto py-8 px-4 max-w-5xl bg-white">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="mr-4"
              onClick={() => router.push("/seller/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Edit Deal</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seller Rewards */}
            <div className="bg-[#f0f7fa] p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">
                Seller Rewards - Choose Reward Level
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Seed Option */}
                <div
                  className={`cursor-pointer border-4 rounded-lg overflow-hidden ${
                    selectedReward === "seed"
                      ? "border-[#3aafa9]"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedReward("seed")}
                >
                  <div className="flex flex-col h-full bg-white">
                    <div className="p-4">
                      <div className="flex justify-between overflow-hidden">
                        <h3 className="font-semibold text-[#3aafa9]">Seed</h3>
                        <Image
                          width={100}
                          height={100}
                          src="/seed.svg"
                          alt="seed"
                          className="w-20 h-20"
                        />
                      </div>
                      <p className="text-sm mt-2 text-gray-600">
                        This deal will be made widely available on other deal
                        platforms. Most of our buyers refuse deals from this level
                        - you will get very few buyer matches.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center">
                        <div className="p-4">
                          <div className="bg-[#3aafa9] text-white text-xs rounded-md px-3 py-3 inline-block">
                            <span className="text-[#F4E040]">$10</span> Amazon
                            Gift Card for posting with us
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloom Option */}
                <div
                  className={`cursor-pointer border-4 rounded-lg overflow-hidden ${
                    selectedReward === "bloom"
                      ? "border-[#3aafa9]"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedReward("bloom")}
                >
                  <div className="flex flex-col h-full bg-white">
                    <div className="p-4">
                      <div className="flex justify-between overflow-hidden">
                        <h3 className="font-semibold text-[#3aafa9]">Bloom</h3>

                        <Image
                          width={100}
                          height={100}
                          src="/bloom.svg"
                          alt="bloom"
                          className="w-20 h-20"
                        />
                      </div>
                      <p className="text-sm mt-2 text-gray-600">
                        Give CIM Amplify a two week head start! This deal will be
                        posted exclusively on CIM Amplify for two weeks and no
                        other deal sites including your own website. Feel free to
                        market directly to buyers you do not choose on CIM
                        Amplify.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center">
                        <div className="p-4">
                          <div className="bg-[#3aafa9] text-white text-xs rounded-md px-3 py-3 inline-block">
                            <span className="text-[#F4E040]">$25</span> Amazon
                            Gift Card for posting with us PLUS $5,000 if acquired
                            via CIM Amplify
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fruit Option */}
                <div
                  className={`cursor-pointer border-4 rounded-lg overflow-hidden ${
                    selectedReward === "fruit"
                      ? "border-[#3aafa9]"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedReward("fruit")}
                >
                  <div className="flex flex-col h-full bg-white">
                    <div className="p-4">
                      <div className="flex justify-between overflow-hidden">
                        <h3 className="font-semibold text-[#3aafa9]">Fruit</h3>

                        <Image
                          width={100}
                          height={100}
                          src="/fruit.svg"
                          alt="Fruit"
                          className="w-20 h-20"
                        />
                      </div>

                      <p className="text-sm mt-2 text-gray-600">
                        This deal will be posted exclusively on CIM Amplify and no
                        other deal sites including your own website. Feel free to
                        market directly to buyers you do not choose on CIM
                        Amplify.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center">
                        <div className="p-4">
                          <div className="bg-[#3aafa9] text-white text-xs rounded-md px-3 py-3 inline-block">
                            <span className="text-[#F4E040]">$50</span> Amazon
                            Gift Card for posting with us PLUS $10,000 if acquired
                            via CIM Amplify
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Section */}
            <section>
              <h2 className="text-xl font-bold mb-2">Overview</h2>
              <p className="text-sm font-semibold text-red-600 mb-6">Please do not include your company name or the name of your client on this form.</p>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="dealTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Deal Title <RequiredStar />
                  </label>
                  <Input
                    id="dealTitle"
                    name="dealTitle"
                    value={formData.dealTitle}
                    onChange={handleInputChange}
                    placeholder="Add title"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyDescription"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company Description <RequiredStar />
                  </label>
                  <Textarea
                    id="companyDescription"
                    name="companyDescription"
                    value={formData.companyDescription}
                    onChange={handleInputChange}
                    placeholder="Make sure to be very specific about what the company does"
                    className="w-full min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Geography Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Location <RequiredStar />
                    </label>
                    <div className="border border-[#d0d5dd] rounded-md p-4 h-80 flex flex-col">
                      <div className="relative mb-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#667085]" />
                        <Input
                          placeholder="Search "
                          className="pl-8 border-[#d0d5dd]"
                          value={geoSearchTerm}
                          onChange={(e) => setGeoSearchTerm(e.target.value)}
                        />
                      </div>

                      {formData.geographySelections.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm text-[#667085] mb-1">
                            Selected{" "}
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {formData.geographySelections.map(
                              (country, index) => (
                                <span
                                  key={`selected-country-${index}`}
                                  className="bg-gray-100 text-[#344054] text-xs rounded-full px-2 py-0.5 flex items-center group"
                                >
                                  {country}
                                  <button
                                    type="button"
                                    onClick={() => removeCountry(country)}
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
                      )}

                      <div className="flex-1 overflow-y-auto">
                        {renderGeographySelection()}
                      </div>
                    </div>
                  </div>

                  {/* Industry Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry Selector <RequiredStar />
                    </label>
                    <div className="border border-[#d0d5dd] rounded-md p-4 h-80 flex flex-col">
                      <div className="relative mb-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#667085]" />
                        <Input
                          placeholder="Search "
                          className="pl-8 border-[#d0d5dd]"
                          value={industrySearchTerm}
                          onChange={(e) => setIndustrySearchTerm(e.target.value)}
                        />
                      </div>

                      {formData.selectedIndustryDisplay && (
                        <div className="mb-4">
                          <div className="text-sm text-[#667085] mb-1">
                            Selected{" "}
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            <span
                              key="selected-industry-display"
                              className="bg-gray-100 text-[#344054] text-xs rounded-full px-2 py-0.5 flex items-center group"
                            >
                              {formData.selectedIndustryDisplay}
                              <span className="ml-1 text-gray-400 text-xs">
                                ({formData.industrySelections.length}{" "}
                                sub-industries)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    industrySelections: [],
                                    selectedIndustryDisplay: undefined,
                                  }));
                                }}
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
                          </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto">
                        {renderIndustrySelection()}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="yearsInBusiness"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Number of years in business <RequiredStar />
                  </label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    min="0"
                    value={formData.yearsInBusiness ?? ""}
                    onChange={(e) => handleNumberChange(e, "yearsInBusiness")}
                    className="w-full"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Business Models <RequiredStar />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center">
                      <Checkbox
                        id="recurring-revenue"
                        checked={formData.businessModels.includes(
                          "recurring-revenue"
                        )}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            Boolean(checked),
                            "recurring-revenue",
                            "businessModels"
                          )
                        }
                        className="mr-2 border-[#d0d5dd]"
                      />
                      <Label
                        htmlFor="recurring-revenue"
                        className="cursor-pointer"
                      >
                        Recurring Revenue
                      </Label>
                    </div>

                    <div className="flex items-center">
                      <Checkbox
                        id="project-based"
                        checked={formData.businessModels.includes(
                          "project-based"
                        )}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            Boolean(checked),
                            "project-based",
                            "businessModels"
                          )
                        }
                        className="mr-2 border-[#d0d5dd]"
                      />
                      <Label htmlFor="project-based" className="cursor-pointer">
                        Project Based
                      </Label>
                    </div>

                    <div className="flex items-center">
                      <Checkbox
                        id="asset-light"
                        checked={formData.businessModels.includes("asset-light")}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            Boolean(checked),
                            "asset-light",
                            "businessModels"
                          )
                        }
                        className="mr-2 border-[#d0d5dd]"
                      />
                      <Label htmlFor="asset-light" className="cursor-pointer">
                        Asset Light
                      </Label>
                    </div>

                    <div className="flex items-center">
                      <Checkbox
                        id="asset-heavy"
                        checked={formData.businessModels.includes("asset-heavy")}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            Boolean(checked),
                            "asset-heavy",
                            "businessModels"
                          )
                        }
                        className="mr-2 border-[#d0d5dd]"
                      />
                      <Label htmlFor="asset-heavy" className="cursor-pointer">
                        Asset Heavy
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="managementPreferences"
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
                    Management Preferences <RequiredStar />
                  </label>
                  <textarea
                    id="managementPreferences"
                    name="managementPreferences"
                    value={formData.managementPreferences}
                    onChange={handleInputChange}
                    rows={4}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    placeholder="Enter management preferences"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Financials Section */}
            <section className="bg-[#f9f9f9] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Financials <RequiredStar /></h2>
              <p className="text-sm text-gray-600 mb-6">Please use full numbers (e.g., 5,000,000 not 5M)</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="trailingRevenue"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Trailing 12 Month Revenue <RequiredStar />
                    </label>
                    <div className="flex">
                      <Input
                        id="trailingRevenue"
                        type="text"
                        value={
                          formData.trailingRevenue
                            ? formatNumberWithCommas(formData.trailingRevenue)
                            : ""
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/,/g, "");
                          if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                            const numValue = rawValue === "" ? 0 : Number.parseFloat(rawValue);
                            handleNumberChange(
                              {
                                target: { value: rawValue },
                              } as React.ChangeEvent<HTMLInputElement>,
                              "trailingRevenue"
                            );

                            const validationErrors = validateFinancials(numValue, formData.trailingEBITDA);
                            setRealtimeErrors((prev) => ({
                              ...prev,
                              trailingRevenue: validationErrors.trailingRevenue || "",
                              trailingEBITDA: validationErrors.trailingEBITDA || "",
                            }));
                          }
                        }}
                        className="w-full"
                        required
                      />
                    </div>
                    {(fieldErrors.trailingRevenue || realtimeErrors.trailingRevenue) && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors.trailingRevenue || realtimeErrors.trailingRevenue}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="currency"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Currency
                    </label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        handleSelectChange(value, "currency")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD($)">USD($)</SelectItem>
                        <SelectItem value="EUR(€)">EUR(€)</SelectItem>
                        <SelectItem value="GBP(£)">GBP(£)</SelectItem>
                        <SelectItem value="CAD($)">CAD($)</SelectItem>
                        <SelectItem value="AUD($)">AUD($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="trailingEBITDA"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Trailing 12 Month EBITDA(0 covers negative) <RequiredStar />
                    </label>
                    <Input
                      id="trailingEBITDA"
                      type="text"
                      value={
                        formData.trailingEBITDA !== undefined &&
                        formData.trailingEBITDA !== null
                          ? formatNumberWithCommas(formData.trailingEBITDA)
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "");
                        if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                          const numValue = rawValue === "" ? 0 : Number.parseFloat(rawValue);
                          handleNumberChange(
                            {
                              target: { value: rawValue },
                            } as React.ChangeEvent<HTMLInputElement>,
                            "trailingEBITDA"
                          );
                          
                          const validationErrors = validateFinancials(formData.trailingRevenue, numValue);
                          setRealtimeErrors((prev) => ({
                            ...prev,
                            trailingRevenue: validationErrors.trailingRevenue || "",
                            trailingEBITDA: validationErrors.trailingEBITDA || "",
                          }));
                        }
                      }}
                      className="w-full"
                      required
                    />
                    {(fieldErrors.trailingEBITDA || realtimeErrors.trailingEBITDA) && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldErrors.trailingEBITDA || realtimeErrors.trailingEBITDA}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="revenueGrowth"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Average 3 year revenue growth in %(0 covers negative) <RequiredStar />
                    </label>
                    <Input
                      id="revenueGrowth"
                      type="text"
                      value={
                        formData.revenueGrowth !== undefined &&
                        formData.revenueGrowth !== null
                          ? formatNumberWithCommas(formData.revenueGrowth)
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "");
                        if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                          handleNumberChange(
                            {
                              target: { value: rawValue },
                            } as React.ChangeEvent<HTMLInputElement>,
                            "revenueGrowth"
                          );
                        }
                      }}
                      className="w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Optional Financial Information */}
            <section className="bg-[#f9f9f9] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">Optional Financial Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="netIncome"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Net Income
                  </label>
                  <Input
                    id="netIncome"
                    type="text"
                    value={
                      formData.netIncome
                        ? formatNumberWithCommas(formData.netIncome)
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                        handleNumberChange(
                          {
                            target: { value: rawValue },
                          } as React.ChangeEvent<HTMLInputElement>,
                          "netIncome"
                        );
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="t12FreeCashFlow"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    T12 Free Cash Flow
                  </label>
                  <Input
                    id="t12FreeCashFlow"
                    type="text"
                    value={
                      formData.t12FreeCashFlow
                        ? formatNumberWithCommas(formData.t12FreeCashFlow)
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                        handleNumberChange(
                          {
                            target: { value: rawValue },
                          } as React.ChangeEvent<HTMLInputElement>,
                          "t12FreeCashFlow"
                        );
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="t12NetIncome"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    T12 Net Income
                  </label>
                  <Input
                    id="t12NetIncome"
                    type="text"
                    value={
                      formData.t12NetIncome
                        ? formatNumberWithCommas(formData.t12NetIncome)
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                        handleNumberChange(
                          {
                            target: { value: rawValue },
                          } as React.ChangeEvent<HTMLInputElement>,
                          "t12NetIncome"
                        );
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="askingPrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Asking Price
                  </label>
                  <Input
                    id="askingPrice"
                    type="text"
                    value={
                      formData.askingPrice
                        ? formatNumberWithCommas(formData.askingPrice)
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, "");
                      if (rawValue === "" || /^-?\d*$/.test(rawValue)) {
                        handleNumberChange(
                          {
                            target: { value: rawValue },
                          } as React.ChangeEvent<HTMLInputElement>,
                          "askingPrice"
                        );
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </section>

            {/* Buyer Fit / Ability to Close */}
            <section className="bg-[#f9f9f9] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">
                Buyer Fit / Ability to Close <RequiredStar />
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Capital Availability <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="ready-capital"
                      checked={formData.capitalAvailability.includes(
                        CAPITAL_AVAILABILITY_OPTIONS.READY
                      )}
                      onCheckedChange={(checked) =>
                        handleCapitalAvailabilityChange(
                          Boolean(checked),
                          CAPITAL_AVAILABILITY_OPTIONS.READY
                        )
                      }
                      className="border-[#d0d5dd]"
                    />
                    <label
                      htmlFor="ready-capital"
                      className="text-sm cursor-pointer"
                    >
                      {CAPITAL_AVAILABILITY_OPTIONS.READY}
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="need-raise"
                      checked={formData.capitalAvailability.includes(
                        CAPITAL_AVAILABILITY_OPTIONS.NEED
                      )}
                      onCheckedChange={(checked) =>
                        handleCapitalAvailabilityChange(
                          Boolean(checked),
                          CAPITAL_AVAILABILITY_OPTIONS.NEED
                        )
                      }
                      className="border-[#d0d5dd]"
                    />
                    <label
                      htmlFor="need-raise"
                      className="text-sm cursor-pointer"
                    >
                      {CAPITAL_AVAILABILITY_OPTIONS.NEED}
                    </label>
                  </div>
                </div>
              </div>

              {/* Company Type - spans full width on md+ */}
              <div className="md:col-span-2 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Type <RequiredStar />
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left h-auto min-h-11 px-3 py-2 border border-gray-300 hover:border-gray-400 focus:border-[#3aafa9] focus:ring-2 focus:ring-[#3aafa9]/20 rounded-md overflow-hidden bg-transparent"
                    >
                      <span
                        className={`${
                          Array.isArray(formData.companyType) &&
                          formData.companyType.length > 0
                            ? "text-gray-900"
                            : "text-gray-500"
                        } truncate block pr-2`}
                      >
                        {Array.isArray(formData.companyType) &&
                        formData.companyType.length > 0
                          ? formData.companyType.join(", ")
                          : "Select company types"}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="max-w-full w-[--radix-popover-trigger-width] p-0 border border-gray-200 rounded-md shadow-lg bg-white"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          Select Company Types
                        </h3>
                        <span className="text-xs text-gray-500">
                          {Array.isArray(formData.companyType)
                            ? formData.companyType.length
                            : 0}{" "}
                          selected
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allOptions = [
                              "Buy Side Mandate",
                              "Entrepreneurship through Acquisition",
                              "Family Office",
                              "Holding Company",
                              "Independent Sponsor",
                              "Private Equity",
                              "Single Acquisition Search",
                              "Strategic Operating Company",
                            ];
                            setFormData((prev) => ({
                              ...prev,
                              companyType: allOptions,
                            }));
                          }}
                          className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, companyType: [] }))
                          }
                          className="flex-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {[
                        "Buy Side Mandate",
                        "Entrepreneurship through Acquisition",
                        "Family Office",
                        "Holding Company",
                        "Independent Sponsor",
                        "Private Equity",
                        "Single Acquisition Search",
                        "Strategic Operating Company",
                      ].map((option) => {
                        const isChecked =
                          Array.isArray(formData.companyType) &&
                          formData.companyType.includes(option);

                        return (
                          <div
                            key={option}
                            className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-blue-50 hover:bg-blue-100"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleMultiSelectChange(option, "companyType")}
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Controlled by onClick above
                                className="h-4 w-4 border-gray-300 rounded appearance-none border-2 checked:bg-[#3aafa9] checked:border-[#3aafa9] focus:ring-[#3aafa9] focus:ring-2 transition-colors"
                              />
                              {isChecked && (
                                <svg
                                  className="absolute inset-0 h-4 w-4 text-white pointer-events-none"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <label
                              className={`text-sm cursor-pointer flex-1 select-none ${
                                isChecked
                                  ? "font-medium text-blue-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {option}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col md:flex-row w-full gap-4">
                  {/* Minimum Prior Acquisitions */}
                  <div className="w-full">
                    <label
                      htmlFor="minPriorAcquisitions"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Minimum Prior Acquisitions
                    </label>
                    <Input
                      id="minPriorAcquisitions"
                      type="text"
                      value={
                        typeof formData.minPriorAcquisitions === 'number'
                          ? formatNumberWithCommas(formData.minPriorAcquisitions)
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "");
                        if (rawValue === "" || /^\d*$/.test(rawValue)) {
                          handleNumberChange(
                            {
                              target: { value: rawValue },
                            } as React.ChangeEvent<HTMLInputElement>,
                            "minPriorAcquisitions"
                          );
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  {/* Minimum Transaction Size */}
                  <div className="w-full">
                    <label
                      htmlFor="minTransactionSize"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Minimum Transaction Size
                    </label>
                    <Input
                      id="minTransactionSize"
                      type="text"
                      value={
                        typeof formData.minTransactionSize === 'number'
                          ? formatNumberWithCommas(formData.minTransactionSize)
                          : ""
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "");
                        if (rawValue === "" || /^\d*$/.test(rawValue)) {
                          handleNumberChange(
                            {
                              target: { value: rawValue },
                            } as React.ChangeEvent<HTMLInputElement>,
                            "minTransactionSize"
                          );
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Marketplace listing toggle - enhanced */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3 3h18v2H3V3zm1 4h16l-1.5 12.5A2 2 0 0 1 16.51 21H7.49a2 2 0 0 1-1.99-1.5L4 7zm4 2v8h2V9H8zm6 0v8h2V9h-2z"/></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">List in Marketplace</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200">Marketplace</span>
                      <input
                        aria-label="List in Marketplace"
                        type="checkbox"
                        checked={!!formData.isPublic}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                        className="h-4 w-4 accent-teal-500"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-blue-800">Marketplace allows all buyers on CIM Amplify to see this teaser. Buyers can request access; you'll choose to approve or deny. We suggest that you still select and invite buyers that are perfectly matched on the next screen.</p>
                  <p className="mt-1 text-xs text-blue-700">Note: If you turn this off later, outstanding marketplace requests will be declined automatically.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    Updating...
                    <div className="animate-spin rounded-full h-4 w-4 ml-2 border-t-2 border-b-2 border-white"></div>
                  </>
                ) : (
                  "Update Deal"
                )}
              </Button>
            </div>
          </form>
          <Toaster />
          <FloatingChatbot />
        </div>
      </SellerProtectedRoute>
      
      {/* Deal Guidelines Modal - Fixed with higher z-index and proper positioning */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 relative">
              <button
                onClick={async () => {
                  await updateSellerPreferences();
                  setShowGuidelines(false);
                }}
                className="absolute top-3 right-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-all group"
                aria-label="Close modal"
              >
                <X size={20} className="transform group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Deal Guidelines</h2>
                  <p className="text-teal-100 text-sm">Review before proceeding</p>
                </div>
              </div>
            </div>

            {/* Compact Body */}
            <div className="p-5">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-teal-600 rounded-full"></span>
                  Important Notes
                </h3>
                
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, text: 'Deals must have a minimum of $1 Million in EBITDA or $5 Million in revenue' },
                    { icon: Users, text: 'Deals must be posted by an M&A Advisor' },
                    { icon: FileText, text: 'A Confidential Information Memorandum, or similar data, must be available' },
                    { icon: Briefcase, text: 'Only M&A deals may be posted. No other deal type will be accepted' }
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 group hover:translate-x-1 transition-transform duration-200"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="bg-teal-600 rounded-lg p-1.5 group-hover:bg-teal-700 transition-colors">
                            <Icon size={14} className="text-white" />
                          </div>
                        </div>
                        <span className="text-gray-700 text-sm leading-snug">
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="bg-gray-50 px-5 py-4 border-t border-gray-200 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-gray-700 text-sm font-medium group-hover:text-gray-900 select-none">
                  Don't show this again
                </span>
              </label>

              <button
                onClick={async () => {
                  await updateSellerPreferences();
                  setShowGuidelines(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                OK, Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}