"use client";
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./ForgotPassword.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");

  const verifyOtpAndSendResetLink = async () => {
    if (!email || !otp) {
      setStatus("❌ Tafadhali weka barua pepe na OTP.");
      return;
    }

    // Step 1: Verify OTP from users table
    const { data, error } = await supabase
      .from("users")
      .select("id, metadata, otp_verified, otp_verified_at")
      .eq("email", email)
      .single();

    if (error || !data) {
      setStatus("❌ Akaunti haijapatikana.");
      return;
    }

    const meta = data.metadata || {};
    const storedOtp = meta.password_reset_otp;
    const resetStatus = meta.reset_status;
    const expiresAt = meta.otp_expires_at ? new Date(meta.otp_expires_at) : null;

    if (!storedOtp) return setStatus("❌ Hakuna OTP iliyotumwa na admin.");
    if (expiresAt && expiresAt < new Date())
      return setStatus("⌛ Muda wa OTP umeisha, omba OTP mpya kwa admin.");
    if (storedOtp !== otp)
      return setStatus("❌ OTP uliyoingiza si sahihi.");
    if (resetStatus !== "waiting_approval" && resetStatus !== "approved")
      return setStatus("⚠️ OTP hii haijathibitishwa au imefutwa.");

    // Step 2: Mark OTP verified
    const { error: updateError } = await supabase
      .from("users")
      .update({
        otp_verified: true,
        otp_verified_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) {
      setStatus("⚠️ OTP sahihi lakini hatukuweza kusasisha status.");
      return;
    }

    // Step 3: Send Supabase reset link
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://your-app.com/update-password", 
      // 👆 badilisha URL hii iwe domain yako halisi
    });

    if (resetError) {
      setStatus("⚠️ OTP sahihi lakini hatukuweza kutuma reset link: " + resetError.message);
      return;
    }

    setStatus("✅ OTP sahihi! Link ya kubadilisha nenosiri imetumwa kwa barua pepe yako.");
  };

  return (
    <div className="forgot-container">
      <h2>🔑 Sahau Nenosiri</h2>
      <input
        type="email"
        placeholder="📧 Weka barua pepe"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />
      <input
        type="password"
        placeholder="🔐 OTP kutoka kwa admin"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="input-field"
      />
      <button className="btn btn-verify" onClick={verifyOtpAndSendResetLink}>
        ✅ Thibitisha OTP & Tuma Reset Link
      </button>
      {status && <div className="status">{status}</div>}
    </div>
  );
      }
