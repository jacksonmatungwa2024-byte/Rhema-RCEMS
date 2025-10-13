"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import "./login.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


const LoginPage: React.FC = () => {
  const [loginMessage, setLoginMessage] = useState("")
  const [tangazo, setTangazo] = useState<any>(null)
  const [localAttempts, setLocalAttempts] = useState(0)
  const [countdown, setCountdown] = useState("")
  const [showCartoon, setShowCartoon] = useState(false)
  const [settings, setSettings] = useState<{ logo_url: string; branch_name: string } | null>(null)
const [showPassword, setShowPassword] = useState(false)
const [showPin, setShowPin] = useState(false)
  const router = useRouter()

  // ====== Handle reason query param ======
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const reason = searchParams.get("reason")

    if (reason === "locked") {
      setLoginMessage(
        "🚫 Mfumo umefungwa kwa sasa. Hii ni hatua ya kiroho ya kutafakari na kutunza uzima wa milele."
      )
    } else if (reason === "expired") {
      setLoginMessage(
        "⏳ Muda wako kwenye mfumo siku ya leo umeisha. Tafadhali sbiri tena ili kuendelea na safari ya uzima."
      )
    }
  }, [])

  // ====== Fetch tangazo and settings ======
  useEffect(() => {
    fetchTangazo()
    fetchSettings()
  }, [])

  // ====== Background slideshow ======
  useEffect(() => {
    const bgImages = document.querySelectorAll<HTMLImageElement>("#backgroundSlideshow img")
    let bgIndex = 0
    const bgTimer = setInterval(() => {
      bgImages.forEach(img => img.classList.remove("active"))
      bgImages[bgIndex].classList.add("active")
      bgIndex = (bgIndex + 1) % bgImages.length
    }, 6000)

    return () => clearInterval(bgTimer)
  }, [])

  // ====== Check session revocation ======
  useEffect(() => {
    const checkSessionRevocation = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session) return router.push("/login?reason=expired")

      const { data: revokeData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "session_revoked_at")
        .single()

      const revokedAt = revokeData?.value ? new Date(revokeData.value) : null
      const sessionIssuedAt = session?.user?.updated_at
      const sessionStarted = sessionIssuedAt ? new Date(sessionIssuedAt) : null

      if (revokedAt && sessionStarted && sessionStarted.getTime() < revokedAt.getTime()) {
        router.push("/login?reason=expired")
      }
    }

    checkSessionRevocation()
  }, [])

  // ====== Check login access ======
  useEffect(() => {
    const checkLoginAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) return router.push("/login")

      const { data: loginStatus } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "login_enabled")
        .single()

      const loginAllowed = loginStatus?.value === true || loginStatus?.value === "true"
      if (!loginAllowed) router.push("/login")
    }

    checkLoginAccess()
  }, [])

  // ====== Fetch settings ======
  async function fetchSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("logo_url, branch_name")
      .eq("is_active", true)
      .single()

    if (!error) setSettings(data)
  }

  // ====== Fetch latest tangazo ======
  async function fetchTangazo() {
    const { data } = await supabase
      .from("tangazo")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) setTangazo(data)
  }

  // ====== Countdown for delayed login ======
  const startCountdown = (targetTime: Date) => {
    setShowCartoon(true)
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetTime.getTime() - now

      if (distance <= 0) {
        clearInterval(interval)
        setCountdown("✅ Sasa unaweza kuingia.")
        setShowCartoon(false)
        return
      }

      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((distance / (1000 * 60)) % 60)
      const seconds = Math.floor((distance / 1000) % 60)

      setCountdown(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
  }

  // ====== Handle login submission ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const email = (form.email as HTMLInputElement).value.trim()
    const password = (form.password as HTMLInputElement).value.trim()
    const pin = (form.pin as HTMLInputElement).value.trim()

    setLoginMessage("")

    if (!email || !password) {
      setLoginMessage("Tafadhali jaza taarifa zote.")
      return
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (!userRecord) {
      const newAttempts = localAttempts + 1
      setLocalAttempts(newAttempts)
      if (newAttempts >= 3) router.push("/404")
      setLoginMessage("❌ Akaunti haijapatikana.")
      return
    }

    if (!userRecord.is_active) {
      setLoginMessage("🚫 Akaunti yako imefungwa. Tafadhali wasiliana na admin.")
      return
    }

    const now = new Date()
    const expiry = userRecord.active_until ? new Date(userRecord.active_until) : null
    if (expiry && now > expiry) {
      await supabase
        .from("users")
        .update({ metadata: { reset_status: "expired" }, active_until: null })
        .eq("id", userRecord.id)
      setLoginMessage("⏳ Akaunti yako imeisha muda wake. Tafadhali wasiliana na admin kwa upya.")
      return
    }

    const status = userRecord.metadata?.reset_status
    const readyAt = userRecord.metadata?.password_reset_ready_at
    const readyTime = readyAt ? new Date(readyAt) : null

    if (status === "approved_by_admin") {
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      await supabase
        .from("users")
        .update({
          metadata: {
            reset_status: "ready_for_user",
            password_reset_ready_at: oneHourLater.toISOString()
          }
        })
        .eq("id", userRecord.id)
      setLoginMessage("✅ Admin amepokea ombi lako. Login tena baada ya lisaa limoja.")
      return
    }

    if (status === "ready_for_user") {
      if (readyTime && now < readyTime) {
        startCountdown(readyTime)
        setLoginMessage("⏳ Subiri lisaa limoja kabla ya kuweka nenosiri.")
        return
      }

      router.push(`/set-password?user_id=${userRecord.id}`)
      return
    }

    if (status === "wait_before_login") {
      if (readyTime && now < readyTime) {
        startCountdown(readyTime)
        setLoginMessage("⏳ Umefanikiwa kubadilisha nenosiri. Login tena baada ya lisaa limoja.")
        return
      }

      await supabase
        .from("users")
        .update({ metadata: { reset_status: null, password_reset_ready_at: null } })
        .eq("id", userRecord.id)
    }

    const lastFailed = userRecord.last_failed_login ? new Date(userRecord.last_failed_login) : null
    const oneHour = 60 * 60 * 1000
    if (userRecord.login_attempts >= 5 && lastFailed && now.getTime() - lastFailed.getTime() < oneHour) {
      setLoginMessage("⏳ Umefungiwa kwa saa 1 baada ya majaribio 5 ya kuingia.")
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData?.user) {
      const attempts = (userRecord.login_attempts || 0) + 1
      const updates: any = { login_attempts: attempts, last_failed_login: now.toISOString() }
      if (attempts >= 10) updates.is_active = false
      await supabase.from("users").update(updates).eq("id", userRecord.id)
      setLoginMessage("❌ Taarifa si sahihi, jaribu tena.")
      return
    }

    await supabase.from("users").update({ login_attempts: 0 }).eq("id", userRecord.id)
    setLocalAttempts(0)

    await fetch("/functions/v1/notify_admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userRecord.id,
        email: userRecord.email,
        full_name: userRecord.full_name
      })
    })

    router.push("/home")
  }

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="logo-container">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.branch_name || "Institute Logo"} className="church-logo" />
          ) : (
            <img src="/fallback-logo.png" alt="Default Logo" className="church-logo" />
          )}
        </div>

        <h2>
          🔐 Ingia kwenye Mfumo
          {settings?.branch_name && <> - {settings.branch_name}</>}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">📧 Barua Pepe:</label>
          <input type="email" id="email" name="email" required placeholder="Andika barua pepe yako" />
          <label htmlFor="password">🔑 Nenosiri:</label>
<div className="password-wrapper">
  <input
    type={showPassword ? "text" : "password"}
    id="password"
    name="password"
    required
    placeholder="Andika nenosiri lako"
  />
  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>

<label htmlFor="pin">🔢 PIN ya Admin (hiari):</label>
<div className="password-wrapper">
  <input
    type={showPin ? "text" : "password"}
    id="pin"
    name="pin"
    placeholder="Weka PIN kama wewe ni admin"
  />
  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPin(!showPin)}
  >
    {showPin ? "Hide" : "Show"}
  </button>
</div>

          <button type="submit">🚪 Ingia</button>
        </form>

        <button
          onClick={() => router.push("/forgot-password")}
          style={{ marginTop: "1rem", background: "#009688", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}
        >
          ❓ Umesahau Nenosiri?
        </button>

        <div className="login-message">{loginMessage}</div>

        {countdown && <div style={{ marginTop: 12, fontWeight: 700, color: "#4a148c" }}>⏳ {countdown}</div>}

        {showCartoon && (
          <div style={{ marginTop: 24 }}>
            <img src="/cartoon-waiting.gif" alt="Kamdori anasubiri" style={{ maxWidth: 200, borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }} />
            <div style={{ marginTop: 8, fontWeight: 600, color: "#6a1b9a" }}>😂 Kamdori anasubiri muda wako kuisha...</div>
          </div>
        )}
      </div>

      <div className="login-right">
        {tangazo ? (
          <div className="tangazo-hero">
            {tangazo.image_url?.match(/\.(mp4|mov|webm)$/i) ? (
              <video src={tangazo.image_url} className="tangazo-media" autoPlay loop muted playsInline />
            ) : (
              <img src={tangazo.image_url} alt="Tangazo" className="tangazo-media" />
            )}
            <div className="tangazo-overlay">
              {tangazo.title && (
                <div className="scrolling-title">
                  <h1>{tangazo.title}</h1>
                </div>
              )}
              {tangazo.message && (
                <div className="scrolling-message">
                  <p>{tangazo.message}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="background-slideshow" id="backgroundSlideshow" aria-hidden="true">
            <img src="maua.jpg" className="active" alt="Background 1" />
            <img src="clouds.jpeg" alt="Background 2" />
            <img src="Cross-Easter-scaled.jpg" alt="Background 3" />
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
