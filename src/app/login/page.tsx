"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./login.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [loginMessage, setLoginMessage] = useState("");
  const [settings, setSettings] = useState<{ logo_url: string; branch_name: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔄 Fetch active settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("logo_url, branch_name")
          .eq("is_active", true)
          .single();
        if (error) throw error;
        if (data) setSettings(data);
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage("");

    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value.trim();
    const password = (form.password as HTMLInputElement).value.trim();
    const pin = (form.pin as HTMLInputElement).value.trim();

    if (!email || !password) {
      setLoginMessage("⚠️ Tafadhali jaza taarifa zote.");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData?.user) {
        console.log("Supabase authError:", authError);
        setLoginMessage("❌ Taarifa si sahihi, jaribu tena.");
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch user metadata from 'users' table
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (userError || !userRecord) {
        setLoginMessage("❌ Akaunti haijapatikana kwenye mfumo.");
        setLoading(false);
        return;
      }

      if (!userRecord.is_active) {
        setLoginMessage("🚫 Akaunti yako imefungwa. Wasiliana na admin.");
        setLoading(false);
        return;
      }

      // 3️⃣ Optional PIN check (admin)
      if (userRecord.role === "admin" && pin && pin !== userRecord.metadata?.admin_pin) {
        setLoginMessage("❌ PIN si sahihi.");
        setLoading(false);
        return;
      }

      // 4️⃣ Successful login: redirect
      setLoginMessage("✅ Taarifa ni sahihi, unaelekezwa...");
      setTimeout(() => router.push("/home"), 1000);
    } catch (err) {
      console.error("Login error:", err);
      setLoginMessage("❌ Tatizo la mtandao au seva.");
    } finally {
      setLoading(false);
    }
  };

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

        <h2>🔐 {settings?.branch_name && <>- {settings.branch_name}</>}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">📧 Barua Pepe:</label>
          <input type="email" id="email" name="email" placeholder="Andika barua pepe yako" />

          <label htmlFor="password">🔑 Nenosiri:</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Andika nenosiri lako"
            />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
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
            <button type="button" className="toggle-password" onClick={() => setShowPin(!showPin)}>
              {showPin ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "⌛ Inapakia..." : "🚪 Ingia"}
          </button>
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

        <footer
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.9rem",
            color: "#4a148c",
            borderTop: "1px solid #ddd",
            paddingTop: "1rem",
            opacity: 0.9,
          }}
        >
          Mfumo huu umetengenezwa na <b>Abel Memorial Programmers</b> kwa ushirikiano na{" "}
          <b>Kitengo cha Usimamizi wa Rasilimali na Utawala – Tanga Quarters</b>.
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
