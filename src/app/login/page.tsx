"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./login.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();

  const [loginMessage, setLoginMessage] = useState("");
  const [settings, setSettings] = useState<{ logo_url: string; branch_name: string } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("logo_url, branch_name")
        .eq("is_active", true)
        .single();

      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  // Handle login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage("");
    setDebugInfo(null);

    const form = e.target as HTMLFormElement;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const pin = form.pin.value.trim();

    if (!email || !password) {
      setLoginMessage("⚠️ Tafadhali jaza taarifa zote.");
      setLoading(false);
      return;
    }

    try {
      // ✓ Authenticate
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !authData.user) {
        setLoginMessage("❌ Barua pepe au nenosiri si sahihi.");
        setDebugInfo({ error, authData });
        setLoading(false);
        return;
      }

      // ✓ Fetch user record
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!user) {
        setLoginMessage("❌ Akaunti haikupatikana.");
        setLoading(false);
        return;
      }

      if (!user.is_active) {
        setLoginMessage("🚫 Akaunti yako imefungwa. Wasiliana na admin.");
        setLoading(false);
        return;
      }

      // ✓ Check admin PIN
      if (user.role === "admin") {
        if (pin && pin !== user.admin_pin) {
          setLoginMessage("❌ PIN ya admin si sahihi.");
          setLoading(false);
          return;
        }
      }

      // ✓ Update last login
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id);

      setLoginMessage("✅ Inakuelekeza...");

      setTimeout(() => {
        if (user.role === "admin") router.push("/admin");
        else router.push("/home");
      }, 900);
    } catch (err: any) {
      setLoginMessage("❌ Hitilafu ya mtandao: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      <div className="wa-left-panel"></div>

      <div className="wa-right-panel">
        <div className="login-bubble">

          {/* Logo */}
          <div className="logo-container">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="church-logo" />
            ) : (
              <img src="/fallback-logo.png" alt="Logo" className="church-logo" />
            )}
          </div>

          <h2>🔐 Ingia {settings?.branch_name && `- ${settings.branch_name}`}</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">📧 Barua Pepe:</label>
            <input type="email" id="email" name="email" placeholder="Weka barua pepe" />

            <label htmlFor="password">🔑 Nenosiri:</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Weka nenosiri"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label htmlFor="pin">🔢 PIN ya Admin (hiari):</label>
            <div className="password-wrapper">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                name="pin"
                placeholder="PIN ya admin"
              />
              <button type="button" onClick={() => setShowPin(!showPin)}>
                {showPin ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "⌛ Inapakia..." : "🚪 Ingia"}
            </button>
          </form>

          <button onClick={() => router.push("/chatbot")} className="forgot-btn">
            ❓ Umesahau Nenosiri?
          </button>

          <button onClick={() => router.push("/signup")} className="signup-btn">
            📝 Huna akaunti? Jisajili hapa
          </button>

          <div className="login-message">{loginMessage}</div>
        </div>
      </div>
    </div>
  );
}
