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

  const [debugInfo, setDebugInfo] = useState<any>(null);

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

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput || null,
          password: passwordInput || null,
          pin: pinInput || null,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setLoginMessage(`❌ ${data.error}`);
      } else {
        localStorage.setItem("session_token", data.token);
        setLoginMessage("✅ Inakuelekeza...");

        setTimeout(() => {
          if (data.role === "admin" && data.loginMode === "pin") {
            // Ask admin choice
            const choice = confirm("Umeingia kwa PIN. Unataka kwenda Admin au Home?");
            if (choice) router.push("/admin");
            else router.push("/home");
          } else {
            router.push("/home");
          }
        }, 900);
      }
    } catch (err: any) {
      setLoginMessage("❌ Hitilafu ya mtandao: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="wa-right-panel">
        <div className="login-bubble">
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
            <input type="email" id="email" name="email" placeholder="Andika barua pepe" />

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

            <label htmlFor="pin">🔢 PIN ya Admin:</label>
            <div className="password-wrapper">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                name="pin"
                placeholder="Weka PIN kama we Admin"
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

          {debugInfo && (
            <div className="debug-panel">
              <h3>🛠 Debug Info</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          <div className="env-debug">
            <h3>🌍 Environment</h3>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Missing"}</p>
            <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Loaded" : "Missing"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
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
        setLoginMessage("❌ Nenosiri au barua pepe si sahihi.");
        setDebugInfo({ authError, authData });
        setLoading(false);
        return;
      }

      // Step 2: Fetch user record
      let { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      // fallback – check by email
      if (userError || !userRecord) {
        const { data: userByEmail, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", emailInput)
          .single();

        if (emailError || !userByEmail) {
          setLoginMessage("❌ Akaunti haijapatikana.");
          setDebugInfo({ userError, userRecord, emailError, userByEmail });
          setLoading(false);
          return;
        }

        userRecord = userByEmail;
      }

      if (!userRecord.is_active) {
        setLoginMessage("🚫 Akaunti yako imefungwa. Wasiliana na admin.");
        setLoading(false);
        return;
      }

      // Admin PIN (optional)
      if (userRecord.role === "admin") {
        const adminPin = userRecord.admin_pin || "";

        if (pinInput && pinInput !== adminPin) {
          setLoginMessage("❌ PIN ya admin si sahihi.");
          setLoading(false);
          return;
        }
      }

      // Update last login
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", authData.user.id);

      setLoginMessage("✅ Inakuelekeza...");

      setTimeout(() => {
        if (userRecord.role === "admin") router.push("/admin");
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

      {/* Left Panel (WhatsApp Web Style) */}
      <div className="wa-left-panel"></div>

      {/* Right side form area */}
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

          {/* Title */}
          <h2>🔐 Ingia {settings?.branch_name && `- ${settings.branch_name}`}</h2>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <label htmlFor="email">📧 Barua Pepe:</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Andika barua pepe"
            />

            {/* Password with toggle */}
            <label htmlFor="password">🔑 Nenosiri:</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Weka nenosiri"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Admin PIN */}
            <label htmlFor="pin">🔢 PIN ya Admin (hiari):</label>
            <div className="password-wrapper">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                name="pin"
                placeholder="Weka PIN kama we Admin"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "⌛ Inapakia..." : "🚪 Ingia"}
            </button>
          </form>
{/* Forgot Password */}
<button
  onClick={() => router.push("/chatbot")}
  className="forgot-btn"
>
  ❓ Umesahau Nenosiri?
</button>


          {/* Signup */}
          <button onClick={() => router.push("/signup")} className="signup-btn">
            📝 Huna akaunti? Jisajili hapa
          </button>

          {/* Status message */}
          <div className="login-message">{loginMessage}</div>

          {/* Debug Panel */}
          {debugInfo && (
            <div className="debug-panel">
              <h3>🛠 Debug Info</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {/* Environment Info */}
          <div className="env-debug">
            <h3>🌍 Environment</h3>
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Missing"}</p>
            <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Loaded" : "Missing"}</p>
          </div>

        </div>
      </div>
    </div>
  );


export default LoginPage;
    
