"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SajiliMuumini from "../components/SajiliMuumini";
import SajiliMahadhurio from "../components/SajiliMahadhurio";
import SajiliAliyeokoka from "../components/SajiliAliyeokoka";
import MafunzoMuumini from "../components/MafunzoMuumini";
import SajiliUshuhuda from "../components/SajiliUshuhuda";
import ReportsDashboard from "../components/ReportsDashboard";
import UsherProfile from "../components/UsherProfile";
import UsherGallery from "../components/UsherGallery";

import styles from "./Home.module.css";

export type TabType =
  | "home"
  | "usajili"
  | "mafunzo"
  | "reports"
  | "messages"
  | "profile"
  | "picha";

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [usajiliSub, setUsajiliSub] = useState<
    "muumini" | "mahadhurio" | "wokovu" | "ushuhuda"
  >("muumini");
  const [user, setUser] = useState<any>(null);

  // Load user and restore last active tab/subtab
  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;

      if (!email) {
        window.location.href = "/login";
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !userData || !["admin", "usher"].includes(userData.role)) {
        window.location.href = "/login";
        return;
      }

      setUser(userData);

      // Restore last active tab/subtab from localStorage for non-admin
      if (userData.role !== "admin") {
        const lastTab = localStorage.getItem("home_active_tab") as TabType;
        const lastSub = localStorage.getItem("home_usajili_sub") as
          | "muumini"
          | "mahadhurio"
          | "wokovu"
          | "ushuhuda";

        if (lastTab && ["home","usajili","mafunzo","reports","messages","profile","picha"].includes(lastTab))
          setActiveTab(lastTab);
        if (lastSub && ["muumini","mahadhurio","wokovu","ushuhuda"].includes(lastSub))
          setUsajiliSub(lastSub);
      }
    };

    loadUser();
  }, []);

  // Save active tab and subtab to localStorage for non-admin
  useEffect(() => {
    if (user?.role !== "admin") {
      localStorage.setItem("home_active_tab", activeTab);
      localStorage.setItem("home_usajili_sub", usajiliSub);
    }
  }, [activeTab, usajiliSub, user]);

  const { role, full_name, branch } = user || {};
  const allowedTabs: Record<string, TabType[]> = {
    admin: ["home","usajili","mafunzo","reports","messages","profile","picha"],
    usher: ["home","usajili","reports","profile","picha"],
  };
  const visibleTabs = allowedTabs[role] || [];

  const handleLogout = async () => {
    if (role !== "admin") {
      await supabase.auth.signOut();
      localStorage.removeItem("home_active_tab");
      localStorage.removeItem("home_usajili_sub");
      window.location.href = "/login";
    }
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {visibleTabs.includes("home") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "home" ? styles.active : ""}`}
            onClick={() => setActiveTab("home")}
          >
            🏠 Home
          </button>
        )}

        {visibleTabs.includes("usajili") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "usajili" ? styles.active : ""}`}
            onClick={() => setActiveTab("usajili")}
          >
            🗂️ Usajili
          </button>
        )}

        {visibleTabs.includes("mafunzo") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "mafunzo" ? styles.active : ""}`}
            onClick={() => setActiveTab("mafunzo")}
          >
            📚 Mafunzo
          </button>
        )}

        {visibleTabs.includes("reports") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "reports" ? styles.active : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            📊 Reports
          </button>
        )}

        {visibleTabs.includes("picha") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "picha" ? styles.active : ""}`}
            onClick={() => setActiveTab("picha")}
          >
            🖼️ Picha
          </button>
        )}

        {visibleTabs.includes("profile") && (
          <button
            className={`${styles.tabBtn} ${activeTab === "profile" ? styles.active : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
        )}

        {role !== "admin" && (
          <button onClick={handleLogout} className={styles.logoutBtn}>
            🚪 Toka / Logout
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {activeTab === "home" && (
          <div>
            <h2 className={styles.homeTitle}>
              Karibu {role === "admin" ? "Admin" : "Mhudumu"} {full_name}
            </h2>
            <p className={styles.subText}>Tawi: {branch || "—"}</p>
            <p className={styles.subText}>
              Chagua kipengele upande wa kushoto ili kuendelea.
            </p>
          </div>
        )}

        {activeTab === "usajili" && (
          <div>
            <h3 className={styles.sectionTitle}>Usajili</h3>
            <p className={styles.sectionText}>Chagua aina ya usajili:</p>

            <div className={styles.subTabs}>
              <button
                className={`${styles.subBtn} ${usajiliSub === "muumini" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("muumini")}
              >
                📝 Muumini
              </button>
              <button
                className={`${styles.subBtn} ${usajiliSub === "mahadhurio" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("mahadhurio")}
              >
                📋 Mahadhurio
              </button>
              <button
                className={`${styles.subBtn} ${usajiliSub === "wokovu" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("wokovu")}
              >
                🙏 Wokovu
              </button>
              <button
                className={`${styles.subBtn} ${usajiliSub === "ushuhuda" ? styles.subActive : ""}`}
                onClick={() => setUsajiliSub("ushuhuda")}
              >
                🗣️ Ushuhuda
              </button>
            </div>

            <div className={styles.sectionContent}>
              {usajiliSub === "muumini" && <SajiliMuumini />}
              {usajiliSub === "mahadhurio" && <SajiliMahadhurio setActiveTab={setActiveTab} />}
              {usajiliSub === "wokovu" && <SajiliAliyeokoka setActiveTab={setActiveTab} />}
              {usajiliSub === "ushuhuda" && <SajiliUshuhuda setActiveTab={setActiveTab} />}
            </div>
          </div>
        )}

        {activeTab === "mafunzo" && <MafunzoMuumini setActiveTab={setActiveTab} />}
        {activeTab === "reports" && <ReportsDashboard setActiveTab={setActiveTab} />}
        {activeTab === "picha" && <UsherGallery />}
        {activeTab === "profile" && <UsherProfile onClose={() => setActiveTab("home")} />}
      </main>

      <SpeedInsights />
    </div>
  );
}
