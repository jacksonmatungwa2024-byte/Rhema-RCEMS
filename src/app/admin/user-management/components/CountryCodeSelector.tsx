"use client";

import React from "react";
import countryData from "./countryData";

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountryCodeSelector({ value, onChange }: CountryCodeSelectorProps) {
  return (
    <div className="country-code-selector">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-select"
      >
        {countryData.map((country) => (
          <option key={country.code} value={country.dial_code}>
            {country.flag} {country.name} ({country.dial_code})
          </option>
        ))}
      </select>
    </div>
  );
}
