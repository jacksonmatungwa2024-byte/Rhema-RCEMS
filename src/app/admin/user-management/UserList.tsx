"use client";

import React, { useState } from "react";
import CountryCodeSelector from "./CountryCodeSelector";

interface UserListProps {
  users: any[];
  onDelete: (userId: number, email: string) => void;
  onGenerateOtp: (userId: number, phoneNumberWithCode: string, currentMeta: any) => void;
  onApprove: (userId: number, currentMeta: any) => void;
  saving: boolean;
}

export default function UserList({ users, onDelete, onGenerateOtp, onApprove, saving }: UserListProps) {
  const [selectedCode, setSelectedCode] = useState("+255");
  const [phoneNumbers, setPhoneNumbers] = useState<{ [key: number]: string }>({});

  return (
    <div>
      {users.map((user) => {
        const status = user.metadata?.reset_status;
        const otpExists = user.metadata?.password_reset_otp;
        return (
          <div key={user.id} className="user-card">
            <div>{user.full_name} ({user.role})</div>
            <div>{user.email}</div>
            <div>Status: {status || "✅ Active"}</div>

            <div className="otp-section">
              <CountryCodeSelector value={selectedCode} onChange={setSelectedCode} />
              <input
                type="text"
                placeholder="Namba ya WhatsApp"
                value={phoneNumbers[user.id] || ""}
                onChange={(e) => setPhoneNumbers(prev => ({ ...prev, [user.id]: e.target.value }))}
              />
              <button onClick={() => onGenerateOtp(user.id, selectedCode + phoneNumbers[user.id], user.metadata)} disabled={saving}>
                📲 Tuma OTP
              </button>
              {status === "waiting_approval" && otpExists && (
                <button onClick={() => onApprove(user.id, user.metadata)} disabled={saving}>
                  ✅ Thibitisha OTP
                </button>
              )}
            </div>

            <button onClick={() => onDelete(user.id, user.email)} disabled={saving}>
              🗑️ Futa Mtumiaji
            </button>
          </div>
        );
      })}
    </div>
  );
      }
