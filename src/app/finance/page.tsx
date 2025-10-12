"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Finance.css";
import FinancePanel from "../components/FinancePanel";
import Michango from "../components/Michango";
import FinanceReports from "../components/FinanceReports";
import FinanceProfile from "../components/FinanceProfile";
import FinanceGallery from "../components/FinanceGallery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

const allTabs = [
  { key: "finance", label: "💰 Mapato & Matumizi", component: <FinancePanel /> },
  { key: "michango", label: "🙏 Michango", component: <Michango /> },
  { key: "reports", label: "📊 Ripoti", component: <FinanceReports /> },
  { key: "picha", label: "🖼️ Picha", component: <FinanceGallery /> },
  { key: "profile", label: "👥 Wasifu", component: <FinanceProfile /> },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("finance");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleLogout = async () => {
    if (user?.role !== "admin") {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  // Auto logout only for non-admin users
  useEffect(() => {
    if (user?.role === "admin") return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }, 10 * 60 * 1000); // 10 minutes
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  // Check login session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);
    };
    checkSession();
  }, []);

  // Fetch allowed tabs for user
  useEffect(() => {
    const fetchUserTabs = async () => {
      if (!user) return;

      const { id, email } = user;
      let { data: userData, error: userErr } = await supabase
        .from("users")
        .select("role, username, email, metadata")
        .eq("id", id)
        .single();

      if (userErr || !userData) {
        const fallback = await supabase
          .from("users")
          .select("role, username, email, metadata")
          .eq("email", email)
          .single();
        userData = fallback.data;
      }

      if (!userData) {
        alert("Haiwezekani kupata taarifa zako. Tafadhali jaribu tena.");
        window.location.href = "/login";
        return;
      }

      const { role, metadata } = userData;
      if (role === "admin") {
        // Admin sees all tabs and no logout
        setAllowedTabs(allTabs.map((t) => t.key));
      } else {
        const tabs = metadata?.allowed_tabs;
        setAllowedTabs(Array.isArray(tabs) ? tabs : ["finance", "profile"]);
      }

      setActiveTab("finance");
      setLoading(false);
    };

    fetchUserTabs();
  }, [user]);

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-text">⏳ Inapakia dashboard yako...</div>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <div className="home-layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <h1 className="sidebar-title">🕊️ Dashboard</h1>
          <div className="sidebar-user">{user?.email || "Mwenye akaunti"}</div>

          <div className="sidebar-tabs">
            {allTabs
              .filter((tab) => allowedTabs.includes(tab.key))
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          {/* Only show logout for non-admin */}
          {user?.role !== "admin" && (
            <button
              onClick={handleLogout}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className={`logout-btn ${hovered ? "hover" : ""}`}
            >
              🚪 Toka / Logout
            </button>
          )}
        </nav>

        {/* Main content */}
        <main className="main-content">
          {allTabs
            .filter((tab) => tab.key === activeTab && allowedTabs.includes(tab.key))
            .map((tab) => (
              <React.Fragment key={tab.key}>{tab.component}</React.Fragment>
            ))}
        </main>
      </div>
    </div>
  );
}
