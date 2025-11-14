"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [verified, setVerified] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");

  // Step 1: verify email
  const verifyEmail = async () => {
    if (!email) {
      setStatus("⚠️ Tafadhali weka email yako.");
      return;
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, otp_verified")
      .eq("email", email)
      .single();

    if (error || !user) {
      setStatus("❌ Email haipo kwenye system.");
      return;
    }

    setVerified(true);
    setOtpVerified(user.otp_verified);

    if (!user.otp_verified) {
      setStatus("⚠️ Hujathibitisha OTP. Tafadhali pata OTP kwanza kabla ya kubadilisha password.");
    } else {
      setStatus("✅ Email imethibitishwa na OTP tayari imekamilika. Endelea kubadilisha password.");
    }
  };

  // Step 2: update password
  const updatePassword = async () => {
    if (!verified || !otpVerified) {
      setStatus("⚠️ Huwezi kuendelea bila OTP.");
      return;
    }

    if (!password || password.length < 6) {
      setStatus("❌ Nenosiri lazima liwe angalau herufi 6.");
      return;
    }

    // ✅ Update password in Supabase Auth
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("❌ Tatizo katika kubadilisha nenosiri: " + error.message);
    } else {
      // ✅ Update metadata in users table
      await supabase
        .from("users")
        .update({ updated_at: new Date().toISOString() })
        .eq("email", email);

      setStatus("✅ Nenosiri limebadilishwa kikamilifu!");
      await supabase.auth.signOut(); // 🔒 force logout
      setTimeout(() => router.push("/login"), 1500);
    }
  };

  return (
    <div className="update-container">
      <h2>🔒 Badilisha Nenosiri</h2>

      {/* Step 1: Email verification */}
      {!verified && (
        <div className="input-group">
          <input
            type="email"
            placeholder="Email yako"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <button onClick={verifyEmail} className="btn btn-verify">
            📧 Thibitisha Email
          </button>
        </div>
      )}

      {/* Step 2: Password update */}
      {verified && otpVerified && (
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
      )}

      {status && <div className="status">{status}</div>}
    </div>
  );
}
