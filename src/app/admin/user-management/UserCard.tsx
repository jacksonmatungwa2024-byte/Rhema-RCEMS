"use client";
import React, { useState } from "react";
import { deleteUser } from "./actions/deleteUser";
import { generateOtp } from "./actions/generateOtp";
import { approveOtp } from "./actions/approveOtp";

export default function UserCard({ user, refresh }: any) {
  const [saving, setSaving] = useState(false);
  const meta = user.metadata || {};
  const otp = meta.password_reset_otp;
  const status = meta.reset_status;
  const expiresAt = meta.otp_expires_at ? new Date(meta.otp_expires_at) : null;
  const expired = expiresAt && expiresAt < new Date();

  const handleDelete = async () => {
    setSaving(true);
    await deleteUser(user);
    await refresh();
    setSaving(false);
  };

  const handleGenerate = async () => {
    setSaving(true);
    await generateOtp(user);
    await refresh();
    setSaving(false);
  };

  const handleApprove = async () => {
    setSaving(true);
    await approveOtp(user);
    await refresh();
    setSaving(false);
  };

  return (
    <div className="user-card">
      <div className="name">
        <strong>{user.full_name}</strong> ({user.role})
      </div>
      <div className="email">📧 {user.email}</div>
      <div>🔐 Status: {expired ? "⌛ OTP imeisha" : status || "✅ Active"}</div>

      {otp && (
        <div className="otp">
          🧾 OTP: <code>{otp}</code>{" "}
          {expired ? "(ime-expire)" : "(valid kwa muda)"}
        </div>
      )}

      <div className="action-buttons">
        <button onClick={handleDelete} disabled={saving}>
          🗑️ Futa
        </button>
        <button onClick={handleGenerate} disabled={saving}>
          🔐 Tuma OTP
        </button>
        {status === "waiting_approval" && !expired && (
          <button onClick={handleApprove} disabled={saving}>
            ✅ Idhinisha
          </button>
        )}
      </div>
    </div>
  );
}

