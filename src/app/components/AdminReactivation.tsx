"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./AdminReactivation.css"; // ✅ External CSS

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminReactivation() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email, role, is_active, metadata, reactivation_requested_at")
        .eq("is_active", false);

      if (data) setUsers(data);
    };

    fetchUsers();
  }, []);

  const reactivateUser = async (userId: number, requestedAt: string) => {
    const now = new Date();
    const requestedDate = new Date(requestedAt);
    const hoursPassed = (now.getTime() - requestedDate.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < 48) {
      alert(`⏳ Bado haijafika masaa 48 (${Math.floor(hoursPassed)}hrs passed).`);
      return;
    }

    await supabase
      .from("users")
      .update({ is_active: true, login_attempts: 0, reactivation_requested_at: null })
      .eq("id", userId);

    alert("✅ Akaunti imewezeshwa tena.");
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <div className="admin-reactivation-panel">
      <h2>🔓 Admin Reactivation Panel</h2>
      {users.length === 0 ? (
        <p>✅ Hakuna akaunti zinazohitaji uamsho.</p>
      ) : (
        users.map(user => (
          <div key={user.id} className="user-card">
            <div className="name">{user.full_name} ({user.role})</div>
            <div className="email">📧 {user.email}</div>
            <div className="requested">
              ⏳ Requested: {new Date(user.reactivation_requested_at).toLocaleString()}
            </div>
            <button
              onClick={() => reactivateUser(user.id, user.reactivation_requested_at)}
              className="reactivate-button"
            >
              ✅ Approve Reactivation
            </button>
          </div>
        ))
      )}
    </div>
  );
}
