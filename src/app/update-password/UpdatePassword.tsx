"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import "./UpdatePassword.css";

export default function UpdatePassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const [email] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      setStatus("❌ Nenosiri lazima liwe angalau herufi 6.");
      return;
    }

    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: password }),
      });

      const data = await res.json();
      if (data.error) {
        setStatus("❌ Tatizo: " + data.error);
      } else {
        setStatus("✅ Nenosiri limebadilishwa kikamilifu!");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      setStatus("❌ Hitilafu: " + err.message);
    }
  };

  return (
    <div className="update-container">
      <h2>🔒 Badilisha Nenosiri</h2>

      <div className="input-group">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Nenosiri jipya"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="btn btn-toggle"
        >
          {showPassword ? "🙈 Ficha" : "👁️ Onyesha"}
        </button>
        <button onClick={updatePassword} className="btn btn-update">
          💾 Hifadhi
        </button>
      </div>

      {status && <div className="status">{status}</div>}
    </div>
  );
}
