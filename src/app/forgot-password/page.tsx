"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./ForgotPassword.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WHATSAPP_PLAIN_NUMBER = "255626280792";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [otpReady, setOtpReady] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [canPromptWhatsApp, setCanPromptWhatsApp] = useState(false);

  // 🔍 Check if email exists for WhatsApp button
  useEffect(() => {
    const checkEmail = async () => {
      if (!isValidEmail(email)) return setCanPromptWhatsApp(false);

      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      setCanPromptWhatsApp(!error && !!data);
    };

    checkEmail();
  }, [email]);

  // 📲 Generate OTP
  const generateOtp = async () => {
    if (!isValidEmail(email)) {
      setStatus("❌ Tafadhali weka email halali.");
      return;
    }

    const res = await fetch("/api/otp/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setStatus("✅ OTP imezalishwa. Subiri admin athibitishe.");
      setOtpReady(true);

      // focus input after short delay
      setTimeout(() => {
        otpInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        otpInputRef.current?.focus();
      }, 300);
    } else {
      setStatus(`❌ Tatizo: ${data.error || "Haiwezi ku generate OTP."}`);
    }
  };

  // 📲 Open WhatsApp to request OTP
  const openWhatsAppForOtp = () => {
    const message = `Naomba OTP kwa ${email}`;
    const waLink = `https://wa.me/${WHATSAPP_PLAIN_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waLink, "_blank")?.focus();
    generateOtp();
  };

  // ✅ Verify OTP & admin approval
  const verifyOtp = async () => {
    if (!isValidEmail(email) || !otp) {
      setStatus("❌ Tafadhali weka email na OTP.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("metadata")
      .eq("email", email)
      .single();

    if (error || !data) {
      setStatus("❌ Email haijapatikana.");
      return;
    }

    const storedOtp = data.metadata?.password_reset_otp;
    const resetStatus = data.metadata?.reset_status;

    if (storedOtp === otp && resetStatus === "approved") {
      setStatus("✅ OTP imeidhinishwa na admin. Unaelekezwa kwenye password mpya...");
      router.push(`/update-password?email=${encodeURIComponent(email)}`);
    } else if (storedOtp === otp && resetStatus === "waiting_approval") {
      setStatus("⌛ OTP sahihi. Subiri admin athibitishe nenosiri.");
    } else {
      setStatus("❌ OTP si sahihi au haijathibitishwa.");
    }
  };

  return (
    <div className="forgot-container">
      <h2>🔑 Sahau Nenosiri</h2>

      {!otpReady && (
        <>
          <input
            type="email"
            className="input-field"
            placeholder="📧 Weka barua pepe"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {canPromptWhatsApp && (
            <button className="btn btn-whatsapp" onClick={openWhatsAppForOtp}>
              📲 Pata OTP kwa WhatsApp
            </button>
          )}

          <button className="btn btn-manual" onClick={generateOtp}>
            ✍️ Generate OTP
          </button>
        </>
      )}

      {otpReady && (
        <div className="otp-section">
          <p className="label">🕐 Ingiza OTP uliyopewa:</p>
          <input
            ref={otpInputRef}
            type="password"
            placeholder="🔐 OTP"
            className="input-field otp-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="btn btn-verify" onClick={verifyOtp}>
            ✅ Thibitisha OTP
          </button>
        </div>
      )}

      {status && (
        <div className={`status ${status.startsWith("✅") ? "success" : "error"}`}>
          {status}
        </div>
      )}
    </div>
  );
}
                
