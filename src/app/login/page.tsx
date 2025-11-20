"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initNetworkStatus } from "../utils/networkStatus"; // 👈 import API
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [toast, setToast] = useState("");

  // 👇 Network status listener
  useEffect(() => {
    initNetworkStatus((status) => {
      setToast(status);
      setTimeout(() => setToast(""), 4000); // auto-hide after 4s
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage("");

    const form = e.target as HTMLFormElement;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const pin = form.pin.value.trim();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, pin }),
      });

      const data = await res.json();
      if (data.error) {
        setLoginMessage(`❌ ${data.error}`);
      } else {
        localStorage.setItem("session_token", data.token);
        setLoginMessage("✅ Inakuelekeza...");

        setTimeout(() => {
          if (data.role === "admin" && data.loginMode === "pin") {
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
      {/* Toast popup */}
      {toast && <div className="toast">{toast}</div>}

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Karibu 👋</h2>
        <p>Ingia kwenye akaunti yako</p>

        <label>Email</label>
        <input type="email" name="email" placeholder="Weka email" required />

        <label>Nenosiri</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Weka nenosiri"
            required
          />
          <span onClick={() => setShowPassword((p) => !p)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <label>PIN ya Admin (hiari)</label>
        <div className="password-wrapper">
          <input
            type={showPin ? "text" : "password"}
            name="pin"
            placeholder="PIN ya admin"
          />
          <span onClick={() => setShowPin((p) => !p)}>
            {showPin ? "🙈" : "👁️"}
          </span>
        </div>

        <button disabled={loading}>
          {loading ? "⏳ Inapakia..." : "🚪 Ingia"}
        </button>

        <button type="button" onClick={() => router.push("/signup")}>
          📝 Jisajili
        </button>

        <button
          type="button"
          className="help-btn"
          onClick={() => router.push("/chatbot")}
        >
          🤖 Msaada ChatBot
        </button>

        {loginMessage && <div className="status">{loginMessage}</div>}

        <footer className="system-footer">
          <p>
            🙌 Mfumo huu umetengenezwa na <br />
            <strong>Abel Memorial Programmers</strong> <br />
            kwa ushirikiano na <br />
            <strong>Kitengo cha Usimamizi wa Rasilimali na Utawala – Tanga Quarters</strong>
          </p>
        </footer>
      </form>
    </div>
  );
        }
