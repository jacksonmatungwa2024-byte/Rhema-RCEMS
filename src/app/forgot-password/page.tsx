"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import "./ForgotPassword.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WHATSAPP_PLAIN_NUMBER = "255626280792";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function useDebounce<T>(value: T, delay = 700) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [canPromptWhatsApp, setCanPromptWhatsApp] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [otpReady, setOtpReady] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const debouncedEmail = useDebounce(email, 800);

  // 🔍 Check if email exists
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!isValidEmail(debouncedEmail)) {
        setCanPromptWhatsApp(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", debouncedEmail)
        .single();

      setCanPromptWhatsApp(!error && !!data);
    };

    checkEmailExists();
  }, [debouncedEmail]);

  // 📲 Open WhatsApp to request OTP
  const openWhatsAppForOtp = () => {
    const message = `Naomba OTP kwa ${debouncedEmail}`;
    const waLink = `https://wa.me/${WHATSAPP_PLAIN_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waLink, "_blank")?.focus();

    setPopupMessage("📲 WhatsApp imefunguliwa. Tuma ujumbe 'Naomba OTP' ili upokee OTP yako.");
    setTimeout(() => setPopupMessage(null), 4000);
    setOtpReady(true);

    setTimeout(() => {
      otpInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      otpInputRef.current?.focus();
      otpInputRef.current?.select();
    }, 600);
  };

  // ✅ Verify OTP and check admin approval
  const verifyOtp = async () => {
    if (!isValidEmail(email)) {
      setStatus("❌ Tafadhali weka email halali.");
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
      setStatus("✅ OTP imeidhinishwa na admin. Tafadhali weka email ili kuset password mpya.");
      setOtpReady(false); // hide OTP field
      // redirect user to update-password page with email
      router.push(`/update-password?email=${encodeURIComponent(email)}`);
    } else if (storedOtp === otp && resetStatus === "waiting_approval") {
      setStatus("⌛ OTP sahihi. Subiri admin athibitishe nenosiri.");
    } else {
      setStatus("❌ OTP si sahihi au haijathibitishwa.");
    }
  };

  return (
    <div className="forgot-container">
      {popupMessage && <div className="popup">{popupMessage}</div>}

      <h2 className="title">🔑 Sahau Nenosiri</h2>

      {!otpReady && (
        <input
          type="email"
          className="input-field"
          placeholder="📧 Weka barua pepe"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}

      {canPromptWhatsApp && !otpReady && (
        <button className="btn btn-whatsapp" onClick={openWhatsAppForOtp}>
          📲 Pata OTP kwa WhatsApp
        </button>
      )}

      {otpReady && (
        <div className="otp-section">
          <p className="label">🕐 Ingiza OTP uliyopewa:</p>
          <div className="otp-wrapper">
            <input
              ref={otpInputRef}
              type="password"
              placeholder="🔐 OTP"
              className="input-field otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
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
            
