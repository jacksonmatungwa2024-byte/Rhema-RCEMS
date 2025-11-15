"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./AdminPanel.css";

import AdminMatangazo from "../components/AdminMatangazo";
import AdminTabManager from "../components/AdminTabManager";
import AdminReactivation from "../components/AdminReactivation";
import UserRegistration from "../components/UserRegistration";
import AdminDataManagement from "../components/AdminDataMangement";
import StorageDashboard from "../components/StorageDashboard";
import AdminProfile from "../components/AdminProfile";
import AdminSettings from "../components/AdminSettings";
import { BucketProvider } from "../components/BucketContext";

const tabs = [
  { id: "tabManager", label: "🛠️ Tab Manager", component: <AdminTabManager /> },
  { id: "reactivation", label: "🔁 Reactivation", component: <AdminReactivation /> },
  { id: "users", label: "👥 User Management", link: "/admin/user-management" },
  { id: "registration", label: "📝 Registration", component: <UserRegistration /> },
  { id: "data", label: "📊 Data Management", component: <AdminDataManagement /> },
  { id: "matangazo", label: "📣 Matangazo", component: <AdminMatangazo /> },
  { id: "storage", label: "🗄️ Storage", component: <StorageDashboard /> },
  { id: "settings", label: "⚙️ Settings", component: <AdminSettings /> },
  { id: "profile", label: "👤 Profile", component: <AdminProfile /> },
];

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tabManager");
  const [user, setUser] = useState<any>(null);
  const [allowedTabs, setAllowedTabs] = useState<typeof tabs>([]);

  // 🔒 Load admin session using JWT
  useEffect(() => {
    const loadSession = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error || data.role !== "admin") {
        localStorage.removeItem("session_token");
        router.push("/login");
        return;
      }

      setUser(data);
      // 🔹 Admin gets all tabs
      setAllowedTabs(tabs);

      // 🔹 Auto logout after 30 mins inactivity
      const timeout = setTimeout(() => {
        alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
        localStorage.removeItem("session_token");
        router.push("/login");
      }, 30 * 60 * 1000);

      return () => clearTimeout(timeout);
    };

    loadSession();
  }, [router]);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("session_token");
    router.push("/login");
  };

  // 🧭 Handle tab switching
  const handleTabChange = (tabId: string, link?: string) => {
    setActiveTab(tabId);
    if (link) router.push(link);
  };

  if (!user)
    return (
      <div className="admin-loading">
        <p>⏳ Inapakia dashibodi ya admin...</p>
      </div>
    );

  const currentTab = allowedTabs.find((tab) => tab.id === activeTab);

  return (
    <BucketProvider>
      <div className="admin-panel-container">
        <nav>
          <h2>🧭 Admin Panel</h2>
          <p>👤 {user.full_name}</p>

          <div className="tab-buttons">
            {allowedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id, tab.link)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            🚪 Toka / Logout
          </button>
        </nav>

        <main>{currentTab?.component}</main>

        <SpeedInsights />
      </div>
    </BucketProvider>
  );
}
