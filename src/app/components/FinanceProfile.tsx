"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./FinanceProfile.css"; // ✅ External CSS file

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;

    if (!email) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!error && data) setUser(data);
    setLoading(false);
  };

  if (loading) return <p className="loading">⏳ Loading profile...</p>;
  if (!user) return <p className="error">🚫 Hakuna taarifa za mtumiaji.</p>;

  return (
    <div className="profile-container">
      <h2 className="profile-header">🙋 Karibu {user.full_name}</h2>
      <div className="profile-card">
        <img
          src={user.profile_url || "default-profile.png"}
          alt="Profile"
          className="profile-avatar"
        />
        <div className="profile-info">
          <p><strong>📧 Email:</strong> {user.email}</p>
          <p><strong>📞 Simu:</strong> {user.phone || "—"}</p>
          <p><strong>🧑‍💼 Nafasi:</strong> {user.role}</p>
          <p><strong>🌿 Tawi:</strong> {user.branch || "—"}</p>
          <p><strong>🧠 Bio:</strong> {user.bio || "—"}</p>
          <p><strong>🕒 Membership:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
