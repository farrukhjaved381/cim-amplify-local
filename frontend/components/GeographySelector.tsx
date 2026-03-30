import React, { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Country } from "country-state-city";

interface GeographySelectorProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  searchTerm: string;
}

const US_REGION_PREFIX = "United States > ";
const US_REGIONS = ["Northeast", "Midwest", "South", "West"];

const GeographySelector: React.FC<GeographySelectorProps> = ({ selectedCountries, onChange, searchTerm }) => {
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

  const allCountries = useMemo(() => {
    let countries = Country.getAllCountries().filter((country) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      if (country.name.toLowerCase().includes(term)) return true;

      if (country.name === "United States") {
        return US_REGIONS.some((region) => region.toLowerCase().includes(term));
      }

      return false;
    });

    const priorityCountries = ["United States", "Canada", "Mexico"];
    const priority = countries.filter((c) => priorityCountries.includes(c.name));
    const rest = countries.filter((c) => !priorityCountries.includes(c.name));

    return [...priority, ...rest];
  }, [searchTerm]);

  const handleCountryToggle = (countryName: string) => {
    const isSelected = selectedCountries.includes(countryName);

    if (isSelected) {
      const next = selectedCountries.filter(
        (item) => item !== countryName && !item.startsWith(US_REGION_PREFIX),
      );
      onChange(next);
      return;
    }

    const next = selectedCountries.filter((item) => item !== countryName);
    onChange([...new Set([...next, countryName])]);
  };

  const handleUsRegionToggle = (region: string) => {
    const regionLabel = `${US_REGION_PREFIX}${region}`;
    const isSelected = selectedCountries.includes(regionLabel);

    if (isSelected) {
      onChange(selectedCountries.filter((item) => item !== regionLabel));
      return;
    }

    const next = new Set(selectedCountries);
    next.add("United States");
    next.add(regionLabel);
    onChange(Array.from(next));
  };

  const handleRemove = (item: string) => {
    if (item === "United States") {
      onChange(selectedCountries.filter((i) => i !== item && !i.startsWith(US_REGION_PREFIX)));
      return;
    }

    onChange(selectedCountries.filter((i) => i !== item));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <style jsx>{`
        .custom-checkbox {
          appearance: none;
          width: 1rem;
          height: 1rem;
          border: 2px solid #D1D5DB;
          border-radius: 0.25rem;
          background-color: white;
          cursor: pointer;
          position: relative;
          margin-right: 0.5rem;
        }
        .custom-checkbox:checked {
          background-color: #3AAFA9;
          border-color: #3AAFA9;
        }
        .custom-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 45%;
          width: 0.25rem;
          height: 0.5rem;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .custom-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(58, 175, 169, 0.2);
        }
      `}</style>

      <div className="space-y-2 font-poppins flex-1 overflow-y-auto min-h-0">
        {allCountries.map((country) => (
          <div key={country.isoCode} className="border-b border-gray-100 pb-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`geo-${country.isoCode}`}
                checked={selectedCountries.includes(country.name)}
                onChange={() => handleCountryToggle(country.name)}
                className="custom-checkbox"
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
                <Label htmlFor={`geo-${country.isoCode}`} className="text-[#344054] cursor-pointer font-medium">
                  {country.name}
                </Label>
              </div>
            </div>

            {country.name === "United States" && expandedCountries[country.isoCode] && (
              <div className="ml-6 mt-1 space-y-1">
                {US_REGIONS.map((region) => {
                  const label = `${US_REGION_PREFIX}${region}`;
                  return (
                    <div key={region} className="pl-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`geo-us-region-${region}`}
                          checked={selectedCountries.includes(label)}
                          onChange={() => handleUsRegionToggle(region)}
                          className="custom-checkbox"
                        />
                        <Label htmlFor={`geo-us-region-${region}`} className="text-[#344054] cursor-pointer">
                          {region}
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCountries.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <div className="flex flex-wrap gap-1">
            {selectedCountries.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => handleRemove(item)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-[#344054]"
              >
                {item} x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographySelector;
