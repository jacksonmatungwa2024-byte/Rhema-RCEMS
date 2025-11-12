"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import CountryCodeSelector from "./CountryCodeSelector";
import { sendWhatsappOtp } from "../utils/sendWhatsappOtp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  user: any;
  refreshUsers: () => void;
}

export default function UserCard({ user, refreshUsers }: Props) {
  const [saving, setSaving] = useState(false);
  const [countryCode, setCountryCode] = useState("+255"); // default Tanzania

  const initiateOtp = async () => {
    setSaving(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      const currentMeta = user.metadata || {};
      const newMeta = {
        ...currentMeta,
        password_reset_otp: otp,
        reset_status: "waiting_approval",
        otp_expires_at: expiresAt,
      };

      await supabase.from("users").update({ metadata: newMeta }).eq("id", user.id);

      alert(`✅ OTP generated: ${otp} (expires in 10 min)`);

      // Send WhatsApp
      sendWhatsappOtp(countryCode, user.phone || "", otp);
    } catch (err) {
      console.error(err);
      alert("❌ Tatizo wakati wa generate OTP.");
    } finally {
      setSaving(false);
      refreshUsers();
    }
  };

  const approveOtp = async () => {
    setSaving(true);
    try {
      const currentMeta = user.metadata || {};
      const newMeta = { ...currentMeta, reset_status: "approved" };
      await supabase.from("users").update({ metadata: newMeta }).eq("id", user.id);
      alert("✅ OTP approved. User can reset password now.");
    } catch (err) {
      console.error(err);
      alert("❌ Tatizo wakati wa approve OTP.");
    } finally {
      setSaving(false);
      refreshUsers();
    }
  };

  return (
    <div className="user-card">
      <p>👤 {user.full_name} ({user.email})</p>
      <p>🔐 Status: {user.metadata?.reset_status || "Active"}</p>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
        <button onClick={initiateOtp} disabled={saving}>📲 Tuma OTP</button>
        {user.metadata?.reset_status === "waiting_approval" && (
          <button onClick={approveOtp} disabled={saving}>✅ Thibitisha OTP</button>
        )}
      </div>
    </div>
  );
        }
      
