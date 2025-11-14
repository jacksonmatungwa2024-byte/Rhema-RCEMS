"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./UpdatePassword.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  // Step: update password (works only if user came via reset link)
  const updatePassword = async () => {
    if (!password || password.length < 6) {
      setStatus("❌ Nenosiri lazima liwe angalau herufi 6.");
      return;
    }

    // ✅ Update password in Supabase Auth (session exists because of reset link)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("❌ Tatizo katika kubadilisha nenosiri: " + error.message);
    } else {
      setStatus("✅ Nenosiri limebadilishwa kikamilifu!");
      await supabase.auth.signOut(); // 🔒 force logout
      setTimeout(() => router.push("/login"), 1500);
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
