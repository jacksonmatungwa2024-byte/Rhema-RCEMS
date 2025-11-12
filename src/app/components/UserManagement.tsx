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
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, metadata, active_until")
        .order("full_name", { ascending: true });

      if (error) console.error(error);
      if (data) setUsers(data);
    };

    fetchUsers();
  }, []);

  const deleteUser = async (userId: number, email: string) => {
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUser = authData?.users?.find(u => u.email === email);
      if (!authUser) return alert("❌ Auth user not found.");

      await supabase.auth.admin.deleteUser(authUser.id);
      await supabase.from("users").delete().eq("id", userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("✅ Mtumiaji amefutwa kikamilifu.");
    } finally {
      setSaving(false);
    }
  };

  const initiatePasswordReset = async (userId: number) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentMeta = users.find(u => u.id === userId)?.metadata || {};
    await supabase
      .from("users")
      .update({
        metadata: {
          ...currentMeta,
          password_reset_otp: otp,
          reset_status: "waiting_approval",
        },
      })
      .eq("id", userId);
    alert(`✅ OTP ya kubadilisha nenosiri: ${otp}`);
  };

  const approveResetRequest = async (userId: number) => {
    const currentMeta = users.find(u => u.id === userId)?.metadata || {};
    await supabase
      .from("users")
      .update({
        metadata: {
          ...currentMeta,
          reset_status: "approved_by_admin",
        },
      })
      .eq("id", userId);
    alert("✅ Ombi la kubadilisha nenosiri limeidhinishwa.");
  };

  return (
    <div className="user-management-panel">
      <h2>🛠️ User Management</h2>
      {users.map(user => {
        const status = user.metadata?.reset_status;
        const otpExists =
          user.metadata?.password_reset_otp &&
          user.metadata?.reset_status === "waiting_approval";

        return (
          <div key={user.id} className="user-card">
            <div className="name">
              {user.full_name} ({user.role})
            </div>
            <div className="email">📧 {user.email}</div>
            <div className="status">
              🔐 Status: {status || "✅ Active"}
            </div>
            <div className="active-until">
              📅 Active Until:{" "}
              {user.active_until
                ? new Date(user.active_until).toLocaleDateString()
                : "—"}
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
                disabled={saving || otpExists}
              >
                🔐 Tuma OTP
              </button>
              {status === "waiting_approval" && (
                <button
                  onClick={() => approveResetRequest(user.id)}
                  className="action-button"
                  disabled={saving}
                >
                  ✅ Thibitisha Ombi
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
