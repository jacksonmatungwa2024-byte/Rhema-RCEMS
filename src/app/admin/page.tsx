"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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

const tabs = [
  { id: "tabManager", label: "🛠️ Tab Manager", component: <AdminTabManager /> },
  { id: "reactivation", label: "🔁 Reactivation", component: <AdminReactivation /> },
  { id: "users", label: "👥 User Management", link: "/admin/user-management" }, // 🚀 Now opens route
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
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🔒 Load admin session
  useEffect(() => {
    const loadSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;

      if (!email) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (!userData || userData.role !== "admin") {
        router.push("/login");
        return;
      }

      setUser(userData);
    };

    loadSession();
  }, [router]);

  // 📱 Handle responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🚪 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <BucketProvider>
      <div className="admin-panel-container">
        <nav>
          <h2>🧭 Admin Panel</h2>
          <p>👤 {user.full_name}</p>

          <div className="tab-buttons">
            {tabs.map((tab) => (
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
      
