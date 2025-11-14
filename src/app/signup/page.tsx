"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./signup.css"; // ✅ IMPORT CSS HERE

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

    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value
      .trim()
      .toLowerCase();

    const password = (form.elements.namedItem("password") as HTMLInputElement)
      ?.value.trim();

    const fullName = (form.elements.namedItem("full_name") as HTMLInputElement)
      ?.value.trim();

    const role = (form.elements.namedItem("role") as HTMLSelectElement)?.value.trim();

    const branch = (form.elements.namedItem("branch") as HTMLInputElement)?.value.trim();

    const username = (form.elements.namedItem("username") as HTMLInputElement)?.value.trim();

    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim();

    const profileFile = (form.elements.namedItem("profile_file") as HTMLInputElement)
      ?.files?.[0];

    if (!email || !password || !fullName || !role || !profileFile) {
      setMessage("⚠️ Tafadhali jaza taarifa zote muhimu na weka picha ya profile.");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Create account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user || !authData.session) {
        setMessage(`❌ Usajili umeshindikana: ${authError?.message}`);
        setLoading(false);
        return;
      }

      const accessToken = authData.session.access_token;

      // 2️⃣ Upload profile picture
      const fileExt = profileFile.name.split(".").pop();
      const fileName = `${Date.now()}-${email}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, profileFile);

      if (uploadError) {
        setMessage(`❌ Picha haijapakiwa: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const profileUrl = urlData?.publicUrl;

      // 3️⃣ Insert into users table
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const { error: insertError } = await supabase.from("users").insert({
        email,
        full_name: fullName,
        role,
        branch,
        username: username || null,
        phone: phone || null,
        profile_url: profileUrl,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        current_session: accessToken,
        active_until: sixMonthsFromNow.toISOString(),
        metadata: {},
      });

      if (insertError) {
        setMessage(`❌ Usajili haukufanikiwa: ${insertError.message}`);
        setLoading(false);
        return;
      }

      setMessage("✅ Usajili umefanikiwa! Unaelekezwa...");
      setTimeout(() => router.push("/login"), 1500);

    } catch (err: any) {
      setMessage(`❌ Tatizo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <h2>📝 Sajili Akaunti Mpya</h2>

      <form onSubmit={handleSignup}>
        <label>👤 Jina Kamili:</label>
        <input type="text" id="full_name" name="full_name" required />

        <label>🆔 Jina la Mtumiaji:</label>
        <input type="text" id="username" name="username" required />

        <label>📧 Barua Pepe:</label>
        <input type="email" id="email" name="email" required />

        <label>🔑 Nenosiri:</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <label>📞 Simu:</label>
        <input type="text" id="phone" name="phone" />

        <label>🖼️ Picha ya Profile:</label>
        <input type="file" id="profile_file" name="profile_file" accept="image/*" required />

        <label>🎯 Nafasi:</label>
        <select id="role" name="role" required>
          <option value="">-- Chagua Nafasi --</option>
          <option value="usher">Mhudumu</option>
          <option value="pastor">Mchungaji</option>
          <option value="media">Media</option>
          <option value="finance">Fedha</option>
          <option value="admin">Admin</option>
        </select>

        <label>📍 Tawi:</label>
        <input type="text" id="branch" name="branch" />

        <button type="submit" disabled={loading}>
          {loading ? "⌛ Inasajili..." : "📝 Sajili"}
        </button>
      </form>

      <div className="signup-message">{message}</div>
    </div>
  );
};

export default SignupPage;
        
