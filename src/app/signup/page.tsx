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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value.trim().toLowerCase();
    const password = (form.password as HTMLInputElement).value.trim();
    const fullName = (form.full_name as HTMLInputElement).value.trim();
    const role = (form.role as HTMLSelectElement)?.value;  // Fix here
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

  return (
    <div className="signup-wrapper">
      <h2>📝 Sajili Akaunti Mpya</h2>
      <form onSubmit={handleSignup}>
        <label htmlFor="full_name">👤 Jina Kamili:</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          placeholder="Jina kamili"
        />

        <label htmlFor="email">📧 Barua Pepe:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Barua pepe sahihi"
        />

        <label htmlFor="password">🔑 Nenosiri:</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Nenosiri lenye nguvu"
        />

        <label htmlFor="role">🎯 Nafasi:</label>
        <select id="role" name="role">
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
        />

        <button type="submit" disabled={loading}>
          {loading ? "⌛ Inasajili..." : "📝 Sajili"}
        </button>
      </form>

      <div className="signup-message">{message}</div>

      <style jsx>{`
        .signup-wrapper {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          color: #333;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        label {
          font-size: 1rem;
          color: #555;
        }

        input, select {
          padding: 0.8rem;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fff;
        }

        button {
          padding: 1rem;
          font-size: 1rem;
          color: #fff;
          background-color: #007bff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:disabled {
          background-color: #ccc;
        }

        .signup-message {
          margin-top: 1rem;
          text-align: center;
          font-weight: bold;
          color: #d9534f;
        }

        .signup-message.success {
          color: #5bc0de;
        }

        .signup-message.error {
          color: #d9534f;
        }
      `}</style>
    </div>
  );
};

export default SignupPage;
