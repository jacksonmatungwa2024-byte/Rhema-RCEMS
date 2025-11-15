"use client";

import React, { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./PastorPage.css";
import PastorUsajili from "../components/PastorUsajili";
import BudgetsPanel from "../components/BudgetsPanel";
import ReportsDashboard2 from "../components/ReportsDashboard2";
import PastorProfile from "../components/PastorProfile";
import PastorSummary from "../components/PastorSummary";
import SummaryApproval from "../components/SummaryApproval";
import ApprovedSummaries from "../components/ApprovedSummaries";
import RejectedSummaries from "../components/RejectedSummaries";
import PastorMatangazo from "../components/PastorMatangazo";
import UserGallery from "../components/UserGallery";

const defaultAccess: Record<string, string[]> = {
  admin: [
    "dashboard","usajili","bajeti","messages","reports","summary",
    "approval","approved","rejected","matangazo","picha","profile",
  ],
  pastor: [
    "dashboard","usajili","messages","reports","summary","approval",
    "matangazo","picha","profile",
  ],
  user: ["dashboard","messages","picha","profile"],
};

const tabs = [
  { key: "dashboard", label: "🏠 Dashboard" },
  { key: "usajili", label: "🗂️ Usajili" },
  { key: "bajeti", label: "💰 Bajeti" },
  { key: "reports", label: "📊 Reports" },
  { key: "summary", label: "📝 Muhtasari" },
  { key: "approval", label: "✅ Approval" },
  { key: "approved", label: "📁 Approved" },
  { key: "rejected", label: "⛔ Rejected" },
  { key: "matangazo", label: "📣 Matangazo" },
  { key: "picha", label: "🖼️ Picha" },
  { key: "profile", label: "👤 Profile" },
];

export default function PastorPage() {
  const [active, setActive] = useState("dashboard");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  // Load user & restore last tab
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) {
        window.location.href = "/login";
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

      setRole(data.role);
      setUsername(data.username || "");

      const metadataTabs = data.allowedTabs;
      const tabsToUse = Array.isArray(metadataTabs) && metadataTabs.length > 0
        ? metadataTabs
        : defaultAccess[data.role] || [];
      setAllowedTabs(tabsToUse);

      // Restore last tab for non-admin
      if (data.role !== "admin") {
        const lastTab = localStorage.getItem("pastor_active_tab");
        if (lastTab && tabsToUse.includes(lastTab)) setActive(lastTab);
      }
    };

    loadUser();
  }, []);

  // Save active tab for non-admin
  useEffect(() => {
    if (role !== "admin") {
      localStorage.setItem("pastor_active_tab", active);
    }
  }, [active, role]);

  // Auto logout after 10 minutes inactivity (non-admin)
  useEffect(() => {
    if (role === "admin") return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.removeItem("session_token");
        localStorage.removeItem("pastor_active_tab");
        window.location.href = "/login";
      }, 10 * 60 * 1000);
    };

    const events = ["mousemove","keydown","click","scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("pastor_active_tab");
    window.location.href = "/login";
  };

  return (
    <div className="pastor-container">
      <aside className="pastor-sidebar">
        <div className="pastor-logo">
          <div className="pastor-logo-icon">P</div>
          <div>
            <div className="pastor-logo-text">Pastor Panel</div>
            <div className="pastor-username">{username || "Mwenye Akaunti"}</div>
          </div>
        </div>

        <nav className="pastor-nav">
          {tabs
            .filter((tab) => allowedTabs.includes(tab.key))
            .map((tab) => (
              <div
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`pastor-nav-item ${active === tab.key ? "active" : ""}`}
              >
                {tab.label}
              </div>
            ))}
        </nav>

        <div className="pastor-footer">
          <button onClick={() => setActive("profile")} className="account-btn">
            My Account
          </button>
          {role !== "admin" && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      </aside>

      <main className="pastor-main">
        {allowedTabs.includes(active) && (
          <>
            {active === "dashboard" && <h2>Pastor Dashboard</h2>}
            {active === "usajili" && <PastorUsajili />}
            {active === "bajeti" && <BudgetsPanel />}
            {active === "reports" && <ReportsDashboard2 />}
            {active === "summary" && <PastorSummary />}
            {active === "approval" && <SummaryApproval />}
            {active === "approved" && <ApprovedSummaries />}
            {active === "rejected" && <RejectedSummaries />}
            {active === "matangazo" && <PastorMatangazo />}
            {active === "picha" && <UserGallery />}
            {active === "profile" && <PastorProfile />}
          </>
        )}
      </main>

      <SpeedInsights />
    </div>
  );
                   }
