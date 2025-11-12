"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./UpdatePassword.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setStatus("❌ Email haijapatikana. Tumia link sahihi kutoka OTP.");
      return;
    }

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, metadata")
          .eq("email", email)
          .single();

        if (error || !data) {
          setStatus("❌ Haiwezekani kupata user. Rudia hatua ya OTP.");
          return;
        }

        const meta = data.metadata || {};
        const now = new Date();

        if (meta.reset_status !== "approved_by_admin") {
          setStatus("⏳ Subiri admin kuthibitisha OTP yako.");
          return;
        }

        if (meta.password_reset_otp_expires_at && new Date(meta.password_reset_otp_expires_at) < now) {
          setStatus("❌ OTP imeisha muda wake. Tafadhali jaribu tena.");
          return;
        }

        setUserId(data.id);
      } catch (err) {
        console.error(err);
        setStatus("❌ Tatizo la seva au mtandao.");
      }
    };

    fetchUser();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");

    if (!password || !confirmPassword) {
      setStatus("⚠️ Tafadhali jaza password zote.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("❌ Password hazilingani.");
      return;
    }

    if (!userId) {
      setStatus("❌ Haiwezekani kupata user ID au OTP haijathibitishwa.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus("✅ Password imebadilishwa. Tafadhali ingia tena.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setStatus(`❌ Tatizo: ${result.error || "Hatuwezi kubadilisha password."}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Tatizo la seva au mtandao.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <h2>🔑 Weka Password Mpya</h2>
      <p>Email: <b>{email}</b></p>

      <form onSubmit={handleSubmit}>
        <label>🔒 Password Mpya:</label>
        <input
          type="password"
          placeholder="Weka password mpya"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>🔒 Thibitisha Password:</label>
        <input
          type="password"
          placeholder="Thibitisha password mpya"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "⌛ Inapakia..." : "💾 Badilisha Password"}
        </button>
      </form>

      {status && <div className={`status ${status.startsWith("✅") ? "success" : "error"}`}>{status}</div>}
    </div>
  );
}
