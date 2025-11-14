"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./login.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [loginMessage, setLoginMessage] = useState("");
  const [settings, setSettings] = useState<{ logo_url: string; branch_name: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null); // debug panel state

  // Fetch active settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("logo_url, branch_name")
        .eq("is_active", true)
        .single();
      if (!error && data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage("");
    setDebugInfo(null);

    const form = e.target as HTMLFormElement;
    const emailInput = (form.email as HTMLInputElement).value.trim().toLowerCase();
    const passwordInput = (form.password as HTMLInputElement).value.trim();
    const pinInput = (form.pin as HTMLInputElement).value.trim();

    if (!emailInput || !passwordInput) {
      setLoginMessage("⚠️ Tafadhali jaza taarifa zote.");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (authError || !authData.user) {
        setLoginMessage("❌ Auth Error: " + (authError?.message || "User not found or password wrong"));
        setDebugInfo({ authError, authData }); // show raw info
        setLoading(false);
        return;
      }

      // Step 2: Fetch user info by ID
      let { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      // Fallback: if not found by ID, try by email
      if (userError || !userRecord) {
        const { data: userByEmail, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", emailInput)
          .single();

        if (emailError || !userByEmail) {
          setLoginMessage("❌ User Table Error: " + (emailError?.message || "User not found in users table"));
          setDebugInfo({ userError, userRecord, emailError, userByEmail });
          setLoading(false);
          return;
        }

        userRecord = userByEmail;
      }

      if (!userRecord.is_active) {
        setLoginMessage("🚫 Akaunti yako imefungwa. Wasiliana na admin.");
        setDebugInfo({ userRecord });
        setLoading(false);
        return;
      }

      // Step 3: Optional admin PIN check
      if (userRecord.role === "admin") {
        const adminPin = userRecord.admin_pin || "";
        if (pinInput && pinInput !== adminPin) {
          setLoginMessage("❌ PIN Error: PIN ya admin si sahihi.");
          setDebugInfo({ userRecord, pinInput });
          setLoading(false);
          return;
        }
      }

      // Step 4: Update last_login
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
        })
        .eq("id", authData.user.id);

      // Step 5: Redirect based on role
      setLoginMessage("✅ Login Success: Unaelekezwa...");
      setDebugInfo({ authData, userRecord });
      setTimeout(() => {
        if (userRecord.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/home");
        }
      }, 1000);

    } catch (err: any) {
      setLoginMessage("❌ Network/Server Error: " + err.message);
      setDebugInfo({ err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="logo-container">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.branch_name || "Logo"} className="church-logo" />
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
              placeholder="Weka PIN kama admin"
            />
            <button type="button" className="toggle-password" onClick={() => setShowPin(!showPin)}>
              {showPin ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "⌛ Inapakia..." : "🚪 Ingia"}
          </button>
        </form>

        <button onClick={() => router.push("/forgot-password")} className="forgot-btn">
          ❓ Umesahau Nenosiri?
        </button>

        <button onClick={() => router.push("/signup")} className="signup-btn">
          📝 Huna akaunti? Jisajili hapa
        </button>

        <div className="login-message">{loginMessage}</div>

        {/* Debug panel */}
        {debugInfo && (
          <div className="debug-panel">
            <h3>🛠 Debug Info</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
