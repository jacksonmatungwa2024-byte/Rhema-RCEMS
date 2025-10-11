"use client"

import React, { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import "./ForgotPassword.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const WHATSAPP_PLAIN_NUMBER = "255698290332"

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function useDebounce<T>(value: T, delay = 700) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [status, setStatus] = useState("")
  const [showOtp, setShowOtp] = useState(false)
  const [canPromptWhatsApp, setCanPromptWhatsApp] = useState(false)
  const [popupMessage, setPopupMessage] = useState<string | null>(null)
  const [otpReady, setOtpReady] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  const debouncedEmail = useDebounce(email, 800)

  // 🔍 Check kama email ipo kwenye DB
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!isValidEmail(debouncedEmail)) {
        setCanPromptWhatsApp(false)
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", debouncedEmail)
        .single()

      setCanPromptWhatsApp(!error && !!data)
    }

    checkEmailExists()
  }, [debouncedEmail])

  // 📲 Fungua WhatsApp, focus OTP field
  const openWhatsAppForOtp = () => {
    const message = `naomba otp for ${debouncedEmail}`
    const waLink = `https://wa.me/${WHATSAPP_PLAIN_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(waLink, "_blank")?.focus()

    setPopupMessage("📲 WhatsApp imefunguliwa. Tuma ujumbe 'naomba otp' ili upokee OTP yako.")
    setTimeout(() => setPopupMessage(null), 4000)
    setOtpReady(true)

    setTimeout(() => {
      otpInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      otpInputRef.current?.focus()
      otpInputRef.current?.select()
    }, 600)
  }

  // ✅ Kagua OTP
  const verifyOtp = async () => {
    if (!isValidEmail(email)) {
      setStatus("❌ Tafadhali weka email halali.")
      return
    }

    const { data, error } = await supabase
      .from("users")
      .select("metadata")
      .eq("email", email)
      .single()

    if (error || !data) {
      setStatus("❌ Email haijapatikana.")
      return
    }

    const storedOtp = data.metadata?.password_reset_otp
    const resetStatus = data.metadata?.reset_status

    if (storedOtp === otp && resetStatus === "waiting_approval") {
      setStatus("✅ OTP sahihi. Tafadhali subiri admin athibitishe nenosiri.")
    } else {
      setStatus("❌ OTP si sahihi au haijathibitishwa.")
    }
  }

  return (
    <div className="forgot-container">
      {popupMessage && <div className="popup">{popupMessage}</div>}

      <h2 className="title">🔑 Sahau Nenosiri</h2>

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

      <div className="manual-otp">
        <button className="btn btn-manual" onClick={() => setOtpReady(true)}>
          ✍️ Ingiza OTP mwenyewe
        </button>
      </div>

      {otpReady && (
        <div className="otp-section">
          <p className="label">🕐 Ingiza OTP uliyopewa:</p>

          <div className="otp-wrapper">
            <input
              ref={otpInputRef}
              type={showOtp ? "text" : "password"}
              placeholder="🔐 OTP"
              className="input-field otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              className="btn-toggle"
              onClick={() => setShowOtp(!showOtp)}
            >
              {showOtp ? "🙈" : "👁️"}
            </button>
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
  )
}
