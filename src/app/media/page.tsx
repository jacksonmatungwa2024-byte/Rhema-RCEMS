"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./MediaDashboard.css";
import MediaPanel from "../components/MediaPanel";
import StoragePanel from "../components/StoragePanel";
import UsagePanel from "../components/UsagePanel";
import MediaProfile from "../components/MediaProfile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: true, autoRefreshToken: true },
  }
);

interface TabBase { key: string; label: string; }
interface TabWithComponent<P = {}> extends TabBase { component: React.ComponentType<P>; }

const allTabs: Array<TabWithComponent<any>> = [
  { key: "media", label: "📣 Matangazo", component: MediaPanel },
  { key: "storage", label: "🖼️ Gallery", component: StoragePanel },
  { key: "usage", label: "📊 Matumizi", component: UsagePanel },
  { key: "profile", label: "🙍‍♂️ Profile", component: MediaProfile as React.ComponentType<{ userId: number }> },
];

export default function MediaDashboard() {
  const [activeTab, setActiveTab] = useState("media");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  // Load user & permissions
  useEffect(() => {
    const fetchUserTabs = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      const email = user.email;
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id, role, metadata")
        .eq("email", email)
        .single();

      if (userErr || !userData) {
        alert("Haiwezekani kupata metadata ya mtumiaji.");
        window.location.href = "/login";
        return;
      }

      setUserId(userData.id);
      setUserRole(userData.role);

      const { role, metadata } = userData;

      // Restore last tab for non-admin
      if (role === "admin") {
        setAllowedTabs(allTabs.map((t) => t.key));
        setActiveTab("media");
      } else {
        const tabs = metadata?.allowed_tabs;
        setAllowedTabs(Array.isArray(tabs) ? tabs : ["media","profile","usage"]);
        const lastTab = localStorage.getItem("media_active_tab") as string;
        setActiveTab(lastTab && tabs?.includes(lastTab) ? lastTab : (tabs?.[0] || "media"));
      }

      setLoading(false);
    };

    fetchUserTabs();
  }, []);

  // Save active tab for non-admin
  useEffect(() => {
    if (userRole !== "admin") {
      localStorage.setItem("media_active_tab", activeTab);
    }
  }, [activeTab, userRole]);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("media_active_tab");
    window.location.href = "/login";
  };

  if (loading) return <div className="loading-screen">⏳ Inapakia dashibodi yako...</div>;

  return (
    <div className="media-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <h2 className="sidebar-title">🎧 Media Center</h2>

          {allTabs
            .filter((tab) => allowedTabs.includes(tab.key))
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`sidebar-btn ${activeTab === tab.key ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        <button
          onClick={handleLogout}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`logout-btn ${hovered ? "hovered" : ""}`}
        >
          🚪 Toka / Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <h1 className="main-title">🕊️ Dashibodi ya Vyombo vya Habari</h1>

        {allTabs
          .filter((tab) => tab.key === activeTab && allowedTabs.includes(tab.key))
          .map((tab) => {
            const Component = tab.component;
            return tab.key === "profile" && userId !== null ? (
              <Component key={tab.key} userId={userId} />
            ) : (
              <Component key={tab.key} />
            );
          })}
      </main>
    </div>
  );
}
