"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./UserManagement.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // we’ll call RPCs or APIs; anon ok for dashboard
);

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, metadata, active_until")
      .order("full_name", { ascending: true });

    if (error) console.error("Fetch users error:", error);
    else setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔹 Delete user completely
  const deleteUser = async (userId: number, email: string) => {
    if (!confirm(`Una uhakika unataka kumfuta ${email}?`)) return;
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUser = authData?.users?.find((u) => u.email === email);
      if (authUser) await supabase.auth.admin.deleteUser(authUser.id);

      await supabase.from("users").delete().eq("id", userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert(`✅ Mtumiaji ${email} amefutwa kikamilifu.`);
    } catch (err) {
      console.error("Delete user error:", err);
      alert("❌ Imeshindikana kufuta mtumiaji.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Generate OTP (valid for 10 mins)
  const initiatePasswordReset = async (userId: number) => {
    setSaving(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // +10 mins

      const currentUser = users.find((u) => u.id === userId);
      const currentMeta = currentUser?.metadata || {};

      const newMeta = {
        ...currentMeta,
        password_reset_otp: otp,
        reset_status: "waiting_approval",
        otp_expires_at: expiresAt,
      };

      const { error } = await supabase
        .from("users")
        .update({ metadata: newMeta })
        .eq("id", userId);

      if (error) throw error;

      alert(
        `✅ OTP mpya (${otp}) imetengenezwa kwa ${currentUser?.email}\n⏰ Inaisha baada ya dakika 10.\n⚠️ Subiri user aingize OTP hii kwenye ukurasa wa sahau nenosiri.`
      );

      await fetchUsers(); // refresh list
    } catch (err) {
      console.error("OTP generation error:", err);
      alert("❌ Imeshindikana kutengeneza OTP.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Approve OTP (admin confirms after user verifies)
  const approveResetRequest = async (userId: number) => {
    setSaving(true);
    try {
      const currentUser = users.find((u) => u.id === userId);
      const currentMeta = currentUser?.metadata || {};
      const expiresAt = new Date(currentMeta?.otp_expires_at || "");

      if (expiresAt < new Date()) {
        alert("⌛ OTP hii imekwisha muda wake. Tengeneza mpya.");
        setSaving(false);
        return;
      }

      const newMeta = {
        ...currentMeta,
        reset_status: "approved",
      };

      const { error } = await supabase
        .from("users")
        .update({ metadata: newMeta })
        .eq("id", userId);

      if (error) throw error;

      alert(`✅ OTP imeidhinishwa kwa ${currentUser?.email}.`);
      await fetchUsers();
    } catch (err) {
      console.error("Approve error:", err);
      alert("❌ Imeshindikana kuidhinisha OTP.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>⏳ Inapakia watumiaji...</p>;

  return (
    <div className="user-management-panel">
      <h2>🛠️ Usimamizi wa Watumiaji</h2>

      {users.length === 0 && <p>Hakuna watumiaji waliopatikana.</p>}

      {users.map((user) => {
        const meta = user.metadata || {};
        const status = meta.reset_status;
        const otp = meta.password_reset_otp;
        const expiresAt = meta.otp_expires_at
          ? new Date(meta.otp_expires_at)
          : null;
        const expired = expiresAt && expiresAt < new Date();

        return (
          <div key={user.id} className="user-card">
            <div className="name">
              <strong>{user.full_name}</strong> ({user.role})
            </div>
            <div className="email">📧 {user.email}</div>
            <div>
              🔐 Reset Status:{" "}
              {expired
                ? "⌛ OTP imeisha muda wake"
                : status
                ? status
                : "✅ Active"}
            </div>
            {otp && (
              <div className="otp">
                🧾 OTP: <code>{otp}</code>{" "}
                {expired ? "(ime-expire)" : "(valid kwa muda)"}
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
                className="action-button delete"
                disabled={saving}
              >
                🗑️ Futa
              </button>
              <button
                onClick={() => initiatePasswordReset(user.id)}
                className="action-button"
                disabled={saving}
              >
                🔐 Tuma OTP
              </button>
              {status === "waiting_approval" && !expired && (
                <button
                  onClick={() => approveResetRequest(user.id)}
                  className="action-button"
                  disabled={saving}
                >
                  ✅ Idhinisha OTP
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
    }
        
