"use client";

import React from "react";

interface CountryCodeSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

const countries = [
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  // Ongeza zingine kama unataka
];

export default function CountryCodeSelector({ value, onChange }: CountryCodeSelectorProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {countries.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name} ({c.code})
        </option>
      ))}
    </select>
  );
}
