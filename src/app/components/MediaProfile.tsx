"use client"
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./MediaProfile.css";

// 🔹 Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MediaProfileProps {
  userId: number;
}

export default function MediaProfile({ userId }: MediaProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [userId]);

  // 🔹 Fetch user info
  const loadUser = async () => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Supabase user fetch error:", error);
      setUser(null);
    } else {
      setUser(data);
    }

    setLoading(false);
  };

  // 🔹 Loading / Error UI
  if (loading)
    return <p className="profile-loading">⏳ Loading profile...</p>;

  if (!user)
    return <p className="profile-error">🚫 Hakuna taarifa za mtumiaji.</p>;

  // 🔹 Main Profile UI
  return (
    <div className="profile-container">
      <h2 className="profile-header">🙋 Karibu {user.full_name}</h2>

      <div className="profile-card">
        <img
          src={user.profile_url || "/default-profile.png"}
          alt="Profile"
          className="profile-avatar"
        />

        <div className="profile-info">
          <p>
            <strong>📧 Email:</strong> {user.email}
          </p>
          <p>
            <strong>📞 Simu:</strong> {user.phone || "—"}
          </p>
          <p>
            <strong>🧑‍💼 Nafasi:</strong> {user.role}
          </p>
          <p>
            <strong>🌿 Tawi:</strong> {user.branch || "—"}
          </p>
          <p>
            <strong>🧠 Bio:</strong> {user.bio || "—"}
          </p>
          <p>
            <strong>🕒 Member Tangu:</strong>{" "}
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
