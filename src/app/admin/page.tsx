"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import "./AdminPanel.css";
import AdminMatangazo from "../components/AdminMatangazo";
import AdminTabManager from "../components/AdminTabManager";
import AdminReactivation from "../components/AdminReactivation";
import UserManagement from "../components/UserManagement";
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
  { id: "users", label: "👥 User Management", component: <UserManagement /> },
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
  const [loginEnabled, setLoginEnabled] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchLoginStatus = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "login_enabled")
        .single();

      if (data) setLoginEnabled(data.value === true || data.value === "true");
    };

    fetchLoginStatus();
  }, []);

  const toggleLoginAccess = async () => {
    const newValue = !loginEnabled;

    const { error } = await supabase
      .from("settings")
      .update({ value: JSON.stringify(newValue) }) // Cast to JSON string for jsonb
      .eq("key", "login_enabled");

    if (!error) setLoginEnabled(newValue);
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "login_enabled")
        .single();

      if (data?.value === false || data?.value === "false") {
        router.push("/locked"); // Redirect to spiritual message
      }
    };

    checkLoginStatus();
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user)
    return (
      <div>
        <p>⏳ Inapakia dashibodi ya admin...</p>
      </div>
    );

  return (
    <BucketProvider>
      <div className="admin-panel-container">
        <nav>
          <h2>🧭 Admin Panel</h2>
          <p>👤 {user.full_name}</p>

          <div style={{ marginTop: "1rem" }}>
            <button onClick={toggleLoginAccess}>
              {loginEnabled ? "🚫 Lock Login Access" : "✅ Unlock Login Access"}
            </button>
          </div>

          <div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button onClick={handleLogout}>🚪 Toka / Logout</button>
        </nav>

        <main>
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </main>
      </div>
    </BucketProvider>
  );
}
