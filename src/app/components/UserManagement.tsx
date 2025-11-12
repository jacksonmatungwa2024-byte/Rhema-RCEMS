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

  // ✅ Fetch users from Supabase
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, metadata, active_until")
      .order("full_name", { ascending: true });

    if (error) console.error(error);
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🗑️ Delete user completely
  const deleteUser = async (userId: number, email: string) => {
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUser = authData?.users?.find((u) => u.email === email);
      if (!authUser) return alert("❌ Auth user not found.");

      await supabase.auth.admin.deleteUser(authUser.id);
      await supabase.from("users").delete().eq("id", userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("✅ Mtumiaji amefutwa kikamilifu.");
    } finally {
      setSaving(false);
    }
  };

  // 🔐 Generate OTP (calls backend route)
  const initiatePasswordReset = async (email: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          `✅ OTP imezalishwa kwa ${email}\nOTP: ${data.otp}\nItaisha saa: ${new Date(
            data.expires_at
          ).toLocaleTimeString()}`
        );
        await fetchUsers();
      } else {
        alert(`❌ ${data.error || data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Tatizo la kutuma OTP.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Approve reset request (via API)
  const approveResetRequest = async (userId: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/otp/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Ombi la kubadilisha nenosiri limeidhinishwa.");
        await fetchUsers();
      } else {
        alert(`❌ ${data.error || data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Haiwezi kuidhinisha OTP kwa sasa.");
    } finally {
      setSaving(false);
    }
  };

  // 🧾 Render user cards
  return (
    <div className="user-management-panel">
      <h2>🛠️ User Management</h2>
      {users.map((user) => {
        const status = user.metadata?.reset_status;
        const otp = user.metadata?.password_reset_otp;
        const expiresAt = user.metadata?.otp_expires_at
          ? new Date(user.metadata.otp_expires_at)
          : null;
        const expired = expiresAt && new Date() > expiresAt;

        return (
          <div key={user.id} className="user-card">
            <div className="name">
              {user.full_name} ({user.role})
            </div>
            <div className="email">📧 {user.email}</div>
            <div className="status">
              🔐 Status:{" "}
              {expired
                ? "⚠️ OTP imekwisha muda wake"
                : status || "✅ Active"}
            </div>
            {otp && !expired && (
              <div className="otp-info">
                🔢 OTP: {otp} (Inaisha{" "}
                {expiresAt?.toLocaleTimeString()})
              </div>
            )}
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
                onClick={() => initiatePasswordReset(user.email)}
                className="action-button"
                disabled={
                  saving ||
                  (status === "waiting_approval" && !expired)
                }
              >
                🔐 Tuma OTP
              </button>

              {status === "waiting_approval" && !expired && (
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
