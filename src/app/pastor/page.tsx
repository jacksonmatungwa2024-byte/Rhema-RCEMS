"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
import UserGallery from "../components/UserGallery"; // ✅ new import

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Default tab access per role
const defaultAccess: Record<string, string[]> = {
  admin: [
    "dashboard",
    "usajili",
    "bajeti",
    "messages",
    "reports",
    "summary",
    "approval",
    "approved",
    "rejected",
    "matangazo",
    "picha", // ✅ added
    "profile",
  ],
  pastor: [
    "dashboard",
    "usajili",
    "messages",
    "reports",
    "summary",
    "approval",
    "matangazo",
    "picha", // ✅ added
    "profile",
  ],
  user: ["dashboard", "messages", "picha", "profile"], // ✅ added picha
};

// Tab definitions
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
  { key: "picha", label: "🖼️ Picha" }, // ✅ new tab
  { key: "profile", label: "👤 Profile" },
];

export default function PastorPage() {
  const [active, setActive] = useState("dashboard");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      const { id, email } = user;

      let { data: userData, error: userErr } = await supabase
        .from("users")
        .select("role, username, metadata")
        .eq("id", id)
        .single();

      if (userErr || !userData) {
        const fallback = await supabase
          .from("users")
          .select("role, username, metadata")
          .eq("email", email)
          .single();

        userData = fallback.data;
        userErr = fallback.error;
      }

      if (userErr || !userData) {
        alert("Haiwezekani kupata taarifa zako.");
        window.location.href = "/login";
        return;
      }

      setRole(userData.role);
      setUsername(userData.username || "");

      const metadataTabs = userData.metadata?.allowed_tabs;
      if (Array.isArray(metadataTabs)) {
        setAllowedTabs(metadataTabs);
      } else {
        setAllowedTabs(defaultAccess[userData.role] || []);
      }
    };

    loadUser();
  }, []);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
    background: "#f3f6fb",
  };

  const sidebarStyle: React.CSSProperties = {
    width: 280,
    padding: 24,
    background: "linear-gradient(180deg, #fff, #faf8ff)",
    borderRight: "1px solid rgba(15,23,42,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 16px",
    borderRadius: 10,
    cursor: "pointer",
    background: isActive
      ? "linear-gradient(90deg, #6a1b9a, #9c27b0)"
      : "transparent",
    color: isActive ? "#fff" : "#3b3050",
    fontWeight: 700,
    fontSize: 15,
    userSelect: "none",
    transition: "background-color 0.25s ease",
    boxShadow: isActive ? "0 4px 12px rgba(106,27,154,0.3)" : "none",
  });

  const mainStyle: React.CSSProperties = {
    flex: 1,
    padding: 24,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    overflowY: "auto",
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
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") setActive(tab.key);
              }}
              aria-current={active === tab.key ? "page" : undefined}
            >
              {tab.label}
            </div>
          ))}
      </nav>

      <div className="pastor-footer">
        <button onClick={() => setActive("profile")} className="account-btn">
          My Account
        </button>
        <button
          onClick={() => {
            supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="logout-btn"
        >
          Logout
        </button>
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
  </div>
);
}