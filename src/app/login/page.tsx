"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [anonLoaded, setAnonLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 Check ENV + anon key status
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && anon) setAnonLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage("");

    const form = e.target as HTMLFormElement;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // ⭐ PIN removed
      });

      const data = await res.json();

      if (data.error) {
        setLoginMessage(`❌ ${data.error}`);
      } else {
        localStorage.setItem("session_token", data.token);
        setLoginMessage("✅ Inakuelekeza...");

        setTimeout(() => {
          if (data.role === "admin") router.push("/admin");
          else router.push("/home");
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
      <form className="login-box slide-in" onSubmit={handleSubmit}>
        <h2 className="title fade-in">Karibu 👋</h2>
        <p className="subtitle fade-in-delay">Ingia kwenye akaunti yako</p>

        {/* Email */}
        <div className="input-group">
          <label>Email</label>
          <input type="email" name="email" placeholder="Weka email" required />
        </div>

        {/* Password */}
        <div className="input-group">
          <label>Nenosiri</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Weka nenosiri"
              required
            />
            <span
              className="toggle"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        {/* Button */}
        <button className="login-btn bounce" disabled={loading}>
          {loading ? "⏳ Inacheza..." : "Ingia"}
        </button>

        {/* Status */}
        {loginMessage && (
          <div
            className={`status ${
              loginMessage.startsWith("❌") ? "error" : "success"
            }`}
          >
            {loginMessage}
          </div>
        )}

        {/* ENV INFO */}
        <div className="env-box">
          <p>🌐 ENV Status:</p>
          <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Loaded ✔" : "❌ Missing"}</p>
          <p>Anon: {anonLoaded ? "Loaded ✔" : "❌ Missing"}</p>
        </div>
      </form>
    </div>
  );
}
