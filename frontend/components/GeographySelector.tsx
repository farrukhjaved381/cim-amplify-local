import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Country, State } from "country-state-city";
interface GeographySelectorProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  searchTerm: string;
}
const GeographySelector: React.FC<GeographySelectorProps> = ({ selectedCountries, onChange, searchTerm }) => {
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  let allCountries = Country.getAllCountries().filter((country) => {
    const countryMatch = country.name.toLowerCase().includes(searchTerm.toLowerCase());
    const states = State.getStatesOfCountry(country.isoCode);
    const stateMatch = states.some(state => state.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return countryMatch || stateMatch;
  });

  // Move United States, Canada, and Mexico to the top
  const priorityCountries = ["United States", "Canada", "Mexico"];
  const priority = allCountries.filter(c => priorityCountries.includes(c.name));
  const rest = allCountries.filter(c => !priorityCountries.includes(c.name));
  allCountries = [...priority, ...rest];
  // Handler for country checkbox (no city logic)
  const handleCountryToggle = (country: any) => {
    const countryName = country.name;
    const states = State.getStatesOfCountry(country.isoCode);
    const allStateNames = states.map((state) => `${country.name} > ${state.name}`);
    const isSelected = selectedCountries.includes(countryName);
    let newSelected: string[];
    if (isSelected) {
      // Deselect country and all its states
      newSelected = selectedCountries.filter(
        (item) => item !== countryName && !allStateNames.includes(item)
      );
    } else {
      // Select country and all its states
      newSelected = [
        ...selectedCountries.filter(
          (item) => item !== countryName && !allStateNames.includes(item)
        ),
        countryName,
        ...allStateNames,
      ];
    }
    onChange([...new Set(newSelected)]);
  };
  // Handler for state checkbox (no city logic)
  const handleStateToggle = (country: any, state: any) => {
    const stateName = `${country.name} > ${state.name}`;
    const isSelected = selectedCountries.includes(stateName);
    let newSelected: string[];
    if (isSelected) {
      // Deselect state
      newSelected = selectedCountries.filter((item) => item !== stateName);
    } else {
      // Select state
      newSelected = [...selectedCountries, stateName];
    }
    onChange([...new Set(newSelected)]);
  };
  // Remove handler for pills (no city logic)
  const handleRemove = (item: string) => {
    // If it's a country, remove it and all its states
    const country = Country.getAllCountries().find((c) => c.name === item);
    if (country) {
      const states = State.getStatesOfCountry(country.isoCode);
      const allStateNames = states.map((state) => `${country.name} > ${state.name}`);
      onChange(selectedCountries.filter((i) => i !== item && !allStateNames.includes(i)));
        return;
    }
    // If it's a state, just remove the state
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
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 0.75rem;
          font-weight: bold;
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
                onChange={() => handleCountryToggle(country)}
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
            {expandedCountries[country.isoCode] && (
              <div className="ml-6 mt-1 space-y-1">
                {(() => {
                  let states = State.getStatesOfCountry(country.isoCode);
                  if (country.name === "United States") {
                    // Only show contiguous US, Hawaii, and Alaska
                    const contiguous = [
                      "Alabama","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
                    ];
                    states = states.filter(state => contiguous.includes(state.name) || ["Hawaii","Alaska"].includes(state.name));
                  }
                  return states
                    .filter(state =>
                      searchTerm.trim() === '' ||
                      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      state.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((state) => (
                      <div key={state.isoCode} className="pl-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`geo-${country.isoCode}-${state.isoCode}`}
                            checked={selectedCountries.includes(
                              `${country.name} > ${state.name}`
                            )}
                            onChange={() => handleStateToggle(country, state)}
                            className="custom-checkbox"
                          />
                          <Label htmlFor={`geo-${country.isoCode}-${state.isoCode}`} className="text-[#344054] cursor-pointer">
                            {state.name}
                          </Label>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default GeographySelector;