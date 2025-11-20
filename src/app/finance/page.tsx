"use client";

import React, { useEffect, useState } from "react";
import "./Finance.css";
import FinancePanel from "../components/FinancePanel";
import Michango from "../components/Michango";
import FinanceReports from "../components/FinanceReports";
import FinanceProfile from "../components/FinanceProfile";
import FinanceGallery from "../components/FinanceGallery";

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

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("finance_active_tab");
    window.location.href = "/log";
  };

  // 🔒 Check login session via JWT
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) {
        window.location.href = "/logout";
        return;
      }

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error) {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
        return;
      }

      setUser(data);

      // Determine allowed tabs
      if (data.role === "admin") {
        setAllowedTabs(allTabs.map((t) => t.key));
      } else {
        const tabs = data.allowedTabs;
        setAllowedTabs(Array.isArray(tabs) ? tabs : ["finance", "profile"]);
      }

      // Restore last active tab for non-admin
      if (data.role !== "admin") {
        const savedTab = localStorage.getItem("finance_active_tab");
        if (savedTab && allTabs.some((t) => t.key === savedTab)) {
          setActiveTab(savedTab);
        } else {
          setActiveTab("finance");
        }
      } else {
        setActiveTab("finance");
      }

      setLoading(false);

      // 🔹 Auto logout after 10 mins inactivity
      let timeout: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
          handleLogout();
        }, 10 * 60 * 1000);
      };

      const events = ["mousemove", "keydown", "scroll", "click"];
      events.forEach((event) => window.addEventListener(event, resetTimer));
      resetTimer();

      return () => {
        clearTimeout(timeout);
        events.forEach((event) => window.removeEventListener(event, resetTimer));
      };
    };

    checkSession();
  }, []);

  // 💾 Save active tab for non-admin
  useEffect(() => {
    if (user?.role !== "admin") {
      localStorage.setItem("finance_active_tab", activeTab);
    }
  }, [activeTab, user]);

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

          {/* Logout always available */}
          <button
            onClick={handleLogout}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`logout-btn ${hovered ? "hover" : ""}`}
          >
            🚪 Toka / Logout
          </button>
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
