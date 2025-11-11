import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import "./login.css"

const supabase = createClient(
  process.env.NEXTPUBLICSUPABASE_URL!,
  process.env.NEXTPUBLICSUPABASEANONKEY!
)

const LoginPage: React.FC = () => {
  const [loginMessage, setLoginMessage] = useState("")
  const [settings, setSettings] = useState<{ logourl: string; branchname: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const router = useRouter()

  // ====== Fetch settings ======
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("logourl, branchname")
        .eq("is_active", true)
        .single()
      if (!error) setSettings(data)
    }
    fetchSettings()
  }, [])

  // ====== Handle login submission ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const email = (form.email as HTMLInputElement).value.trim()
    const password = (form.password as HTMLInputElement).value.trim()

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
      setLoginMessage("❌ Akaunti haijapatikana.")
      return
    }

    if (!userRecord.is_active) {
      setLoginMessage("🚫 Akaunti yako imefungwa. Tafadhali wasiliana na admin.")
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData?.user) {
      setLoginMessage("❌ Taarifa si sahihi, jaribu tena.")
      return
    }

    router.push("/home")
  }

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="logo-container">
          {settings?.logourl ? (
            <img src={settings.logourl} alt={settings.branchname || "Institute Logo"} className="church-logo" />
          ) : (
            <img src="/fallback-logo.png" alt="Default Logo" className="church-logo" />
          )}
        </div>

        <h2>🔐 {settings?.branchname && <>- {settings.branchname}</>}</h2>

        <form onSubmit={handleSubmit}>
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
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label htmlFor="pin">🔢 PIN ya Admin (hiari):</label>
          <div className="password-wrapper">
            <input type={showPin ? "text" : "password"} id="pin" name="pin" placeholder="Weka PIN kama wewe ni admin" />
            <button type="button" className="toggle-password" onClick={() => setShowPin(!showPin)}>
              {showPin ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit">🚪 Ingia</button>
        </form>

        <button
          onClick={() => router.push("/forgot-password")}
          style={{
            marginTop: "1rem",
            background: "#009688",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "8px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          ❓ Umesahau Nenosiri?
        </button>

        <div className="login-message">{loginMessage}</div>
      </div>
    </div>
  )
}

export default LoginPage
