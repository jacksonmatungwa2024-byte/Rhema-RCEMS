"use client";

import { useState } from "react";
import CountryCodeSelector from "./CountryCodeSelector";

interface UserCardProps {
  user: any;
  onDelete: (id: number, email: string) => void;
  onGenerateOtp: (id: number, email: string, countryCode: string) => void;
  onApprove: (id: number) => void;
  saving: boolean;
}

export default function UserCard({ user, onDelete, onGenerateOtp, onApprove, saving }: UserCardProps) {
  const [countryCode, setCountryCode] = useState("+255");

  return (
    <div className="user-card">
      <div className="name">{user.full_name} ({user.role})</div>
      <div className="email">📧 {user.email}</div>
      <div className="status">🔐 Status: {user.metadata?.reset_status || "✅ Active"}</div>

      <CountryCodeSelector value={countryCode} onChange={setCountryCode} />

      <div className="action-buttons">
        <button onClick={() => onDelete(user.id, user.email)} disabled={saving}>🗑️ Futa Mtumiaji</button>
        <button onClick={() => onGenerateOtp(user.id, user.email, countryCode)} disabled={saving}>🔐 Tuma OTP</button>
        {user.metadata?.reset_status === "waiting_approval" && (
          <button onClick={() => onApprove(user.id)} disabled={saving}>✅ Thibitisha OTP</button>
        )}
      </div>
    </div>
  );
}
