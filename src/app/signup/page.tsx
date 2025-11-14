"use client"; // Make sure this is the first line

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value.trim().toLowerCase();
    const password = (form.password as HTMLInputElement).value.trim();
    const fullName = (form.full_name as HTMLInputElement).value.trim();
    const role = (form.role as HTMLSelectElement).value;
    const branch = (form.branch as HTMLInputElement).value.trim();

    if (!email || !password || !fullName || !role) {
      setMessage("⚠️ Tafadhali jaza taarifa zote muhimu.");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Register in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        setMessage("❌ Usajili umeshindikana. Jaribu tena.");
        setLoading(false);
        return;
      }

      // Step 2: Insert into custom users table
      await supabase.from("users").insert({
        email,
        full_name: fullName,
        role,
        branch,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setMessage("✅ Usajili umefanikiwa! Unaelekezwa...");
      setTimeout(() => router.push("/login"), 1500);

    } catch (err) {
      console.error("Signup error:", err);
      setMessage("❌ Tatizo la mtandao au seva.");
    } finally {
      setLoading(false);
    }
  };

  // Inline CSS styles as JavaScript objects
  const containerStyle = {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    margin: '0 auto',
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  };

  const inputStyle = {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  };

  const buttonStyle = {
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: '#ddd',
    cursor: 'not-allowed',
  };

  return (
    <div style={containerStyle}>
      <h2>📝 Sajili Akaunti Mpya</h2>
      <form onSubmit={handleSignup} style={formStyle}>
        <label htmlFor="full_name">👤 Jina Kamili:</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          placeholder="Jina kamili"
          style={inputStyle}
        />

        <label htmlFor="email">📧 Barua Pepe:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Barua pepe sahihi"
          style={inputStyle}
        />

        <label htmlFor="password">🔑 Nenosiri:</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Nenosiri lenye nguvu"
          style={inputStyle}
        />

        <label htmlFor="role">🎯 Nafasi:</label>
        <select id="role" name="role" style={inputStyle}>
          <option value="usher">Mhudumu</option>
          <option value="pastor">Mchungaji</option>
          <option value="media">Media</option>
          <option value="finance">Fedha</option>
          <option value="admin">Admin</option>
        </select>

        <label htmlFor="branch">📍 Tawi:</label>
        <input
          type="text"
          id="branch"
          name="branch"
          placeholder="Tawi lako (hiari)"
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={loading ? buttonDisabledStyle : buttonStyle}>
          {loading ? "⌛ Inasajili..." : "📝 Sajili"}
        </button>
      </form>

      <div className="signup-message" style={{ marginTop: '20px', fontSize: '14px', color: '#d9534f' }}>
        {message}
      </div>
    </div>
  );
};

export default SignupPage;
