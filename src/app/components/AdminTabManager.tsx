"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./AdminTabManager.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const allTabs = [
  "home", "usajili", "mafunzo", "reports", "messages", "profile",
  "muumini", "mahadhurio", "wokovu", "ushuhuda",
  "dashboard", "bajeti", "summary", "approval", "approved", "rejected", "matangazo",
  "media", "storage", "usage", "picha",
  "finance", "michango", "reports_finance"
];

interface User {
  id: number;
  username: string;
  role: string;
  metadata: {
    allowed_tabs?: string[];
    [key: string]: any;
  };
}

export default function AdminTabManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMap, setSuccessMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, username, role, metadata")
        .order("role", { ascending: true })
        .order("username", { ascending: true });

      if (!error && data) setUsers(data as User[]);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const toggleTab = (userId: number, tab: string) => {
    setUsers(prev =>
      prev.map(user => {
        if (user.id !== userId) return user;
        const currentTabs = user.metadata?.allowed_tabs || [];
        const updatedTabs = currentTabs.includes(tab)
          ? currentTabs.filter(t => t !== tab)
          : [...currentTabs, tab];
        return { ...user, metadata: { ...user.metadata, allowed_tabs: updatedTabs } };
      })
    );
  };

  const saveTabs = async (userId: number, metadata: any) => {
    setSaving(true);
    await supabase.from("users").update({ metadata }).eq("id", userId);
    setSaving(false);
    setSuccessMap(prev => ({ ...prev, [userId]: true }));
    setTimeout(() => setSuccessMap(prev => ({ ...prev, [userId]: false })), 3000);
  };

  const grouped = users.reduce<Record<string, User[]>>((acc, user) => {
    const role = user.role || "other";
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {});

  return (
    <div className="admin-tab-manager">
      <h2>🛠️ Tab Manager kwa Kila Paneli</h2>
      {loading ? (
        <p>⏳ Inapakia watumiaji...</p>
      ) : (
        Object.entries(grouped).map(([role, group]) => (
          <div key={role} className="role-group">
            <h3 className="role-title">👥 {role.charAt(0).toUpperCase() + role.slice(1)} Panel</h3>
            {group.map(user => (
              <div key={user.id} className="user-card">
                <div className="username">{user.username} ({user.role})</div>
                <div className="tab-list">
                  {allTabs.map((tab, index) => (
                    <label key={tab} className={`tab-label ${user.metadata?.allowed_tabs?.includes(tab) ? "active" : ""}`} style={{ "--i": index } as React.CSSProperties}>
                      <input
                        type="checkbox"
                        checked={user.metadata?.allowed_tabs?.includes(tab) || false}
                        onChange={() => toggleTab(user.id, tab)}
                        style={{ display: "none" }}
                      />
                      {tab}
                    </label>
                  ))}
                </div>
                <button onClick={() => saveTabs(user.id, user.metadata)} disabled={saving} className="save-button">
                  💾 Hifadhi Tab
                </button>
                {successMap[user.id] && <div className="success-message">✅ Tabs zimehifadhiwa kwa mafanikio</div>}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
