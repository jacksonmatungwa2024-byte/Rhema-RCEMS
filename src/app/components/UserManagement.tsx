"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./UserManagement.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, role, metadata, active_until")
        .order("full_name", { ascending: true });

      if (data) setUsers(data);
    };

    fetchUsers();
  }, []);

  const deleteUser = async (userId: number, email: string) => {
    setSaving(true);
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email === email);
    if (!authUser) return alert("❌ Auth user not found.");

    await supabase.auth.admin.deleteUser(authUser.id);
    await supabase.from("users").delete().eq("id", userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setSaving(false);
    alert("✅ Mtumiaji amefutwa kikamilifu.");
  };

  const initiatePasswordReset = async (userId: number) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase
      .from("users")
      .update({
        metadata: {
          ...users.find(u => u.id === userId)?.metadata,
          password_reset_otp: otp,
          reset_status: "waiting_approval"
        }
      })
      .eq("id", userId);
    alert(`✅ OTP ya kubadilisha nenosiri: ${otp}`);
  };

  const approveResetRequest = async (userId: number) => {
    await supabase
      .from("users")
      .update({
        metadata: {
          ...users.find(u => u.id === userId)?.metadata,
          reset_status: "approved_by_admin"
        }
      })
      .eq("id", userId);
    alert("✅ Ombi la kubadilisha nenosiri limeidhinishwa.");
  };

  return (
    <div className="user-management-panel">
      <h2>🛠️ User Management</h2>
      {users.map(user => {
        const status = user.metadata?.reset_status;
        return (
          <div key={user.id} className="user-card">
            <div className="name">{user.full_name} ({user.role})</div>
            <div className="email">📧 {user.email}</div>
            <div className="status">🔐 Status: {status || "✅ Active"}</div>
            <div className="active-until">
              📅 Active Until: {user.active_until ? new Date(user.active_until).toLocaleDateString() : "—"}
            </div>

            <div className="action-buttons">
              <button
                onClick={() => deleteUser(user.id, user.email)}
                className="action-button"
                disabled={saving}
              >
                🗑️ Futa Mtumiaji
              </button>
              <button
                onClick={() => initiatePasswordReset(user.id)}
                className="action-button"
                disabled={saving}
              >
                🔐 Tuma OTP
              </button>
              {status === "waiting_approval" && (
                <button
                  onClick={() => approveResetRequest(user.id)}
                  className="action-button"
                  disabled={saving}
                >
                  ✅ Approve Reset Request
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
