"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.currentTarget;

    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value.trim().toLowerCase();
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value.trim();
    const fullName = (form.elements.namedItem("full_name") as HTMLInputElement)?.value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement)?.value.trim();
    const branch = (form.elements.namedItem("branch") as HTMLInputElement)?.value.trim();
    const username = (form.elements.namedItem("username") as HTMLInputElement)?.value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim();
    const profileUrl = (form.elements.namedItem("profile_url") as HTMLInputElement)?.value.trim();

    if (!email || !password || !fullName || !role) {
      setMessage("⚠️ Tafadhali jaza taarifa zote muhimu.");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user || !authData.session) {
        console.error("Auth error:", authError?.message);
        setMessage(`❌ Usajili umeshindikana: ${authError?.message || "Hakuna session."}`);
        setLoading(false);
        return;
      }

      const accessToken = authData.session.access_token;

      const { error: insertError } = await supabase.from("users").insert({
        email,
        full_name: fullName,
        role,
        branch,
        username: username || null,
        phone: phone || null,
        profile_url: profileUrl || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        current_session: accessToken,
        active_until: null,
        metadata: {},
      });

      if (insertError) {
        console.error("Insert error:", insertError.message);
        setMessage(`❌ Usajili umeshindikana: ${insertError.message}`);
        setLoading(false);
        return;
      }

      setMessage("✅ Usajili umefanikiwa! Unaelekezwa...");
      setTimeout(() => router.push("/login"), 1500);

    } catch (err: any) {
      console.error("Signup error:", err);
      setMessage(`❌ Tatizo la mtandao au seva: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <h2>📝 Sajili Akaunti Mpya</h2>
      <form onSubmit={handleSignup}>
        <label htmlFor="full_name">👤 Jina Kamili:</label>
        <input type="text" id="full_name" name="full_name" placeholder="Jina kamili" />

        <label htmlFor="username">🆔 Jina la Mtumiaji:</label>
        <input type="text" id="username" name="username" placeholder="Mfano: jdoe" />

        <label htmlFor="email">📧 Barua Pepe:</label>
        <input type="email" id="email" name="email" placeholder="Barua pepe sahihi" />

        <label htmlFor="password">🔑 Nenosiri:</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Nenosiri lenye nguvu"
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈 Ficha" : "👁️ Onyesha"}
          </button>
        </div>

        <label htmlFor="phone">📞 Simu:</label>
        <input type="text" id="phone" name="phone" placeholder="Namba ya simu (hiari)" />

        <label htmlFor="profile_url">🖼️ Picha ya Profile:</label>
        <input type="text" id="profile_url" name="profile_url" placeholder="URL ya picha (hiari)" />

        <label htmlFor="role">🎯 Nafasi:</label>
        <select id="role" name="role">
          <option value="usher">Mhudumu</option>
          <option value="pastor">Mchungaji</option>
          <option value="media">Media</option>
          <option value="finance">Fedha</option>
          <option value="admin">Admin</option>
        </select>

        <label htmlFor="branch">📍 Tawi:</label>
        <input type="text" id="branch" name="branch" placeholder="Tawi lako (hiari)" />

        <button type="submit" disabled={loading}>
          {loading ? "⌛ Inasajili..." : "📝 Sajili"}
        </button>
      </form>

      <div className="signup-message">{message}</div>
    </div>
  );
};

export default SignupPage;
